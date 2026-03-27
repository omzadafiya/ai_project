import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Bot, Globe, Copy, CheckCircle, Zap, Database, MessageSquare, ExternalLink, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('ai');
  const [stats, setStats] = useState({ totalLeads: 0, totalProperties: 0, statusCounts: [] });
  const [copied, setCopied] = useState('');

  const webhookUrl = `${window.location.origin}/webhook`;

  useEffect(() => {
    fetch('/api/settings/prompt')
      .then(res => res.json())
      .then(data => { setPrompt(data.prompt || ''); setLoading(false); });

    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data));
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
    } catch (e) {
      toast.error('Failed to save AI config.');
    }
    setSaving(false);
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(''), 2000);
  };

  const tabs = [
    { id: 'ai', label: 'AI Persona', icon: <Bot size={18} /> },
    { id: 'system', label: 'System Info', icon: <Globe size={18} /> },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-3xl border border-white/5">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <SettingsIcon className="text-indigo-400" /> Platform Settings
        </h1>
        <p className="text-slate-400 mt-2">Configure AI routing and monitor system health.</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-56 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                activeTab === tab.id
                  ? 'bg-indigo-500/20 text-white border border-indigo-500/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
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
                    <p className="text-sm text-emerald-400 font-medium">💡 Changes go live immediately — no redeploy needed.</p>
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

          {/* System Info Tab */}
          {activeTab === 'system' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">System Information</h3>
                <p className="text-sm text-slate-400">Live system health, webhook config, and quick access links.</p>
              </div>

              {/* Status Cards */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'AI Engine', value: 'Mistral Large', status: 'online', icon: <Zap size={16} className="text-indigo-400" /> },
                  { label: 'Database', value: 'MongoDB Atlas', status: 'online', icon: <Database size={16} className="text-emerald-400" /> },
                  { label: 'WhatsApp', value: '11za Webhook', status: 'online', icon: <MessageSquare size={16} className="text-green-400" /> },
                ].map(item => (
                  <div key={item.label} className="bg-slate-900/60 border border-white/5 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      {item.icon}
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
                    </div>
                    <p className="text-sm font-bold text-white">{item.value}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] text-emerald-400 font-semibold uppercase">Active</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Stats */}
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Activity size={14} /> Live Statistics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Total Leads Captured</p>
                    <p className="text-3xl font-bold text-indigo-400">{stats.totalLeads}</p>
                  </div>
                  <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Active Inventory</p>
                    <p className="text-3xl font-bold text-emerald-400">{stats.totalProperties}</p>
                  </div>
                  {(stats.statusCounts || []).map(s => (
                    <div key={s._id} className="bg-slate-900/60 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                      <span className="text-sm text-slate-400">{s._id}</span>
                      <span className="font-bold text-white text-lg">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Webhook URL */}
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">11za Webhook URL</h4>
                <div className="flex items-center gap-3 bg-slate-900/80 border border-indigo-500/20 rounded-2xl p-4">
                  <code className="flex-1 text-sm text-indigo-300 font-mono break-all">{webhookUrl}</code>
                  <button
                    onClick={() => copyToClipboard(webhookUrl, 'webhook')}
                    className="flex items-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0"
                  >
                    {copied === 'webhook' ? <CheckCircle size={14} /> : <Copy size={14} />}
                    {copied === 'webhook' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">Paste this URL in your 11za dashboard under "Webhook Settings".</p>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Quick Links</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'MongoDB Atlas', url: 'https://cloud.mongodb.com', desc: 'Manage your database' },
                    { label: '11za Dashboard', url: 'https://11za.in', desc: 'WhatsApp API settings' },
                    { label: 'Vercel Dashboard', url: 'https://vercel.com/dashboard', desc: 'Deployment & logs' },
                    { label: 'Mistral AI Console', url: 'https://console.mistral.ai', desc: 'Manage API keys' },
                  ].map(link => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between bg-slate-900/60 hover:bg-slate-800/60 border border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all group"
                    >
                      <div>
                        <p className="text-sm font-bold text-white">{link.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{link.desc}</p>
                      </div>
                      <ExternalLink size={14} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
