import React, { useState, useEffect, useRef } from 'react';
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
        <div className="flex h-full gap-6 max-h-[85vh]">
            {/* Minimalist Sessions Panel */}
            <div className="w-[300px] bg-[#050505] rounded-xl border border-[#1a1a1a] flex flex-col overflow-hidden">
                <div className="p-5 border-b border-[#1a1a1a] bg-[#0A0A0A]">
                    <h3 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
                        Active Tunnels
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-[#1a1a1a] custom-scrollbar">
                    {sessions.map(sess => (
                        <button
                            key={sess.phoneId}
                            onClick={() => { setSelectedPhone(sess.phoneId); setSelectedName(sess.senderName || sess.phoneId); }}
                            className={`w-full flex items-center gap-3 p-4 transition-all text-left ${
                                selectedPhone === sess.phoneId 
                                ? 'bg-[#111] border-l-2 border-zinc-100' 
                                : 'hover:bg-[#0A0A0A] border-l-2 border-transparent text-zinc-500'
                            }`}
                        >
                            <div className="w-9 h-9 rounded bg-[#1a1a1a] flex items-center justify-center font-semibold text-xs text-zinc-100 border border-[#222]">
                                {sess.senderName ? sess.senderName.substring(0, 2).toUpperCase() : sess.phoneId.slice(-4)}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className={`text-sm font-semibold truncate ${selectedPhone === sess.phoneId ? 'text-zinc-100' : 'text-zinc-400'}`}>
                                    {sess.senderName || sess.phoneId}
                                </p>
                                <p className="text-[10px] text-zinc-600 font-mono truncate">{sess.phoneId}</p>
                            </div>
                        </button>
                    ))}
                    {sessions.length === 0 && !loading && (
                        <div className="text-center py-10 text-zinc-600 text-sm">No active tunnels</div>
                    )}
                </div>
            </div>

            {/* Minimalist Chat Canvas */}
            <div className="flex-1 bg-[#050505] rounded-xl border border-[#1a1a1a] flex flex-col overflow-hidden relative">
                {selectedPhone ? (
                    <>
                        {/* Header */}
                        <div className="p-5 border-b border-[#1a1a1a] bg-[#0A0A0A] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div>
                                    <h4 className="font-semibold text-sm text-zinc-100 tracking-tight">{selectedName}</h4>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${aiEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`}></div>
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">
                                            {aiEnabled ? 'AI Automation Layer Active' : 'Human Override Active'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={toggleAI}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border ${
                                    aiEnabled 
                                    ? 'bg-transparent border-[#222] text-zinc-400 hover:text-white hover:border-zinc-500' 
                                    : 'bg-zinc-100 text-zinc-900 hover:bg-white border-transparent'
                                }`}
                            >
                                {aiEnabled ? 'Pause AI' : 'Resume AI'}
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#0A0A0A]">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                                    <div className={`max-w-[70%] px-4 py-3 text-sm leading-relaxed ${
                                        msg.sender === 'user' 
                                        ? 'bg-[#111] border border-[#222] text-zinc-300 rounded-2xl rounded-tl-sm' 
                                        : 'bg-transparent border border-[#222] text-zinc-400 rounded-2xl rounded-tr-sm'
                                    }`}>
                                        <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                                            {msg.sender === 'user' ? (msg.senderName || selectedName) : 'Astro AI'}
                                        </div>
                                        <p className="whitespace-pre-wrap">{msg.text}</p>
                                        <p className="text-[9px] font-mono text-right mt-2 text-zinc-700">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Box */}
                        <form onSubmit={handleSend} className="p-4 bg-[#0A0A0A] border-t border-[#1a1a1a]">
                            <div className="relative flex items-center">
                                <input 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    className="flex-1 bg-[#111] border border-[#222] rounded-lg pl-4 pr-12 py-3 outline-none focus:border-zinc-500 transition-colors text-sm text-zinc-200 placeholder:text-zinc-600 disabled:opacity-50" 
                                    placeholder="Execute manual override..."
                                    disabled={aiEnabled}
                                />
                                <button 
                                    type="submit"
                                    disabled={aiEnabled || !input.trim()}
                                    className="absolute right-2 p-1.5 rounded-md text-zinc-500 hover:text-zinc-100 hover:bg-[#222] disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </form>
                        
                        {aiEnabled && (
                            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-[#111] border border-[#222] px-4 py-2 rounded-full text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 pointer-events-none">
                                <Terminal size={12} className="text-zinc-600" />
                                AI Active Override Blocked
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-700">
                        <MessageSquare size={32} className="mb-4 opacity-50" />
                        <p className="text-sm font-semibold">Select a tunnel to monitor feed</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveChat;
