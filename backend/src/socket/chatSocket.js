import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { JWT_SECRET } from '../middleware/authMiddleware.js';
import Conversation from '../models/Conversation.js';
import ChatMessage from '../models/ChatMessage.js';
import User from '../models/User.js';
import { recordActivity } from '../services/auditLogger.js';

// In-memory online user sockets mapping: userId -> Set<socketId>
const onlineUsers = new Map();

export const isUserOnline = (userId) => {
  if (!userId) return false;
  const strId = userId.toString();
  const sockets = onlineUsers.get(strId);
  return !!(sockets && sockets.size > 0);
};

export const getOnlineUserIds = () => {
  return Array.from(onlineUsers.keys());
};

export function setupChatSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    }
  });

  // Socket Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    const strUserId = userId.toString();

    // 1. Track presence
    if (!onlineUsers.has(strUserId)) {
      onlineUsers.set(strUserId, new Set());
    }
    const userSockets = onlineUsers.get(strUserId);
    const isFirstConnection = userSockets.size === 0;
    userSockets.add(socket.id);

    // Join personal user room
    socket.join(`user:${strUserId}`);

    // Broadcast presence update if first connection
    if (isFirstConnection) {
      io.emit('user:online', { userId: strUserId });
    }

    // Send initial list of online user IDs
    socket.emit('online_users_list', getOnlineUserIds());

    // 2. Mark undelivered messages sent to this user as 'delivered'
    try {
      const undeliveredMessages = await ChatMessage.find({
        receiverId: userId,
        status: 'sent'
      });

      if (undeliveredMessages.length > 0) {
        const now = new Date();
        await ChatMessage.updateMany(
          { receiverId: userId, status: 'sent' },
          { $set: { status: 'delivered', deliveredAt: now } }
        );

        // Group by sender and notify senders
        const senderIds = [...new Set(undeliveredMessages.map(m => m.senderId.toString()))];
        for (const sId of senderIds) {
          io.to(`user:${sId}`).emit('messages_delivered', {
            receiverId: strUserId,
            deliveredAt: now
          });
        }
      }
    } catch (err) {
      console.error('Error updating undelivered messages:', err.message);
    }

    // 3. Send Message Event Handler
    socket.on('send_message', async (data, ackCallback) => {
      try {
        const { receiverId, text, attachments } = data || {};
        if (!receiverId) {
          if (typeof ackCallback === 'function') ackCallback({ error: 'Receiver ID is required' });
          return;
        }

        const cleanText = (text || '').trim();
        if (cleanText.length > 4000) {
          if (typeof ackCallback === 'function') ackCallback({ error: 'Message exceeds 4000 character limit' });
          return;
        }

        if (!cleanText && (!attachments || attachments.length === 0)) {
          if (typeof ackCallback === 'function') ackCallback({ error: 'Message text or attachment required' });
          return;
        }

        // Find or Create Conversation
        let conversation = await Conversation.findOne({
          participants: { $all: [userId, receiverId] }
        });

        if (!conversation) {
          conversation = await Conversation.create({
            participants: [userId, receiverId]
          });
        }

        // Determine delivery status
        const isReceiverOnline = isUserOnline(receiverId);
        const initialStatus = isReceiverOnline ? 'delivered' : 'sent';
        const deliveredAt = isReceiverOnline ? new Date() : null;

        const message = await ChatMessage.create({
          conversationId: conversation._id,
          senderId: userId,
          receiverId: receiverId,
          text: cleanText,
          attachments: attachments || [],
          status: initialStatus,
          deliveredAt
        });

        // Update Conversation's last message info
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = message.createdAt;
        await conversation.save();

        const messageObj = message.toJSON();

        // Populate sender info for recipient preview
        const senderUser = await User.findById(userId).select('name username avatar').lean();
        messageObj.sender = senderUser;

        // Emit to receiver's socket room
        io.to(`user:${receiverId}`).emit('receive_message', messageObj);

        // Emit acknowledgment back to sender
        socket.emit('message_sent', messageObj);
        if (typeof ackCallback === 'function') ackCallback({ success: true, message: messageObj });
      } catch (err) {
        console.error('Error handling send_message socket event:', err);
        if (typeof ackCallback === 'function') ackCallback({ error: err.message || 'Failed to send message' });
      }
    });

    // 4. Mark Read Handler
    socket.on('mark_read', async (data) => {
      try {
        const { conversationId, senderId } = data || {};
        if (!conversationId) return;

        const now = new Date();
        const updateResult = await ChatMessage.updateMany(
          {
            conversationId,
            receiverId: userId,
            status: { $ne: 'read' }
          },
          {
            $set: { status: 'read', readAt: now }
          }
        );

        if (updateResult.modifiedCount > 0) {
          // Notify the sender that messages were read
          const targetSenderId = senderId ? senderId.toString() : null;
          if (targetSenderId) {
            io.to(`user:${targetSenderId}`).emit('messages_read', {
              conversationId,
              readerId: strUserId,
              readAt: now
            });
          } else {
            // Find sender from conversation
            const conv = await Conversation.findById(conversationId).lean();
            if (conv) {
              const otherParticipant = conv.participants.find(p => p.toString() !== strUserId);
              if (otherParticipant) {
                io.to(`user:${otherParticipant.toString()}`).emit('messages_read', {
                  conversationId,
                  readerId: strUserId,
                  readAt: now
                });
              }
            }
          }
        }
      } catch (err) {
        console.error('Error marking messages read:', err.message);
      }
    });

    // 5. Typing Indicators
    socket.on('typing_start', ({ receiverId }) => {
      if (receiverId) {
        io.to(`user:${receiverId}`).emit('typing_status', {
          senderId: strUserId,
          isTyping: true
        });
      }
    });

    socket.on('typing_stop', ({ receiverId }) => {
      if (receiverId) {
        io.to(`user:${receiverId}`).emit('typing_status', {
          senderId: strUserId,
          isTyping: false
        });
      }
    });

    // 6. Moderation Deletion Event (Audit log hook REQ-CHAT-3.3)
    socket.on('delete_message', async ({ messageId }, ackCallback) => {
      try {
        const msg = await ChatMessage.findById(messageId);
        if (!msg) {
          if (typeof ackCallback === 'function') ackCallback({ error: 'Message not found' });
          return;
        }

        // Only sender or Super Admin/Admin can delete message
        if (msg.senderId.toString() !== strUserId && !['Super Admin', 'Admin'].includes(socket.user.role)) {
          if (typeof ackCallback === 'function') ackCallback({ error: 'Unauthorized to delete message' });
          return;
        }

        await ChatMessage.findByIdAndDelete(messageId);

        // Audit Log Integration (REQ-CHAT-3.3)
        recordActivity({
          req: { headers: {}, ip: socket.handshake.address, user: socket.user },
          userId: socket.user.id,
          userName: socket.user.name,
          userEmail: socket.user.email,
          roleName: socket.user.role,
          module: 'Live Chat Engine',
          action: 'MESSAGE_DELETED',
          targetType: 'ChatMessage',
          targetId: messageId,
          description: `Message deleted by ${socket.user.name} in conversation ${msg.conversationId}`
        });

        // Notify both participants
        io.to(`user:${msg.senderId.toString()}`).emit('message_deleted', { messageId, conversationId: msg.conversationId });
        io.to(`user:${msg.receiverId.toString()}`).emit('message_deleted', { messageId, conversationId: msg.conversationId });

        if (typeof ackCallback === 'function') ackCallback({ success: true, messageId });
      } catch (err) {
        if (typeof ackCallback === 'function') ackCallback({ error: err.message });
      }
    });

    // 7. Disconnect Handler
    socket.on('disconnect', () => {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        onlineUsers.delete(strUserId);
        io.emit('user:offline', { userId: strUserId });
      }
    });
  });

  return io;
}
