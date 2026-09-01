import React from 'react';
import ContactsPanel from './ContactsPanel';
import ChatRoom from './ChatRoom';
import useChatStore from '../../stores/chatStore';

export default function ChatModal() {
  const isOpen = useChatStore((state) => state.isOpen);
  const activeContactId = useChatStore((state) => state.activeContactId);

  if (!isOpen) return null;

  return (
    <div
      id="live-chat-modal-container"
      className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[92vw] max-w-[820px] h-[600px] max-h-[82vh] bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl shadow-2xl overflow-hidden flex flex-row transition-all duration-300 animate-in fade-in zoom-in-95 ring-1 ring-slate-900/5 font-sans"
    >
      {/* Left Contacts Panel */}
      <div className={`h-full ${activeContactId ? 'hidden md:flex' : 'flex w-full md:w-auto'}`}>
        <ContactsPanel />
      </div>

      {/* Right Chat Room */}
      <div className={`flex-1 h-full ${!activeContactId ? 'hidden md:flex' : 'flex'}`}>
        <ChatRoom />
      </div>
    </div>
  );
}