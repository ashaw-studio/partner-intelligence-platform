
import React, { useState, useEffect } from 'react';
import { Lock, User, ArrowRight, Shield, Globe } from 'lucide-react';
import { dbService } from '../services/dbService';
import { PartnerData } from '../types';

interface Props {
    onLogin: (data: PartnerData) => void;
    onRegister: () => void;
}

const PartnerLogin: React.FC<Props> = ({ onLogin, onRegister }) => {
    const [partners, setPartners] = useState<PartnerData[]>([]);
    const [selectedPartnerEmail, setSelectedPartnerEmail] = useState<string>('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [loginError, setLoginError] = useState('');

    useEffect(() => {
        const all = dbService.getAllPartners();
        setPartners(all);
    }, []);

    const handleDemoSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const email = e.target.value;
        setSelectedPartnerEmail(email);
        setEmail(email); // Pre-fill visual email
        setPassword('demo-access-token'); // Fake password
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Demo Logic: If selected from dropdown, log in as that user
        if (selectedPartnerEmail) {
            const partner = partners.find(p => p.email === selectedPartnerEmail);
            if (partner) {
                onLogin(partner);
            }
        } else {
            // "Real" Logic: Look up manually typed email
            const partner = dbService.getPartnerByEmail(email);
            if (partner) {
                onLogin(partner);
            } else {
                setLoginError("Account not found. Please use the Demo User dropdown above to sign in.");
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative">
                <div className="h-2 bg-gradient-to-r from-[#004481] to-[#FF9900]"></div>
                
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-[#004481] mb-4 shadow-inner">
                            <User size={32} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900">Partner Access</h2>
                        <p className="text-slate-500 text-sm mt-1">Secure login to your practice dashboard.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Demo Mode Toggle */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                    <Globe size={12} /> Demo Persona
                                </label>
                                <button 
                                    type="button"
                                    onClick={() => setIsDemoMode(!isDemoMode)} 
                                    className="text-[10px] text-[#004481] font-bold hover:underline"
                                >
                                    {isDemoMode ? "Hide Options" : "Show Demo Users"}
                                </button>
                            </div>
                            
                            {isDemoMode ? (
                                <select 
                                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#004481] outline-none"
                                    onChange={handleDemoSelect}
                                    value={selectedPartnerEmail}
                                >
                                    <option value="">-- Select Existing Partner --</option>
                                    {partners.map((p, i) => (
                                        <option key={i} value={p.email}>
                                            {p.companyName} ({p.contactName})
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div 
                                    onClick={() => setIsDemoMode(true)}
                                    className="text-sm text-slate-400 italic cursor-pointer hover:text-slate-600"
                                >
                                    Click to assume an existing partner identity...
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="email" 
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#004481] focus:border-transparent outline-none transition-all"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="password" 
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#004481] focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {loginError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
                                {loginError}
                            </div>
                        )}

                        <button 
                            type="submit"
                            className="w-full py-4 bg-[#004481] text-white font-bold rounded-xl shadow-lg hover:bg-blue-900 hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            Sign In to Portal <ArrowRight size={18} />
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-slate-500 mb-4">New to the Nimbus Cloud Ecosystem?</p>
                        <button 
                            onClick={onRegister}
                            className="w-full py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:border-[#004481] hover:text-[#004481] transition-all"
                        >
                            Register New Partner
                        </button>
                    </div>
                </div>
                
                <div className="bg-slate-50 p-4 text-center border-t border-slate-200">
                    <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
                        <Shield size={12} /> Secure Ecosystem Login
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PartnerLogin;
