import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import LiveChat from './pages/LiveChat';
import Agents from './pages/Agents';
import Settings from './pages/Settings';
import Brochure from './pages/Brochure';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-[#0A0A0A] text-zinc-200 font-sans selection:bg-zinc-800">
        <Toaster position="top-right" toastOptions={{ style: { background: '#111', color: '#fff', border: '1px solid #27272a', fontSize: '13px', borderRadius: '8px' } }} />
        <Sidebar className="w-64 border-r border-white/5 flex flex-col" />
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
          <div className="flex-1 overflow-y-auto w-full px-8 py-10">
            <Routes>
              <Route path="/" element={<Dashboard />} />
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
