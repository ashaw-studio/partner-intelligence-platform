import React from 'react';
import { 
    Layout, 
    Globe, 
    Target, 
    Database, 
    PieChart, 
    DollarSign, 
    Brain, 
    Briefcase, 
    Settings, 
    FileText, 
    Zap, 
    TrendingUp, 
    BarChart3 
} from 'lucide-react';

export type DemoSection = 'vision' | 'partner' | 'admin' | 'impact';

interface DemoNavigationProps {
    activeSection: DemoSection;
    activeView: string;
    activeContext?: any;
    onNavigate: (section: DemoSection, view: string, context?: any) => void;
}

export const DemoNavigation: React.FC<DemoNavigationProps> = ({ activeSection, activeView, activeContext, onNavigate }) => {
    
    const navItemClass = (isActive: boolean) => `
        w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-left
        ${isActive 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 font-bold' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }
    `;

    const subItemClass = (isActive: boolean) => `
        w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm ml-4 border-l border-slate-700 text-left
        ${isActive 
            ? 'text-blue-400 border-blue-500 bg-blue-900/10 font-medium' 
            : 'text-slate-500 hover:text-slate-300 hover:border-slate-500'
        }
    `;

    return (
        <div className="flex flex-col h-full overflow-y-auto pr-2">
            
            {/* SECTION 1: VISION */}
            <div className="mb-6">
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 px-4">
                    Strategy & Vision
                </div>
                <button 
                    onClick={() => onNavigate('vision', 'cover')}
                    className={navItemClass(activeView === 'cover')}
                >
                    <Globe size={18} />
                    <span>Executive Summary</span>
                </button>
                <button 
                    onClick={() => onNavigate('vision', 'problem')}
                    className={navItemClass(activeView === 'problem')}
                >
                    <Target size={18} />
                    <span>The Challenge</span>
                </button>
                <button 
                    onClick={() => onNavigate('vision', 'arch')}
                    className={navItemClass(activeView === 'arch')}
                >
                    <Database size={18} />
                    <span>Architecture</span>
                </button>
            </div>

            {/* SECTION 2: PARTNER EXPERIENCE */}
            <div className="mb-6">
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 px-4">
                    Partner Experience
                </div>
                <button 
                    onClick={() => onNavigate('partner', 'dashboard', { tab: 'overview' })}
                    className={navItemClass(activeSection === 'partner')}
                >
                    <Layout size={18} />
                    <span>Partner Portal</span>
                </button>
                
                {activeSection === 'partner' && (
                    <div className="mt-2 space-y-1 mb-4 animate-in slide-in-from-left-2 duration-300">
                        <button 
                            onClick={() => onNavigate('partner', 'dashboard', { tab: 'overview' })}
                            className={subItemClass(activeView === 'overview' || (activeView === 'dashboard' && (!activeContext || activeContext.tab === 'overview')))}
                        >
                            <PieChart size={14} /> Overview & Scorecard
                        </button>
                        <button 
                            onClick={() => onNavigate('partner', 'dashboard', { tab: 'funding' })}
                            className={subItemClass(activeView === 'funding' || (activeView === 'dashboard' && activeContext?.tab === 'funding'))}
                        >
                            <DollarSign size={14} /> Funding Calculator
                        </button>
                        <button 
                            onClick={() => onNavigate('partner', 'dashboard', { tab: 'chat' })}
                            className={subItemClass(activeView === 'chat' || (activeView === 'dashboard' && activeContext?.tab === 'chat'))}
                        >
                            <Brain size={14} /> AI Consultant
                        </button>
                        <button 
                            onClick={() => onNavigate('partner', 'dashboard', { tab: 'opportunities' })}
                            className={subItemClass(activeView === 'opportunities' || (activeView === 'dashboard' && activeContext?.tab === 'opportunities'))}
                        >
                            <Briefcase size={14} /> Opportunity Pipeline
                        </button>
                    </div>
                )}
            </div>

            {/* SECTION 3: ADMIN WORKFLOW */}
            <div className="mb-6">
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 px-4">
                    Admin Orchestration
                </div>
                <button 
                    onClick={() => onNavigate('admin', 'admin_dashboard', { tab: 'portfolio' })}
                    className={navItemClass(activeSection === 'admin')}
                >
                    <Settings size={18} />
                    <span>Command Center</span>
                </button>

                {activeSection === 'admin' && (
                    <div className="mt-2 space-y-1 mb-4 animate-in slide-in-from-left-2 duration-300">
                        <button 
                            onClick={() => onNavigate('admin', 'admin_dashboard', { tab: 'portfolio' })}
                            className={subItemClass(activeView === 'portfolio' || (activeView === 'admin_dashboard' && (!activeContext || activeContext.tab === 'portfolio')))}
                        >
                            <Globe size={14} /> Portfolio View
                        </button>
                        <button 
                            onClick={() => onNavigate('admin', 'admin_dashboard', { tab: 'import' })}
                            className={subItemClass(activeView === 'import' || (activeView === 'admin_dashboard' && activeContext?.tab === 'import'))}
                        >
                            <FileText size={14} /> Bulk Ingestion
                        </button>
                        <button 
                            onClick={() => onNavigate('admin', 'admin_dashboard', { tab: 'matcher' })}
                            className={subItemClass(activeView === 'matcher' || (activeView === 'admin_dashboard' && activeContext?.tab === 'matcher'))}
                        >
                            <Zap size={14} /> AI Matcher
                        </button>
                        <button 
                            onClick={() => onNavigate('admin', 'admin_dashboard', { tab: 'pipeline' })}
                            className={subItemClass(activeView === 'pipeline' || (activeView === 'admin_dashboard' && activeContext?.tab === 'pipeline'))}
                        >
                            <TrendingUp size={14} /> Pipeline Health
                        </button>
                    </div>
                )}
            </div>

            {/* SECTION 4: IMPACT */}
            <div className="mb-6">
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 px-4">
                    Business Impact
                </div>
                <button 
                    onClick={() => onNavigate('impact', 'impact')}
                    className={navItemClass(activeView === 'impact')}
                >
                    <BarChart3 size={18} />
                    <span>ROI & Roadmap</span>
                </button>
            </div>

            {/* SECTION 4: BUSINESS IMPACT */}
            <div className="mb-6">
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 px-4">
                    Outcomes
                </div>
                <button 
                    onClick={() => onNavigate('impact', 'impact')}
                    className={navItemClass(activeSection === 'impact')}
                >
                    <TrendingUp size={18} />
                    <span>Business Impact</span>
                </button>
            </div>
        </div>
    );
};
