import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, X, Send, AlertTriangle, MessageSquare, Bot, User, Loader2, Sparkles, Zap, Phone, MapPin, Navigation, Flame, Heart, Globe } from 'lucide-react';
import { FadeIn } from './FadeIn';
import { sendChatMessage, type ChatMessage } from '../services/groqChat';
import { useNavigate } from 'react-router-dom';
import { reportStore } from '../store/reportStore';

const LANGUAGES = [
  { code: 'English', label: 'EN' },
  { code: 'Kannada', label: 'KN' },
  { code: 'Telugu', label: 'TE' },
  { code: 'Tamil', label: 'TA' },
  { code: 'Hindi', label: 'HI' },
  { code: 'Malayalam', label: 'ML' },
];

// Quick actions that trigger both AI responses and actual platform actions
const QUICK_ACTIONS = [
  { label: 'Activate SOS', action: 'activate_sos', icon: Zap },
  { label: 'Find Hospital', action: 'find_hospital', icon: MapPin },
  { label: 'Report Emergency', action: 'report', icon: Flame },
  { label: 'Safe Route', action: 'safe_route', icon: Navigation },
  { label: 'Emergency Numbers', action: 'emergency_numbers', icon: Phone },
  { label: 'Women Safety', action: 'women_safety', icon: Heart },
];

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  isAlert?: boolean;
  isLoading?: boolean;
  actions?: { label: string; route: string }[];
}

export const AIEmergencyChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: '**RAKSHA AI** powered by Google Gemini.\n\nI have full access to all platform features — Dashboard, Crisis Response, Women Safety, AI Intelligence, Public Tools, and Offline Mesh.\n\nHow can I assist you?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [language, setLanguage] = useState('English');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // We no longer use navigate for the chatbot (it can show inline action buttons instead)
  let navigate: ReturnType<typeof useNavigate>;
  try {
    navigate = useNavigate();
  } catch {
    // Graceful fallback if not inside Router
    navigate = (() => {}) as any;
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Focus input when chatbot opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setHasUnread(false);
    }
  }, [isOpen]);

  // Proactive alert with live context
  useEffect(() => {
    const timer = setTimeout(() => {
      const reports = reportStore.getAll();
      const criticalReports = reports.filter(r => r.severity === 'Critical' && r.status === 'Pending');
      
      let alertText = '**Proactive Alert**: Monitoring all threat feeds in real-time. ';
      if (criticalReports.length > 0) {
        alertText += `There are **${criticalReports.length} critical reports** pending review. Check the Admin Panel or ask me for details.`;
      } else {
        alertText += 'All zones are currently within normal parameters. I\'ll alert you immediately if any situation escalates.';
      }

      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: alertText,
          isAlert: true,
        },
      ]);
      if (!isOpen) setHasUnread(true);
    }, 20000);
    return () => clearTimeout(timer);
  }, []);

  // Execute platform actions triggered by quick actions or AI
  const executeAction = useCallback((action: string) => {
    switch (action) {
      case 'activate_sos':
        navigate('/women-safety');
        break;
      case 'find_hospital':
        navigate('/public-tools');
        break;
      case 'report':
        navigate('/public-tools?tab=report');
        break;
      case 'safe_route':
        navigate('/women-safety');
        setTimeout(() => {
          document.getElementById('safe-route-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 500);
        break;
      case 'emergency_numbers':
        // Handled by AI response
        break;
      case 'women_safety':
        navigate('/women-safety');
        break;
      case 'crisis':
        navigate('/crisis');
        break;
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'ai_intelligence':
        navigate('/ai-intelligence');
        break;
      case 'offline':
        navigate('/offline');
        break;
      case 'admin':
        navigate('/admin');
        break;
    }
  }, [navigate]);

  // Detect inline action suggestions from AI response
  const parseActionsFromResponse = (text: string): { label: string; route: string }[] => {
    const actions: { label: string; route: string }[] = [];
    const routeMap: Record<string, { label: string; route: string }> = {
      '/dashboard': { label: 'Open Dashboard', route: '/dashboard' },
      '/crisis': { label: 'Crisis Response', route: '/crisis' },
      '/women-safety': { label: 'Women Safety', route: '/women-safety' },
      '/public-tools': { label: 'Public Tools', route: '/public-tools' },
      '/ai-intelligence': { label: 'AI Intelligence', route: '/ai-intelligence' },
      '/offline': { label: 'Offline Mesh', route: '/offline' },
      '/admin': { label: 'Admin Panel', route: '/admin' },
      '/settings': { label: 'Settings', route: '/settings' },
    };

    for (const [path, info] of Object.entries(routeMap)) {
      if (text.toLowerCase().includes(path) || text.toLowerCase().includes(info.label.toLowerCase())) {
        actions.push(info);
      }
    }

    // Detect emergency-specific cues
    if (text.toLowerCase().includes('sos') || text.toLowerCase().includes('panic')) {
      if (!actions.find(a => a.route === '/women-safety')) {
        actions.push({ label: 'Activate SOS', route: '/women-safety' });
      }
    }
    if (text.toLowerCase().includes('hospital') || text.toLowerCase().includes('nearby finder')) {
      if (!actions.find(a => a.route === '/public-tools')) {
        actions.push({ label: 'Find Nearby', route: '/public-tools' });
      }
    }

    return actions.slice(0, 3); // Max 3 action buttons
  };

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;

    // Add user message
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Add loading indicator
    const loadingId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: loadingId, sender: 'bot', text: '', isLoading: true }]);

    // Build conversation history for context
    const newHistory: ChatMessage[] = [...conversationHistory, { role: 'user' as const, content: text }];

    try {
      const response = await sendChatMessage(newHistory, language);

      // Update conversation history (keep last 20 messages for context window)
      const updatedHistory: ChatMessage[] = [
        ...newHistory,
        { role: 'assistant' as const, content: response },
      ].slice(-10);
      setConversationHistory(updatedHistory);

      // Parse inline action buttons from AI response
      const actions = parseActionsFromResponse(response);

      // Replace loading message with actual response
      setMessages(prev =>
        prev.map(msg =>
          msg.id === loadingId
            ? { ...msg, text: response, isLoading: false, actions: actions.length > 0 ? actions : undefined }
            : msg
        )
      );
    } catch (error) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === loadingId
            ? { ...msg, text: 'Failed to reach RAKSHA AI. Please check your connection and try again.', isLoading: false }
            : msg
        )
      );
    }

    setIsTyping(false);
  }, [isTyping, conversationHistory, language]);

  const handleQuickAction = useCallback((action: typeof QUICK_ACTIONS[0]) => {
    // Send the label text as a message to the AI
    handleSend(action.label.replace(/^[^\s]+\s/, ''));
    // Also execute the platform action
    executeAction(action.action);
  }, [handleSend, executeAction]);

  // Render markdown-ish text (bold, line breaks)
  const renderText = (text: string) => {
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
          }
          return <span key={j}>{part}</span>;
        })}
        {i < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4">
        {/* Chat Panel */}
        {isOpen && (
          <FadeIn>
            <div className="w-[380px] h-[540px] liquid-glass border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
              {/* Header */}
              <div className="p-4 border-b border-white/10 bg-black/50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <Shield size={16} className="text-white" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold tracking-wide text-white flex items-center gap-1.5">
                      RAKSHA AI
                      <Sparkles size={12} className="text-emerald-400" />
                    </div>
                    <div className="text-[10px] text-emerald-400/80 font-mono">Gemini · Online</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select
                      value={language}
                      onChange={e => setLanguage(e.target.value)}
                      className="appearance-none bg-white/5 border border-white/10 rounded-lg pl-6 pr-2 py-1 text-[10px] text-gray-300 font-mono focus:outline-none focus:border-emerald-500/50 cursor-pointer hover:bg-white/10 transition-colors"
                    >
                      {LANGUAGES.map(l => (
                        <option key={l.code} value={l.code} className="bg-gray-900 text-white">{l.label}</option>
                      ))}
                    </select>
                    <Globe size={10} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'none' }}>
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'bot' ? (
                      <div className="flex gap-2 max-w-[90%]">
                        <div className="shrink-0 mt-1">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${msg.isAlert ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}>
                            {msg.isAlert ? (
                              <AlertTriangle size={12} className="text-amber-400" />
                            ) : (
                              <Bot size={12} className="text-emerald-400" />
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div
                            className={`p-3 rounded-xl rounded-tl-sm text-[13px] leading-relaxed ${
                              msg.isAlert
                                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-200'
                                : 'bg-white/5 border border-white/10 text-gray-200'
                            }`}
                          >
                            {msg.isLoading ? (
                              <div className="flex items-center gap-2 text-gray-400">
                                <Loader2 size={14} className="animate-spin" />
                                <span className="text-xs">Thinking...</span>
                              </div>
                            ) : (
                              renderText(msg.text)
                            )}
                          </div>
                          {/* Action Buttons */}
                          {msg.actions && msg.actions.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {msg.actions.map((action, i) => (
                                <button
                                  key={i}
                                  onClick={() => navigate(action.route)}
                                  className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                                >
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 max-w-[85%]">
                        <div className="bg-white/10 border border-white/10 p-3 rounded-xl rounded-tr-sm text-[13px] text-white">
                          {msg.text}
                        </div>
                        <div className="shrink-0 mt-1">
                          <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">
                            <User size={12} className="text-gray-400" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions */}
              <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto shrink-0" style={{ scrollbarWidth: 'none' }}>
                {QUICK_ACTIONS.map(qa => (
                  <button
                    key={qa.action}
                    onClick={() => handleQuickAction(qa)}
                    disabled={isTyping}
                    className="shrink-0 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 disabled:opacity-50 transition-all rounded-lg px-2.5 py-1.5 text-[11px] text-gray-300 flex items-center gap-1"
                  >
                    {qa.label}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <div className="p-3 border-t border-white/10 bg-black/40 shrink-0">
                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend(input)}
                    placeholder={isTyping ? 'RAKSHA AI is thinking...' : 'Ask anything about emergencies...'}
                    disabled={isTyping}
                    className="bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-sm w-full text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 disabled:opacity-50 transition-colors"
                  />
                  <button
                    onClick={() => handleSend(input)}
                    disabled={isTyping || !input.trim()}
                    className="absolute right-2 p-1.5 text-gray-400 hover:text-emerald-400 disabled:text-gray-600 transition-colors"
                  >
                    {isTyping ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </FadeIn>
        )}

        {/* Floating Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full liquid-glass border border-white/20 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:scale-105 transition-all group relative"
        >
          {isOpen ? (
            <X size={24} className="text-white" />
          ) : (
            <MessageSquare
              size={24}
              className="text-white group-hover:text-emerald-400 transition-colors"
            />
          )}

          {/* Notification Dot */}
          {!isOpen && hasUnread && (
            <span className="absolute top-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-black"></span>
            </span>
          )}
        </button>
      </div>
    </>
  );
};
