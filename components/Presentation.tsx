import React, { useState, useEffect, useRef } from 'react';
import { 
    X, 
    Sparkles, 
    Layout, 
    Shield, 
    Zap, 
    Database,
    Globe,
    Target,
    TrendingUp,
    ArrowRight, 
    Mic,
    RotateCcw,
    Play,
    ChevronRight,
    ChevronLeft,
    FileText,
    PieChart,
    DollarSign,
    Brain,
    Briefcase,
    Settings,
    BarChart3
} from 'lucide-react';
import Dashboard, { DashboardHandle } from './Dashboard';
import AdminDashboard, { AdminDashboardHandle } from './AdminDashboard';
import { PartnerData, INITIAL_PARTNER_DATA, PartnerTrack } from '../types';
import DemoCopilot, { DemoStep } from './DemoCopilot';
import AIUnderTheHood from './AIUnderTheHood';
import { DemoNavigation, DemoSection } from './DemoNavigation';

// --- MOCK DATA ---
const DEMO_PARTNER: PartnerData = {
    ...INITIAL_PARTNER_DATA,
    companyName: "Apex Data Corporation",
    website: "apexdata.example.com",
    contactName: "Morgan Reed",
    email: "morgan.reed@apexdata.example.com",
    roleTitle: "VP, Cloud & AI Strategy",
    roleCategory: "Sales Leader",
    hqProvince: ["Ontario (ON)"],
    sellToProvinces: ["Ontario (ON)", "Quebec (QC)", "Alberta (AB)", "British Columbia (BC)"],
    sellToUSA: true,
    segmentFocus: "Enterprise",
    businessModel: ["Consultancy", "SI / GSI", "Born-in-Cloud"],
    industryVerticals: ["Financial Services (FSI)", "Retail", "Manufacturing", "Healthcare", "Public Sector"],
    publicSectorActive: true,
    publicSectorSegments: ["Federal Govt", "Provincial Govt", "Higher Ed", "Healthcare - Hospitals"],
    publicSectorContracts: "Shared Services Canada (SSC) Framework, Ontario Vendor of Record (VOR)",
    enrolledPrograms: ["Think Big for Small Business", "Well‑Architected Partner", "ISV Accelerate"],
    competencies: ["Data & Analytics", "Migration", "Machine Learning", "Financial Services", "Generative AI"],
    sdpStatus: ["Redshift", "Glue", "SageMaker", "Lake Formation", "Bedrock"],
    pursuingResale: "Yes",
    monthlyResale: ">$200k",
    arrGrowthTarget: "50%+",
    teamSizeTech: "11-50",
    awsTeamSize: 42,
    teamSizeSales: "5-10",
    headcount: {
        sa: "12",
        delivery: "20",
        dataAi: "15",
        finOps: "5",
        pm: "8"
    },
    certCount: {
        practitioner: "25",
        associate_sa: "18",
        associate_dev: "12",
        associate_sysops: "8",
        pro_sa: "14",
        pro_devops: "10",
        specialty_security: "6",
        specialty_data: "12",
        specialty_ml: "8",
        specialty_db: "5",
        specialty_net: "4",
        specialty_sap: "2"
    },
    iacExperience: "Yes",
    deliversAssessments: "Yes, in-house (OLA/CVA)",
    mapFamiliarity: 95,
    mapPhasesDelivered: ["Assess", "Mobilize", "Migrate"],
    distributorPsValue: 8,
    buildsAiSolutions: "Yes, in production",
    aiReadinessMatrix: {
        "[Use case] RAG on enterprise data": 5,
        "[Use case] Contact Center AI": 4,
        "[Use case] Copilots / chatbots": 5,
        "[Use case] Document understanding": 4,
        "[Use case] Anomaly / fraud detection": 5,
        "[Service] Amazon Bedrock": 5,
        "[Service] Amazon SageMaker": 5,
        "[Service] Amazon Kendra / OpenSearch": 4,
        "[Model] Foundation models via Bedrock": 5,
        "[Model] Fine-tuning on SageMaker": 4
    },
    aiOffersDescription: "Apex's 'AI Launchpad' provides a 4-week rapid prototype for Generative AI use cases, leveraging RAG and Amazon Bedrock.",
    aiGtmInterest: "Yes — ready to scale",
    provideReferences: true,
    referenceDetails: "Successfully migrated 2PB of financial data for a major financial institution, implementing a real-time fraud detection engine using SageMaker and Kinesis, resulting in a 30% reduction in false positives.",
    aceWinRate: "78",
    aceArrValue: "$1.2M",
    demandGenRoutes: ["Webinars", "Executive Roundtables", "AWS Co-selling"],
    aceUsageMaturity: "High",
    hasSca: true,
    hasPackagedOffers: true,
    packagedOffersDetails: "Cloud Data Migration Accelerator, GenAI Readiness Assessment",
    managedServicesMaturity: 8,
    interestedIn24x7Support: true,
    interestedInMdf: "Yes",
    gtmActivities: ["Joint Webinars", "Case Study Development", "Marketplace Listing"],
    enablementNeeds: ["Advanced Bedrock Training", "Public Sector GTM Strategy"],
    primaryBusinessContact: { name: "Morgan Reed", email: "morgan.reed@apexdata.example.com" },
    primaryTechContact: { name: "Casey Lin", email: "casey.lin@apexdata.example.com" },
    calculatedTrack: PartnerTrack.TRACK_C,
    scores: { capability: 94, capacity: 90, growth: 96, ai: 88 },
    opportunities: [
        {
            id: 'opp-1',
            title: 'Enterprise Data Lake Migration',
            customerSegment: 'Financial Services',
            description: 'Modernizing legacy on-prem Hadoop cluster to AWS S3/Glue.',
            estArr: 450000,
            stage: 'Proposal',
            status: 'Active',
            probability: 75,
            source: 'Lead Form',
            dateCreated: '2025-02-15',
            dateLastUpdated: '2025-03-01',
            history: []
        },
        {
            id: 'opp-2',
            title: 'GenAI Customer Support Bot',
            customerSegment: 'Retail',
            description: 'Implementing RAG-based chatbot using Amazon Bedrock.',
            estArr: 120000,
            stage: 'Technical Validation',
            status: 'Active',
            probability: 60,
            source: 'Manual',
            dateCreated: '2025-02-20',
            dateLastUpdated: '2025-03-05',
            history: []
        }
    ]
};

// --- TYPES ---
type ViewType = 
    | 'cover' 
    | 'problem' 
    | 'arch' 
    | 'impact' 
    | 'dashboard' 
    | 'admin_dashboard';

// --- DEMO SCRIPT ---
const DEMO_SCRIPT: DemoStep[] = [
    // 1. VISION & STRATEGY
    {
        id: 'intro',
        title: 'Vision',
        script: "Good morning. We are shifting from a transactional distributor to a platform-first technology partner. This is the new AWS Ecosystem Portal.",
        action: 'read',
        section: 'vision',
        view: 'cover'
    },
    {
        id: 'problem',
        title: 'The Challenge',
        script: "Today, our PDMs manage partners via spreadsheets. It's unscalable. We miss millions in AWS funding because partners don't know they qualify.",
        action: 'read',
        section: 'vision',
        view: 'problem'
    },
    {
        id: 'arch',
        title: 'Architecture',
        script: "Our new architecture leverages a multi-source data fabric, AI Engine for intelligence, and an orchestration engine for automated actions.",
        action: 'read',
        section: 'vision',
        view: 'arch'
    },

    // 2. PARTNER EXPERIENCE - DASHBOARD OVERVIEW
    {
        id: 'partner-intro',
        title: 'Partner Experience',
        script: "Let's log in as Morgan from Apex Data Corporation. They're a Strategic Partner focused on Data & AI. This is their single source of truth.",
        action: 'read',
        section: 'partner',
        view: 'dashboard',
        context: { tab: 'overview' }
    },
    {
        id: 'scorecard-header',
        title: 'Propensity & Readiness Scores',
        script: "At the top, we see core health metrics. Resell and Service Propensity indicate likelihood to transact and deliver. AI Readiness shows maturity in GenAI. These scores are critical for Nimbus Cloud to understand where to invest resources.",
        targetId: 'scorecard-header',
        action: 'read',
        section: 'partner',
        view: 'dashboard',
        context: { tab: 'overview' }
    },
    {
        id: 'strategic-summary',
        title: 'Strategic Summary',
        script: "The Strategic Summary provides a high-level, AI-generated overview of the partner's focus areas, like Data & AI and Financial Services. It instantly grounds our PDMs in the partner's core business.",
        targetId: 'strategic-summary',
        action: 'read',
        section: 'partner',
        view: 'dashboard',
        context: { tab: 'overview' }
    },
    {
        id: 'revenue-metrics',
        title: 'Revenue Band (MRR)',
        script: "Here we track their Monthly Recurring Revenue and YoY growth target. This is essential for forecasting and ensuring they are on track to meet their tier requirements.",
        targetId: 'revenue-metrics',
        action: 'read',
        section: 'partner',
        view: 'dashboard',
        context: { tab: 'overview' }
    },
    {
        id: 'ace-win-rate',
        title: 'ACE Win Rate',
        script: "The ACE Win Rate and Average Deal Size show their effectiveness in co-selling with AWS. A high win rate indicates a strong, mature sales motion that we should accelerate.",
        targetId: 'ace-win-rate',
        action: 'read',
        section: 'partner',
        view: 'dashboard',
        context: { tab: 'overview' }
    },
    {
        id: 'public-sector',
        title: 'Public Sector Footprint',
        script: "This section details their Public Sector activity and contract vehicles. Knowing they have an active SSC Framework contract allows us to route specific government opportunities to them.",
        targetId: 'public-sector',
        action: 'read',
        section: 'partner',
        view: 'dashboard',
        context: { tab: 'overview' }
    },
    {
        id: 'references',
        title: 'References & Case Studies',
        script: "Verified references are crucial for building trust. We track their key wins, like this 2PB migration for a Canadian Bank, to prove their capability to end-customers.",
        targetId: 'references',
        action: 'read',
        section: 'partner',
        view: 'dashboard',
        context: { tab: 'overview' }
    },
    {
        id: 'practice-radar',
        title: 'Practice Radar',
        script: "The Practice Radar visualizes their balanced scorecard across Sales, Capacity, Growth, AI Readiness, and Delivery. It immediately highlights strengths and areas needing development.",
        targetId: 'practice-radar',
        action: 'read',
        section: 'partner',
        view: 'dashboard',
        context: { tab: 'overview' }
    },
    {
        id: 'technical-dna',
        title: 'Technical DNA',
        script: "Technical DNA breaks down their engineering headcount and certification density. A high Pro Cert Density is a strong indicator of their ability to handle complex, high-value workloads.",
        targetId: 'technical-dna',
        action: 'read',
        section: 'partner',
        view: 'dashboard',
        context: { tab: 'overview' }
    },
    {
        id: 'delivery-engine',
        title: 'Delivery Engine',
        script: "This tracks their maturity in specific AWS programs like MAP (Migration Acceleration Program) and OLA (Optimization and Licensing Assessment). It shows if they can execute funded engagements.",
        targetId: 'delivery-engine',
        action: 'read',
        section: 'partner',
        view: 'dashboard',
        context: { tab: 'overview' }
    },
    {
        id: 'ai-maturity',
        title: 'AI Maturity Matrix',
        script: "The AI Maturity Matrix details their specific capabilities in Generative AI, from RAG pipelines to Amazon Bedrock. This is vital for matching them with the surge in AI-related customer demand.",
        targetId: 'ai-maturity',
        action: 'read',
        section: 'partner',
        view: 'dashboard',
        context: { tab: 'overview' }
    },
    {
        id: 'gtm-engine',
        title: 'Nimbus Cloud GTM Engine',
        script: "Finally, the GTM Engine recommends next best actions and programs based on their scorecard. It automatically suggests funding they qualify for, turning insights into immediate revenue opportunities.",
        targetId: 'gtm-engine',
        action: 'read',
        section: 'partner',
        view: 'dashboard',
        context: { tab: 'overview' }
    },

    // 4. FUNDING & OPPORTUNITIES
    {
        id: 'funding',
        title: 'Funding Opportunity',
        script: "She checks the Funding tab. We automatically calculate that she's leaving $45k on the table in MAP funding because she hasn't claimed her credits.",
        targetId: 'funding-input',
        action: 'click',
        section: 'partner',
        view: 'dashboard',
        context: { tab: 'funding' }
    },
    {
        id: 'opportunities',
        title: 'Pipeline Health',
        script: "In Opportunities, she sees 42 active deals. The AI predicts 3 are at risk of stalling. This is proactive pipeline management.",
        targetId: 'opportunities-tab',
        action: 'click',
        section: 'partner',
        view: 'dashboard',
        context: { tab: 'opportunities' }
    },

    // 5. AI CONSULTANT
    {
        id: 'ai-consultant',
        title: 'AI Consultant',
        script: "She doesn't know how to close the AI gap. She asks the AI Consultant for a specific plan.",
        targetId: 'chat-input',
        action: 'type',
        section: 'partner',
        view: 'dashboard',
        context: { tab: 'chat' },
        autoAction: async () => {
            // This will be handled by the component's auto-runner
        }
    },
    {
        id: 'ai-analysis',
        title: 'AI Analysis',
        script: "Under the hood, the AI Engine is analyzing her specific scorecard data against the AWS program guide to generate a tailored recommendation.",
        action: 'read',
        section: 'partner',
        view: 'dashboard',
        context: { tab: 'chat' }
    },

    // 6. ADMIN ORCHESTRATION
    {
        id: 'admin-switch',
        title: 'Admin View',
        script: "Now, let's switch hats. I'm the Nimbus Admin. I see the entire ecosystem health in real-time.",
        targetId: 'admin-portfolio-tab',
        action: 'click',
        section: 'admin',
        view: 'admin_dashboard',
        context: { tab: 'portfolio' }
    },
    {
        id: 'admin-metrics',
        title: 'Ecosystem Metrics',
        script: "At the top, we have a macro view of the ecosystem health. We track total active partners, average resell propensity, and technical focus distribution. This tells us if we have the right mix of partners to meet market demand.",
        targetId: 'admin-metrics',
        action: 'read',
        section: 'admin',
        view: 'admin_dashboard',
        context: { tab: 'portfolio' }
    },
    {
        id: 'admin-partner-list',
        title: 'Partner Portfolio',
        script: "The Partner Table provides a consolidated view of all accounts. We can see their tier, technical focus, and vertical expertise at a glance. This allows PDMs to quickly identify partners for specific campaigns or interventions.",
        targetId: 'admin-partner-list',
        action: 'read',
        section: 'admin',
        view: 'admin_dashboard',
        context: { tab: 'portfolio' }
    },
    {
        id: 'import',
        title: 'Lead Ingestion',
        script: "We just received a messy CSV of leads from AWS. Watch how fast we ingest this.",
        targetId: 'admin-import-tab',
        action: 'click',
        section: 'admin',
        view: 'admin_dashboard',
        context: { tab: 'import' }
    },
    {
        id: 'bulk-ingest',
        title: 'Intelligent Ingestion',
        script: "With one click, we trigger an intelligent ingestion workflow. The AI Engine parses the raw data, identifies customers, and prepares them for matching.",
        targetId: 'admin-demo-bulk-workflow',
        action: 'click',
        section: 'admin',
        view: 'admin_dashboard',
        context: { tab: 'import' }
    },
    {
        id: 'matcher',
        title: 'AI Matcher',
        script: "The system has automatically transitioned to the AI Matcher. It's now evaluating competencies, past performance, and vendor certifications to find the perfect partner for each lead.",
        action: 'read',
        section: 'admin',
        view: 'admin_dashboard',
        context: { tab: 'matcher' }
    },

    // 7. BUSINESS IMPACT
    {
        id: 'impact',
        title: 'Business Impact',
        script: "This system is projected to drive $2.5M in net-new funding in Q3 alone. We are ready to scale.",
        action: 'read',
        section: 'impact',
        view: 'impact'
    }
];

export default function Presentation({ onClose }: { onClose: () => void }) {
    // State
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [view, setView] = useState<ViewType>('cover');
    const [activeSection, setActiveSection] = useState<DemoSection>('vision');
    const [dashboardContext, setDashboardContext] = useState<any>({});
    const [showAIUnderTheHood, setShowAIUnderTheHood] = useState(false);
    const [currentMatchScore, setCurrentMatchScore] = useState<number | undefined>(undefined);

    // Refs
    const dashboardRef = useRef<DashboardHandle>(null);
    const adminDashboardRef = useRef<AdminDashboardHandle>(null);

    const currentStep = DEMO_SCRIPT[currentStepIndex];

    // --- EFFECT: SYNC VIEW WITH STEP ---
    useEffect(() => {
        const step = DEMO_SCRIPT[currentStepIndex];
        
        // Reset AI Panel — disabled for clean executive demo
        setShowAIUnderTheHood(false);

        if (step.view) setView(step.view as ViewType);
        if (step.section) setActiveSection(step.section as DemoSection);
        if (step.context) setDashboardContext(step.context);

    }, [currentStepIndex]);

    // --- EFFECT: SYNC TABS ---
    useEffect(() => {
        if (view === 'dashboard' && dashboardContext.tab) {
            // Small timeout to allow mount
            setTimeout(() => dashboardRef.current?.setActiveTab(dashboardContext.tab), 50);
        }
        if (view === 'admin_dashboard' && dashboardContext.tab) {
            setTimeout(() => adminDashboardRef.current?.setActiveTab(dashboardContext.tab), 50);
        }
    }, [view, dashboardContext]);

    // --- HANDLERS ---
    const handleNext = () => {
        if (currentStepIndex < DEMO_SCRIPT.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        }
    };

    const handleNavigate = (section: DemoSection, newView: string, context?: any) => {
        // Try to find a matching step in the script
        const stepIndex = DEMO_SCRIPT.findIndex(step => {
            if (step.section !== section) return false;
            if (step.view !== newView) return false;
            
            // Check context (specifically tab)
            if (context && step.context) {
                return context.tab === step.context.tab;
            }
            // If one has context and other doesn't, treat as mismatch unless context is empty
            if (context && !step.context) return false;
            if (!context && step.context) return false;
            
            return true;
        });

        if (stepIndex !== -1) {
            setCurrentStepIndex(stepIndex);
        } else {
            // Fallback: Manual navigation if no script step matches
            setActiveSection(section);
            setView(newView as ViewType);
            if (context) {
                setDashboardContext(context);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950 z-[100] flex text-white overflow-hidden font-sans">
            
            {/* LEFT: STAGE (75%) */}
            <div className="w-3/4 relative flex flex-col bg-slate-50 overflow-hidden border-r border-slate-800">
                
                {/* STATIC SLIDES */}
                {view === 'cover' && (
                    <div className="relative w-full h-full overflow-hidden">
                        {/* Background Image */}
                        <div 
                            className="absolute inset-0 bg-cover bg-center z-0 scale-105 animate-in fade-in duration-1000"
                            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop")' }}
                        >
                            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
                        </div>

                        {/* Content */}
                        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-12">
                            <div className="animate-in slide-in-from-bottom-10 fade-in duration-1000 delay-300">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 font-mono text-sm mb-8 backdrop-blur-md">
                                    <Sparkles size={14} />
                                    <span>EXECUTIVE PREVIEW</span>
                                </div>
                                <h1 className="text-7xl font-black text-white mb-6 tracking-tight leading-tight">
                                    AWS Ecosystem <br/>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Intelligence Portal</span>
                                </h1>
                                <p className="text-2xl text-slate-300 max-w-3xl mx-auto font-light leading-relaxed">
                                    Transforming distribution from transactional logistics to <br/>
                                    <span className="text-white font-medium">platform-first value orchestration</span>.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'problem' && (
                    <div className="w-full h-full flex bg-slate-950">
                        {/* LEFT: THE OLD WAY */}
                        <div className="w-1/2 relative overflow-hidden border-r border-slate-800 group">
                            <div 
                                className="absolute inset-0 bg-cover bg-center opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700 scale-110"
                                style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop")' }}
                            ></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
                            <div className="relative z-10 h-full flex flex-col justify-end p-16">
                                <div className="text-red-500 font-mono text-xl mb-4 flex items-center gap-2">
                                    <X size={24} /> CURRENT STATE
                                </div>
                                <h2 className="text-5xl font-bold text-white mb-6">Manual & Reactive</h2>
                                <ul className="space-y-4 text-lg text-slate-400">
                                    <li className="flex items-center gap-3"><span className="w-2 h-2 bg-red-500 rounded-full"></span>Disconnected Spreadsheets</li>
                                    <li className="flex items-center gap-3"><span className="w-2 h-2 bg-red-500 rounded-full"></span>Missed Funding Claims</li>
                                    <li className="flex items-center gap-3"><span className="w-2 h-2 bg-red-500 rounded-full"></span>Unscalable PDM Coverage</li>
                                </ul>
                            </div>
                        </div>

                        {/* RIGHT: THE NEW WAY */}
                        <div className="w-1/2 relative overflow-hidden group">
                            <div 
                                className="absolute inset-0 bg-cover bg-center opacity-60 scale-110 transition-all duration-700"
                                style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop")' }}
                            ></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-900/40 to-transparent"></div>
                            <div className="relative z-10 h-full flex flex-col justify-end p-16">
                                <div className="text-emerald-400 font-mono text-xl mb-4 flex items-center gap-2">
                                    <Zap size={24} /> FUTURE STATE
                                </div>
                                <h2 className="text-5xl font-bold text-white mb-6">AI-Driven & Proactive</h2>
                                <ul className="space-y-4 text-lg text-blue-100">
                                    <li className="flex items-center gap-3"><span className="w-2 h-2 bg-emerald-400 rounded-full"></span>Real-time Data Fabric</li>
                                    <li className="flex items-center gap-3"><span className="w-2 h-2 bg-emerald-400 rounded-full"></span>Automated Funding Recovery</li>
                                    <li className="flex items-center gap-3"><span className="w-2 h-2 bg-emerald-400 rounded-full"></span>10x PDM Efficiency</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'arch' && (
                    <div className="w-full h-full bg-slate-950 flex items-center justify-center p-12 relative overflow-hidden">
                        {/* Background Grid */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20"></div>
                        
                        <div className="max-w-6xl w-full relative z-10">
                            <div className="text-center mb-16">
                                <h2 className="text-4xl font-black text-white mb-4">Platform Architecture</h2>
                                <p className="text-slate-400 text-xl">Multi-source ingestion to automated action.</p>
                            </div>

                            <div className="grid grid-cols-1 gap-8 relative">
                                {/* Connecting Line */}
                                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500/0 via-blue-500/50 to-blue-500/0 -translate-x-1/2 z-0"></div>

                                {/* LAYER 3: ACTION */}
                                <div className="relative z-10 bg-slate-900/80 backdrop-blur-xl border border-emerald-500/30 p-8 rounded-2xl shadow-2xl shadow-emerald-900/20 flex items-center justify-between group hover:border-emerald-500/60 transition-all duration-500">
                                    <div className="flex items-center gap-6">
                                        <div className="p-4 bg-emerald-500/20 rounded-xl text-emerald-400">
                                            <Zap size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-white">Orchestration Engine</h3>
                                            <p className="text-slate-400">Automated workflows & outreach</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 text-slate-300 text-sm">Email Campaigns</div>
                                        <div className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 text-slate-300 text-sm">Funding Claims</div>
                                        <div className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 text-slate-300 text-sm">CRM Sync</div>
                                    </div>
                                </div>

                                {/* LAYER 2: INTELLIGENCE */}
                                <div className="relative z-10 bg-slate-900/90 backdrop-blur-xl border border-blue-500/50 p-10 rounded-2xl shadow-[0_0_50px_-12px_rgba(59,130,246,0.5)] flex items-center justify-between scale-105 my-4 group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                    <div className="flex items-center gap-6 relative z-10">
                                        <div className="p-5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl text-white shadow-lg shadow-blue-500/50 animate-pulse">
                                            <Sparkles size={40} />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-white">AI Engine</h3>
                                            <p className="text-blue-200">Cognitive Core & Reasoning</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 relative z-10">
                                        <div className="px-4 py-2 bg-blue-950/50 rounded-lg border border-blue-800 text-blue-200 text-sm font-mono backdrop-blur-md">RAG Pipeline</div>
                                        <div className="px-4 py-2 bg-blue-950/50 rounded-lg border border-blue-800 text-blue-200 text-sm font-mono backdrop-blur-md">Vector DB</div>
                                        <div className="px-4 py-2 bg-blue-950/50 rounded-lg border border-blue-800 text-blue-200 text-sm font-mono backdrop-blur-md">Semantic Match</div>
                                    </div>
                                </div>

                                {/* LAYER 1: INGESTION */}
                                <div className="relative z-10 bg-slate-900/80 backdrop-blur-xl border border-slate-700 p-8 rounded-2xl shadow-xl flex items-center justify-between group hover:border-slate-600 transition-all duration-500">
                                    <div className="flex items-center gap-6">
                                        <div className="p-4 bg-slate-800 rounded-xl text-slate-400">
                                            <Database size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-white">Data Fabric</h3>
                                            <p className="text-slate-400">Multi-source ingestion & normalization</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 text-slate-300 text-sm">Partner Portal</div>
                                        <div className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 text-slate-300 text-sm">AWS ACE</div>
                                        <div className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 text-slate-300 text-sm">Partner CSVs</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'impact' && (
                    <div className="h-full flex items-center justify-center p-12 animate-in zoom-in-95 duration-700 relative overflow-hidden bg-slate-50">
                        {/* Background glow effect */}
                        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px] animate-pulse"></div>
                        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)]"></div>
                        
                        <div className="max-w-6xl w-full grid grid-cols-2 gap-16 relative z-10">
                            <div className="space-y-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl text-white shadow-xl shadow-blue-500/20">
                                        <BarChart3 size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-4xl font-black text-slate-900 tracking-tight">Business Impact</h3>
                                        <p className="text-slate-500 font-medium">Projected ROI & Ecosystem Growth</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="group p-8 bg-white/90 backdrop-blur-xl rounded-[2rem] border border-white shadow-2xl shadow-slate-200/50 hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                                        <div className="flex items-center justify-between mb-2 relative z-10">
                                            <span className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Partner Adoption</span>
                                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:rotate-12 transition-transform"><Globe size={20} /></div>
                                        </div>
                                        <div className="flex items-baseline gap-2 relative z-10">
                                            <span className="text-7xl font-black text-slate-900 tracking-tighter">500+</span>
                                            <div className="flex flex-col">
                                                <span className="text-emerald-500 font-bold text-lg leading-none">↑ 40%</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">YoY</span>
                                            </div>
                                        </div>
                                        <p className="text-slate-500 mt-4 font-medium relative z-10">Active partners across global regions</p>
                                    </div>

                                    <div className="group p-8 bg-white/90 backdrop-blur-xl rounded-[2rem] border border-white shadow-2xl shadow-slate-200/50 hover:shadow-emerald-500/10 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                                        <div className="flex items-center justify-between mb-2 relative z-10">
                                            <span className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Incremental Funding</span>
                                            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:rotate-12 transition-transform"><DollarSign size={20} /></div>
                                        </div>
                                        <div className="flex items-baseline gap-2 relative z-10">
                                            <span className="text-7xl font-black text-slate-900 tracking-tighter">$2.5M</span>
                                            <div className="flex flex-col">
                                                <span className="text-emerald-500 font-bold text-lg leading-none">Net New</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">Q3 Target</span>
                                            </div>
                                        </div>
                                        <p className="text-slate-500 mt-4 font-medium relative z-10">Recovered via automated AI Engine claims</p>
                                    </div>

                                    <div className="group p-8 bg-white/90 backdrop-blur-xl rounded-[2rem] border border-white shadow-2xl shadow-slate-200/50 hover:shadow-purple-500/10 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                                        <div className="flex items-center justify-between mb-2 relative z-10">
                                            <span className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Routing Efficiency</span>
                                            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:rotate-12 transition-transform"><Zap size={20} /></div>
                                        </div>
                                        <div className="flex items-baseline gap-2 relative z-10">
                                            <span className="text-7xl font-black text-slate-900 tracking-tighter">4s</span>
                                            <span className="text-slate-300 text-2xl ml-3 line-through decoration-red-500/50 decoration-4">4 days</span>
                                        </div>
                                        <p className="text-slate-500 mt-4 font-medium relative z-10">Autonomous lead distribution & matching</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl text-white shadow-xl shadow-purple-500/20">
                                        <Target size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-4xl font-black text-slate-900 tracking-tight">Strategic Roadmap</h3>
                                        <p className="text-slate-500 font-medium">Evolution of the Intelligence Portal</p>
                                    </div>
                                </div>

                                <div className="relative space-y-8 before:absolute before:left-[31px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
                                    <div className="relative pl-20 group">
                                        <div className="absolute left-0 top-0 w-16 h-16 bg-white rounded-2xl border-2 border-blue-500 flex items-center justify-center z-10 shadow-xl group-hover:scale-110 transition-transform duration-300">
                                            <div className="flex flex-col items-center leading-none">
                                                <span className="text-[10px] font-black text-slate-400 uppercase mb-1">Phase</span>
                                                <span className="font-black text-blue-600 text-xl">01</span>
                                            </div>
                                        </div>
                                        <div className="p-8 bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200 shadow-xl group-hover:border-blue-400 group-hover:shadow-blue-500/5 transition-all duration-300">
                                            <div className="text-blue-600 font-bold text-xs uppercase tracking-widest mb-2">Q3 2024</div>
                                            <h4 className="font-black text-slate-900 text-xl mb-2">Ecosystem Launch</h4>
                                            <p className="text-slate-500 font-medium leading-relaxed">Onboarding Strategic Partners to the Intelligence Portal with real-time health scoring.</p>
                                        </div>
                                    </div>

                                    <div className="relative pl-20 group">
                                        <div className="absolute left-0 top-0 w-16 h-16 bg-white rounded-2xl border-2 border-purple-500 flex items-center justify-center z-10 shadow-xl group-hover:scale-110 transition-transform duration-300">
                                            <div className="flex flex-col items-center leading-none">
                                                <span className="text-[10px] font-black text-slate-400 uppercase mb-1">Phase</span>
                                                <span className="font-black text-purple-600 text-xl">02</span>
                                            </div>
                                        </div>
                                        <div className="p-8 bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200 shadow-xl group-hover:border-purple-400 group-hover:shadow-purple-500/5 transition-all duration-300">
                                            <div className="text-purple-600 font-bold text-xs uppercase tracking-widest mb-2">Q3 2025</div>
                                            <h4 className="font-black text-slate-900 text-xl mb-2">Enterprise Integration</h4>
                                            <p className="text-slate-500 font-medium leading-relaxed">Deep integration with enterprise data fabric for global visibility and automated co-selling.</p>
                                        </div>
                                    </div>

                                    <div className="relative pl-20 group">
                                        <div className="absolute left-0 top-0 w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center z-10 shadow-2xl group-hover:scale-110 transition-transform duration-300">
                                            <Sparkles size={32} className="text-white animate-pulse" />
                                        </div>
                                        <div className="p-8 bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-700 group-hover:border-blue-500 transition-all duration-300">
                                            <div className="text-blue-400 font-bold text-xs uppercase tracking-widest mb-2">2025 & Beyond</div>
                                            <h4 className="font-black text-white text-xl mb-2">Autonomous Orchestration</h4>
                                            <p className="text-slate-400 font-medium leading-relaxed">AI Agents proactively managing partner growth, funding claims, and technical enablement.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* LIVE APPS */}
                {view === 'dashboard' && (
                    <div className="w-full flex-1 overflow-y-auto bg-slate-50 animate-in fade-in duration-300">
                        <Dashboard ref={dashboardRef} data={DEMO_PARTNER} readOnly={true} />
                    </div>
                )}

                {view === 'admin_dashboard' && (
                    <div className="w-full flex-1 overflow-y-auto bg-slate-50 animate-in fade-in duration-300">
                        <AdminDashboard 
                            ref={adminDashboardRef} 
                            onSelectPartner={() => {}} 
                            onLogout={() => {}} 
                            dataMode="demo" 
                            onMatchUpdate={setCurrentMatchScore}
                        />
                    </div>
                )}

                {/* OVERLAYS */}
                <DemoCopilot 
                    currentStep={currentStep}
                    onNext={() => setCurrentStepIndex(prev => Math.min(prev + 1, DEMO_SCRIPT.length - 1))}
                    onPrev={() => setCurrentStepIndex(prev => Math.max(prev - 0, 0))}
                    totalSteps={DEMO_SCRIPT.length}
                    currentStepIndex={currentStepIndex}
                    headless={true}
                />

                <AIUnderTheHood 
                    isOpen={showAIUnderTheHood}
                    onClose={() => setShowAIUnderTheHood(false)}
                    data={view === 'dashboard' ? DEMO_PARTNER : { leads: 15, partners: 120 }}
                    type={view === 'dashboard' ? 'generation' : 'matching'}
                    score={view === 'admin_dashboard' ? currentMatchScore || 92 : undefined}
                />
            </div>

            {/* RIGHT: DIRECTOR'S CONSOLE (25%) */}
            <div className="w-1/4 bg-slate-900 border-l border-slate-800 flex flex-col h-full shadow-2xl z-50">
                {/* HEADER */}
                <div className="p-6 border-b border-slate-800 bg-slate-950">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-xs font-bold text-blue-500 uppercase tracking-widest">Director's Console</div>
                        <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={16} /></button>
                    </div>
                    <h2 className="text-xl font-bold text-white">Executive Demo</h2>
                    <div className="flex items-center gap-2 mt-2">
                        <div className={`w-2 h-2 rounded-full bg-slate-600`}></div>
                        <span className="text-xs text-slate-400">Manual Control</span>
                    </div>
                </div>

                {/* SCRIPT & CONTROLS */}
                <div className="p-6 bg-slate-800/50 border-b border-slate-800">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-slate-400 uppercase">Current Step {currentStepIndex + 1}/{DEMO_SCRIPT.length}</span>
                        <div className="flex gap-1">
                            <button 
                                onClick={() => setCurrentStepIndex(prev => Math.max(prev - 1, 0))}
                                className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-white"
                                title="Previous Step"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button 
                                onClick={handleNext}
                                className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white shadow-lg shadow-blue-900/50"
                                title="Next Step"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 mb-4">
                        <h3 className="text-amber-400 font-bold mb-2 text-sm">{currentStep.title}</h3>
                        <p className="text-slate-300 text-sm leading-relaxed">"{currentStep.script}"</p>
                    </div>

                    <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                        <div 
                            className="bg-blue-500 h-full transition-all duration-500" 
                            style={{ width: `${((currentStepIndex + 1) / DEMO_SCRIPT.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* NAVIGATION TREE */}
                <div className="flex-1 overflow-y-auto p-4">
                    <DemoNavigation 
                        activeSection={activeSection}
                        activeView={view}
                        activeContext={dashboardContext}
                        onNavigate={handleNavigate}
                    />
                </div>
            </div>
        </div>
    );
}
