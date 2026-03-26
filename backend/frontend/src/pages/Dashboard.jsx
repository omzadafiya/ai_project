import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MapPin, IndianRupee, Home, Clock } from 'lucide-react';

const Dashboard = () => {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ totalLeads: 0, totalProperties: 0, statusCounts: [] });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
        const [leadsRes, statsRes] = await Promise.all([
            fetch('/api/leads'),
            fetch('/api/stats')
        ]);
        if (leadsRes.ok) setLeads(await leadsRes.json());
        if (statsRes.ok) setStats(await statsRes.json());
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

  const columns = [
    { id: 'New', title: 'New Inquiries', icon: '📥', color: 'border-blue-500/20 bg-blue-500/[0.02]', headerColor: 'text-blue-400' },
    { id: 'Qualified', title: 'AI Qualified', icon: '✨', color: 'border-indigo-500/30 bg-indigo-500/[0.03]', headerColor: 'text-indigo-400' },
    { id: 'Contacted', title: 'Contacted', icon: '🤝', color: 'border-amber-500/20 bg-amber-500/[0.02]', headerColor: 'text-amber-400' },
    { id: 'Closed', title: 'Closed Won', icon: '🎉', color: 'border-emerald-500/20 bg-emerald-500/[0.02]', headerColor: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-8">
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
                leads.filter(l => l.status === col.id).map(lead => (
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
                        <div className="flex items-center gap-1.5 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 ring-2 ring-indigo-500/20"></span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Verified</span>
                        </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
            
            {leads.filter(l => l.status === col.id).length === 0 && !loading && (
              <div className="h-24 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center text-slate-500 text-sm font-medium">
                No leads yet
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
