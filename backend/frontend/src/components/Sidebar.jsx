import React from 'react';
import { LayoutDashboard, Users, Settings as SettingsIcon, MessageSquare } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const menu = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Live Chat', icon: MessageSquare, path: '/chat' },
    { name: 'Brokers', icon: Users, path: '/agents' },
    { name: 'Settings', icon: SettingsIcon, path: '/settings' },
  ];

  return (
    <aside className="w-64 bg-[#050505] border-r border-[#1a1a1a] flex flex-col h-screen text-zinc-400">
      <div className="px-6 py-8 flex items-center gap-3">
        <div className="w-7 h-7 rounded border border-zinc-800 bg-black text-zinc-100 flex items-center justify-center font-bold text-xs tracking-tighter">AE</div>
        <div className="flex flex-col">
            <span className="font-semibold text-sm text-zinc-100 leading-tight tracking-tight">AstroEstate</span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Workspace</span>
        </div>
      </div>
      
      <div className="px-4 pb-2">
         <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest px-2 mb-2">Platform</p>
      </div>

      <nav className="flex-1 px-4 space-y-0.5">
        {menu.map(item => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${isActive ? 'bg-[#141414] text-zinc-100 border border-[#222]' : 'text-zinc-500 border border-transparent hover:text-zinc-300 hover:bg-[#0f0f0f]'}`}
          >
            <item.icon size={15} /> {item.name}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-6">
        <div className="p-4 rounded-xl border border-[#1a1a1a] bg-[#0A0A0A] flex items-center gap-3">
            <div className="flex items-center justify-center p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="flex flex-col">
                <span className="text-xs font-semibold text-zinc-200">Mistral Active</span>
                <span className="text-[9px] text-zinc-500 font-mono">large-latest</span>
            </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
