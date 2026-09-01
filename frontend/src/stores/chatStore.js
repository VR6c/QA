import { create } from 'zustand';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';
import {
  playNotificationSound,
  requestNotificationPermission,
  showNativeNotification
} from '../lib/notificationService';

const useChatStore = create((set, get) => ({
  isOpen: false,
  users: [],
  searchQuery: '',
  activeContactId: null,
  activeConversationId: null,
  messages: [],
  typingUsers: {}, // { userId: boolean }
  onlineUserIds: new Set(),
  unreadCounts: {}, // { userId: number }
  isLoadingUsers: false,
  isLoadingMessages: false,

  // Computed cumulative total unread messages
  get totalUnreadCount() {
    const counts = get().unreadCounts;
    return Object.values(counts).reduce((sum, count) => sum + (count || 0), 0);
  },

  setOpen: (isOpen) => set({ isOpen }),

  toggleChat: () => {
    const nextState = !get().isOpen;
    set({ isOpen: nextState });

    if (nextState) {
      get().fetchUsers();
      // If active contact already selected, mark read
      const activeId = get().activeContactId;
      if (activeId) {
        get().markConversationRead(activeId);
      }
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchUsers: async () => {
    set({ isLoadingUsers: true });
    try {
      const res = await api.getChatUsers();
      const userList = res.data || res;
      
      const unreadMap = {};
      const onlineSet = new Set(get().onlineUserIds);

      userList.forEach(u => {
        unreadMap[u.id] = u.unreadCount || 0;
        if (u.isOnline) onlineSet.add(u.id);
      });

      set({
        users: userList,
        unreadCounts: unreadMap,
        onlineUserIds: onlineSet,
        isLoadingUsers: false
      });
    } catch (err) {
      console.error('Failed to fetch chat users:', err);
      set({ isLoadingUsers: false });
    }
  },

  selectContact: async (contactId) => {
    if (!contactId) return;
    set({ activeContactId: contactId, isLoadingMessages: true, messages: [] });

    try {
      const res = await api.getChatMessages({ targetUserId: contactId });
      const payload = res.data || res;
      const conversationId = payload.conversationId;
      const messageList = payload.messages || [];

      // Clear unread count for this contact
      const unreadMap = { ...get().unreadCounts, [contactId]: 0 };

      set({
        activeConversationId: conversationId,
        messages: messageList,
        unreadCounts: unreadMap,
        isLoadingMessages: false
      });

      // Emit socket mark_read event
      get().markConversationRead(contactId, conversationId);
    } catch (err) {
      console.error('Failed to select contact & load messages:', err);
      set({ isLoadingMessages: false });
    }
  },

  markConversationRead: (contactId, convId) => {
    const socket = getSocket();
    const targetConvId = convId || get().activeConversationId;
    if (socket && socket.connected && targetConvId) {
      socket.emit('mark_read', {
        conversationId: targetConvId,
        senderId: contactId
      });
    }

    // Update state locally
    const unreadMap = { ...get().unreadCounts, [contactId]: 0 };
    set({ unreadCounts: unreadMap });
  },

  sendMessage: async ({ text, attachments, currentUserId }) => {
    const activeContactId = get().activeContactId;
    if (!activeContactId) return;

    const socket = getSocket();
    const cleanText = (text || '').trim();

    // 1. Create Optimistic Pending Message for Instant Display & Sending Animation
    const tempId = 'temp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const tempMsg = {
      id: tempId,
      senderId: currentUserId?.toString(),
      receiverId: activeContactId.toString(),
      text: cleanText,
      attachments: attachments || [],
      status: 'sending',
      isPending: true,
      createdAt: new Date().toISOString()
    };

    // Append temporary message immediately with sending animation state
    set(state => ({ messages: [...state.messages, tempMsg] }));

    try {
      let serverMsg = null;

      if (socket && socket.connected) {
        serverMsg = await new Promise((resolve, reject) => {
          socket.emit('send_message', {
            receiverId: activeContactId,
            text: cleanText,
            attachments: attachments || []
          }, (response) => {
            if (response?.error) {
              reject(new Error(response.error));
            } else {
              resolve(response?.message);
            }
          });
        });
      } else {
        const res = await api.sendChatMessage({
          receiverId: activeContactId,
          text: cleanText,
          attachments: attachments || []
        });
        serverMsg = res.data || res;
      }

      if (serverMsg) {
        const normalizedMsg = {
          ...serverMsg,
          id: (serverMsg.id || serverMsg._id)?.toString(),
          senderId: serverMsg.senderId?.toString(),
          receiverId: serverMsg.receiverId?.toString()
        };

        // Replace temp message with server confirmed message
        set(state => ({
          messages: state.messages.map(m => m.id === tempId ? normalizedMsg : m)
        }));
      }

      get().fetchUsers();
      return serverMsg;
    } catch (err) {
      // Remove temp message if sending failed
      set(state => ({
        messages: state.messages.filter(m => m.id !== tempId)
      }));
      throw err;
    }
  },

  deleteMessage: async (messageId) => {
    const socket = getSocket();
    if (socket && socket.connected) {
      return new Promise((resolve, reject) => {
        socket.emit('delete_message', { messageId }, (response) => {
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            // Remove locally
            set(state => ({
              messages: state.messages.filter(m => m.id !== messageId)
            }));
            resolve(response);
          }
        });
      });
    } else {
      await api.deleteChatMessage(messageId);
      set(state => ({
        messages: state.messages.filter(m => m.id !== messageId)
      }));
    }
  },

  sendTypingStart: () => {
    const activeContactId = get().activeContactId;
    const socket = getSocket();
    if (socket && socket.connected && activeContactId) {
      socket.emit('typing_start', { receiverId: activeContactId });
    }
  },

  sendTypingStop: () => {
    const activeContactId = get().activeContactId;
    const socket = getSocket();
    if (socket && socket.connected && activeContactId) {
      socket.emit('typing_stop', { receiverId: activeContactId });
    }
  },

  // Setup Socket Real-time Event Listeners
  setupSocketListeners: (socket, currentUserId) => {
    if (!socket) return;

    socket.off('online_users_list');
    socket.off('user:online');
    socket.off('user:offline');
    socket.off('receive_message');
    socket.off('message_sent');
    socket.off('messages_read');
    socket.off('messages_delivered');
    socket.off('typing_status');
    socket.off('message_deleted');

    // Online Users List
    socket.on('online_users_list', (userIds) => {
      set({ onlineUserIds: new Set(userIds) });
    });

    // Presence updates
    socket.on('user:online', ({ userId }) => {
      set(state => {
        const nextSet = new Set(state.onlineUserIds);
        nextSet.add(userId);
        return { onlineUserIds: nextSet };
      });
    });

    socket.on('user:offline', ({ userId }) => {
      set(state => {
        const nextSet = new Set(state.onlineUserIds);
        nextSet.delete(userId);
        return { onlineUserIds: nextSet };
      });
    });

    // Request desktop notification permission when socket is initialized
    requestNotificationPermission();

    // Receive Message Event
    socket.on('receive_message', (rawMsg) => {
      const msg = {
        ...rawMsg,
        id: (rawMsg.id || rawMsg._id)?.toString(),
        senderId: rawMsg.senderId?.toString(),
        receiverId: rawMsg.receiverId?.toString(),
        conversationId: rawMsg.conversationId?.toString()
      };

      const { activeContactId, isOpen, messages, unreadCounts, users } = get();
      const senderId = msg.senderId;
      const activeId = activeContactId?.toString();
      const senderObj = msg.sender || users.find(u => u.id?.toString() === senderId);
      const senderName = senderObj?.name || 'New Message';
      const textPreview = msg.text
        ? (msg.text.length > 60 ? msg.text.substring(0, 60) + '...' : msg.text)
        : 'Sent an attachment';

      // 1. Play real-time notification audio chime
      playNotificationSound();

      // 2. Show OS native desktop notification if window is hidden
      showNativeNotification(`Message from ${senderName}`, {
        body: textPreview,
        icon: senderObj?.avatar || '/favicon.ico'
      });

      // 3. Show Sonner toast banner with instant Reply button if chat room is closed or with another contact
      if (!isOpen || activeId !== senderId) {
        toast(`💬 ${senderName}`, {
          description: textPreview,
          action: {
            label: 'Reply',
            onClick: () => {
              set({ isOpen: true });
              get().selectContact(senderId);
            }
          }
        });
      }

      if (activeId === senderId) {
        // Active chat room is open with this contact - append message instantly!
        set({ messages: [...messages, msg] });

        if (isOpen) {
          // Immediately mark read
          socket.emit('mark_read', { conversationId: msg.conversationId, senderId });
        } else {
          // Increment unread count
          const currentCount = unreadCounts[senderId] || 0;
          set({ unreadCounts: { ...unreadCounts, [senderId]: currentCount + 1 } });
        }
      } else {
        // Message from another contact
        const currentCount = unreadCounts[senderId] || 0;
        set({ unreadCounts: { ...unreadCounts, [senderId]: currentCount + 1 } });
      }

      // Refresh users list order / preview
      get().fetchUsers();
    });

    // Sent Message Acknowledgment
    socket.on('message_sent', (rawMsg) => {
      const msg = {
        ...rawMsg,
        id: (rawMsg.id || rawMsg._id)?.toString(),
        senderId: rawMsg.senderId?.toString(),
        receiverId: rawMsg.receiverId?.toString(),
        conversationId: rawMsg.conversationId?.toString()
      };

      const { activeContactId, messages } = get();
      const activeId = activeContactId?.toString();

      if (activeId === msg.receiverId) {
        // Prevent duplicate appending
        const exists = messages.some(m => m.id?.toString() === msg.id);
        if (!exists) {
          set({ messages: [...messages, msg] });
        }
      }
      get().fetchUsers();
    });

    // Read Receipts Updates
    socket.on('messages_read', ({ conversationId, readerId, readAt }) => {
      const { activeConversationId, messages } = get();
      if (activeConversationId === conversationId || get().activeContactId === readerId) {
        const updatedMessages = messages.map(m => {
          if (m.senderId === currentUserId && m.status !== 'read') {
            return { ...m, status: 'read', readAt };
          }
          return m;
        });
        set({ messages: updatedMessages });
      }
    });

    // Delivery Statuses Updates
    socket.on('messages_delivered', ({ receiverId, deliveredAt }) => {
      const { activeContactId, messages } = get();
      if (activeContactId === receiverId) {
        const updatedMessages = messages.map(m => {
          if (m.senderId === currentUserId && m.status === 'sent') {
            return { ...m, status: 'delivered', deliveredAt };
          }
          return m;
        });
        set({ messages: updatedMessages });
      }
    });

    // Typing Status Updates
    socket.on('typing_status', ({ senderId, isTyping }) => {
      set(state => ({
        typingUsers: { ...state.typingUsers, [senderId]: isTyping }
      }));
    });

    // Message Deleted Event
    socket.on('message_deleted', ({ messageId }) => {
      set(state => ({
        messages: state.messages.filter(m => m.id !== messageId)
      }));
    });
  },

  // Production Real-time Smart Sync Polling Engine (Fallback when Socket.io is disconnected/serverless)
  syncIntervalId: null,

  startRealtimeSync: (currentUserId) => {
    if (get().syncIntervalId) clearInterval(get().syncIntervalId);

    const syncFn = async () => {
      try {
        const { activeContactId, messages, unreadCounts, isOpen } = get();

        // 1. Silent Users List & Unread Counts Fetch
        const userRes = await api.getChatUsers();
        const userList = userRes.data || userRes || [];

        const nextUnreadMap = {};
        let newUnreadSender = null;

        userList.forEach(u => {
          const uId = u.id?.toString();
          const count = u.unreadCount || 0;
          nextUnreadMap[uId] = count;

          const oldCount = unreadCounts[uId] || 0;
          if (count > oldCount && uId !== activeContactId?.toString()) {
            newUnreadSender = u;
          }
        });

        set({ users: userList, unreadCounts: nextUnreadMap });

        if (newUnreadSender) {
          playNotificationSound();
          showNativeNotification(`Message from ${newUnreadSender.name}`, {
            body: newUnreadSender.lastMessage?.text || 'Sent an attachment',
            icon: newUnreadSender.avatar || '/favicon.ico'
          });

          if (!isOpen || activeContactId !== newUnreadSender.id) {
            toast(`💬 ${newUnreadSender.name}`, {
              description: newUnreadSender.lastMessage?.text || 'Sent an attachment',
              action: {
                label: 'Reply',
                onClick: () => {
                  set({ isOpen: true });
                  get().selectContact(newUnreadSender.id);
                }
              }
            });
          }
        }

        // 2. Silent Active Chat Room Message Sync
        if (activeContactId) {
          const msgRes = await api.getChatMessages({ targetUserId: activeContactId });
          const payload = msgRes.data || msgRes;
          const freshMessages = payload.messages || [];

          if (freshMessages.length > messages.length) {
            const latestMsg = freshMessages[freshMessages.length - 1];
            const latestSenderId = latestMsg.senderId?.toString();
            const myId = currentUserId?.toString();

            if (latestSenderId !== myId) {
              const lastMsgInState = messages[messages.length - 1];
              if (!lastMsgInState || lastMsgInState.id !== latestMsg.id) {
                playNotificationSound();
              }
            }

            set({ messages: freshMessages });
          }
        }
      } catch (err) {
        // Silent catch for background sync
      }
    };

    syncFn();
    const intervalId = setInterval(syncFn, 3000);
    set({ syncIntervalId: intervalId });
  },

  stopRealtimeSync: () => {
    const intervalId = get().syncIntervalId;
    if (intervalId) {
      clearInterval(intervalId);
      set({ syncIntervalId: null });
    }
  }
}));

export default useChatStore;
