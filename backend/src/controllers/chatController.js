import User from '../models/User.js';
import Owner from '../models/Owner.js';
import Conversation from '../models/Conversation.js';
import ChatMessage from '../models/ChatMessage.js';
import { isUserOnline } from '../socket/chatSocket.js';
import { recordActivity } from '../services/auditLogger.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';

// Get active system users with presence, last message & personal unread count
export const getSystemUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Update current user's active timestamp
    User.findByIdAndUpdate(currentUserId, { last_login_at: new Date() }).exec();

    // Fetch all active registered users excluding current user
    const users = await User.find({
      _id: { $ne: currentUserId },
      status: 'Active',
      deleted_at: null
    }).select('name username email avatar role department position status last_login_at updatedAt').lean();

    // Map each user with unread counts, presence, and last message info
    const userListWithDetails = await Promise.all(
      users.map(async (u) => {
        const uId = u._id.toString();

        // 1. Unread count from this contact to current user
        const unreadCount = await ChatMessage.countDocuments({
          senderId: uId,
          receiverId: currentUserId,
          status: { $ne: 'read' }
        });

        // 2. Find conversation between current user and this contact
        const conversation = await Conversation.findOne({
          participants: { $all: [currentUserId, uId] }
        }).lean();

        let lastMessage = null;
        if (conversation && conversation.lastMessage) {
          lastMessage = await ChatMessage.findById(conversation.lastMessage).lean();
        }

        // Determine if user is active (Socket connected OR active within last 4 minutes)
        const lastActive = u.last_login_at || u.updatedAt;
        const isActiveTimestamp = lastActive && (Date.now() - new Date(lastActive).getTime() <= 4 * 60 * 1000);
        const isOnline = isUserOnline(uId) || Boolean(isActiveTimestamp);

        return {
          id: uId,
          name: u.name,
          username: u.username,
          email: u.email,
          avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`,
          role: u.role,
          department: u.department,
          position: u.position,
          isOnline,
          unreadCount,
          conversationId: conversation ? conversation._id.toString() : null,
          lastMessage: lastMessage ? {
            id: lastMessage._id.toString(),
            text: lastMessage.text,
            senderId: lastMessage.senderId.toString(),
            createdAt: lastMessage.createdAt,
            status: lastMessage.status
          } : null
        };
      })
    );

    // Sort users: first by unread count descending, then by last message time, then name
    userListWithDetails.sort((a, b) => {
      if (b.unreadCount !== a.unreadCount) {
        return b.unreadCount - a.unreadCount;
      }
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      if (timeB !== timeA) return timeB - timeA;
      return a.name.localeCompare(b.name);
    });

    return sendSuccess(res, userListWithDetails, null, 'Active users fetched successfully');
  } catch (error) {
    return sendError(res, error.message || 'Failed to fetch users', 500, 'ERR_INTERNAL');
  }
};

// Get messages for a specific conversation or user contact
export const getMessages = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { conversationId, targetUserId } = req.query;

    let conversation = null;

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    } else if (targetUserId) {
      conversation = await Conversation.findOne({
        participants: { $all: [currentUserId, targetUserId] }
      });
      if (!conversation) {
        // Automatically create conversation document if initializing (REQ-CHAT-3.1)
        conversation = await Conversation.create({
          participants: [currentUserId, targetUserId]
        });
      }
    } else {
      return sendError(res, 'conversationId or targetUserId query parameter is required.', 400, 'ERR_VALIDATION');
    }

    if (!conversation) {
      return sendSuccess(res, { conversationId: null, messages: [] });
    }

    // Verify current user is a participant
    const isParticipant = conversation.participants.some(p => p.toString() === currentUserId);
    if (!isParticipant) {
      return sendError(res, 'Access denied to this conversation.', 403, 'ERR_FORBIDDEN');
    }

    // Mark unread messages in this conversation as read
    await ChatMessage.updateMany(
      {
        conversationId: conversation._id,
        receiverId: currentUserId,
        status: { $ne: 'read' }
      },
      {
        $set: { status: 'read', readAt: new Date() }
      }
    );

    // Fetch messages
    const messages = await ChatMessage.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .lean();

    const formattedMessages = messages.map(m => ({
      id: m._id.toString(),
      conversationId: m.conversationId.toString(),
      senderId: m.senderId.toString(),
      receiverId: m.receiverId.toString(),
      text: m.text,
      attachments: m.attachments || [],
      replyTo: m.replyTo || null,
      status: m.status,
      deliveredAt: m.deliveredAt,
      readAt: m.readAt,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt
    }));

    return sendSuccess(res, {
      conversationId: conversation._id.toString(),
      messages: formattedMessages
    }, null, 'Messages retrieved successfully');
  } catch (error) {
    return sendError(res, error.message || 'Failed to fetch messages', 500, 'ERR_INTERNAL');
  }
};

// Send message HTTP Fallback
export const sendMessage = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { receiverId, text, attachments, replyTo } = req.body;

    if (!receiverId) {
      return sendError(res, 'receiverId is required', 400, 'ERR_VALIDATION');
    }

    const cleanText = (text || '').trim();
    if (cleanText.length > 4000) {
      return sendError(res, 'Message text payload exceeds maximum 4,000 characters limit.', 400, 'ERR_VALIDATION');
    }

    if (!cleanText && (!attachments || attachments.length === 0)) {
      return sendError(res, 'Message text or attachments required.', 400, 'ERR_VALIDATION');
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, receiverId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, receiverId]
      });
    }

    const isReceiverOnline = isUserOnline(receiverId);
    const initialStatus = isReceiverOnline ? 'delivered' : 'sent';
    const deliveredAt = isReceiverOnline ? new Date() : null;

    const message = await ChatMessage.create({
      conversationId: conversation._id,
      senderId: currentUserId,
      receiverId,
      text: cleanText,
      attachments: attachments || [],
      replyTo: replyTo || null,
      status: initialStatus,
      deliveredAt
    });

    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    return sendSuccess(res, message.toJSON(), null, 'Message sent successfully', 201);
  } catch (error) {
    return sendError(res, error.message || 'Failed to send message', 500, 'ERR_INTERNAL');
  }
};

// Delete message (Moderation Deletion / Audit integration REQ-CHAT-3.3)
export const deleteMessage = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { messageId } = req.params;

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return sendError(res, 'Message not found.', 404, 'ERR_NOT_FOUND');
    }

    const isSender = message.senderId.toString() === currentUserId;
    const isAdmin = ['Super Admin', 'Admin'].includes(req.user.role);

    if (!isSender && !isAdmin) {
      return sendError(res, 'Permission denied to delete this message.', 403, 'ERR_FORBIDDEN');
    }

    await ChatMessage.findByIdAndDelete(messageId);

    // Audit Log Integration Hook (REQ-CHAT-3.3)
    recordActivity({
      req,
      userId: currentUserId,
      userName: req.user.name,
      userEmail: req.user.email,
      roleName: req.user.role,
      module: 'Live Chat Engine',
      action: 'MESSAGE_DELETED',
      targetType: 'ChatMessage',
      targetId: messageId,
      description: `Moderation deletion of chat message by ${req.user.name}`
    });

    return sendSuccess(res, { messageId }, null, 'Message deleted successfully');
  } catch (error) {
    return sendError(res, error.message || 'Failed to delete message', 500, 'ERR_INTERNAL');
  }
};
