import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit, X, Save, Upload, MapPin, IndianRupee, Home, FileText, Sparkles, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const Properties = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [importing, setImporting] = useState(false);
    const [form, setForm] = useState({ title: '', price: '', location: '', type: '2BHK', description: '', imageUrl: '' });
    const fileInputRef = useRef(null);

    const fetchProperties = async () => {
        try {
            const res = await fetch('/api/properties');
            if (res.ok) setProperties(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchProperties(); }, []);

    const openAdd = () => {
        setEditingId(null);
        setForm({ title: '', price: '', location: '', type: '2BHK', description: '', imageUrl: '' });
        setIsModalOpen(true);
    };

    const openEdit = (prop) => {
        setEditingId(prop._id);
        setForm({ title: prop.title, price: prop.price, location: prop.location, type: prop.type, description: prop.description || '', imageUrl: prop.imageUrl || '' });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingId ? `/api/properties/${editingId}` : '/api/properties';
        const method = editingId ? 'PUT' : 'POST';
        try {
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            if (res.ok) {
                toast.success(editingId ? 'Property updated!' : 'Property added!');
                setIsModalOpen(false);
                fetchProperties();
            }
        } catch (e) { toast.error('Failed to save'); }
    };

    const handleDelete = async (id) => {
        const r = await Swal.fire({
            title: 'Remove Property?',
            text: 'This listing will be permanently deleted.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#374151',
            confirmButtonText: 'Delete',
            background: '#111827',
            color: '#fff'
        });
        if (r.isConfirmed) {
            await fetch(`/api/properties/${id}`, { method: 'DELETE' });
            toast.success('Property removed');
            fetchProperties();
        }
    };

    const handlePdfImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImporting(true);
        const tid = toast.loading(`🤖 AI is reading "${file.name}"...`);
        try {
            const formData = new FormData();
            formData.append('pdf', file);
            const res = await fetch('/api/properties/import-pdf', { method: 'POST', body: formData });
            const data = await res.json();
            if (res.ok && data.count > 0) {
                toast.success(`✅ AI extracted & saved ${data.count} propert${data.count === 1 ? 'y' : 'ies'} from PDF!`, { id: tid, duration: 5000 });
                fetchProperties();
            } else if (data.count === 0) {
                toast.error('AI couldn\'t find any property data in this PDF.', { id: tid });
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (err) {
            toast.error(`Import failed: ${err.message}`, { id: tid });
        }
        setImporting(false);
        e.target.value = '';
    };

    const typeColors = { '1BHK': 'text-blue-400', '2BHK': 'text-indigo-400', '3BHK': 'text-violet-400', '4BHK': 'text-purple-400', 'Villa': 'text-amber-400', 'Commercial': 'text-emerald-400', 'Land': 'text-orange-400' };

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center bg-gradient-to-r from-slate-900 to-indigo-900/40 p-6 rounded-3xl border border-white/5 relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none" />
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                        <Home className="text-indigo-400" /> Property Vault
                    </h1>
                    <p className="text-slate-400 text-sm">Manage your live inventory. AI PDF import extracts listings automatically.</p>
                </div>
                <div className="relative z-10 flex gap-3">
                    <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfImport} />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importing}
                        className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-60"
                    >
                        <Sparkles size={15} /> {importing ? 'AI Reading...' : 'Import via PDF'}
                    </button>
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all"
                    >
                        <Plus size={15} /> Add Manually
                    </button>
                </div>
            </motion.div>

            {/* Property Grid */}
            {loading ? (
                <div className="text-center py-20 text-slate-500">Loading inventory...</div>
            ) : properties.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                    <FileText size={40} className="text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 font-semibold">No properties in vault</p>
                    <p className="text-slate-600 text-sm mt-1">Add manually or upload a builder PDF to auto-import.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    <AnimatePresence>
                        {properties.map((prop) => (
                            <motion.div
                                key={prop._id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="group bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 transition-all"
                            >
                                {/* Property Image */}
                                <div className="relative h-44 bg-slate-800 overflow-hidden">
                                    {prop.imageUrl ? (
                                        <img src={prop.imageUrl} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.target.style.display = 'none'; }} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Home size={40} className="text-slate-600" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10 ${typeColors[prop.type] || 'text-slate-400'}`}>{prop.type}</span>
                                    </div>
                                    {/* Action Buttons — show on hover */}
                                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(prop)} className="p-1.5 bg-black/60 hover:bg-indigo-600 text-white rounded-lg backdrop-blur-sm transition-colors"><Edit size={13} /></button>
                                        <button onClick={() => handleDelete(prop._id)} className="p-1.5 bg-black/60 hover:bg-rose-600 text-white rounded-lg backdrop-blur-sm transition-colors"><Trash2 size={13} /></button>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-4">
                                    <h3 className="font-bold text-white text-sm mb-2 leading-tight line-clamp-1">{prop.title}</h3>
                                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                                        <span className="flex items-center gap-1"><MapPin size={11} /> {prop.location}</span>
                                        <span className="flex items-center gap-1 text-emerald-400 font-semibold"><IndianRupee size={11} /> {prop.price}</span>
                                    </div>
                                    {prop.description && <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{prop.description}</p>}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-lg bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                            <div className="flex justify-between items-center p-6 border-b border-white/5">
                                <h3 className="font-bold text-white text-lg">{editingId ? 'Edit Property' : 'Add New Property'}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Property Title</label>
                                        <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 transition-colors" placeholder="e.g. Luxury 3BHK at Vesu Heights" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Price</label>
                                        <input required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 transition-colors" placeholder="e.g. 85 Lakh" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Location</label>
                                        <input required value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 transition-colors" placeholder="e.g. Vesu, Surat" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Type</label>
                                        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 transition-colors">
                                            {['1BHK','2BHK','3BHK','4BHK','Villa','Commercial','Land'].map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Image URL</label>
                                        <input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 transition-colors" placeholder="https://..." />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Description</label>
                                        <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 transition-colors resize-none" placeholder="Amenities, highlights..." />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm">Cancel</button>
                                    <button type="submit" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all">
                                        <Save size={14} /> {editingId ? 'Save Changes' : 'Add Property'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Properties;
