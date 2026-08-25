import React, { useState, useRef, useEffect } from 'react';
import { Person } from '../types/family';
import { askAIWaris, AIChatMessage } from '../services/aiService';
import { ISLAMIC_DISCLAIMER } from '../utils/mahramEngine';
import {
  Sparkles,
  Send,
  Bot,
  User,
  TreeDeciduous,
  BookOpen,
  Search,
  CheckCircle2,
  RefreshCw,
  Zap,
  HelpCircle,
} from 'lucide-react';

interface AIWarisChatViewProps {
  allPersons: Person[];
  currentPerson: Person | null;
  setActiveTab: (tab: string) => void;
  onOpenPersonDetail: (person: Person) => void;
}

export const AIWarisChatView: React.FC<AIWarisChatViewProps> = ({
  allPersons,
  currentPerson,
  setActiveTab,
  onOpenPersonDetail,
}) => {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: `Assalamualaikum${currentPerson ? ` ${currentPerson.nickname || currentPerson.fullName.split(' ')[0]}` : ''}! Saya ialah **AI WARIS**, pembantu pintar rasmi bagi salasilah keturunan **Mamat bin Ismail & Hafsah binti Ismail**.\n\nAnda boleh bertanya apa sahaja tentang:\n- Susur galur generasi (cth: "Siapa anak Mamat?", "Siapa cucu Hafsah?")\n- Hubungan kekeluargaan (cth: "Siapa sepupu saya?", "Apakah hubungan saya dengan Ali?")\n- Statistik dan ringkasan waris (cth: "Berapa jumlah waris generasi ke-3?")\n\nSila pilih soalan cadangan di bawah atau taip soalan anda!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    'Siapa anak Mamat & Hafsah?',
    'Siapa cucu Hafsah?',
    'Siapakah sepupu saya?',
    'Berapa jumlah waris dan generasi?',
    'Ringkaskan susur galur keluarga ini.',
    'Siapa waris generasi ke-4 dan ke-5?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: AIChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setIsLoading(true);

    try {
      const response = await askAIWaris(textToSend, allPersons, currentPerson);
      const aiMsg: AIChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        highlightPersonIds: response.highlightPersonIds,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: AIChatMessage = {
        id: `msg-ai-err-${Date.now()}`,
        sender: 'ai',
        text: `Maaf, berlaku masalah: ${err.message || 'Sila cuba lagi'}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md text-white flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-bold text-white">AI WARIS</h2>
              <span className="px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-700/60 text-emerald-300 text-[10px] font-bold">
                Aktif & Sifar Halusinasi
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Pembantu pintar salasilah, kalkulator hubungan kekeluargaan, dan maklumat waris.
            </p>
          </div>
        </div>

        {/* Current user badge */}
        <div className="hidden sm:block text-right">
          <span className="text-[10px] text-slate-400 block">Identiti Anda:</span>
          <span className="text-xs font-semibold text-emerald-300">
            {currentPerson ? currentPerson.fullName : 'Pengunjung Umum'}
          </span>
        </div>
      </div>

      {/* Suggested Questions Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto py-1 px-1">
        <span className="text-xs text-slate-400 font-semibold shrink-0 flex items-center space-x-1">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Cadangan:</span>
        </span>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-slate-300 text-xs whitespace-nowrap transition-colors cursor-pointer shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl min-h-[480px] max-h-[580px] overflow-y-auto flex flex-col space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-md ${
                  isUser
                    ? 'bg-emerald-700 text-white'
                    : 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-5 h-5" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-md text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-emerald-900/90 text-white rounded-tr-none border border-emerald-700/60'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                {/* Message text with formatting */}
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Highlighted Person Action Pills */}
                {msg.highlightPersonIds && msg.highlightPersonIds.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap gap-2">
                    <span className="text-[10px] text-slate-400 font-semibold block w-full">
                      Pautan Pantas Waris:
                    </span>
                    {msg.highlightPersonIds.map((pid) => {
                      const person = allPersons.find((p) => p.id === pid);
                      if (!person) return null;
                      return (
                        <button
                          key={pid}
                          onClick={() => onOpenPersonDetail(person)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-emerald-300 flex items-center space-x-1.5 transition-colors"
                        >
                          <TreeDeciduous className="w-3 h-3 text-emerald-400" />
                          <span>{person.nickname || person.fullName}</span>
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setActiveTab('tree')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-[11px] font-semibold text-emerald-200 flex items-center space-x-1"
                    >
                      <span>[ Buka Dalam Carta ]</span>
                    </button>
                  </div>
                )}

                <div
                  className={`text-[10px] mt-2 text-right ${
                    isUser ? 'text-emerald-300/70' : 'text-slate-500'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center space-x-3 text-slate-400 text-xs">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl rounded-tl-none flex items-center space-x-2">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>AI Waris sedang menganalisis salasilah & pangkalan data...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center space-x-2"
      >
        <input
          id="ai-chat-input"
          type="text"
          placeholder="Tanya soalan tentang susur galur, hubungan atau mahram..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          disabled={isLoading}
          className="flex-1 px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-inner"
        />
        <button
          id="ai-send-btn"
          type="submit"
          disabled={!inputQuery.trim() || isLoading}
          className="px-5 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-bold">Hantar</span>
        </button>
      </form>

      {/* Islamic Safety Notice in AI */}
      <p className="text-[11px] text-slate-400 text-center leading-relaxed px-4">
        ⚖️ <em>Penerangan hukum Islam dijana secara umum berdasarkan fiqh muktabar dan bukan fatwa peribadi. Tiada rekaan data salasilah (Zero Hallucination).</em>
      </p>
    </div>
  );
};
