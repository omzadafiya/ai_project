import React from 'react';
import { Home, Users, Settings, MessageSquare, Building2, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  
  const links = [
    { name: 'Lead Pipeline', icon: <Home size={20} />, path: '/' },
    { name: 'Agents', icon: <Users size={20} />, path: '/agents' },
    { name: 'Properties', icon: <Building2 size={20} />, path: '/properties' },
    { name: 'Live Chat', icon: <MessageSquare size={20} />, path: '/chat' },
    { name: 'Settings', icon: <Settings size={20} />, path: '/settings' },
  ];

  return (
    <aside className="w-68 glass border-r border-white/5 h-screen flex flex-col pt-6 z-20">
      <div className="px-6 flex items-center gap-3 mb-10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
          A
        </div>
        <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">AstroEstate</h1>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {links.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${
              location.pathname === link.path 
                ? 'bg-indigo-500/20 text-white border border-indigo-500/30 shadow-lg shadow-indigo-500/5' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {link.icon}
            <span className="font-semibold text-[15px]">{link.name}</span>
            {location.pathname === link.path && <ChevronRight size={16} className="ml-auto opacity-70" />}
          </Link>
        ))}
      </nav>

      <div className="p-6 mt-auto">
        <div className="bg-gradient-to-br from-white/[0.05] to-transparent rounded-3xl p-5 border border-white/10 shadow-inner">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">AI Engine</p>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center">
               <img src="https://www.gstatic.com/lamda/images/sparkle_resting_v2_darkmode_2bdb7df2724e450073ede.gif" alt="Gemini" className="w-3 h-3" />
            </div>
            <span className="text-sm font-bold text-white/90">Gemini 2.5 Pro</span>
          </div>
          <p className="text-[10px] text-emerald-400 mt-2 font-semibold">Ready to Match Properties</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
