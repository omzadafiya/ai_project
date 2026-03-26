import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Shield, ShieldOff, MessageSquare, Terminal } from 'lucide-react';

const LiveChat = () => {
    const [sessions, setSessions] = useState([]);
    const [selectedPhone, setSelectedPhone] = useState(null);
    const [selectedName, setSelectedName] = useState(null);
    const [messages, setMessages] = useState([]);
    const [aiEnabled, setAiEnabled] = useState(true);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const chatEndRef = useRef(null);

    const fetchSessions = async () => {
        try {
            const res = await fetch('/api/chat-sessions');
            if (res.ok) setSessions(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchMessages = async (phone) => {
        try {
            const res = await fetch(`/api/chats/${phone}`);
            if (res.ok) setMessages(await res.json());
            
            const statusRes = await fetch(`/api/chat/status/${phone}`);
            if (statusRes.ok) {
                const data = await statusRes.json();
                setAiEnabled(data.aiEnabled);
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchSessions();
        const interval = setInterval(fetchSessions, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedPhone) {
            fetchMessages(selectedPhone);
            const interval = setInterval(() => fetchMessages(selectedPhone), 3000);
            return () => clearInterval(interval);
        }
    }, [selectedPhone]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || !selectedPhone) return;
        
        try {
            const res = await fetch('/api/chat/reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneId: selectedPhone, text: input })
            });
            if (res.ok) {
                setInput('');
                fetchMessages(selectedPhone);
            }
        } catch (e) { console.error(e); }
    };

    const toggleAI = async () => {
        try {
            const res = await fetch('/api/chat/toggle-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneId: selectedPhone, enabled: !aiEnabled })
            });
            if (res.ok) setAiEnabled(!aiEnabled);
        } catch (e) { console.error(e); }
    };

    return (
        <div className="flex gap-6 h-[calc(100vh-160px)]">
            <div className="w-80 glass rounded-3xl flex flex-col border border-white/5 overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 bg-black/10">
                    <h3 className="font-bold flex items-center gap-2">
                        <MessageSquare size={18} className="text-indigo-500" />
                        Active Sessions
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {sessions.map(sess => (
                        <button
                            key={sess.phoneId}
                            onClick={() => { setSelectedPhone(sess.phoneId); setSelectedName(sess.senderName || sess.phoneId); }}
                            className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${
                                selectedPhone === sess.phoneId 
                                ? 'bg-indigo-500/20 border border-indigo-500/30 text-white shadow-lg' 
                                : 'text-slate-400 hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-xs">
                                {sess.senderName ? sess.senderName.substring(0, 2).toUpperCase() : sess.phoneId.slice(-4)}
                            </div>
                            <div className="text-left overflow-hidden flex-1">
                                <p className="text-sm font-bold truncate">{sess.senderName || sess.phoneId}</p>
                                <p className="text-[10px] text-slate-500 font-medium truncate">{sess.senderName ? sess.phoneId : 'WhatsApp Info Syncing...'}</p>
                            </div>
                        </button>
                    ))}
                    {sessions.length === 0 && !loading && (
                        <div className="text-center py-10 text-slate-500 text-sm italic">No active chats</div>
                    )}
                </div>
            </div>

            <div className="flex-1 glass rounded-3xl border border-white/5 flex flex-col overflow-hidden shadow-2xl relative">
                {selectedPhone ? (
                    <>
                        <div className="p-6 border-b border-white/5 bg-black/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold">{selectedName}</h4>
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-2 h-2 rounded-full ${aiEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                            {aiEnabled ? 'AI Automation Active' : 'Human Control Enabled'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={toggleAI}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-xs transition-all ${
                                    aiEnabled 
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' 
                                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20 shadow-lg shadow-amber-500/5'
                                }`}
                            >
                                {aiEnabled ? <Shield size={14} /> : <ShieldOff size={14} />}
                                {aiEnabled ? 'PAUSE AI' : 'RESUME AI'}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-black/5">
                            {messages.map((msg, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={i}
                                    className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div className={`max-w-[75%] px-5 py-3.5 rounded-3xl shadow-lg relative ${
                                        msg.sender === 'user' 
                                        ? 'bg-slate-800 border border-white/5 rounded-tl-none' 
                                        : msg.sender === 'ai'
                                            ? 'bg-indigo-600/20 border border-indigo-500/20 text-white rounded-tr-none shadow-indigo-500/5'
                                            : 'bg-purple-600/20 border border-purple-500/20 text-white rounded-tr-none'
                                    }`}>
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            {msg.sender === 'ai' && <Bot size={12} className="opacity-70" />}
                                            {msg.sender === 'agent' && <Shield size={12} className="opacity-70" />}
                                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">
                                                {msg.sender === 'user' ? (msg.senderName || selectedName) : msg.sender.toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                        <p className="text-[10px] text-right mt-2 opacity-30 font-medium">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        <form onSubmit={handleSend} className="p-6 bg-black/20 border-t border-white/5 flex gap-3">
                            <input 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500/50 transition-all text-sm placeholder:text-slate-600 font-medium" 
                                placeholder="Type a manual response..."
                                disabled={aiEnabled}
                            />
                            <button 
                                type="submit"
                                disabled={aiEnabled || !input.trim()}
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-90 ${
                                    aiEnabled || !input.trim() 
                                    ? 'bg-white/5 text-slate-600 cursor-not-allowed' 
                                    : 'bg-indigo-600 text-white shadow-indigo-500/20 hover:shadow-indigo-500/40'
                                }`}
                            >
                                <Send size={22} />
                            </button>
                        </form>
                        
                        {aiEnabled && (
                            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-[10px] font-bold text-slate-400 flex items-center gap-2 pointer-events-none shadow-2xl">
                                <Terminal size={12} className="text-indigo-500" />
                                AI IS CURRENTLY HANDLING THIS CONVERSATION
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 opacity-50">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                            <MessageSquare size={40} />
                        </div>
                        <p className="text-lg font-bold">Select a session to start monitoring</p>
                        <p className="text-sm">Real-time WhatsApp messages will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveChat;
