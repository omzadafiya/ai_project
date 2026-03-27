import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Bot, Globe, Building2, Phone, MessageSquare, Languages, Users, Copy, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('ai');
  const [copied, setCopied] = useState(false);

  // System config state
  const [config, setConfig] = useState({
    companyName: '',
    companyPhone: '',
    whatsappNumber: '',
    followUpMessage: '',
    botLanguage: 'auto',
    maxLeadsPerAgent: '10',
  });

  const webhookUrl = `${window.location.origin}/webhook`;

  useEffect(() => {
    fetch('/api/settings/prompt')
      .then(r => r.json()).then(d => { setPrompt(d.prompt || ''); setLoading(false); });

    fetch('/api/settings/config')
      .then(r => r.json()).then(d => setConfig(prev => ({ ...prev, ...d })));
  }, []);

  const handleSavePrompt = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings/prompt', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      toast.success('✅ AI Configuration Saved!');
    } catch { toast.error('Failed to save.'); }
    setSaving(false);
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      toast.success('✅ Project Settings Saved!');
    } catch { toast.error('Failed to save.'); }
    setSaving(false);
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success('Webhook URL copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'ai', label: 'AI Persona', icon: <Bot size={16} /> },
    { id: 'system', label: 'Project Settings', icon: <Globe size={16} /> },
  ];

  const inputClass = "w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-all";
  const labelClass = "block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-3xl border border-white/5">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <SettingsIcon className="text-indigo-400" /> Platform Settings
        </h1>
        <p className="text-slate-400 mt-2">Configure your AI bot, company info, and lead management rules.</p>
      </div>

      <div className="flex gap-6">
        <div className="w-52 space-y-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${activeTab === tab.id ? 'bg-indigo-500/20 text-white border border-indigo-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 glass p-8 rounded-3xl border border-white/5">

          {/* AI Persona Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">AI Prompt Engineering</h3>
                <p className="text-sm text-slate-400">Modify Mistral AI's core instructions. Changes go live instantly — no redeploy needed.</p>
              </div>
              {loading ? (
                <div className="h-64 flex items-center justify-center text-slate-500 animate-pulse">Loading from MongoDB...</div>
              ) : (
                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                    <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                      className="relative w-full h-80 bg-[#0B1120] text-slate-300 p-6 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 border border-white/10 font-mono text-sm leading-relaxed resize-none shadow-inner" />
                  </div>
                  <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                    <p className="text-sm text-emerald-400 font-medium">💡 Tip: Always output strict JSON format for constraints.</p>
                    <button onClick={handleSavePrompt} disabled={saving}
                      className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20">
                      <Save size={16} /> {saving ? 'Saving...' : 'Save Prompt'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Project Settings Tab */}
          {activeTab === 'system' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Project Settings</h3>
                <p className="text-sm text-slate-400">Configure your company details, bot behaviour, and lead rules. All changes are saved to your database.</p>
              </div>

              {/* Company Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                  <Building2 size={16} className="text-indigo-400" />
                  <h4 className="font-bold text-white text-sm">Company Information</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Company Name</label>
                    <input value={config.companyName} onChange={e => setConfig({ ...config, companyName: e.target.value })}
                      className={inputClass} placeholder="e.g. 11za Realty" />
                    <p className="text-[10px] text-slate-500 mt-1">Used in AI replies and WhatsApp messages</p>
                  </div>
                  <div>
                    <label className={labelClass}>Company WhatsApp Number</label>
                    <input value={config.whatsappNumber} onChange={e => setConfig({ ...config, whatsappNumber: e.target.value })}
                      className={inputClass} placeholder="e.g. 919904362053" />
                    <p className="text-[10px] text-slate-500 mt-1">11za sends messages from this number</p>
                  </div>
                </div>
              </div>

              {/* Bot Behaviour */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                  <Languages size={16} className="text-purple-400" />
                  <h4 className="font-bold text-white text-sm">Bot Behaviour</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Default Response Language</label>
                    <select value={config.botLanguage} onChange={e => setConfig({ ...config, botLanguage: e.target.value })} className={inputClass}>
                      <option value="auto">🌐 Auto-Detect (Recommended)</option>
                      <option value="hindi">🇮🇳 Hindi</option>
                      <option value="gujarati">🇮🇳 Gujarati</option>
                      <option value="english">🇬🇧 English</option>
                      <option value="marathi">🇮🇳 Marathi</option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">Auto-Detect mirrors the user's language automatically</p>
                  </div>
                  <div>
                    <label className={labelClass}>Max Leads Per Agent</label>
                    <input type="number" min="1" max="100" value={config.maxLeadsPerAgent}
                      onChange={e => setConfig({ ...config, maxLeadsPerAgent: e.target.value })}
                      className={inputClass} placeholder="e.g. 10" />
                    <p className="text-[10px] text-slate-500 mt-1">Agent won't receive new leads after this limit</p>
                  </div>
                </div>
              </div>

              {/* Webhook URL */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                  <Phone size={16} className="text-amber-400" />
                  <h4 className="font-bold text-white text-sm">11za Webhook URL</h4>
                </div>
                <div className="flex items-center gap-3 bg-slate-900/80 border border-amber-500/20 rounded-2xl p-4">
                  <code className="flex-1 text-sm text-amber-300 font-mono break-all">{webhookUrl}</code>
                  <button onClick={copyWebhook}
                    className="flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0">
                    {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-slate-500">Paste this in your 11za dashboard → Webhook Settings → Incoming URL.</p>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-2">
                <button onClick={handleSaveConfig} disabled={saving}
                  className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20">
                  <Save size={16} /> {saving ? 'Saving...' : 'Save All Settings'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
