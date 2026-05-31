import { useEffect, useRef, useState } from 'react';
import { Bot, Send, User, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useVitals } from '../contexts/VitalsContext';
import { askAI } from '../lib/ai';
import type { ChatMessage } from '../lib/database.types';

const SUGGESTIONS = [
  'What are my current vitals?',
  'Is my heart rate normal?',
  'Tips for improving SpO2',
  'What is tachycardia?',
  'How to reduce heart rate?',
  'Heart-healthy diet tips',
];

export function AIView() {
  const { user } = useAuth();
  const { current } = useVitals();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);

  // ✅ ALWAYS START FRESH CHAT
  useEffect(() => {
    setMessages([]);
  }, [user]);

  // Auto scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading || !user) return;

    setInput('');
    setLoading(true);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: user.id,
      role: 'user',
      content: msg,
      created_at: new Date().toISOString(),
    };

    // Add user message
    setMessages(prev => [...prev, userMsg]);

    setTyping(true);

    // 🔥 FIX: use latest messages (not stale state)
    const history = [...messages, userMsg]
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }));

    const reply = await askAI(msg, current, history);

    setTyping(false);

    const aiMsg: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: user.id,
      role: 'assistant',
      content: reply,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
  };

  // ✅ CLEAR CHAT
  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-2rem)] space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white">AI Health Assistant</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Powered by Gemini AI
          </p>
        </div>

        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 text-sm px-3 py-1.5 rounded-xl hover:bg-red-500/10 transition"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Warning */}
      <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-2.5 flex items-start gap-2 flex-shrink-0">
        <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-amber-300/80 text-xs">
          I am an AI, not a doctor. Always consult a medical professional.
        </p>
      </div>

      {/* Chat Box */}
      <div className="flex-1 bg-slate-900/60 border border-slate-700/50 rounded-2xl flex flex-col overflow-hidden min-h-0">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Bot className="w-7 h-7 text-cyan-400" />
              </div>

              <p className="text-slate-300 font-medium mb-1">
                Hello! I'm CardioWatch AI
              </p>

              <p className="text-slate-500 text-sm mb-6">
                Ask me anything about health or AI
              </p>

              <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left text-xs bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white rounded-xl px-3 py-2 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(m => (
            <div
              key={m.id}
              className={`flex gap-3 ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 bg-cyan-500/15 border border-cyan-500/30 rounded-xl flex items-center justify-center">
                  <Bot className="w-4 h-4 text-cyan-400" />
                </div>
              )}

              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                  m.role === 'user'
                    ? 'bg-cyan-500/15 border border-cyan-500/20 text-white'
                    : 'bg-slate-800/60 border border-slate-700/50 text-slate-200'
                }`}
              >
                {m.content}
              </div>

              {m.role === 'user' && (
                <div className="w-8 h-8 bg-slate-700 rounded-xl flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-300" />
                </div>
              )}
            </div>
          ))}

          {/* Typing */}
          {typing && (
            <div className="flex gap-3">
              <Bot className="w-4 h-4 text-cyan-400" />
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-150" />
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-300" />
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-700/50 p-4 flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask anything..."
            className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-2 text-white"
          />

          <button
            onClick={() => send()}
            disabled={loading}
            className="bg-cyan-500 px-4 rounded-xl"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}