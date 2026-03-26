import React, { useState, useEffect } from 'react';
import { Users, Phone, Shield, Circle, UserPlus } from 'lucide-react';

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/agents')
      .then(res => res.json())
      .then(data => {
        setAgents(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gradient-to-r from-slate-900 to-indigo-900/40 p-6 rounded-3xl border border-white/5 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="text-indigo-400" /> Team Agents
          </h1>
          <p className="text-slate-400">Manage your real estate brokers and track their active leads.</p>
        </div>
        <button className="relative z-10 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20">
          <UserPlus size={18} /> Add New Agent
        </button>
      </div>

      <div className="glass rounded-3xl overflow-hidden border border-white/5">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-white/5">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-300">Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-300">Contact</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-300">Role</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-300">Assigned Leads</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-300">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan="5" className="p-8 text-center text-slate-400">Loading agents...</td></tr>
            ) : agents.map(agent => (
              <tr key={agent.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-sm shadow-inner overflow-hidden">
                       <span className="opacity-90">{agent.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <span className="font-medium text-slate-200">{agent.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400 flex items-center gap-2">
                  <Phone size={14} className="text-slate-500" /> {agent.phone}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Shield size={12} /> {agent.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-slate-800 rounded-full h-2 max-w-[100px]">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.min(agent.leads * 2, 100)}%` }}></div>
                    </div>
                    <span className="text-sm text-slate-300 font-medium">{agent.leads}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Circle size={10} className={agent.status === 'Online' ? 'fill-emerald-400 text-emerald-400 animate-pulse' : agent.status === 'In Meeting' ? 'fill-amber-400 text-amber-400' : 'fill-slate-500 text-slate-500'} />
                    <span className={agent.status === 'Online' ? 'text-emerald-400' : agent.status === 'In Meeting' ? 'text-amber-400' : 'text-slate-400'}>{agent.status}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Agents;
