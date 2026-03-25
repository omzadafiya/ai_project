import React from 'react';
import { Home, Users, Settings, MessageSquare, Building2, ChevronRight } from 'lucide-react';

const Sidebar = () => {
  const links = [
    { name: 'Pipeline', icon: <Home size={20} />, active: true },
    { name: 'Agents', icon: <Users size={20} /> },
    { name: 'Properties', icon: <Building2 size={20} /> },
    { name: 'Live Chat', icon: <MessageSquare size={20} /> },
    { name: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside className="w-64 glass border-r border-white/5 h-screen flex flex-col pt-6 z-20">
      <div className="px-6 flex items-center gap-3 mb-10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">
          11
        </div>
        <h1 className="text-xl font-bold tracking-tight">AstroEstateCRM</h1>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {links.map((link) => (
          <button
            key={link.name}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              link.active 
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-inner' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {link.icon}
            <span className="font-medium">{link.name}</span>
            {link.active && <ChevronRight size={16} className="ml-auto opacity-70" />}
          </button>
        ))}
      </nav>

      <div className="p-6 mt-auto">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-colors cursor-pointer">
          <p className="text-xs text-slate-400 font-medium mb-1">AI Powered By</p>
          <div className="flex items-center gap-2">
            <img src="https://www.gstatic.com/lamda/images/sparkle_resting_v2_darkmode_2bdb7df2724e450073ede.gif" alt="Gemini" className="w-4 h-4" />
            <span className="text-sm font-semibold text-white tracking-wide">Gemini 2.5 Flash</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
