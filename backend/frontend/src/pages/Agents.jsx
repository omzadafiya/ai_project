import React, { useState, useEffect } from 'react';
import { Phone, Shield, Circle, UserPlus, Trash2, Edit, X, Plus, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
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

  const openEditModal = (agent) => {
    setEditingId(agent._id || agent.id);
    setNewAgent({ name: agent.name, phone: agent.phone, role: agent.role, status: agent.status });
    setIsModalOpen(true);
  };

  const handleAddAgent = async (e) => {
    e.preventDefault();
    if (!newAgent.name || !newAgent.phone) return;
    
    if (editingId) {
      await fetch(`/api/agents/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAgent)
      });
    } else {
      await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAgent)
      });
    }
    
    setIsModalOpen(false);
    setEditingId(null);
    setNewAgent({ name: '', phone: '', role: 'Agent', status: 'Online' });
    toast.success(editingId ? 'Broker details updated' : 'Broker created successfully');
    fetchAgents();
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Revoke Access?',
      text: "This agent will be permanently removed from the system.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#1a1a1a',
      confirmButtonText: 'Revoke',
      background: '#0A0A0A',
      color: '#fff',
      customClass: { popup: 'border border-[#222] rounded-xl' }
    });
    
    if (result.isConfirmed) {
      await fetch(`/api/agents/${id}`, { method: 'DELETE' });
      toast.success('Agent access revoked');
      fetchAgents();
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-10">
      <header className="flex items-end justify-between border-b border-[#1a1a1a] pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight mb-1">Team Roster</h1>
          <p className="text-sm text-zinc-500 font-medium">Manage broker access profiles and CRM routing status.</p>
        </div>
        <button 
          onClick={() => {
              setEditingId(null);
              setNewAgent({ name: '', phone: '', role: 'Agent', status: 'Online' });
              setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-zinc-100 text-zinc-900 hover:bg-white text-sm font-semibold rounded-md flex items-center gap-2 transition-all"
        >
          <UserPlus size={14} /> Provision Agent
        </button>
      </header>

      <div className="border border-[#1a1a1a] rounded-xl overflow-hidden bg-[#050505]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#0A0A0A]">
            <tr className="border-b border-[#1a1a1a]">
              <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Broker Identity</th>
              <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Contact Vector</th>
              <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Clearance</th>
              <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Lead Volume</th>
              <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Modifiers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1a1a]">
            {loading ? (
              <tr><td colSpan="6" className="p-8 text-center text-sm text-zinc-600">Retrieving roster...</td></tr>
            ) : agents.length === 0 ? (
              <tr><td colSpan="6" className="p-8 text-center text-sm text-zinc-600">No agents registered in cluster.</td></tr>
            ) : agents.map(agent => (
              <tr key={agent._id || agent.id} className="hover:bg-[#0A0A0A] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded border border-[#222] bg-[#111] text-zinc-300 flex items-center justify-center font-semibold text-xs transition-colors">
                       {agent.name ? agent.name.split(' ').map(n => n[0]).join('') : 'A'}
                    </div>
                    <span className="font-semibold text-sm text-zinc-200 tracking-tight">{agent.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-zinc-400 font-mono">
                  <span className="flex items-center gap-1.5"><Phone size={12} className="text-zinc-600" /> {agent.phone}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${agent.role === 'Admin' ? 'text-indigo-400' : 'text-zinc-500'}`}>
                    <Shield size={10} /> {agent.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold text-zinc-300">{agent.leads}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Circle size={8} className={agent.status === 'Online' ? 'fill-emerald-500 text-emerald-500' : agent.status === 'In Meeting' ? 'fill-amber-500 text-amber-500' : 'fill-zinc-600 text-zinc-600'} />
                    <span className="text-zinc-400">{agent.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditModal(agent)}
                      className="p-1.5 text-zinc-500 hover:text-zinc-200 transition-colors"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(agent._id || agent.id)}
                      className="p-1.5 text-zinc-500 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0A0A0A] rounded-xl border border-[#222] shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-[#1a1a1a]">
              <h3 className="text-sm font-semibold text-white">
                {editingId ? 'Modify Access Profile' : 'Provision Agent Access'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="text-zinc-600 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleAddAgent} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Official Name</label>
                <input 
                  type="text" required
                  value={newAgent.name} onChange={e => setNewAgent({...newAgent, name: e.target.value})}
                  className="w-full bg-[#111] border border-[#222] rounded-md px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-500 transition-colors"
                  placeholder="e.g. Rahul Sharma"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">WhatsApp Vector</label>
                <input 
                  type="text" required
                  value={newAgent.phone} onChange={e => setNewAgent({...newAgent, phone: e.target.value})}
                  className="w-full bg-[#111] border border-[#222] rounded-md px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-500 transition-colors font-mono"
                  placeholder="+91 9876543210"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Clearance Level</label>
                  <select 
                    value={newAgent.role} onChange={e => setNewAgent({...newAgent, role: e.target.value})}
                    className="w-full bg-[#111] border border-[#222] rounded-md px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-500 transition-colors appearance-none"
                  >
                    <option value="Agent">Agent</option>
                    <option value="Senior Broker">Senior Broker</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Routing Status</label>
                  <select 
                    value={newAgent.status} onChange={e => setNewAgent({...newAgent, status: e.target.value})}
                    className="w-full bg-[#111] border border-[#222] rounded-md px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-500 transition-colors appearance-none"
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="In Meeting">In Meeting</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#1a1a1a] mt-4 p-5 -mx-5 -mb-5 bg-[#050505]">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit" className="bg-zinc-100 text-zinc-900 hover:bg-white px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-1.5">
                  {editingId ? <><Save size={14}/> Save Profile</> : <><Plus size={14} /> Provision</>}
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
