import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, IndianRupee, BedDouble, Building, CheckCircle2, PhoneCall, Image as ImageIcon } from 'lucide-react';

const Brochure = () => {
    const { id } = useParams();
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/properties/${id}`)
            .then(res => res.json())
            .then(data => { setProperty(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="min-h-screen bg-[#0B1120] flex items-center justify-center font-bold text-indigo-500 animate-pulse">Loading VIP Brochure...</div>;
    
    if (!property) return <div className="min-h-screen bg-[#0B1120] flex items-center justify-center font-bold text-slate-400">Property Not Found.</div>;

    const bgImage = property.imageUrl || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';

    return (
        <div className="min-h-screen bg-[#0B1120] text-slate-200 pb-28 font-sans selection:bg-indigo-500/30">
            {/* Hero Image Section */}
            <div className="relative h-[55vh] w-full">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/60 to-transparent"></div>
                
                {/* Top Bar Navigation */}
                <div className="absolute top-0 w-full p-6 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
                    <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/50 leading-none pb-0.5">A</div>
                         <span className="font-bold text-white tracking-widest uppercase text-xs drop-shadow-md">Astro VIP</span>
                    </div>
                    <span className="px-3 py-1.5 glass rounded-full text-[10px] uppercase tracking-wider font-bold text-emerald-400 border border-emerald-500/30 backdrop-blur-md bg-black/20">Verified Listing</span>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-6 left-6 right-6"
                >
                    <span className="inline-block px-3 py-1.5 bg-indigo-500/90 backdrop-blur-sm text-white rounded-xl text-xs font-bold mb-3 shadow-lg shadow-indigo-500/30 uppercase tracking-widest border border-white/10">{property.type || 'Premium Residence'}</span>
                    <h1 className="text-4xl font-black text-white leading-tight mb-2 drop-shadow-xl">{property.title}</h1>
                    <div className="flex items-center gap-2 text-slate-300 font-medium text-sm drop-shadow-md bg-black/20 w-fit px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/5">
                        <MapPin size={16} className="text-indigo-400" /> {property.location}
                    </div>
                </motion.div>
            </div>

            {/* Price & Primary Specs */}
            <div className="px-6 -mt-8 relative z-10 space-y-6">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="glass p-6 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-2xl bg-slate-900/90 flex items-center justify-between"
                >
                    <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Asking Price</p>
                        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">{property.price}</h2>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-inner">
                        <IndianRupee className="text-emerald-400" />
                    </div>
                </motion.div>

                {/* Amenities / Description */}
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                >
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Building size={18} className="text-indigo-400" /> Property Overview</h3>
                    <p className="text-slate-400 leading-relaxed text-sm">
                        {property.description || "Experience the pinnacle of luxury living in this exquisite residence. Featuring state-of-the-art amenities, breathtaking views, and meticulously crafted interiors, this property is designed for those who accept nothing but the best."}
                    </p>
                </motion.div>

                {/* Highlights Grid */}
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    className="grid grid-cols-2 gap-4"
                >
                    <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col gap-2 bg-black/20">
                        <BedDouble className="text-indigo-400" size={20} />
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Configuration</p>
                            <p className="font-bold text-slate-200 text-sm mt-0.5">{property.type || 'N/A'}</p>
                        </div>
                    </div>
                    <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col gap-2 bg-black/20">
                        <ImageIcon className="text-indigo-400" size={20} />
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Furnishing</p>
                            <p className="font-bold text-slate-200 text-sm mt-0.5">Semi-Furnished</p>
                        </div>
                    </div>
                </motion.div>

                {/* Premium Features List */}
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-indigo-900/20 to-purple-900/10 p-6 rounded-3xl border border-indigo-500/10"
                >
                    <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">VIP Upgrades Included</h3>
                    <ul className="space-y-3.5">
                        {['Italian Marble Flooring', 'Smart Home Automation', 'Reserved Elite Parking', '24/7 Concierge Service'].map((feat, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> {feat}
                            </li>
                        ))}
                    </ul>
                </motion.div>
            </div>

            {/* Fixed Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 w-full p-4 glass border-t border-white/10 z-50 rounded-t-3xl shadow-[0_-20px_40px_rgba(0,0,0,0.8)] bg-[#0B1120]/80 backdrop-blur-xl">
                <a 
                    href={`https://wa.me/917016875366?text=Hi,%20I%20am%20interested%20in%20arranging%20a%20VIP%20Site%20Visit%20for%20the%20property:%20${property.title}`}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 transition-all active:scale-95 border border-white/10"
                >
                    <PhoneCall size={18} /> Book VIP Site Tour Now
                </a>
            </div>
        </div>
    );
};

export default Brochure;
