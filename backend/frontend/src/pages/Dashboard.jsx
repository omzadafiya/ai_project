import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Phone, MapPin, IndianRupee, Home, Clock, MessageSquare, Plus, ArrowRight } from 'lucide-react';

const Dashboard = () => {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ totalLeads: 0, totalProperties: 0, statusCounts: [] });
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
        const [leadsRes, statsRes, agentsRes] = await Promise.all([
            fetch('/api/leads'),
            fetch('/api/stats'),
            fetch('/api/agents')
        ]);
        if (leadsRes.ok) setLeads(await leadsRes.json());
        if (statsRes.ok) setStats(await statsRes.json());
        if (agentsRes.ok) setAgents(await agentsRes.json());
    } catch (error) {
      console.error("Failed to fetch", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateLeadStatus = async (id, newStatus) => {
    try {
        const res = await fetch(`/api/leads/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  const assignLead = async (leadId, agentId) => {
    if (!agentId) return;
    try {
        const res = await fetch(`/api/leads/${leadId}/assign`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId })
        });
        if (res.ok) {
            toast.success('Assigned and Agent Alerted');
            fetchData();
        }
    } catch (e) { toast.error('Assignment Failed'); }
  };

  const triggerNurture = async () => {
      const tid = toast.loading('Dispatching Auto-Followups...');
      try {
          const res = await fetch('/api/campaigns/followup', { method: 'POST' });
          const data = await res.json();
          if (res.ok) toast.success(`Alerts sent to ${data.count} VIP leads`, { id: tid });
          else throw new Error();
      } catch { toast.error('Failed to dispatch campaign', { id: tid }); }
  };

  const statusOptions = [
    { id: 'New', title: 'New Hook', color: 'text-blue-400' },
    { id: 'Qualified', title: 'Qualified', color: 'text-indigo-400' },
    { id: 'Follow Up', title: 'Follow Up', color: 'text-amber-400' },
    { id: 'Site Visit', title: 'Site Visit', color: 'text-emerald-400' },
    { id: 'Closed', title: 'Closed Won', color: 'text-zinc-400' }
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-10">
      
      {/* Sleek V6 Header */}
      <header className="flex items-end justify-between border-b border-[#1a1a1a] pb-6">
          <div>
              <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight mb-1">Command Center</h1>
              <p className="text-sm text-zinc-500 font-medium">Real-time WhatsApp pipeline telemetry.</p>
          </div>
          <button 
              onClick={triggerNurture}
              className="px-4 py-2 bg-zinc-100 text-zinc-900 hover:bg-white text-sm font-semibold rounded-md flex items-center gap-2 transition-all"
          >
              <MessageSquare size={14} /> Drip Sequence
          </button>
      </header>

      {/* V6 Minimalist Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
            { label: 'Total Inflow', value: stats.totalLeads },
            { label: 'Live Inventory', value: stats.totalProperties },
            { label: 'Active Brokers', value: agents.length },
            { label: 'Conversion Rate', value: '18%' }
        ].map((s, i) => (
            <div key={i} className="bg-[#050505] p-5 rounded-xl border border-[#1a1a1a] flex flex-col justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{s.label}</span>
                <span className="text-3xl font-bold text-zinc-100 mt-2 tracking-tight">{s.value}</span>
            </div>
        ))}
      </div>

      {/* Unified CRM Lead Board */}
      <div className="border border-[#1a1a1a] rounded-xl overflow-hidden bg-[#050505]">
          <div className="px-6 py-4 border-b border-[#1a1a1a] bg-[#0A0A0A]">
              <h2 className="text-sm font-semibold text-zinc-200">Active CRM Pipeline</h2>
          </div>
          
          <table className="w-full text-left border-collapse">
              <thead className="bg-[#0A0A0A]">
                  <tr className="border-b border-[#1a1a1a]">
                      <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Client Identity</th>
                      <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Parameters</th>
                      <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Target Value</th>
                      <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Stage</th>
                      <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Routing</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                  {loading ? (
                       <tr><td colSpan="5" className="p-8 text-center text-sm text-zinc-600">Syncing telemetry...</td></tr>
                  ) : leads.map(lead => (
                      <tr key={lead._id} className="hover:bg-[#0A0A0A] transition-colors">
                          <td className="px-6 py-4">
                              <div className="flex flex-col">
                                  <span className="text-sm font-semibold text-zinc-200">{lead.senderName || lead.phoneId}</span>
                                  {lead.senderName && <span className="text-[10px] font-mono text-zinc-600 mt-0.5">{lead.phoneId}</span>}
                              </div>
                          </td>
                          <td className="px-6 py-4">
                              <div className="flex items-center gap-3 text-sm text-zinc-400">
                                  <span className="flex items-center gap-1"><MapPin size={12}/> {lead.location}</span>
                                  <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                                  <span className="flex items-center gap-1"><Home size={12}/> {lead.propertyType}</span>
                              </div>
                          </td>
                          <td className="px-6 py-4">
                              <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1">
                                  <IndianRupee size={12}/> {lead.budget}
                              </span>
                          </td>
                          <td className="px-6 py-4">
                              <select 
                                  value={lead.status}
                                  onChange={(e) => updateLeadStatus(lead._id, e.target.value)}
                                  className="bg-transparent text-xs font-semibold py-1 px-0 border-none outline-none text-zinc-300 focus:ring-0 cursor-pointer appearance-none"
                              >
                                  {statusOptions.map(c => <option key={c.id} value={c.id} className="bg-[#111]">{c.title}</option>)}
                              </select>
                          </td>
                          <td className="px-6 py-4 text-right">
                              <select 
                                  value={lead.assignedAgent || ""}
                                  onChange={(e) => assignLead(lead._id, e.target.value)}
                                  className="bg-[#111] border border-[#222] text-xs font-medium py-1.5 px-3 rounded-md outline-none text-zinc-300 hover:border-zinc-500 transition-colors cursor-pointer w-[140px]"
                              >
                                  <option value="" disabled>Unassigned...</option>
                                  {agents.map(a => <option key={a._id} value={a._id} className="bg-[#111]">{a.name.split(' ')[0]}</option>)}
                              </select>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
    </div>
  );
};

export default Dashboard;
