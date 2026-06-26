
import React, { useState, useMemo, useEffect, useImperativeHandle } from 'react';
import { PartnerData, PartnerTrack, OpportunityMatchRequest, Opportunity, OpportunityStage, PUBLIC_SECTOR_SEGMENTS } from '../types';
import { dbService } from '../services/dbService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Award, TrendingUp, Users, Brain, Briefcase, Pencil, ArrowLeft, ExternalLink, Sparkles, Target, BarChart3, Calculator, DollarSign, CheckCircle2, XCircle, Rocket, Layers, Clock, ArrowRight, Save, Infinity, Cloud, Zap, AlertTriangle, Lightbulb, Shield, Edit2, FileText, Database, Map, Box, Lock, Info, X, Headphones, Wrench, ChevronRight } from 'lucide-react';
import ChatBot, { ChatBotHandle } from './ChatBot';
import { matchOpportunity } from '../services/geminiService';

interface Props {
    data: PartnerData;
    onReset?: () => void;
    onEdit?: (step: number) => void;
    onBack?: () => void; 
    readOnly?: boolean; 
}

// --- SCORE CALCULATION LOGIC ---

// Derives a representative AWS technical headcount. Uses the explicit
// awsTeamSize when present, otherwise estimates from the team-size band so the
// dashboard never shows a blank figure for seeded/intake partners.
const getAwsHeadcount = (p: PartnerData): number => {
    if (typeof p.awsTeamSize === 'number' && p.awsTeamSize > 0) return p.awsTeamSize;
    const band = (p.teamSizeTech || '0').trim();
    const map: Record<string, number> = { '0': 0, '1': 1, '2-3': 3, '4-6': 5, '7-10': 8, '11+': 12 };
    if (map[band] !== undefined) return map[band];
    const n = parseInt(band, 10);
    return isNaN(n) ? 0 : n;
};

// Revenue band -> score (robust to en-dash ranges and substring overlaps).
const revenueScore = (mr: string): number => {
    if (/>\s*\$?200k/i.test(mr)) return 30;   // ">$200k"
    if (/200k/i.test(mr)) return 20;          // "$50k–$200k"
    if (/50k/i.test(mr)) return 10;           // "$10k–$50k"
    return 0;                                  // "<$10k" / unset
};

// Growth ambition band -> score.
const growthScore = (agt: string): number => {
    if (/50%\s*\+/.test(agt)) return 25;      // "50%+"
    if (/25.*50/.test(agt)) return 15;        // "25–50%"
    return 0;                                  // "10–25%" / "<10%" / "Not set"
};

// Tolerant check for in-house assessment delivery (handles ASCII/Unicode hyphens).
const isInHouse = (s: string): boolean => /in.?house/i.test(s || '');

const calculatePropensity = (p: PartnerData): number => {
    let score = 0;
    score += revenueScore(p.monthlyResale);
    score += growthScore(p.arrGrowthTarget);
    const teamSize = parseInt(p.teamSizeTech.split('-')[0]) || 0;
    if (p.teamSizeTech.includes('11+')) score += 25;
    else if (teamSize >= 5) score += 15;
    if (p.competencies.length > 2) score += 20;
    return Math.min(100, score);
};

const calculateServicePropensity = (p: PartnerData): number => {
    let score = 0;
    // Capacity
    const teamSize = parseInt(p.teamSizeTech.split('-')[0]) || 0;
    if (p.teamSizeTech.includes('11+')) score += 30;
    else if (teamSize >= 5) score += 20;
    else if (teamSize >= 1) score += 10;

    // Delivery Experience
    if (p.mapPhasesDelivered.length >= 2) score += 25;
    else if (p.mapPhasesDelivered.length === 1) score += 15;

    // Assessment Cap
    if (isInHouse(p.deliversAssessments)) score += 20;

    // Advanced Certs
    const pro = (parseInt(p.certCount.pro_sa) || 0) + (parseInt(p.certCount.pro_devops) || 0);
    if (pro >= 2) score += 25;
    else if (pro >= 1) score += 15;

    return Math.min(100, score);
};

// --- BREAKDOWN HELPERS ---

const getResellPropensityBreakdown = (p: PartnerData) => {
    const breakdown = [
        { label: 'Revenue Baseline', score: 0, max: 30, note: p.monthlyResale, advice: "Increase monthly recurring resale revenue to >$50k." },
        { label: 'Growth Ambition', score: 0, max: 25, note: p.arrGrowthTarget, advice: "Commit to >25% YoY growth target." },
        { label: 'Technical Capacity', score: 0, max: 25, note: `${getAwsHeadcount(p)} Engineers`, advice: "Grow certified technical team to 5+." },
        { label: 'Strategic Alignment', score: 0, max: 20, note: `${p.competencies.length} Competencies`, advice: "Achieve 2+ AWS Competencies." }
    ];

    breakdown[0].score = revenueScore(p.monthlyResale);
    breakdown[1].score = growthScore(p.arrGrowthTarget);

    const teamSize = parseInt(p.teamSizeTech.split('-')[0]) || 0;
    if (p.teamSizeTech.includes('11+')) breakdown[2].score = 25;
    else if (teamSize >= 5) breakdown[2].score = 15;

    if (p.competencies.length > 2) breakdown[3].score = 20;

    return breakdown;
};

const getServicePropensityBreakdown = (p: PartnerData) => {
    const breakdown = [
        { label: 'Delivery Capacity', score: 0, max: 30, note: p.teamSizeTech, advice: "Expand technical bench to 11+ engineers." },
        { label: 'MAP Experience', score: 0, max: 25, note: `${p.mapPhasesDelivered.length} Phases`, advice: "Deliver Assess & Mobilize phases in-house." },
        { label: 'Assessment Capability', score: 0, max: 20, note: isInHouse(p.deliversAssessments) ? 'In-House' : 'Outsourced', advice: "Develop in-house OLA/CVA capability." },
        { label: 'Advanced Certifications', score: 0, max: 25, note: 'Pro Certs', advice: "Obtain 2+ Professional or Specialty certifications." }
    ];

    const teamSize = parseInt(p.teamSizeTech.split('-')[0]) || 0;
    if (p.teamSizeTech.includes('11+')) breakdown[0].score = 30;
    else if (teamSize >= 5) breakdown[0].score = 20;
    else if (teamSize >= 1) breakdown[0].score = 10;

    if (p.mapPhasesDelivered.length >= 2) breakdown[1].score = 25;
    else if (p.mapPhasesDelivered.length === 1) breakdown[1].score = 15;

    if (isInHouse(p.deliversAssessments)) breakdown[2].score = 20;

    const pro = (parseInt(p.certCount.pro_sa) || 0) + (parseInt(p.certCount.pro_devops) || 0);
    breakdown[3].note = `${pro} Pro Certs`;
    if (pro >= 2) breakdown[3].score = 25;
    else if (pro >= 1) breakdown[3].score = 15;

    return breakdown;
};

const getAiReadinessBreakdown = (p: PartnerData) => {
    const matrixValues = Object.values(p.aiReadinessMatrix) as number[];
    const aiSum = matrixValues.reduce((a, b) => a + b, 0);
    const avgMaturity = matrixValues.length > 0 ? (aiSum / matrixValues.length) : 0;
    
    const breakdown = [
        { label: 'Use Case Maturity', score: 0, max: 40, note: 'Avg Maturity', advice: "Move from POC to Production in core use cases." },
        { label: 'Production Status', score: 0, max: 30, note: p.buildsAiSolutions, advice: "Launch at least one production GenAI workload." },
        { label: 'Technical Stack', score: 0, max: 30, note: 'Service Depth', advice: "Adopt Bedrock and SageMaker in delivery." }
    ];

    breakdown[0].score = Math.min(40, Math.round((avgMaturity / 5) * 40));
    breakdown[0].note = `Level ${avgMaturity.toFixed(1)}/5`;

    if (p.buildsAiSolutions.includes('production')) breakdown[1].score = 30;
    else if (p.buildsAiSolutions.includes('POC')) breakdown[1].score = 15;

    let stackScore = 0;
    if (p.aiReadinessMatrix['[Service] Amazon Bedrock'] > 1) stackScore += 15;
    if (p.aiReadinessMatrix['[Service] Amazon SageMaker'] > 1) stackScore += 15;
    breakdown[2].score = stackScore;
    breakdown[2].note = stackScore === 30 ? "Advanced" : stackScore > 0 ? "Developing" : "None";

    return breakdown;
};

const getTechFocus = (p: PartnerData) => {
    const focus = [];
    if (p.competencies.some(c => ['Machine Learning', 'Generative AI', 'Data & Analytics'].includes(c)) || p.aiReadinessScore && p.aiReadinessScore > 3) {
        focus.push({ type: 'AI / Data', icon: Brain, color: 'text-indigo-600 bg-indigo-50', border: 'border-indigo-100' });
    }
    if (p.competencies.includes('DevOps') || p.iacExperience === 'Yes') {
        focus.push({ type: 'DevOps', icon: Infinity, color: 'text-cyan-600 bg-cyan-50', border: 'border-cyan-100' });
    }
    if (p.competencies.includes('Migration') || p.mapPhasesDelivered.length > 0) {
        focus.push({ type: 'Migration', icon: Cloud, color: 'text-blue-600 bg-blue-50', border: 'border-blue-100' });
    }
    return focus;
};

const getPriorityActions = (p: PartnerData) => {
    const actions = [];
    
    if (getAwsHeadcount(p) < 5) {
        actions.push({ type: 'Capacity', title: 'Capacity Optimization', desc: 'Utilize IMS Bench to scale your delivery.' });
    } else {
        actions.push({ type: 'Capacity', title: 'Team Expansion', desc: 'Sponsor 2 Associates for Pro Certification.' });
    }

    if (p.scores && p.scores.ai < 50) {
        actions.push({ type: 'AI', title: 'AI Acceleration', desc: 'Join the Bedrock Immersion Day to build 1st POC.' });
    } else {
        actions.push({ type: 'AI', title: 'Generative GTM', desc: 'Launch a GenAI offer on AWS Marketplace.' });
    }

    if (p.calculatedTrack?.includes('Longtail')) {
        actions.push({ type: 'Growth', title: 'Track Advancement', desc: 'Secure 2 Pro-Architect Certs to enter Growth tier.' });
    } else {
        actions.push({ type: 'Growth', title: 'Executive Briefing', desc: 'Schedule QBR with Canada AWS Leads.' });
    }

    return actions;
};

export interface DashboardHandle {
    setActiveTab: (tab: 'overview' | 'chat' | 'matcher' | 'funding' | 'opportunities') => void;
    openScoreDetail: (detail: 'resell' | 'service' | 'ai' | null) => void;
    simulateChat: (message: string) => Promise<void>;
}

const Dashboard = React.forwardRef<DashboardHandle, Props>(({ data, onReset, onEdit, onBack, readOnly = false }, ref) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'matcher' | 'funding' | 'opportunities'>('overview');
    const [activeScoreDetail, setActiveScoreDetail] = useState<string | null>(null);
    const chatBotRef = React.useRef<ChatBotHandle>(null);

    useImperativeHandle(ref, () => ({
        setActiveTab: (tab) => setActiveTab(tab),
        openScoreDetail: (detail) => setActiveScoreDetail(detail),
        simulateChat: async (message: string) => {
            setActiveTab('chat');
            // Small delay to ensure tab switch renders the chatbot
            await new Promise(r => setTimeout(r, 100));
            if (chatBotRef.current) {
                await chatBotRef.current.simulateInput(message);
            }
        }
    }));
    const [opportunityInput, setOpportunityInput] = useState('');
    const [matchResult, setMatchResult] = useState<{score: number, reason: string} | null>(null);
    const [matching, setMatching] = useState(false);
    const [localOpportunities, setLocalOpportunities] = useState<Opportunity[]>(data.opportunities || []);
    const [editingOpp, setEditingOpp] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ stage: OpportunityStage, note: string }>({ stage: 'New', note: '' });
    const [fundingInputs, setFundingInputs] = useState({
        workload: 'migration',
        arr: 250000,
        psFees: 50000
    });

    // Ensure local pipeline state updates when the selected partner changes (Admin view)
    useEffect(() => {
        setLocalOpportunities(data.opportunities || []);
    }, [data.opportunities]);

    const propensityScore = calculatePropensity(data);
    const servicePropensityScore = calculateServicePropensity(data);
    const aiReadinessScore = data.scores?.ai || 0;
    
    const propensityBreakdown = getResellPropensityBreakdown(data);
    const serviceBreakdown = getServicePropensityBreakdown(data);
    const aiBreakdown = getAiReadinessBreakdown(data);

    const techFocus = getTechFocus(data);
    const accountType = data.calculatedTrack ? data.calculatedTrack.split(' - ')[0] : 'Partner';
    const priorityActions = getPriorityActions(data);

    const radarData = [
        { subject: 'Capability', A: data.scores?.capability || 0, fullMark: 100 },
        { subject: 'Capacity', A: data.scores?.capacity || 0, fullMark: 100 },
        { subject: 'Growth', A: data.scores?.growth || 0, fullMark: 100 },
        { subject: 'AI Readiness', A: data.scores?.ai || 0, fullMark: 100 },
        { subject: 'Delivery', A: data.mapPhasesDelivered.length * 33, fullMark: 100 },
        { subject: 'Sales', A: parseInt(data.aceWinRate) || 0, fullMark: 100 },
    ];

    const parseCertCount = (val: string) => {
        if (!val) return 0;
        if (val === '5+') return 5;
        if (val.includes('-')) {
            const parts = val.split('-');
            return parseInt(parts[0]) || 0;
        }
        return parseInt(val) || 0;
    };

    const certData = [
        { name: 'Practitioner', count: parseCertCount(data.certCount.practitioner), color: '#94a3b8' },
        { name: 'Associate', count: parseCertCount(data.certCount.associate_sa) + parseCertCount(data.certCount.associate_dev) + parseCertCount(data.certCount.associate_sysops), color: '#60a5fa' },
        { name: 'Professional', count: parseCertCount(data.certCount.pro_sa) + parseCertCount(data.certCount.pro_devops), color: '#3b82f6' },
        { name: 'Specialty', count: parseCertCount(data.certCount.specialty_data) + parseCertCount(data.certCount.specialty_security) + parseCertCount(data.certCount.specialty_ml) + parseCertCount(data.certCount.specialty_db) + parseCertCount(data.certCount.specialty_net) + parseCertCount(data.certCount.specialty_sap), color: '#004481' },
    ];

    const handleMatch = async () => {
        if(!opportunityInput) return;
        setMatching(true);
        const request: OpportunityMatchRequest = {
            segment: "General",
            workload: "General",
            complexity: "Medium",
            region: "Canada",
            description: opportunityInput
        };
        const res = await matchOpportunity([data], request);
        if (res && res.length > 0) {
            setMatchResult({ score: res[0].matchScore, reason: res[0].reasoning });
        } else {
             setMatchResult({ score: 0, reason: "Analysis failed. Please refine your input." });
        }
        setMatching(false);
    };

    const startEditOpp = (opp: Opportunity) => {
        setEditingOpp(opp.id);
        setEditForm({ stage: opp.stage, note: '' });
    };

    const saveOppUpdate = (id: string) => {
        if (readOnly) return;
        
        dbService.updateOpportunityDetails(
            data.email, 
            id, 
            { stage: editForm.stage },
            editForm.note ? { action: 'Stage Update', note: editForm.note, actor: 'Partner' } : undefined
        );
        
        // Optimistic UI update
        const updated = localOpportunities.map(o => o.id === id ? { ...o, stage: editForm.stage, dateLastUpdated: new Date().toISOString() } : o);
        setLocalOpportunities(updated);
        setEditingOpp(null);
    };

    const fundingCalculations = useMemo(() => {
        let total = 0;
        const breakdown: { name: string, amount: number, type: string }[] = [];
        const hasMigrationCompetency = data.competencies.includes('Migration') || data.calculatedTrack === PartnerTrack.TRACK_C;
        const hasDataCompetency = data.competencies.includes('Data & Analytics') || data.competencies.includes('Machine Learning');

        if (fundingInputs.workload === 'migration') {
            if (fundingInputs.arr > 100000) {
                const olAmount = 15000;
                breakdown.push({ name: 'OLA Assessment', amount: olAmount, type: 'Cash/Credit' });
                total += olAmount;
            }
            if (hasMigrationCompetency) {
                const mobilize = Math.min(fundingInputs.psFees * 0.5, 200000);
                if (mobilize > 0) {
                    breakdown.push({ name: 'MAP Mobilize', amount: mobilize, type: 'Cash/Credits' });
                    total += mobilize;
                }
                const migrate = fundingInputs.arr * 0.15;
                breakdown.push({ name: 'MAP Migrate', amount: migrate, type: 'Credits' });
                total += migrate;
            } else {
                const migrate = fundingInputs.arr * 0.05;
                breakdown.push({ name: 'Standard Migration Rebate', amount: migrate, type: 'Credits' });
                total += migrate;
            }
        } 
        else if (fundingInputs.workload === 'ai') {
            const pocBase = hasDataCompetency ? 15000 : 5000;
            breakdown.push({ name: 'AI/ML POC Funding', amount: pocBase, type: 'Credits' });
            total += pocBase;
            if (fundingInputs.arr > 50000) {
                breakdown.push({ name: 'Service Adoption Incentive', amount: 5000, type: 'Cash' });
                total += 5000;
            }
        }
        else if (fundingInputs.workload === 'assessment') {
             const assessAmount = 10000;
             breakdown.push({ name: 'Optimization Assessment', amount: assessAmount, type: 'Cash' });
             total += assessAmount;
        }
        else if (fundingInputs.workload === 'modernization') {
             const modAmount = fundingInputs.arr * 0.10;
             breakdown.push({ name: 'Modernization Incentive', amount: modAmount, type: 'Credits' });
             total += modAmount;
             if (hasDataCompetency) {
                 breakdown.push({ name: 'Jumpstart Funding', amount: 10000, type: 'Cash' });
                 total += 10000;
             }
        }

        return { total, breakdown, hasCompetency: hasMigrationCompetency || hasDataCompetency };
    }, [fundingInputs, data]);

    const tabs = [
        { id: 'overview', label: 'Executive Scorecard', icon: BarChart3 },
        { id: 'opportunities', label: 'My Opportunities', icon: Layers },
        { id: 'funding', label: 'Funding Calculator', icon: Calculator },
        { id: 'matcher', label: 'GTM Matcher', icon: Target },
    ];

    if (!readOnly) {
        tabs.splice(3, 0, { id: 'chat', label: 'Consultant AI', icon: Sparkles });
    }

    const EditTrigger = ({ step }: { step: number }) => {
        if (readOnly || !onEdit) return null;
        return (
            <button 
                onClick={(e) => { e.stopPropagation(); onEdit(step); }} 
                className="ml-auto text-slate-400 hover:text-[#004481] p-1.5 hover:bg-slate-100 rounded-full transition-all"
                title="Update this section"
            >
                <Edit2 size={14} />
            </button>
        );
    };

    const getModalContent = () => {
        let title = '';
        let score = 0;
        let items: { label: string, score: number, max: number, note: string, advice: string }[] = [];

        switch(activeScoreDetail) {
            case 'resell':
                title = 'Resell Propensity';
                score = propensityScore;
                items = propensityBreakdown;
                break;
            case 'service':
                title = 'Service Propensity';
                score = servicePropensityScore;
                items = serviceBreakdown;
                break;
            case 'ai':
                title = 'AI Readiness';
                score = aiReadinessScore;
                items = aiBreakdown;
                break;
            default:
                return null;
        }

        return (
            <>
                <div className="text-center mb-6">
                    <h3 className="text-2xl font-black text-slate-900">{title} Analysis</h3>
                    <p className="text-slate-500">Breakdown of your current score logic.</p>
                </div>
                <div className="space-y-4">
                    {items.map((item, i) => (
                        <div key={i} className="flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-slate-700">{item.label}</span>
                                <span className="text-sm font-black text-[#004481]">{item.score} / {item.max}</span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                                <div className="bg-[#004481] h-full" style={{ width: `${(item.score / item.max) * 100}%` }}></div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>Status: <span className="font-medium text-slate-900">{item.note}</span></span>
                            </div>
                            {item.score < item.max && (
                                <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-amber-600 font-medium flex items-center gap-1">
                                    <TrendingUp size={12} /> Improvement: {item.advice}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-6 text-center">
                    <div className="inline-block text-4xl font-black text-[#004481]">{score}<span className="text-lg text-slate-400">/100</span></div>
                </div>
            </>
        );
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-20 relative">
            
            {activeScoreDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl border border-white/20 relative">
                        <button onClick={() => setActiveScoreDetail(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
                            <X size={20} />
                        </button>
                        {getModalContent()}
                    </div>
                </div>
            )}

            <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 relative overflow-hidden">
                {readOnly && onBack && (
                     <button onClick={onBack} className="absolute top-6 left-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500 z-20">
                        <ArrowLeft size={20} />
                     </button>
                )}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 relative z-10">
                    <div className="flex items-center gap-6 flex-1">
                        <div className="w-20 h-20 bg-[#004481] text-white rounded-2xl flex items-center justify-center shadow-lg">
                            <Award size={40} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">{data.companyName}</h1>
                                {data.website && <a href={data.website.startsWith('http') ? data.website : `https://${data.website}`} target="_blank" rel="noreferrer"><ExternalLink size={18} className="text-slate-400 hover:text-[#004481]" /></a>}
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${
                                    accountType.includes('Strategic') ? "bg-purple-100 text-purple-700 border-purple-200" :
                                    accountType.includes('Emerging') ? "bg-blue-100 text-[#004481] border-blue-200" :
                                    "bg-slate-100 text-slate-600 border-slate-200"
                                }`}>
                                    {accountType}
                                </span>
                                {techFocus.map(tf => (
                                    <span key={tf.type} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${tf.color} ${tf.border}`}>
                                        <tf.icon size={12} /> {tf.type} Focus
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div id="scorecard-header" className="bg-white rounded-2xl border border-slate-200 shadow-sm flex divide-x divide-slate-100 overflow-hidden w-full xl:w-auto">
                        <div className="p-4 md:px-6 min-w-[140px] cursor-pointer hover:bg-slate-50 transition-colors group flex flex-col justify-center" onClick={() => setActiveScoreDetail('resell')}>
                            <div className="flex items-center gap-1.5 mb-1"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resell Propensity</span><Info size={12} className="text-slate-300 group-hover:text-[#004481]" /></div>
                            <div className="flex items-end gap-2"><span className={`text-3xl font-black ${propensityScore > 70 ? 'text-emerald-600' : propensityScore > 40 ? 'text-amber-500' : 'text-slate-500'}`}>{propensityScore}</span><span className="text-xs text-slate-400 font-bold mb-1.5">/100</span></div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2"><div className={`h-full rounded-full ${propensityScore > 70 ? 'bg-emerald-500' : propensityScore > 40 ? 'bg-amber-500' : 'bg-slate-400'}`} style={{ width: `${propensityScore}%` }}></div></div>
                        </div>
                        <div className="p-4 md:px-6 min-w-[140px] cursor-pointer hover:bg-slate-50 transition-colors group flex flex-col justify-center" onClick={() => setActiveScoreDetail('service')}>
                            <div className="flex items-center gap-1.5 mb-1"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Service Propensity</span><Info size={12} className="text-slate-300 group-hover:text-[#004481]" /></div>
                            <div className="flex items-end gap-2"><span className={`text-3xl font-black ${servicePropensityScore > 70 ? 'text-blue-600' : 'text-slate-500'}`}>{servicePropensityScore}</span><span className="text-xs text-slate-400 font-bold mb-1.5">/100</span></div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2"><div className={`h-full rounded-full ${servicePropensityScore > 70 ? 'bg-blue-600' : 'bg-slate-400'}`} style={{ width: `${servicePropensityScore}%` }}></div></div>
                        </div>
                        <div className="p-4 md:px-6 min-w-[140px] cursor-pointer hover:bg-slate-50 transition-colors group flex flex-col justify-center" onClick={() => setActiveScoreDetail('ai')}>
                            <div className="flex items-center gap-1.5 mb-1"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Readiness</span><Info size={12} className="text-slate-300 group-hover:text-[#004481]" /></div>
                            <div className="flex items-end gap-2"><span className={`text-3xl font-black ${aiReadinessScore > 50 ? 'text-purple-600' : 'text-slate-500'}`}>{aiReadinessScore}</span><span className="text-xs text-slate-400 font-bold mb-1.5">/100</span></div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2"><div className={`h-full rounded-full ${aiReadinessScore > 50 ? 'bg-purple-600' : 'bg-slate-400'}`} style={{ width: `${aiReadinessScore}%` }}></div></div>
                        </div>
                        <div className="p-4 md:px-6 min-w-[140px] flex flex-col justify-center bg-slate-50/50">
                            <div className="flex items-center gap-1.5 mb-2"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unified Support</span></div>
                            <div className="flex items-center gap-2 mb-1"><div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div><span className="text-sm font-bold text-slate-500">Not Active</span></div>
                            <div className="text-[9px] text-slate-400 font-medium">24/7 Coverage</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="sticky top-20 z-40 bg-slate-50/80 backdrop-blur-md py-2 -mx-4 px-4 flex justify-center">
                <div className="bg-white/80 p-1.5 rounded-2xl border border-slate-200 shadow-sm flex gap-1 overflow-x-auto">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button 
                                key={tab.id}
                                id={`tab-${tab.id}`}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                    isActive ? 'bg-[#004481] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <Icon size={14} /> {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="animate-in fade-in duration-500">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div id="strategic-summary" className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow lg:col-span-2">
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Strategic Summary</h4>
                                    <Sparkles size={14} className="text-[#004481]" />
                                </div>
                                <div className="text-sm text-slate-700 leading-relaxed">
                                    {data.companyName === 'Apex Data Corporation' ? (
                                        <>
                                            <span className="font-black text-[#004481]">Apex Data Corporation</span> is a Tier-1 Strategic Partner with deep expertise in <span className="font-bold">Data & AI</span>. 
                                            Currently leading the market in <span className="font-bold">Financial Services</span> cloud modernization. 
                                            Key focus is scaling <span className="font-bold">Generative AI</span> offerings via Amazon Bedrock.
                                        </>
                                    ) : (
                                        `Strategic assessment for ${data.companyName} based on current AWS alignment and technical capacity.`
                                    )}
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded border border-emerald-100">High Growth</span>
                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-100">AI Ready</span>
                                    <span className="px-2 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold rounded border border-purple-100">Strategic Tier</span>
                                </div>
                            </div>
                            <div id="revenue-metrics" className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3"><h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue Band (MRR)</h4><EditTrigger step={3} /></div>
                                <div className="text-2xl font-black text-slate-900">{data.monthlyResale}</div>
                                <div className="mt-2 text-xs font-medium text-emerald-600 flex items-center gap-1"><TrendingUp size={12} /> Target: {data.arrGrowthTarget} YoY</div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden"><div className="bg-emerald-500 h-full" style={{ width: data.monthlyResale.includes('200') ? '100%' : data.monthlyResale.includes('50') ? '60%' : '30%' }}></div></div>
                            </div>
                            <div id="ace-win-rate" className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3"><h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ACE Win Rate</h4><EditTrigger step={7} /></div>
                                <div className="text-2xl font-black text-slate-900">{data.aceWinRate ? `${data.aceWinRate}%` : 'N/A'}</div>
                                <div className="mt-2 text-xs font-medium text-slate-500">Avg Deal: <span className="text-slate-700 font-bold">{data.aceArrValue}</span></div>
                                <div className="flex gap-1 mt-3"><span className={`h-1.5 w-1/3 rounded-full ${parseInt(data.aceWinRate) > 20 ? 'bg-[#004481]' : 'bg-slate-200'}`}></span><span className={`h-1.5 w-1/3 rounded-full ${parseInt(data.aceWinRate) > 50 ? 'bg-[#004481]' : 'bg-slate-200'}`}></span><span className={`h-1.5 w-1/3 rounded-full ${parseInt(data.aceWinRate) > 80 ? 'bg-[#004481]' : 'bg-slate-200'}`}></span></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div id="public-sector" className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow lg:col-span-2">
                                <div className="flex justify-between items-start mb-3"><h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Public Sector</h4><EditTrigger step={2} /></div>
                                <div className="text-2xl font-black text-slate-900 mb-1">{data.publicSectorActive ? 'Active' : 'Inactive'}</div>
                                <div className="flex gap-2 mt-3 mb-3">
                                    {[{ key: 'Federal', label: 'FED' }, { key: 'Provincial', label: 'PROV' }, { key: 'Municipal', label: 'MUNI' }, { key: 'Education', label: 'EDU' }, { key: 'Health', label: 'HLTH' }].map(seg => {
                                        const isActive = data.publicSectorActive && data.publicSectorSegments.some(s => s.includes(seg.key));
                                        return (<div key={seg.key} className={`flex-1 h-8 rounded-lg flex items-center justify-center text-[9px] font-black border transition-all ${isActive ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>{seg.label}</div>);
                                    })}
                                </div>
                                <div className="bg-slate-50 rounded-lg p-2 flex items-center gap-2 border border-slate-100"><div className={`p-1 rounded-full ${data.publicSectorContracts ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-400'}`}>{data.publicSectorContracts ? <CheckCircle2 size={12} /> : <Lock size={12} />}</div><div className="flex-1"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Contract Vehicle</p><p className="text-xs font-bold text-slate-700 truncate max-w-[350px]">{data.publicSectorContracts || "None Verified"}</p></div></div>
                            </div>
                            <div id="references" className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow lg:col-span-2">
                                <div className="flex justify-between items-start mb-3"><h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">References & Case Studies</h4><EditTrigger step={7} /></div>
                                <div className="text-sm font-bold text-slate-800 line-clamp-3 leading-tight mb-4">{data.referenceDetails ? `"${data.referenceDetails}"` : 'No references provided'}</div>
                                <div className="flex items-center justify-between mt-auto">
                                    <button className="text-[10px] font-bold text-[#004481] uppercase tracking-wide hover:underline">View Evidence Portal</button>
                                    <span className="text-[10px] font-bold text-slate-400">Verified by Nimbus Cloud</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div id="practice-radar" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
                                 <div className="w-full flex justify-between items-start"><h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Practice Radar</h4><EditTrigger step={1} /></div>
                                 <div className="h-[250px] w-full" id="radar-chart"><ResponsiveContainer width="100%" height="100%"><RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}><PolarGrid stroke="#e2e8f0" /><PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 10, fontWeight: '700'}} /><PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} /><Radar name="Score" dataKey="A" stroke="#004481" strokeWidth={3} fill="#004481" fillOpacity={0.15} /><Tooltip /></RadarChart></ResponsiveContainer></div>
                            </div>
                            <div id="technical-dna" className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-center mb-6"><h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Database size={14} /> Technical DNA</h4><EditTrigger step={4} /></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div><div className="flex items-end gap-2 mb-1"><span className="text-4xl font-black text-slate-900">{getAwsHeadcount(data)}</span><span className="text-sm font-bold text-slate-500 mb-1.5">Engineers</span></div><p className="text-xs text-slate-400">Total AWS Technical Headcount</p><div className="mt-6 space-y-3"><div className="flex justify-between text-xs"><span className="text-slate-600">Sales vs Tech Ratio</span><span className="font-bold text-slate-900">{parseInt(data.teamSizeSales) > 0 ? `1 : ${Math.round((parseInt(data.teamSizeTech) || 1) / (parseInt(data.teamSizeSales) || 1))}` : 'N/A'}</span></div><div className="flex justify-between text-xs"><span className="text-slate-600">Pro Cert Density</span><span className="font-bold text-slate-900">{((parseInt(data.certCount.pro_sa) + parseInt(data.certCount.pro_devops)) / (parseInt(data.teamSizeTech) || 1) * 100).toFixed(0)}%</span></div></div></div>
                                    <div className="h-[180px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={certData} layout="vertical" barSize={12}><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10, fill: '#64748b', fontWeight: 600}} axisLine={false} tickLine={false} /><Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} /><Bar dataKey="count" radius={[0, 4, 4, 0]}>{certData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Bar></BarChart></ResponsiveContainer></div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div id="delivery-engine" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-center mb-6"><h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Zap size={14} /> Delivery Engine</h4><EditTrigger step={5} /></div>
                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4"><div className="flex items-center gap-2 mb-3"><Cloud size={16} className="text-blue-600" /><span className="text-xs font-bold text-slate-700 uppercase tracking-wider">MAP Maturity Journey</span></div><div className="relative pt-2 pb-1 px-1"><div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 rounded-full z-0"></div><div className="relative z-10 flex justify-between">{['Assess', 'Mobilize', 'Migrate'].map((phase, idx) => { const isDone = data.mapPhasesDelivered.some(d => d.includes(phase)); return (<div key={phase} className="flex flex-col items-center gap-2"><div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${isDone ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-300 text-slate-300'}`}>{isDone ? <CheckCircle2 size={14} /> : <span className="text-[10px] font-bold">{idx + 1}</span>}</div><span className={`text-[10px] font-bold uppercase ${isDone ? 'text-blue-700' : 'text-slate-400'}`}>{phase}</span></div>) })}</div></div></div>
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"><div className="flex items-center gap-3"><div className="p-2 bg-white rounded-lg shadow-sm"><FileText size={16} className="text-indigo-500"/></div><div><div className="text-xs font-bold text-slate-700">Assessments (OLA)</div><div className="text-[10px] text-slate-400">{data.deliversAssessments}</div></div></div>{data.deliversAssessments.includes('in-house') ? <CheckCircle2 size={18} className="text-emerald-500"/> : <ArrowRight size={18} className="text-slate-300"/>}</div>
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"><div className="flex items-center gap-3"><div className="p-2 bg-white rounded-lg shadow-sm"><Infinity size={16} className="text-cyan-500"/></div><div><div className="text-xs font-bold text-slate-700">IaC Adoption</div><div className="text-[10px] text-slate-400">{data.iacExperience}</div></div></div>{data.iacExperience === 'Yes' ? <CheckCircle2 size={18} className="text-emerald-500"/> : <Target size={18} className="text-amber-500"/>}</div>
                                </div>
                            </div>
                            <div id="ai-maturity" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full mix-blend-multiply filter blur-2xl opacity-50"></div>
                                <div className="flex justify-between items-center mb-4 relative z-10"><h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Sparkles size={14} className="text-purple-500" /> AI Maturity Matrix</h4><EditTrigger step={6} /></div>
                                <div className="relative z-10">
                                    {Object.keys(data.aiReadinessMatrix).length === 0 ? (
                                        <div className="text-center py-8 text-slate-400 text-sm">No AI capability data provided.</div>
                                    ) : (
                                        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 scrollbar-thin">
                                            {Object.entries(data.aiReadinessMatrix).map(([key, val]) => (
                                                (val as number) > 0 && (
                                                    <div key={key} className="flex items-center justify-between text-xs">
                                                        <span className="text-slate-600 truncate max-w-[200px]" title={key}>{key.replace('[Use case] ', '').replace('[Service] ', '')}</span>
                                                        <div className="flex gap-1">
                                                            {[1,2,3,4,5].map(v => (
                                                                <div key={v} className={`w-6 h-1.5 rounded-sm ${v <= (val as number) ? 'bg-purple-500' : 'bg-slate-100'}`}></div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    )}
                                    {data.aiOffersDescription && (
                                        <div className="mt-4 p-3 bg-purple-50 rounded-xl border border-purple-100">
                                            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Strategic AI Offer</p>
                                            <p className="text-xs text-purple-900 leading-tight">{data.aiOffersDescription}</p>
                                        </div>
                                    )}
                                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-500">GenAI Solutions:</span>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${data.buildsAiSolutions.includes('Yes') ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>{data.buildsAiSolutions.includes('production') ? 'Production' : data.buildsAiSolutions.includes('POC') ? 'POC' : 'None'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="gtm-engine" className="bg-[#004481] rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden text-white">
                            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500 rounded-full mix-blend-overlay filter blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/4"></div>
                            <div className="relative z-10 flex flex-col lg:flex-row gap-8">
                                <div className="flex-1">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6"><div><h3 className="text-2xl font-black tracking-tight flex items-center gap-3"><Target className="text-[#FF9900]" /> Nimbus Cloud GTM Engine</h3><p className="text-blue-200 text-sm mt-1">Accelerate your AWS growth with funded programs and co-sell motions.</p></div></div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl hover:bg-white/20 transition-colors"><div className="flex justify-between items-start mb-3"><Cloud className="text-blue-300" size={24} /><div className={`w-2 h-2 rounded-full ${data.mapPhasesDelivered.length >= 2 ? 'bg-emerald-400' : 'bg-red-400'}`}></div></div><h4 className="font-bold text-lg mb-1">Migration (MAP)</h4><p className="text-xs text-blue-200/80 mb-4 h-8 line-clamp-2">{data.mapPhasesDelivered.length < 2 ? "Unlock funding by certifying in Assess/Mobilize." : "Ready for large-scale migration funding."}</p><button className="text-xs font-bold uppercase tracking-widest text-[#FF9900] hover:text-white transition-colors">View Program</button></div>
                                        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl hover:bg-white/20 transition-colors"><div className="flex justify-between items-start mb-3"><FileText className="text-indigo-300" size={24} /><div className={`w-2 h-2 rounded-full ${data.deliversAssessments.includes('in-house') ? 'bg-emerald-400' : 'bg-amber-400'}`}></div></div><h4 className="font-bold text-lg mb-1">Assessments (OLA)</h4><p className="text-xs text-blue-200/80 mb-4 h-8 line-clamp-2">{!data.deliversAssessments.includes('in-house') ? "Leverage Nimbus Cloud's white-label CVA service." : "Scale your assessment practice with OLA funding."}</p><button className="text-xs font-bold uppercase tracking-widest text-[#FF9900] hover:text-white transition-colors">Request CVA</button></div>
                                        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl hover:bg-white/20 transition-colors"><div className="flex justify-between items-start mb-3"><Shield className="text-purple-300" size={24} /><div className={`w-2 h-2 rounded-full ${data.enrolledPrograms.includes('Well-Architected') ? 'bg-emerald-400' : 'bg-slate-400'}`}></div></div><h4 className="font-bold text-lg mb-1">Well-Architected</h4><p className="text-xs text-blue-200/80 mb-4 h-8 line-clamp-2">Reduce churn and drive consumption. $5k credits per review.</p><button className="text-xs font-bold uppercase tracking-widest text-[#FF9900] hover:text-white transition-colors">Start Review</button></div>
                                        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl hover:bg-white/20 transition-colors"><div className="flex justify-between items-start mb-3"><Rocket className="text-emerald-300" size={24} /><div className={`w-2 h-2 rounded-full ${data.interestedInMdf === 'Yes' ? 'bg-emerald-400' : 'bg-slate-400'}`}></div></div><h4 className="font-bold text-lg mb-1">MDF & Campaigns</h4><p className="text-xs text-blue-200/80 mb-4 h-8 line-clamp-2">{parseInt(data.aceWinRate) > 20 ? "Qualified for co-funded campaigns." : "Improve win-rate to unlock MDF."}</p><button className="text-xs font-bold uppercase tracking-widest text-[#FF9900] hover:text-white transition-colors">Plan Campaign</button></div>
                                    </div>
                                </div>
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 lg:w-96 flex-shrink-0"><h4 className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-4">Recommended Next Actions</h4><div className="space-y-3">{priorityActions.map((action, i) => (<div key={i} className="flex items-center gap-4 bg-white/10 p-3 rounded-xl border border-white/5 hover:bg-white/20 transition-colors"><div className="w-10 h-10 rounded-full bg-[#FF9900] text-[#004481] flex-shrink-0 flex items-center justify-center font-black text-lg shadow-lg">{i+1}</div><div><div className="text-sm font-bold text-white">{action.title}</div><div className="text-xs text-blue-100/80">{action.desc}</div></div></div>))}</div></div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'opportunities' && (
                    <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-5 duration-500">
                        <div className="text-center">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Assigned Opportunities</h2>
                            <p className="text-slate-500 mt-2">Manage leads distributed by Nimbus Cloud.</p>
                        </div>

                        {localOpportunities.length === 0 ? (
                            <div className="bg-white p-12 rounded-[2rem] border-2 border-dashed border-slate-200 text-center">
                                <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Layers size={40} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-600">No Opportunities Yet</h3>
                                <p className="text-slate-400 text-sm mt-1">When Nimbus Cloud distributes a lead to you, it will appear here.</p>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {localOpportunities.map((opp, i) => (
                                    <div key={i} className={`bg-white p-6 rounded-2xl border transition-all hover:shadow-lg ${opp.stage === 'Closed Won' ? 'border-green-200 bg-green-50/10' : 'border-slate-200'}`}>
                                        <div className="flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 border border-slate-200">
                                                        {opp.customerSegment}
                                                    </span>
                                                    <span className="text-slate-300 text-xs">•</span>
                                                    <span className="text-xs text-slate-400">{new Date(opp.dateCreated).toLocaleDateString()}</span>
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-800">{opp.title}</h3>
                                                <div className="text-sm text-slate-500 mt-1 max-w-2xl">{opp.description}</div>
                                                
                                                {opp.contact && (
                                                    <div className="mt-3 text-xs text-slate-500 flex items-center gap-2">
                                                        <span className="bg-slate-100 px-2 py-1 rounded">
                                                            {opp.contact.name} ({opp.contact.email})
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col items-end gap-1 min-w-[150px]">
                                                <div className="text-2xl font-black text-slate-900">${opp.estArr.toLocaleString()}</div>
                                                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Est. Value</div>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-6 border-t border-slate-100">
                                            {editingOpp === opp.id ? (
                                                <div className="bg-slate-50 p-4 rounded-xl animate-in fade-in">
                                                    <div className="flex gap-4 mb-4">
                                                        <div className="flex-1">
                                                            <label className="text-xs font-bold text-slate-500 uppercase">Stage</label>
                                                            <select 
                                                                className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-sm"
                                                                value={editForm.stage}
                                                                onChange={e => setEditForm({...editForm, stage: e.target.value as OpportunityStage})}
                                                            >
                                                                <option value="New">New</option>
                                                                <option value="Qualifying">Qualifying</option>
                                                                <option value="Technical Validation">Technical Validation</option>
                                                                <option value="Proposal">Proposal</option>
                                                                <option value="Negotiation">Negotiation</option>
                                                                <option value="Closed Won">Closed Won</option>
                                                                <option value="Closed Lost">Closed Lost</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="mb-4">
                                                        <label className="text-xs font-bold text-slate-500 uppercase">Activity Log / Note</label>
                                                        <input 
                                                            type="text" 
                                                            className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-sm"
                                                            placeholder="e.g. Completed initial discovery call..."
                                                            value={editForm.note}
                                                            onChange={e => setEditForm({...editForm, note: e.target.value})}
                                                        />
                                                    </div>
                                                    <div className="flex gap-2 justify-end">
                                                        <button onClick={() => setEditingOpp(null)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-white rounded">Cancel</button>
                                                        <button onClick={() => saveOppUpdate(opp.id)} className="px-3 py-1.5 text-xs font-bold bg-[#004481] text-white rounded hover:bg-blue-900 flex items-center gap-1">
                                                            <Save size={14} /> Save Update
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                         <div className={`w-3 h-3 rounded-full ${
                                                             opp.stage === 'New' ? 'bg-blue-500 animate-pulse' :
                                                             opp.stage === 'Closed Won' ? 'bg-green-500' :
                                                             opp.stage === 'Closed Lost' ? 'bg-red-500' :
                                                             'bg-indigo-500'
                                                         }`}></div>
                                                         <span className="text-sm font-bold text-slate-700">{opp.stage}</span>
                                                         {opp.history.length > 0 && (
                                                             <span className="text-xs text-slate-400 ml-2 italic">Last: {opp.history[0].action}</span>
                                                         )}
                                                    </div>
                                                    
                                                    {!readOnly && (
                                                        <button 
                                                            onClick={() => startEditOpp(opp)}
                                                            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 flex items-center gap-2"
                                                        >
                                                            Update Status <ArrowRight size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'funding' && (
                    <div className="bg-white p-8 lg:p-12 rounded-[3rem] shadow-xl border border-slate-200 animate-in slide-in-from-bottom-5 duration-500 max-w-5xl mx-auto">
                        <div className="text-center mb-10">
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner"><DollarSign size={40} /></div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Program Funding Calculator</h2>
                            <p className="text-slate-500 text-lg">Estimate potential Nimbus Cloud & AWS funding based on your practice maturity.</p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Calculator size={20} className="text-[#004481]" /> Project Parameters</h3>
                                    <div className="space-y-5">
                                        <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Workload Type</label><select id="funding-workload" className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#004481]" value={fundingInputs.workload} onChange={(e) => setFundingInputs({...fundingInputs, workload: e.target.value})}><option value="migration">Migration (MAP)</option><option value="modernization">Modernization</option><option value="ai">AI & Machine Learning</option><option value="assessment">Assessment (OLA)</option></select></div>
                                        <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Est. Year 1 ARR ($)</label><input id="funding-arr" type="number" className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#004481]" value={fundingInputs.arr} onChange={(e) => setFundingInputs({...fundingInputs, arr: parseInt(e.target.value) || 0})} /></div>
                                        <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Professional Services Fees ($)</label><input id="funding-ps" type="number" className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#004481]" value={fundingInputs.psFees} onChange={(e) => setFundingInputs({...fundingInputs, psFees: parseInt(e.target.value) || 0})} /></div>
                                    </div>
                                </div>
                                <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                                    <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide">Program Eligibility</h3>
                                    <div className="space-y-3"><div className="flex justify-between items-center text-sm"><span className="text-slate-600">Track Status ({accountType})</span><span className="font-bold text-[#004481]">Qualified</span></div><div className="flex justify-between items-center text-sm"><span className="text-slate-600">Competency Alignment</span>{fundingCalculations.hasCompetency ? (<span className="flex items-center gap-1 font-bold text-emerald-600"><CheckCircle2 size={14} /> Aligned</span>) : (<span className="flex items-center gap-1 font-bold text-amber-600"><XCircle size={14} /> Missing</span>)}</div></div>
                                </div>
                            </div>
                            <div className="bg-[#004481] text-white p-8 rounded-3xl relative overflow-hidden shadow-2xl flex flex-col justify-between">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-overlay filter blur-[80px] opacity-40"></div>
                                <div className="relative z-10">
                                    <h3 className="text-blue-200 text-sm font-bold uppercase tracking-widest mb-1">Total Estimated Funding</h3>
                                    <div className="text-5xl font-black tracking-tight mb-8">${fundingCalculations.total.toLocaleString()}</div>
                                    <div className="space-y-4">{fundingCalculations.breakdown.map((item, i) => (<div key={i} className="flex items-center justify-between p-4 bg-white/10 rounded-2xl border border-white/5"><div><div className="font-bold">{item.name}</div><div className="text-xs text-blue-200 uppercase tracking-wide">{item.type}</div></div><div className="font-bold text-xl">${item.amount.toLocaleString()}</div></div>))}</div>
                                </div>
                                <div className="relative z-10 mt-8 pt-6 border-t border-white/10 text-xs text-blue-200/60 leading-relaxed">*Estimates are for planning purposes only. Funding is subject to AWS approval and program terms. "Cash" typically refers to Nimbus Cloud credits or rebate pass-through.</div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'chat' && (
                    <div className="animate-in slide-in-from-bottom-5 duration-500">
                        <ChatBot ref={chatBotRef} partnerData={data} />
                    </div>
                )}

                {activeTab === 'matcher' && (
                    <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-200 animate-in slide-in-from-bottom-5 duration-500 max-w-4xl mx-auto text-center">
                        <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <Target size={40} />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">GTM Matcher</h2>
                        <p className="text-slate-500 text-lg max-w-xl mx-auto mb-10">
                            Test your capability alignment by pasting an active opportunity description below.
                        </p>
                        
                        <div className="space-y-6 text-left">
                            <textarea
                                className="w-full h-40 p-6 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none resize-none text-base font-medium transition-all"
                                placeholder="e.g. Need a partner in Ontario for a complex migration of SAP workloads to AWS. Customer is in the Public Sector."
                                value={opportunityInput}
                                onChange={(e) => setOpportunityInput(e.target.value)}
                            />
                            
                            <button 
                                onClick={handleMatch}
                                disabled={matching || !opportunityInput}
                                className="w-full py-5 bg-[#004481] text-white font-black uppercase tracking-widest rounded-[2rem] hover:bg-blue-900 shadow-xl shadow-blue-900/20 disabled:opacity-50 transition-all active:scale-[0.98]"
                            >
                                {matching ? "Analyzing Capability Match..." : "Check Alignment"}
                            </button>

                            {matchResult && (
                                <div className={`mt-8 p-10 rounded-[2.5rem] border-2 animate-in zoom-in-95 duration-500 ${matchResult.score > 70 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Alignment Score</span>
                                        <span className={`text-4xl font-black ${matchResult.score > 70 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {matchResult.score}%
                                        </span>
                                    </div>
                                    <p className="text-slate-700 text-lg leading-relaxed font-medium">
                                        {matchResult.reason}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {!readOnly && onReset && (
                <div className="text-center pt-12">
                     <button onClick={onReset} className="text-xs font-bold text-slate-400 hover:text-red-500 underline uppercase tracking-widest transition-colors">Terminate Data & Recalculate Scorecard</button>
                </div>
            )}
        </div>
    );
});

export default Dashboard;
