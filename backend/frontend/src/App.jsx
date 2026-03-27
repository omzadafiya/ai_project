import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import LiveChat from './pages/LiveChat';
import Agents from './pages/Agents';
import Settings from './pages/Settings';
import Brochure from './pages/Brochure';
import Login from './pages/Login';
import { Toaster } from 'react-hot-toast';
import { LogOut } from 'lucide-react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [adminName, setAdminName] = useState('Admin');

  useEffect(() => {
    const token = localStorage.getItem('astro_token');
    if (!token) { setChecking(false); return; }
    fetch('/api/auth/verify', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.valid) { setIsAuthenticated(true); setAdminName(data.username || 'Admin'); }
        else localStorage.removeItem('astro_token');
      })
      .catch(() => localStorage.removeItem('astro_token'))
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    const token = localStorage.getItem('astro_token');
    if (token) {
      fetch('/api/auth/verify', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => { if (d.valid) setAdminName(d.username); });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('astro_token');
    setIsAuthenticated(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
        <Login onLogin={handleLogin} />
      </>
    );
  }

  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
      <div className="flex bg-[#0F172A] min-h-screen text-slate-100 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

          <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 glass sticky top-0 z-10">
            <div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">AstroEstate Dashboard</h2>
              <p className="text-sm text-slate-400">AI-Powered Real Estate Management System</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-xs font-semibold text-emerald-400">Live Webhook Active</span>
              </div>
              {/* Admin badge + logout */}
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-xs text-indigo-300 uppercase shadow-xl">
                  {adminName.substring(0, 2)}
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 transition-all"
                >
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-8 z-0">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/properties" element={<Properties />} />
              <Route path="/chat" element={<LiveChat />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/brochure/:id" element={<Brochure />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
