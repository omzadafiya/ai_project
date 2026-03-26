import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Bot, Key, Globe, LayoutDashboard } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const [prompt, setPrompt] = useState('');
  const [mistralKey, setMistralKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('ai');

  useEffect(() => {
    fetch('/api/settings/prompt')
      .then(res => res.json())
      .then(data => {
        setPrompt(data.prompt || '');
        setLoading(false);
      });
      
    fetch('/api/settings/keys')
      .then(res => res.json())
      .then(data => {
        setMistralKey(data.mistralKey || '');
      });
  }, []);

  const handleSavePrompt = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings/prompt', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      toast.success('AI Configuration Saved Successfully!');
    } catch (e) {
      toast.error('Failed to save AI config.');
    }
    setSaving(false);
  };

  const handleSaveKey = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings/keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mistralKey })
      });
      toast.success('Mistral API Key Saved Successfully!');
    } catch (e) {
      toast.error('Failed to save API key.');
    }
    setSaving(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-3xl border border-white/5">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <SettingsIcon className="text-indigo-400" /> Platform Settings
        </h1>
        <p className="text-slate-400 mt-2">Configure AI routing, API keys, and dashboard preferences.</p>
      </div>

      <div className="flex gap-6">
        <div className="w-64 space-y-2">
          <button onClick={() => setActiveTab('ai')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'ai' ? 'bg-indigo-500/20 text-white border border-indigo-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <Bot size={18} /> AI Persona
          </button>
          <button onClick={() => setActiveTab('keys')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'keys' ? 'bg-indigo-500/20 text-white border border-indigo-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <Key size={18} /> API Keys
          </button>
          <button onClick={() => setActiveTab('system')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'system' ? 'bg-indigo-500/20 text-white border border-indigo-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <Globe size={18} /> System
          </button>
        </div>

        <div className="flex-1 glass p-8 rounded-3xl border border-white/5">
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">AI Prompt Engineering</h3>
                <p className="text-sm text-slate-400">Modify the core instructions given to Mistral AI. This changes how it responds to real estate leads on WhatsApp.</p>
              </div>

              {loading ? (
                <div className="h-64 flex items-center justify-center text-slate-500 animate-pulse">Loading prompt from MongoDB...</div>
              ) : (
                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                    <textarea 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="relative w-full h-80 bg-[#0B1120] text-slate-300 p-6 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 border border-white/10 font-mono text-sm leading-relaxed resize-none shadow-inner"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                    <p className="text-sm text-emerald-400 font-medium">💡 Tip: Use strict JSON rules for constraints.</p>
                    <button 
                      onClick={handleSavePrompt}
                      disabled={saving}
                      className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      <Save size={18} /> {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'keys' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">API Integrations</h3>
                <p className="text-sm text-slate-400">Manage external connections securely via database without redeploying code.</p>
              </div>
              
              <div className="space-y-4 mt-8">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5 flex items-center gap-2">
                    <Key size={14}/> Mistral AI Secret Key
                  </label>
                  <input 
                    type="password" 
                    value={mistralKey} 
                    onChange={e => setMistralKey(e.target.value)} 
                    placeholder="sk-..." 
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono shadow-inner"
                  />
                  <p className="text-[10px] block mt-2 text-slate-500">This key will override the Vercel Enivronment variable when set.</p>
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    onClick={handleSaveKey} 
                    disabled={saving} 
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                  >
                    <Save size={18} /> {saving ? 'Saving...' : 'Save API Key'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'system' && (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 opacity-50 space-y-4">
              <LayoutDashboard size={48} className="text-slate-600" />
              <p>Under Construction</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
