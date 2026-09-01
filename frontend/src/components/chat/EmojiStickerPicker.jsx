import React, { useState } from 'react';
import { Smile, Sticker, X } from 'lucide-react';

const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥹', '😊',
  '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😋', '😛',
  '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥳', '🤩', '😏', '😒',
  '😞', '😔', '😟', '😕', '🙁', '🥺', '😢', '😭', '😤', '😠',
  '😡', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓',
  '🤗', '🤔', '🫣', '🤭', '🫡', '🤫', '🫠', '😶', '😐', '😬',
  '🙄', '😯', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
  '💩', '👻', '💀', '👽', '🤖', '👍', '👎', '👏', '🙌', '👐',
  '🤝', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇',
  '✋', '🖐️', '🖖', '👊', '🤛', '🤜', '🤌', '🤏', '💪', '❤️',
  '🩷', '🧡', '💛', '💚', '💙', '🩵', '💜', '🤎', '🖤', '🩶',
  '🤍', '💯', '💥', '🔥', '✨', '⭐️', '🌟', '⚡️', '🎉', '🎊',
  '🎯', '🏆', '🚀', '☕️'
];

const STICKERS_LIST = [
  { id: 'stk_1', emoji: '🐱', name: 'Happy Cat', bg: 'from-amber-400 to-orange-500' },
  { id: 'stk_2', emoji: '👍', name: 'Super Like', bg: 'from-blue-500 to-indigo-600' },
  { id: 'stk_3', emoji: '🚀', name: 'To The Moon', bg: 'from-purple-500 to-pink-600' },
  { id: 'stk_4', emoji: '🎉', name: 'Party Time', bg: 'from-emerald-400 to-teal-600' },
  { id: 'stk_5', emoji: '💖', name: 'Love & Hearts', bg: 'from-rose-400 to-pink-500' },
  { id: 'stk_6', emoji: '🔥', name: 'Fire & Hot', bg: 'from-orange-500 to-red-600' },
  { id: 'stk_7', emoji: '😎', name: 'Cool Boss', bg: 'from-sky-400 to-blue-600' },
  { id: 'stk_8', emoji: '☕', name: 'Coffee Break', bg: 'from-amber-600 to-yellow-700' },
  { id: 'stk_9', emoji: '🏆', name: 'Top Winner', bg: 'from-yellow-400 to-amber-500' },
  { id: 'stk_10', emoji: '🎯', name: 'Target Hit', bg: 'from-rose-500 to-red-600' },
  { id: 'stk_11', emoji: '💩', name: 'Funny Poop', bg: 'from-amber-700 to-amber-900' },
  { id: 'stk_12', emoji: '🤩', name: 'Star Struck', bg: 'from-purple-400 to-indigo-500' }
];

export default function EmojiStickerPicker({ onSelectEmoji, onSelectSticker, onClose }) {
  const [activeTab, setActiveTab] = useState('emoji'); // 'emoji' | 'sticker'

  return (
    <div className="absolute bottom-14 left-4 z-50 w-72 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden flex flex-col select-none animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Header Navigation Tabs */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200/80 bg-slate-50/80">
        <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('emoji')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'emoji'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Emojis</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sticker')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'sticker'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sticker className="w-3.5 h-3.5" />
            <span>Stickers</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Area */}
      <div className="p-3 max-h-56 overflow-y-auto custom-scrollbar">
        {activeTab === 'emoji' ? (
          <div className="grid grid-cols-8 gap-1 text-lg">
            {EMOJI_LIST.map((emoji, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onSelectEmoji(emoji)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 hover:scale-125 transition-transform active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {STICKERS_LIST.map((sticker) => (
              <button
                key={sticker.id}
                type="button"
                onClick={() => onSelectSticker(sticker)}
                className="group flex flex-col items-center justify-center p-2 rounded-xl border border-slate-100 hover:border-indigo-200 bg-gradient-to-b hover:shadow-md transition-all hover:scale-105 active:scale-95 text-center"
              >
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${sticker.bg} flex items-center justify-center text-2xl shadow-sm group-hover:rotate-6 transition-transform`}>
                  {sticker.emoji}
                </div>
                <span className="text-[10px] font-semibold text-slate-600 mt-1 truncate max-w-full">
                  {sticker.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
