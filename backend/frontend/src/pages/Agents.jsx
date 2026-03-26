import React, { useState, useEffect } from 'react';
import { Users, Phone, Shield, Circle, UserPlus, Trash2, X, Plus } from 'lucide-react';

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: '', phone: '', role: 'Agent', status: 'Online' });

  const fetchAgents = () => {
    fetch('/api/agents')
      .then(res => res.json())
      .then(data => {
        setAgents(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleAddAgent = async (e) => {
    e.preventDefault();
    if (!newAgent.name || !newAgent.phone) return;
    
    await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAgent)
    });
    
    setIsModalOpen(false);
    setNewAgent({ name: '', phone: '', role: 'Agent', status: 'Online' });
    fetchAgents();
  };

  const handleDelete = async (id) => {
    if(window.confirm('Are you sure you want to remove this agent?')) {
      await fetch(`/api/agents/${id}`, { method: 'DELETE' });
      fetchAgents();
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center bg-gradient-to-r from-slate-900 to-indigo-900/40 p-6 rounded-3xl border border-white/5 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="text-indigo-400" /> Team Agents
          </h1>
          <p className="text-slate-400">Manage your real estate brokers and track their active leads.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="relative z-10 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
        >
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
              <th className="px-6 py-4 text-sm font-semibold text-slate-300 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan="6" className="p-8 text-center text-slate-400">Loading agents...</td></tr>
            ) : agents.length === 0 ? (
              <tr><td colSpan="6" className="p-8 text-center text-slate-400">No agents found. Add one above!</td></tr>
            ) : agents.map(agent => (
              <tr key={agent._id || agent.id} className="hover:bg-white/5 transition-colors group">
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
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleDelete(agent._id || agent.id)}
                    className="p-2 text-rose-400/50 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <UserPlus size={20} className="text-indigo-400" /> Add New Broker
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddAgent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Full Name</label>
                <input 
                  type="text" required
                  value={newAgent.name} onChange={e => setNewAgent({...newAgent, name: e.target.value})}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="e.g. Rahul Sharma"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Phone Number</label>
                <input 
                  type="text" required
                  value={newAgent.phone} onChange={e => setNewAgent({...newAgent, phone: e.target.value})}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="+91 9876543210"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">System Role</label>
                  <select 
                    value={newAgent.role} onChange={e => setNewAgent({...newAgent, role: e.target.value})}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  >
                    <option value="Agent">Standard Agent</option>
                    <option value="Senior Broker">Senior Broker</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Initial Status</label>
                  <select 
                    value={newAgent.status} onChange={e => setNewAgent({...newAgent, status: e.target.value})}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="In Meeting">In Meeting</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20">
                  <Plus size={16} /> Create Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agents;
