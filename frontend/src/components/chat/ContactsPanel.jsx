import React from 'react';
import { Search, MessageSquare, Users, Settings, Activity, Sparkles } from 'lucide-react';
import useChatStore from '../../stores/chatStore';

const AVATAR_COLORS = [
  'bg-rose-50 text-rose-600 border-rose-200',
  'bg-emerald-50 text-emerald-600 border-emerald-200',
  'bg-violet-50 text-violet-600 border-violet-200',
  'bg-amber-50 text-amber-600 border-amber-200',
  'bg-indigo-50 text-indigo-600 border-indigo-200',
  'bg-sky-50 text-sky-600 border-sky-200'
];

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(idStr) {
  let hash = 0;
  for (let i = 0; i < (idStr || '').length; i++) {
    hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ContactsPanel() {
  const users = useChatStore((state) => state.users);
  const searchQuery = useChatStore((state) => state.searchQuery);
  const setSearchQuery = useChatStore((state) => state.setSearchQuery);
  const activeContactId = useChatStore((state) => state.activeContactId);
  const selectContact = useChatStore((state) => state.selectContact);
  const onlineUserIds = useChatStore((state) => state.onlineUserIds);
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const isLoadingUsers = useChatStore((state) => state.isLoadingUsers);

  const typingUsers = useChatStore((state) => state.typingUsers);

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex h-full border-r border-slate-200/80 bg-white select-none w-full md:w-80">
      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col h-full bg-slate-50/40">
        {/* Header & Search */}
        <div className="p-4 border-b border-slate-200/80 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              Messages
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </h3>
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredUsers.length}
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              id="chat-user-search-input"
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-100/70 text-xs text-slate-800 placeholder-slate-400 rounded-xl border border-transparent focus:border-indigo-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100/80 p-2 space-y-1">
          {isLoadingUsers && users.length === 0 ? (
            <div className="p-6 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Loading contacts...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No contacts found</div>
          ) : (
            filteredUsers.map((u) => {
              const isSelected = activeContactId === u.id;
              const isOnline = onlineUserIds.has(u.id) || Boolean(u.isOnline);
              const unread = unreadCounts[u.id] || 0;
              const initials = getInitials(u.name);
              const avatarColor = getAvatarColor(u.id);

              return (
                <button
                  key={u.id}
                  id={`chat-contact-${u.id}`}
                  onClick={() => selectContact(u.id)}
                  className={`w-full p-2.5 rounded-2xl flex items-center gap-3 transition-all text-left relative ${isSelected
                      ? 'bg-white shadow-sm ring-1 ring-slate-200/80 text-slate-900'
                      : 'hover:bg-white/80 text-slate-700'
                    }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {u.avatar ? (
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border ${avatarColor}`}
                      >
                        {initials}
                      </div>
                    )}
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ring-1 ring-black/5 ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                    />
                  </div>

                  {/* Text Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold text-xs text-slate-900 truncate">
                        {u.name}
                      </span>
                      {u.lastMessage && (
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {new Date(u.lastMessage.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      {typingUsers[u.id] ? (
                        <span className="text-[11px] font-semibold text-indigo-600 animate-pulse flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping"></span>
                          typing...
                        </span>
                      ) : (
                        <p className="text-[11px] text-slate-500 truncate max-w-[140px]">
                          {u.lastMessage ? u.lastMessage.text : u.role || 'Member'}
                        </p>
                      )}

                      {unread > 0 && (
                        <span className="shrink-0 bg-indigo-600 text-white font-bold text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-xs">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}