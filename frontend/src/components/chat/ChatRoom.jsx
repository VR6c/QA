import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Paperclip,
  Check,
  CheckCheck,
  Trash2,
  MessageSquare,
  Smile,
  Bold,
  Italic,
  Link as LinkIcon,
  MoreHorizontal,
  UserPlus,
  CheckCircle,
  X,
  FileText,
  ArrowLeft,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import useChatStore from '../../stores/chatStore';
import useAuthStore from '../../stores/authStore';
import EmojiStickerPicker from './EmojiStickerPicker';

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ChatRoom() {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [attachmentUrlInput, setAttachmentUrlInput] = useState('');
  const [showAttachInput, setShowAttachInput] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const currentUser = useAuthStore((state) => state.user);
  const users = useChatStore((state) => state.users);
  const activeContactId = useChatStore((state) => state.activeContactId);
  const selectContact = useChatStore((state) => state.selectContact);
  const messages = useChatStore((state) => state.messages);
  const isLoadingMessages = useChatStore((state) => state.isLoadingMessages);
  const onlineUserIds = useChatStore((state) => state.onlineUserIds);
  const typingUsers = useChatStore((state) => state.typingUsers);

  const sendMessage = useChatStore((state) => state.sendMessage);
  const deleteMessage = useChatStore((state) => state.deleteMessage);
  const sendTypingStart = useChatStore((state) => state.sendTypingStart);
  const sendTypingStop = useChatStore((state) => state.sendTypingStop);

  const targetContact = users.find((u) => u.id === activeContactId);
  const isOnline = activeContactId ? (onlineUserIds.has(activeContactId) || Boolean(targetContact?.isOnline)) : false;
  const isTargetTyping = activeContactId ? !!typingUsers[activeContactId] : false;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTargetTyping]);

  const handleInputChange = (e) => {
    const text = e.target.value;
    if (text.length <= 4000) setInputText(text);

    sendTypingStart();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStop();
    }, 2000);
  };

  const handleAddAttachment = () => {
    const url = attachmentUrlInput.trim();
    if (!url) return;

    const fileType = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url) ? 'image' : 'file';
    setAttachments((prev) => [
      ...prev,
      { name: url.split('/').pop() || 'Attachment', url, fileType }
    ]);
    setAttachmentUrlInput('');
    setShowAttachInput(false);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        const fileType = file.type.startsWith('image/') ? 'image' : 'file';
        setAttachments((prev) => [
          ...prev,
          { name: file.name, url: dataUrl, fileType }
        ]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectEmoji = (emoji) => {
    setInputText((prev) => prev + emoji);
  };

  const handleSelectSticker = async (sticker) => {
    setShowEmojiPicker(false);
    try {
      await sendMessage({
        text: sticker.name,
        attachments: [{
          name: sticker.name,
          url: sticker.emoji,
          fileType: 'sticker',
          stickerId: sticker.id,
          stickerBg: sticker.bg
        }],
        currentUserId: currentUser?.id || currentUser?._id
      });
    } catch (err) {
      console.error('Failed to send sticker:', err);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if ((!inputText.trim() && attachments.length === 0) || isSending) return;

    try {
      setIsSending(true);
      sendTypingStop();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      await sendMessage({
        text: inputText.trim(),
        attachments,
        currentUserId: currentUser?.id || currentUser?._id
      });

      setInputText('');
      setAttachments([]);
      setShowAttachInput(false);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  if (!activeContactId || !targetContact) {
    return (
      <div className="flex-1 bg-slate-50/50 flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-md border border-slate-200/60 flex items-center justify-center text-indigo-500 mb-4 animate-pulse">
          <MessageSquare className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 mb-1">Select a Conversation</h3>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          Choose a user from the directory to start real-time messaging.
        </p>
      </div>
    );
  }

  const targetInitials = getInitials(targetContact.name);
  const myInitials = getInitials(currentUser?.name || 'Me');

  return (
    <div className="flex-1 bg-white flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-white/80 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile Back Button */}
          <button
            onClick={() => selectContact(null)}
            className="md:hidden p-1.5 -ml-1 text-slate-500 hover:bg-slate-100 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="relative">
            {targetContact.avatar ? (
              <img
                src={targetContact.avatar}
                alt={targetContact.name}
                className="w-9 h-9 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 font-bold text-xs flex items-center justify-center">
                {targetInitials}
              </div>
            )}
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ring-1 ring-black/5 ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
            />
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900">{targetContact.name}</h4>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
              <span>{isOnline ? 'Active now' : 'Offline'}</span>
              {isTargetTyping && (
                <span className="text-indigo-600 font-semibold animate-pulse">• typing...</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message History Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        <div className="flex items-center justify-center my-1">
          <span className="text-[10px] font-semibold text-slate-400 bg-white/80 px-3 py-1 rounded-full border border-slate-200/60 shadow-xs">
            {new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {isLoadingMessages ? (
          <div className="p-6 text-center text-xs text-slate-400 animate-pulse">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No previous messages. Say hi to {targetContact.name}!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.id || msg.senderId === currentUser?._id;

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 group ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 font-bold text-[10px] flex items-center justify-center border border-indigo-100 shrink-0 mb-4">
                    {targetInitials}
                  </div>
                )}

                <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed transition-all duration-300 ${isMe
                      ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200/70 rounded-bl-xs'
                      } ${msg.isPending || msg.status === 'sending' ? 'opacity-85 animate-pulse' : ''}`}
                  >
                    {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}

                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {msg.attachments.map((att, idx) => (
                          <div key={idx} className="rounded-xl overflow-hidden">
                            {att.fileType === 'sticker' ? (
                              <div className={`flex flex-col items-center justify-center p-3.5 rounded-2xl bg-gradient-to-tr ${att.stickerBg || 'from-indigo-500 to-purple-600'} text-white shadow-md select-none transform hover:scale-105 transition-all duration-200`}>
                                <span className="text-5xl filter drop-shadow-md animate-bounce [animation-duration:2s]">{att.url}</span>
                                <span className="text-[10px] font-extrabold mt-1 tracking-wider uppercase opacity-90">{att.name}</span>
                              </div>
                            ) : att.fileType === 'image' ? (
                              <div className="bg-black/10 p-1.5 rounded-xl">
                                <img
                                  src={att.url}
                                  alt={att.name}
                                  className="max-h-44 max-w-full rounded-lg object-cover"
                                />
                              </div>
                            ) : (
                              <div className="bg-black/10 p-1.5 rounded-xl">
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`flex items-center gap-1.5 text-xs font-medium hover:underline ${isMe ? 'text-blue-100' : 'text-indigo-600'
                                    }`}
                                >
                                  <FileText className="w-4 h-4 shrink-0" />
                                  <span className="truncate">{att.name}</span>
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Message Meta */}
                  <div
                    className={`flex items-center gap-1 mt-1 text-[10px] text-slate-400 ${isMe ? 'justify-end' : 'justify-start'
                      }`}
                  >
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>

                    {isMe && (
                      <span className="inline-flex items-center ml-0.5">
                        {msg.isPending || msg.status === 'sending' ? (
                          <span className="flex items-center gap-1 text-[10px] text-blue-500 font-semibold animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                            <span>sending...</span>
                          </span>
                        ) : msg.status === 'read' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-indigo-500" title="Read" />
                        ) : msg.status === 'delivered' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-slate-400" title="Delivered" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-slate-400" title="Sent" />
                        )}
                      </span>
                    )}

                    {(isMe || ['Super Admin', 'Admin'].includes(currentUser?.role)) && !msg.isPending && (
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-500 hover:text-rose-700 ml-1.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {isMe && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mb-4 shadow-xs">
                    {myInitials}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Animated 3-Dot Typing Indicator Bubble */}
        {isTargetTyping && (
          <div className="flex items-end gap-2 my-2 select-none animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 font-bold text-[10px] flex items-center justify-center border border-indigo-100 shrink-0">
              {targetInitials}
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl rounded-bl-xs px-4 py-2.5 shadow-xs flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.32s]"></span>
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.16s]"></span>
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
              </div>
              <span className="text-[11px] font-medium text-slate-400">{targetContact.name} is typing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Input Toggle */}
      {showAttachInput && (
        <div className="px-4 py-2 bg-slate-100/80 border-t border-slate-200 flex items-center gap-2 animate-in fade-in">
          <input
            type="url"
            placeholder="Paste file or image URL..."
            value={attachmentUrlInput}
            onChange={(e) => setAttachmentUrlInput(e.target.value)}
            className="flex-1 bg-white text-xs text-slate-800 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleAddAttachment}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            Add
          </button>
          <button
            onClick={() => setShowAttachInput(false)}
            className="p-2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-2 overflow-x-auto">
          {attachments.map((att, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 bg-white text-slate-700 text-[11px] px-2.5 py-1 rounded-xl border border-slate-200 shadow-xs"
            >
              <span className="truncate max-w-[120px] font-medium">{att.name}</span>
              <button
                onClick={() => handleRemoveAttachment(i)}
                className="text-slate-400 hover:text-rose-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Message Composer Form */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200/80 space-y-2">
        <div className="relative flex items-center">
          <input
            id="chat-message-text-input"
            type="text"
            placeholder="Type your message..."
            value={inputText}
            onChange={handleInputChange}
            maxLength={4000}
            className="w-full bg-slate-50 text-xs text-slate-800 placeholder-slate-400 pl-4 pr-12 py-3 rounded-2xl border border-slate-200/80 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
          />
          <span className="absolute right-3.5 text-[10px] text-slate-400 font-medium select-none">
            {4000 - inputText.length}
          </span>
        </div>

        {/* Hidden File Selector Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,application/pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp"
          multiple
          className="hidden"
        />

        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-0.5 text-slate-400">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach image or file from computer"
              className="p-2 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload image"
              className="p-2 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowAttachInput(!showAttachInput)}
              title="Attach via URL link"
              className="p-2 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Emoji and Stickers"
              className={`p-2 rounded-xl transition-colors ${showEmojiPicker ? 'text-indigo-600 bg-indigo-50' : 'hover:text-indigo-600 hover:bg-slate-100'}`}
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>

          {/* Emoji & Sticker Picker Popover */}
          {showEmojiPicker && (
            <EmojiStickerPicker
              onSelectEmoji={handleSelectEmoji}
              onSelectSticker={handleSelectSticker}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}

          <button
            id="chat-send-message-btn"
            type="submit"
            disabled={(!inputText.trim() && attachments.length === 0) || isSending}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-500/20 active:scale-95"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}