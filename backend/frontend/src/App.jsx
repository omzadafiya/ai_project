import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import LiveChat from './pages/LiveChat';
import Agents from './pages/Agents';
import Settings from './pages/Settings';
import Brochure from './pages/Brochure';
import { Toaster } from 'react-hot-toast';

function App() {
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
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-sm shadow-xl">
                OZ
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
