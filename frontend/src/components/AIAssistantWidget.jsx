import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, X, Send, Sparkles, CloudRain, Droplets, 
  Wind, Thermometer, ShieldAlert, RotateCcw, 
  ChevronDown, MapPin, Maximize2, Minimize2, MessageSquare
} from 'lucide-react';
import { sendChatMessage } from '../api';

const CITIES = [
  "Delhi", "Mumbai", "Bengaluru", "Kolkata", 
  "Chennai", "Hyderabad", "Pune", "Ahmedabad", 
  "Jaipur", "Lucknow", "Patna", "Chandigarh"
];

const SUGGESTED_QUERIES = [
  { icon: <CloudRain className="w-3.5 h-3.5 text-sky-400" />, label: "Rain in next few hours?" },
  { icon: <Droplets className="w-3.5 h-3.5 text-cyan-400" />, label: "Current humidity & weather" },
  { icon: <Thermometer className="w-3.5 h-3.5 text-amber-400" />, label: "Today's temperature report" },
  { icon: <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />, label: "Is it safe to exercise outside?" },
];

export default function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState("Delhi");
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am **Aero**, your real-time atmospheric and air quality assistant. Ask me anything about current weather, rain predictions, humidity, AQI, or health safety across Indian cities!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      telemetry: null
    }
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setInputMessage("");
    const userMsg = {
      id: "user-" + Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const historyPayload = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await sendChatMessage(text, historyPayload, selectedCity);
      
      const assistantMsg = {
        id: "aero-" + Date.now(),
        role: "assistant",
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        city: response.city,
        telemetry: response.telemetry
      };

      if (response.city && response.city !== selectedCity) {
        setSelectedCity(response.city);
      }

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          content: "I encountered a momentary connection hiccup, but here is what I know: Atmospheric telemetry is updating. Please try asking again!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: "welcome-cleared",
        role: "assistant",
        content: `Chat refreshed. Ask me about weather, rain, humidity, or AQI in **${selectedCity}**!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        telemetry: null
      }
    ]);
  };

  // Basic formatted text renderer (supports **bold**, bullet lines, line breaks)
  const renderFormattedText = (text) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 text-xs leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;
          
          const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
          const lineContent = isBullet ? line.trim().substring(2) : line;

          // Parse **bold** inside lines
          const parts = lineContent.split(/(\*\*.*?\*\*)/g);
          const parsed = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
            }
            return part;
          });

          return (
            <div key={idx} className={isBullet ? "flex items-start gap-1.5 pl-1" : ""}>
              {isBullet && <span className="text-[#00E5B0] mt-0.5">•</span>}
              <div>{parsed}</div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* ── Persistent Floating Launcher Button ─────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0e131f]/90 border border-[#00E5B0]/30 shadow-xl backdrop-blur-md text-xs text-gray-200 cursor-pointer hover:border-[#00E5B0] transition-colors"
            onClick={() => setIsOpen(true)}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00E5B0] animate-pulse" />
            <span className="font-medium text-[11px]">Ask Aero AI (Weather & Rain)</span>
          </motion.div>
        )}

        <motion.button
          onClick={() => setIsOpen(prev => !prev)}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-[#00A884] to-[#00E5B0] p-0.5 shadow-2xl flex items-center justify-center text-slate-950 transition-all hover:shadow-[0_0_25px_rgba(0,229,176,0.5)] group"
          aria-label="Open AI Weather & AQI Assistant"
        >
          <div className="w-full h-full rounded-full bg-[#0a0e17] flex items-center justify-center relative overflow-hidden group-hover:bg-[#080c14] transition-colors">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#00E5B0]/20 to-transparent pointer-events-none" />
            {isOpen ? (
              <X className="w-6 h-6 text-[#00E5B0]" />
            ) : (
              <div className="relative flex items-center justify-center">
                <Bot className="w-6 h-6 text-[#00E5B0]" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0a0e17] animate-pulse" />
              </div>
            )}
          </div>
        </motion.button>
      </div>

      {/* ── Floating Chatbot Modal Window ─────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[92vw] sm:w-[420px] h-[580px] max-h-[82vh] bg-[#0b0f19]/95 border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col overflow-hidden font-sans"
          >
            {/* ── Header ────────────────────────────────────────────── */}
            <div className="p-4 border-b border-white/8 bg-gradient-to-r from-white/4 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-[#00E5B0]/15 border border-[#00E5B0]/40 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-[#00E5B0]" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0b0f19]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-white tracking-wide">Aero AI</h3>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-[#00E5B0]/15 text-[#00E5B0] border border-[#00E5B0]/30">
                      LIVE
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400">Weather, Rain & AQI Intelligence</p>
                </div>
              </div>

              {/* City Switcher & Controls */}
              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-[#00E5B0] cursor-pointer appearance-none pr-5 hover:bg-white/10 transition-colors"
                  >
                    {CITIES.map(c => (
                      <option key={c} value={c} className="bg-[#0b0f19] text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                  <MapPin className="w-2.5 h-2.5 text-[#00E5B0] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <button
                  onClick={handleClearHistory}
                  title="Clear conversation"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  title="Close assistant"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Messages Feed ─────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-[#00E5B0]/10 border border-[#00E5B0]/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-[#00E5B0]" />
                    </div>
                  )}

                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-md ${
                    m.role === 'user'
                      ? 'bg-[#00E5B0] text-slate-950 font-medium rounded-tr-sm ml-8'
                      : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm'
                  }`}>
                    {m.role === 'assistant' ? (
                      <div>
                        {renderFormattedText(m.content)}

                        {/* Telemetry pill if present */}
                        {m.telemetry && (
                          <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center gap-3 text-[10px] text-gray-400 flex-wrap font-mono">
                            <span className="flex items-center gap-1 text-amber-300">
                              <Thermometer className="w-3 h-3" /> {m.telemetry.temp}
                            </span>
                            <span className="flex items-center gap-1 text-sky-300">
                              <Droplets className="w-3 h-3" /> {m.telemetry.humidity}
                            </span>
                            <span className="flex items-center gap-1 text-teal-300">
                              <Wind className="w-3 h-3" /> {m.telemetry.wind}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-white/5 text-gray-300 font-semibold border border-white/5">
                              AQI {m.telemetry.aqi}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    )}

                    <div className={`text-[9px] mt-1 text-right ${m.role === 'user' ? 'text-slate-800' : 'text-gray-500'}`}>
                      {m.timestamp}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2.5 items-start">
                  <div className="w-7 h-7 rounded-lg bg-[#00E5B0]/10 border border-[#00E5B0]/30 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-[#00E5B0]" />
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 text-xs text-gray-300 flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00E5B0] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00E5B0] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00E5B0] animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-[11px] text-gray-400 font-mono ml-1">Analyzing weather telemetry...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Suggested Question Chips ───────────────────────────── */}
            <div className="px-3 py-2 border-t border-white/5 bg-black/20 overflow-x-auto scrollbar-none flex gap-1.5">
              {SUGGESTED_QUERIES.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(`${q.label} in ${selectedCity}`)}
                  disabled={isLoading}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/4 hover:bg-white/10 border border-white/8 text-[10px] text-gray-300 hover:text-white transition-all whitespace-nowrap active:scale-95 disabled:opacity-50"
                >
                  {q.icon}
                  <span>{q.label}</span>
                </button>
              ))}
            </div>

            {/* ── Input Box ─────────────────────────────────────────── */}
            <div className="p-3 border-t border-white/8 bg-[#07090e]">
              <div className="flex items-center gap-2 bg-white/4 border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-[#00E5B0]/60 focus-within:ring-1 focus-within:ring-[#00E5B0]/30 transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask weather, rain, humidity for ${selectedCity}...`}
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-1.5 rounded-lg bg-[#00E5B0] text-slate-950 hover:bg-[#00c598] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[9px] text-gray-500 text-center mt-1.5">
                Real-time CPCB telemetry + AI meteorological synthesis.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
