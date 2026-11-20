'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, MessageCircle, X, Send, Sparkles, Trash2, Minimize2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'akabot';
  text: string;
  timestamp: string;
}

const QUICK_SUGGESTIONS = [
  '🔍 Cara cari preset Alight Motion?',
  '🖼️ Cara pakai Remove Background AI?',
  '⚡ Cara upscale foto jadi 4K nyata?',
  '🎬 Rekomendasi anime terbaik?',
];

export const AkaBotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'akabot',
      text: 'Halo! Aku **AkaBot** 🌸, asisten santai kamu di sini. Mau tanya soal fitur web ini atau sekadar ngobrol?',
      timestamp: 'Baru saja',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({
              role: m.sender === 'user' ? 'user' : 'assistant',
              content: m.text,
            })),
            { role: 'user', content: query },
          ],
        }),
      });

      const data = await res.json();
      const botReply =
        data.reply || 'Maaf, AkaBot sedang kesulitan memproses pesan ini. Coba tanyakan hal lain ya!';

      const akaMsg: ChatMessage = {
        id: `aka-${Date.now()}`,
        sender: 'akabot',
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, akaMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `aka-err-${Date.now()}`,
          sender: 'akabot',
          text: 'Koneksi ke server AkaBot terputus. Silakan coba kirim ulang ya!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'akabot',
        text: 'Obrolan telah dibersihkan. Halo! Aku **AkaBot** 🌸, ada yang bisa aku bantu lagi?',
        timestamp: 'Baru saja',
      },
    ]);
  };

  return (
    <>
      {/* Floating Circular Trigger Button (Red Sakura Crimson) */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 w-13 h-13 md:w-14 md:h-14 rounded-full bg-[#E60026] hover:bg-[#FF1E42] text-white border-2 border-black shadow-neo flex items-center justify-center cursor-pointer transition-colors group"
        aria-label="Buka Chat AI AkaBot"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <Bot className="w-6 h-6 md:w-7 md:h-7" />
              {/* Online Green Indicator Dot */}
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-black rounded-full animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Floating Modal Pop-up Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-36 md:bottom-22 right-4 md:right-6 z-40 w-[92vw] sm:w-[380px] h-[500px] max-h-[75vh] flex flex-col rounded-3xl bg-[var(--neo-surface)] border-2 border-black shadow-neo overflow-hidden"
          >
            {/* Header Red Sakura */}
            <div className="p-3.5 bg-[#E60026] text-white border-b-2 border-black flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white text-[#E60026] border-2 border-black flex items-center justify-center shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black tracking-tight text-white">AkaBot AI</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-black/30 text-white font-mono">
                      v2.0
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-white/90 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    <span>Aktif & Siap Menjawab</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-black/20 transition-colors"
                  title="Hapus Riwayat Obrolan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-black/20 transition-colors"
                  title="Tutup Chat"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 font-sans text-xs">
              {messages.map((msg) => {
                const isAka = msg.sender === 'akabot';
                return (
                  <div key={msg.id} className={`flex flex-col ${isAka ? 'items-start' : 'items-end'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 border leading-relaxed break-words shadow-xs ${isAka
                        ? 'bg-[var(--neo-bg)] text-[var(--neo-text)] border-[var(--neo-border)] rounded-tl-sm'
                        : 'bg-[#E60026] text-white border-black rounded-tr-sm font-medium'
                        }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    </div>
                    <span className="text-[9px] font-mono text-[var(--neo-text-muted)] mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center gap-2 p-3 bg-[var(--neo-bg)] rounded-2xl border border-[var(--neo-border)] w-fit">
                  <div className="w-2 h-2 rounded-full bg-[#E60026] animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-[#E60026] animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-[#E60026] animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[10px] text-[var(--neo-text-muted)] font-mono ml-1">
                    AkaBot sedang mengetik...
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-3 py-2 bg-[var(--neo-bg)]/60 border-t border-[var(--neo-border)] flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {QUICK_SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(sug)}
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--neo-surface)] text-[var(--neo-text)] border border-[var(--neo-border)] hover:border-black shrink-0 whitespace-nowrap transition-all"
                >
                  {sug}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-2.5 bg-[var(--neo-bg)] border-t-2 border-black flex items-center gap-1.5 shrink-0"
            >
              <input
                type="text"
                placeholder="Tanya apapun ke AkaBot..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="flex-1 px-3 py-2 rounded-xl text-xs neo-input border-2 border-[var(--neo-border)] focus:border-black bg-[var(--neo-surface)] text-[var(--neo-text)] outline-none"
              >
              </input>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2 rounded-xl bg-[#E60026] hover:bg-[#FF1E42] text-white border-2 border-black shadow-xs disabled:opacity-50 transition-transform active:scale-95 cursor-pointer"
                title="Kirim Pesan"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

