import React from 'react';
import { MessageSquare, X } from 'lucide-react';
import useChatStore from '../../stores/chatStore';

export default function ChatLauncher() {
  const isOpen = useChatStore((state) => state.isOpen);
  const toggleChat = useChatStore((state) => state.toggleChat);
  const unreadCounts = useChatStore((state) => state.unreadCounts);

  const totalUnreadCount = Object.values(unreadCounts || {}).reduce(
    (sum, count) => sum + (count || 0),
    0
  );

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center justify-center select-none">
      <button
        id="live-chat-launcher-btn"
        onClick={toggleChat}
        aria-label="Toggle Live Chat"
        className={`group relative flex items-center justify-center w-14 h-14 rounded-2xl shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 ${isOpen
            ? 'bg-slate-900 text-white shadow-slate-900/30'
            : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white shadow-indigo-500/30 hover:shadow-indigo-500/50'
          }`}
      >
        <div className="transition-transform duration-300 transform group-hover:rotate-6">
          {isOpen ? (
            <X className="w-6 h-6 transition-transform duration-200 rotate-0 hover:rotate-90" />
          ) : (
            <MessageSquare className="w-6 h-6" />
          )}
        </div>

        {/* Dynamic Pulsing Unread Notification Badge */}
        {!isOpen && totalUnreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white shadow-lg ring-2 ring-white animate-bounce">
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </span>
        )}
      </button>
    </div>
  );
}