import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Building2, MapPin, IndianRupee, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '', location: '', price: '', type: '2BHK', description: '', imageUrl: ''
  });

  const fetchProperties = async () => {
    try {
      const res = await fetch('/api/properties');
      if (res.ok) {
        const data = await res.json();
        setProperties(data);
      }
    } catch (error) {
      console.error("Failed to fetch properties", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success('✅ Property listed successfully!');
        setShowModal(false);
        setFormData({ title: '', location: '', price: '', type: '2BHK', description: '', imageUrl: '' });
        fetchProperties();
      } else {
        toast.error('Failed to add property');
      }
    } catch (error) {
      toast.error('Network error, please try again');
      console.error("Error saving property", error);
    }
  };

  const deleteProperty = async (id) => {
    const result = await Swal.fire({
      title: 'Remove Property?',
      text: 'This listing will be permanently deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#374151',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      background: '#0f172a',
      color: '#fff'
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('🗑️ Property removed');
        fetchProperties();
      } else {
        toast.error('Failed to delete');
      }
    } catch (error) {
      toast.error('Network error');
      console.error("Error deleting", error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Inventory Management</h2>
          <p className="text-slate-400 text-sm">Add properties that Gemini AI will suggest to customers.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          <Plus size={20} />
          Add Property
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="h-64 glass rounded-2xl animate-pulse"></div>)
          ) : properties.map((prop) => (
            <motion.div
              key={prop._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass rounded-2xl overflow-hidden border border-white/5 hover:border-white/20 transition-all group"
            >
              <div className="h-48 bg-slate-800 relative">
                {prop.imageUrl ? (
                  <img src={prop.imageUrl} alt={prop.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <Building2 size={48} />
                  </div>
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button 
                    onClick={() => deleteProperty(prop._id)}
                    className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg backdrop-blur-md transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="bg-indigo-600/90 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md">
                    {prop.type}
                  </span>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <h4 className="font-bold text-lg text-white line-clamp-1">{prop.title}</h4>
                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                  <MapPin size={14} className="text-purple-400" />
                  {prop.location}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-lg">
                    <IndianRupee size={16} />
                    {prop.price}
                  </div>
                  <span className="text-xs text-slate-500 font-medium italic">Active Listing</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-3xl shadow-2xl relative overflow-hidden z-10"
            >
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">New Property Listing</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Property Title</label>
                    <input 
                      required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all" 
                      placeholder="e.g. Modern 2BHK in Surat City"
                      value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300">Location</label>
                      <input 
                        required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500"
                        placeholder="e.g. Surat"
                        value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300">Price (Approx)</label>
                      <input 
                        required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500"
                        placeholder="e.g. 15 Lakh"
                        value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Property Type</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500"
                      value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                    >
                      <option className="bg-slate-900">1BHK</option>
                      <option className="bg-slate-900">2BHK</option>
                      <option className="bg-slate-900">3BHK</option>
                      <option className="bg-slate-900">Villa</option>
                      <option className="bg-slate-900">Commercial</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Image URL (Optional)</label>
                    <input 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500"
                      placeholder="https://images.unsplash.com/..."
                      value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                    />
                  </div>
                  <button className="w-full bg-indigo-600 py-3.5 rounded-xl font-bold text-lg mt-4 shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all">
                    Public Listing
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Properties;
