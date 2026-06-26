
import React, { useState, useEffect } from 'react';
import IntakeWizard from './components/IntakeWizard';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import PartnerLogin from './components/PartnerLogin';
import Presentation from './components/Presentation';
import { PartnerData } from './types';
import { dbService } from './services/dbService';
import { ShieldCheck, User, LogOut, ChevronRight, BarChart3, Globe, Lock, ArrowRight, Shield, Sparkles, Calculator, Database, ToggleRight, ToggleLeft, MonitorPlay } from 'lucide-react';

type UserRole = 'guest' | 'partner' | 'admin';
type ViewState = 'login' | 'partner_login' | 'intake' | 'dashboard' | 'admin_dashboard' | 'admin_view_partner' | 'presentation';
type DataMode = 'live' | 'demo';

// Official Logo Component — uses inline SVG for reliability (no external image dependency)
const BrandLogo = ({ className = "", variant = "color" }: { className?: string, variant?: "color" | "white" }) => {
    const fillColor = variant === 'white' ? '#FFFFFF' : '#004481';
    return (
        <svg className={`h-8 md:h-10 w-auto select-none ${className}`} viewBox="0 0 280 40" xmlns="http://www.w3.org/2000/svg">
            <text x="0" y="32" fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif" fontSize="36" fontWeight="900" fill={fillColor} letterSpacing="-1.5">
                NIMBUS
            </text>
            <text x="155" y="32" fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif" fontSize="36" fontWeight="300" fill={fillColor} letterSpacing="-1.5">
                CLOUD
            </text>
            <circle cx="270" cy="8" r="5" fill="#0078D4"/>
        </svg>
    );
};

export default function App() {
  const [role, setRole] = useState<UserRole>('guest');
  const [view, setView] = useState<ViewState>('login');
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
  const [intakeStartStep, setIntakeStartStep] = useState(0);
  const [dataMode, setDataMode] = useState<DataMode>('demo');
  
  useEffect(() => {
    dbService.seedDatabase();
  }, []);

  const handleRoleSelection = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === 'admin') {
        setView('admin_dashboard');
    } else {
        setView('partner_login');
    }
  };

  const handlePartnerLogin = (data: PartnerData) => {
      setPartnerData(data);
      setView('dashboard');
  };

  const handlePartnerRegister = () => {
      setPartnerData(null); // Clear any existing data
      setIntakeStartStep(0);
      setView('intake');
  };

  const handlePartnerEdit = (step: number) => {
      // Triggered from Dashboard edit buttons
      setIntakeStartStep(step);
      setView('intake');
  };

  const handlePartnerSubmit = (data: PartnerData) => {
    setPartnerData(data);
    dbService.savePartner(data);
    setView('dashboard');
  };

  const handleAdminSelectPartner = (data: PartnerData) => {
    setPartnerData(data);
    setView('admin_view_partner');
  };

  const handleLogout = () => {
      setRole('guest');
      setView('login');
      setPartnerData(null);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-[#004481]">

      {/* ---------------- DEMO BANNER ---------------- */}
      <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-xs sm:text-sm text-center py-2 px-4 font-medium">
        🧪 <span className="font-bold">Portfolio demo</span> — every company, person, and lead shown is fictional. No real, proprietary, or sensitive data is used.
      </div>

      {/* ---------------- NAVIGATION ---------------- */}
      {view !== 'login' && (
          <nav className="bg-white/80 border-b border-slate-200 sticky top-0 z-50 backdrop-blur-xl shadow-sm">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-18 py-3">
                <div className="flex items-center gap-6">
                  <div className="transition-transform hover:scale-[1.02] cursor-pointer" onClick={() => role === 'admin' ? setView('admin_dashboard') : setView('dashboard')}>
                      <BrandLogo />
                  </div>
                  <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
                  <div className="hidden md:flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Ecosystem Portal</span>
                    <span className="font-bold text-slate-700 text-sm tracking-tight flex items-center gap-1.5">
                        <span className="bg-[#FF9900] text-white text-[9px] px-1.5 py-0.5 rounded">AWS</span>
                        Partner Scorecard
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                    {role === 'admin' ? (
                        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-1.5 rounded-full text-indigo-700 shadow-sm transition-all hover:bg-indigo-100">
                            <ShieldCheck size={14} />
                            <span className="text-xs font-bold uppercase tracking-widest">Admin Command</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full text-[#004481] shadow-sm transition-all hover:bg-blue-100">
                            <User size={14} />
                            <span className="text-xs font-bold uppercase tracking-widest">Partner Portal</span>
                        </div>
                    )}
                    <button 
                        onClick={handleLogout}
                        className="text-slate-400 hover:text-red-600 transition-all p-2 rounded-full hover:bg-red-50"
                        title="Sign Out"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
              </div>
            </div>
          </nav>
      )}

      {/* ---------------- MAIN CONTENT ---------------- */}
      <main className={`flex-1 ${view === 'login' ? '' : view === 'presentation' ? '' : 'max-w-[1600px] mx-auto w-full px-4 sm:px-6 py-10'}`}>
        
        {view === 'presentation' && (
            <Presentation onClose={() => setView('login')} />
        )}

        {/* ---------------- LOGIN SCREEN ---------------- */}
        {view === 'login' && (
            <div className="flex min-h-screen bg-white">
                
                {/* Brand Experience Side */}
                <div className="hidden lg:flex w-1/2 bg-[#004481] relative overflow-hidden flex-col justify-between p-16 text-white">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600 rounded-full mix-blend-soft-light filter blur-[120px] opacity-30 -translate-y-1/2 translate-x-1/4"></div>
                    <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-indigo-600 rounded-full mix-blend-soft-light filter blur-[120px] opacity-30 translate-y-1/2 -translate-x-1/4"></div>
                    
                    <div className="relative z-10">
                         {/* White logo variant for dark background */}
                         <div className="p-2 inline-block">
                            <BrandLogo variant="white" />
                         </div>
                    </div>

                    <div className="relative z-10 max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-8 text-blue-100">
                            <Sparkles size={12} className="text-[#FF9900]" /> Intelligence-Driven Practice
                        </div>
                        <h1 className="text-6xl font-black leading-[1.1] mb-8 tracking-tighter">
                            Realize the promise of <br/>
                            <span className="text-[#FF9900]">Technology</span>.
                        </h1>
                        <p className="text-blue-100/80 text-xl leading-relaxed font-light">
                            Unlock the full potential of your AWS partnership with automated scorecarding, AI-driven consulting, and strategic lead matching.
                        </p>
                    </div>

                    <div className="relative z-10 grid grid-cols-3 gap-6">
                         <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 group hover:bg-white/10 transition-all cursor-default">
                            <BarChart3 className="mb-4 text-[#FF9900] group-hover:scale-110 transition-transform" size={28} />
                            <h4 className="font-bold text-lg leading-tight">Maturity Scoring</h4>
                            <p className="text-blue-200/60 text-xs mt-2">Benchmark against top global partners.</p>
                         </div>
                         <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 group hover:bg-white/10 transition-all cursor-default">
                            <Globe className="mb-4 text-[#FF9900] group-hover:scale-110 transition-transform" size={28} />
                            <h4 className="font-bold text-lg leading-tight">Lead Matching</h4>
                            <p className="text-blue-200/60 text-xs mt-2">Precision routing for high-intent deals.</p>
                         </div>
                         <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 group hover:bg-white/10 transition-all cursor-default">
                            <Calculator className="mb-4 text-[#FF9900] group-hover:scale-110 transition-transform" size={28} />
                            <h4 className="font-bold text-lg leading-tight">Funding Calculator</h4>
                            <p className="text-blue-200/60 text-xs mt-2">Visualize project rebates & MDF.</p>
                         </div>
                    </div>
                </div>

                {/* Authentication Side */}
                <div className="w-full lg:w-1/2 bg-slate-50 flex items-center justify-center p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full filter blur-[100px] opacity-50 -translate-y-1/2 translate-x-1/2"></div>
                    
                    <div className="max-w-md w-full relative z-10">
                        <div className="text-center lg:text-left mb-8">
                            <div className="lg:hidden mb-10 inline-block bg-white p-4 rounded-xl shadow-lg">
                                <BrandLogo />
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">Enterprise Access</h2>
                            <p className="text-slate-500 text-lg font-medium">Select your gateway to continue to the AWS Partner Scorecard platform.</p>
                        </div>

                        {/* Demo controls */}
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg text-emerald-700 text-xs font-bold uppercase tracking-wide">
                                <Sparkles size={14} /> Demo data · fictional
                            </div>

                            <button 
                                onClick={() => setView('presentation')}
                                className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-[#004481] transition-colors uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-blue-100 hover:bg-blue-50"
                            >
                                <MonitorPlay size={14} /> Presentation Mode
                            </button>
                        </div>

                        <div className="space-y-6">
                            <button 
                                onClick={() => handleRoleSelection('partner')}
                                className="w-full group relative flex items-center p-8 bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-[#004481] hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 text-left"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"></div>
                                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#004481] flex items-center justify-center group-hover:bg-[#004481] group-hover:text-white transition-all duration-500 shadow-inner">
                                    <User size={32} />
                                </div>
                                <div className="ml-6 flex-1 relative z-10">
                                    <h3 className="font-bold text-xl text-slate-900 group-hover:text-[#004481] transition-colors">AWS Partner Portal</h3>
                                    <p className="text-sm text-slate-500 mt-1 font-medium">Scores, AI Consulting & GTM Insights.</p>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-[#004481] group-hover:translate-x-1 transition-all" size={24} />
                            </button>

                            <button 
                                onClick={() => handleRoleSelection('admin')}
                                className="w-full group relative flex items-center p-8 bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-600 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 text-left"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"></div>
                                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                    <ShieldCheck size={32} />
                                </div>
                                <div className="ml-6 flex-1 relative z-10">
                                    <h3 className="font-bold text-xl text-slate-900 group-hover:text-indigo-600 transition-colors">Nimbus Cloud Admin</h3>
                                    <p className="text-sm text-slate-500 mt-1 font-medium">Portfolio Management & Matching Engine.</p>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" size={24} />
                            </button>
                        </div>
                        
                        <div className="mt-16 pt-8 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <Lock size={12} /> Encrypted Session
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Demo Mode · Fictional Data
                            </div>
                            <span>© 2026 Nimbus Cloud (fictional)</span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* ---------------- APP VIEWS (WITH ANIMATION) ---------------- */}
        <div className="transition-all duration-500">
            
            {view === 'partner_login' && (
                <PartnerLogin 
                    onLogin={handlePartnerLogin}
                    onRegister={handlePartnerRegister}
                />
            )}

            {view === 'intake' && (
                <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-10 duration-700">
                    <IntakeWizard 
                        initialData={partnerData} 
                        onComplete={handlePartnerSubmit} 
                        startAtStep={intakeStartStep}
                        onCancel={() => setView('dashboard')}
                    />
                </div>
            )}

            {view === 'dashboard' && partnerData && (
                <div className="animate-in fade-in zoom-in-95 duration-700">
                    <Dashboard 
                        data={partnerData} 
                        onReset={() => { setPartnerData(null); setView('intake'); }}
                        onEdit={handlePartnerEdit}
                    />
                </div>
            )}

            {view === 'admin_dashboard' && (
                <div className="animate-in fade-in slide-in-from-top-10 duration-700">
                    <AdminDashboard 
                        onSelectPartner={handleAdminSelectPartner}
                        onLogout={handleLogout}
                        dataMode={dataMode}
                    />
                </div>
            )}

            {view === 'admin_view_partner' && partnerData && (
                <div className="animate-in fade-in zoom-in-95 duration-700">
                    <Dashboard 
                        data={partnerData}
                        readOnly={true}
                        onBack={() => setView('admin_dashboard')}
                    />
                </div>
            )}
        </div>

      </main>

      {/* Subtle Bottom Glow */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#004481]/20 to-transparent pointer-events-none"></div>
    </div>
  );
}
