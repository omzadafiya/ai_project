import React, { useState, useEffect } from 'react';
import { Save, Bot, Key, Globe, Cpu } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const [prompt, setPrompt] = useState('');
  const [mistralKey, setMistralKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ai');

  useEffect(() => {
    fetch('/api/settings/prompt')
      .then(res => res.json())
      .then(data => { setPrompt(data.prompt || ''); setLoading(false); });
      
    fetch('/api/settings/keys')
      .then(res => res.json())
      .then(data => { setMistralKey(data.mistralKey || ''); });
  }, []);

  const handleSavePrompt = async () => {
    const tid = toast.loading('Synchronizing matrix...');
    try {
      await fetch('/api/settings/prompt', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
      toast.success('Matrix synced', { id: tid });
    } catch (e) { toast.error('Sync failed', { id: tid }); }
  };

  const handleSaveKey = async () => {
    const tid = toast.loading('Applying token...');
    try {
      await fetch('/api/settings/keys', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mistralKey }) });
      toast.success('Token engaged', { id: tid });
    } catch (e) { toast.error('Token rejected', { id: tid }); }
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-10">
      <header className="border-b border-[#1a1a1a] pb-6">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight mb-1">Platform Settings</h1>
        <p className="text-sm text-zinc-500 font-medium">Fine-tune logic constraints and integration tokens.</p>
      </header>

      <div className="flex items-start gap-10">
        {/* Sleek navigation list */}
        <div className="w-56 flex flex-col space-y-1">
          <button onClick={() => setActiveTab('ai')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'ai' ? 'bg-[#111] text-zinc-100 border border-[#222]' : 'text-zinc-500 hover:text-zinc-200'}`}>
            <Bot size={15} /> Core Persona
          </button>
          <button onClick={() => setActiveTab('keys')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'keys' ? 'bg-[#111] text-zinc-100 border border-[#222]' : 'text-zinc-500 hover:text-zinc-200'}`}>
            <Key size={15} /> Webhooks & Tokens
          </button>
          <button onClick={() => setActiveTab('system')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'system' ? 'bg-[#111] text-zinc-100 border border-[#222]' : 'text-zinc-500 hover:text-zinc-200'}`}>
            <Cpu size={15} /> System Environment
          </button>
        </div>

        <div className="flex-1 bg-[#050505] p-8 rounded-xl border border-[#1a1a1a]">
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 mb-1">Cognitive Prompt Array</h3>
                <p className="text-xs text-zinc-500">Inject constraint modifiers to dictate the autonomous AI behavior for incoming WhatsApp queries.</p>
              </div>

              {loading ? (
                <div className="h-64 flex items-center justify-center text-xs font-mono text-zinc-600">Retrieving payload...</div>
              ) : (
                <div className="space-y-4">
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full h-[400px] bg-[#111] text-zinc-300 p-6 rounded-lg outline-none focus:border-zinc-500 border border-[#222] font-mono text-sm leading-relaxed resize-none custom-scrollbar"
                  />
                  <div className="flex justify-end pt-2">
                    <button 
                      onClick={handleSavePrompt}
                      className="bg-zinc-100 hover:bg-white text-zinc-900 px-5 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all"
                    >
                      <Save size={14} /> Commit Changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'keys' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 mb-1">Mistral LLM Authorization</h3>
                <p className="text-xs text-zinc-500">Override production environmental tokens without recompiling the Node runtime.</p>
              </div>
              
              <div className="space-y-2 mt-8 max-w-md">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Bearer Token</label>
                <input 
                  type="password" 
                  value={mistralKey} 
                  onChange={e => setMistralKey(e.target.value)} 
                  placeholder="sk-..." 
                  className="w-full bg-[#111] border border-[#222] rounded-md px-4 py-2.5 text-zinc-200 outline-none focus:border-zinc-500 transition-colors font-mono text-sm"
                />
                
                <div className="flex justify-end pt-4">
                  <button 
                    onClick={handleSaveKey} 
                    className="bg-zinc-100 hover:bg-white text-zinc-900 px-5 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all"
                  >
                    <Save size={14} /> Assign Token
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="flex flex-col items-center justify-center h-48 text-zinc-600">
               <Globe size={24} className="mb-2 opacity-50" />
               <p className="text-xs font-semibold">Environment is locked</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
