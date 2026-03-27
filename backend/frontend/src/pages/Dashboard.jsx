import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MapPin, IndianRupee, Home, Clock, MessageSquare, LayoutDashboard, Search, X, Filter } from 'lucide-react';

const Dashboard = () => {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ totalLeads: 0, totalProperties: 0, statusCounts: [] });
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterAgent, setFilterAgent] = useState('All');

  // Derived filtered leads (client-side, instant)
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const s = search.toLowerCase();
      const matchSearch = !s ||
        (lead.senderName || '').toLowerCase().includes(s) ||
        (lead.phoneId || '').includes(s) ||
        (lead.location || '').toLowerCase().includes(s) ||
        (lead.budget || '').toLowerCase().includes(s);
      const matchStatus = filterStatus === 'All' || lead.status === filterStatus;
      const matchType = filterType === 'All' || lead.propertyType === filterType;
      const matchAgent = filterAgent === 'All' ||
        (filterAgent === 'Unassigned' ? !lead.assignedAgent : lead.assignedAgent === filterAgent);
      return matchSearch && matchStatus && matchType && matchAgent;
    });
  }, [leads, search, filterStatus, filterType, filterAgent]);

  const hasActiveFilters = search || filterStatus !== 'All' || filterType !== 'All' || filterAgent !== 'All';

  const clearFilters = () => {
    setSearch('');
    setFilterStatus('All');
    setFilterType('All');
    setFilterAgent('All');
  };

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
      console.error("Failed to fetch data", error);
    } finally {
      if(loading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
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
            toast.success('Lead assigned & WhatsApp alert sent to Agent!');
            fetchData();
        }
    } catch (e) {
        toast.error('Failed to assign lead.');
        console.error(e);
    }
  };

  const columns = [
    { id: 'New', title: 'New Inquiries', icon: '📥', color: 'border-blue-500/20 bg-blue-500/[0.02]', headerColor: 'text-blue-400' },
    { id: 'Qualified', title: 'AI Qualified', icon: '✨', color: 'border-indigo-500/30 bg-indigo-500/[0.03]', headerColor: 'text-indigo-400' },
    { id: 'Contacted', title: 'Contacted', icon: '🤝', color: 'border-amber-500/20 bg-amber-500/[0.02]', headerColor: 'text-amber-400' },
    { id: 'Closed', title: 'Closed Won', icon: '🎉', color: 'border-emerald-500/20 bg-emerald-500/[0.02]', headerColor: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-8">
      {/* Dashboard Global Header With Follow-Up Trigger */}
      <div className="flex justify-between items-center bg-gradient-to-r from-slate-900 to-indigo-900/40 p-6 rounded-3xl border border-white/5 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
             <LayoutDashboard className="text-indigo-400" /> Command Center
          </h1>
          <p className="text-slate-400">Monitor unified real estate leads from WhatsApp.</p>
        </div>
        <div className="relative z-10 flex gap-3">
            <button 
                onClick={async () => {
                    const toastId = toast.loading('Dispatching AI Follow-ups...');
                    try {
                        const res = await fetch('/api/campaigns/followup', { method: 'POST' });
                        const data = await res.json();
                        if (res.ok) toast.success(`Sent follow-ups to ${data.count} VIP leads!`, { id: toastId });
                        else throw new Error();
                    } catch { toast.error('Failed to trigger campaign', { id: toastId }); }
                }}
                className="bg-indigo-500 hover:bg-indigo-600 px-5 py-2.5 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
            >
                <MessageSquare size={16} /> Nurture Leads
            </button>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        {/* Live Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, phone, location, budget..."
            className="w-full bg-black/30 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-indigo-500/60 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-black/30 border border-white/5 text-sm text-slate-300 px-3 py-2 rounded-xl outline-none focus:border-indigo-500/60 transition-colors cursor-pointer"
        >
          <option value="All">All Status</option>
          {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>

        {/* Property Type Filter */}
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="bg-black/30 border border-white/5 text-sm text-slate-300 px-3 py-2 rounded-xl outline-none focus:border-indigo-500/60 transition-colors cursor-pointer"
        >
          <option value="All">All Types</option>
          {['1BHK','2BHK','3BHK','4BHK','Villa','Commercial','Land'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* Agent Filter */}
        <select
          value={filterAgent}
          onChange={e => setFilterAgent(e.target.value)}
          className="bg-black/30 border border-white/5 text-sm text-slate-300 px-3 py-2 rounded-xl outline-none focus:border-indigo-500/60 transition-colors cursor-pointer"
        >
          <option value="All">All Brokers</option>
          <option value="Unassigned">Unassigned</option>
          {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
        </select>

        {/* Clear Button — only shows if a filter is active */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-400/40 px-3 py-2 rounded-xl transition-all"
          >
            <X size={12} /> Clear Filters
          </button>
        )}

        {/* Active filter count badge */}
        {hasActiveFilters && (
          <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
            {filteredLeads.length} result{filteredLeads.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Analytics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
            { label: 'Total Leads', value: stats.totalLeads, color: 'text-indigo-400', icon: '💎' },
            { label: 'Live Inventory', value: stats.totalProperties, color: 'text-emerald-400', icon: '🏡' },
            { label: 'AI Efficiency', value: '98%', color: 'text-purple-400', icon: '⚡' }
        ].map((item) => (
            <div key={item.label} className="glass rounded-2xl p-6 border border-white/5 flex items-center justify-between group hover:border-white/20 transition-all">
                <div>
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{item.label}</p>
                   <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                   {item.icon}
                </div>
            </div>
        ))}
      </div>

      <div className="flex gap-6 h-full overflow-x-auto pb-4 custom-scrollbar">
      {columns.map(col => (
        <div key={col.id} className={`flex flex-col min-w-[320px] w-[320px] rounded-2xl glass ${col.color} border shadow-xl`}>
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/10 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xl">{col.icon}</span>
              <h3 className={`font-semibold tracking-wide ${col.headerColor}`}>{col.title}</h3>
            </div>
            <span className="bg-white/10 text-xs px-2.5 py-1 rounded-full font-bold shadow-inner">
              {leads.filter(l => l.status === col.id).length}
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <AnimatePresence>
              {loading && leads.length === 0 ? (
                <div className="animate-pulse space-y-4 pt-2">
                  {[1, 2].map(i => (
                    <div key={i} className="h-32 bg-white/5 rounded-xl border border-white/5"></div>
                  ))}
                </div>
              ) : (
                filteredLeads.filter(l => l.status === col.id).map(lead => (
                  <motion.div
                    key={lead._id}
                    layoutId={lead._id}
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="bg-slate-900/80 backdrop-blur-sm border border-white/10 p-5 rounded-xl shadow-lg hover:border-indigo-500/40 hover:shadow-indigo-500/5 transition-all group cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-bl-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-slate-200">
                        <Phone size={14} className="text-indigo-400" />
                        <div className="flex flex-col">
                            <span className="font-bold text-sm leading-none">{lead.senderName || lead.phoneId}</span>
                            {lead.senderName && <span className="font-mono text-[10px] text-slate-500 mt-1">{lead.phoneId}</span>}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium bg-black/20 px-2 py-0.5 rounded-full">
                        <Clock size={10} />
                        {new Date(lead.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {lead.location && (
                        <div className="flex items-start gap-2.5 text-sm text-slate-300">
                          <MapPin size={16} className="mt-0.5 text-purple-400 opacity-80" />
                          <span className="font-medium line-clamp-1 leading-snug">{lead.location}</span>
                        </div>
                      )}
                      {lead.budget && (
                        <div className="flex items-center gap-2.5 text-sm">
                          <IndianRupee size={16} className="text-purple-400 opacity-80" />
                          <span className="font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">{lead.budget}</span>
                        </div>
                      )}
                      {lead.propertyType && (
                        <div className="flex items-center gap-2.5 text-sm text-slate-300">
                          <Home size={16} className="text-purple-400 opacity-80" />
                          <span className="bg-white/10 px-2.5 py-0.5 rounded-md text-xs font-semibold">{lead.propertyType}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/5 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <select 
                            value={lead.status}
                            onChange={(e) => updateLeadStatus(lead._id, e.target.value)}
                            className="bg-black/40 text-[10px] font-bold py-1.5 px-3 rounded-lg border border-white/10 outline-none text-slate-300 hover:border-indigo-500 transition-all cursor-pointer"
                        >
                            {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>

                        <select 
                            value={lead.assignedAgent || ""}
                            onChange={(e) => assignLead(lead._id, e.target.value)}
                            className="bg-indigo-500/10 text-[10px] font-bold py-1.5 px-3 rounded-lg border border-indigo-500/30 outline-none text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500 transition-all cursor-pointer max-w-[120px] truncate"
                        >
                            <option value="" disabled>Assign Broker</option>
                            {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                        </select>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
            
            {filteredLeads.filter(l => l.status === col.id).length === 0 && !loading && (
              <div className="h-24 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center text-slate-500 text-sm font-medium">
                {hasActiveFilters ? 'No matches' : 'No leads yet'}
              </div>
            )}
          </div>
        </div>
      ))}
      </div>
    </div>
  );
};

export default Dashboard;
