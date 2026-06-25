
import React, { useState, useEffect, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { PartnerData, PartnerTrack, OpportunityMatchRequest, MatchResult, Opportunity } from '../types';
import { dbService } from '../services/dbService';
import { matchOpportunity } from '../services/geminiService';
import { Search, Filter, ArrowRight, Target, MapPin, Sparkles, CheckCircle, BarChart3, DollarSign, Rocket, UploadCloud, FileSpreadsheet, Mail, RefreshCw, Send, Loader2, Brain, Infinity, Cloud, TrendingUp, PieChart, Info, Database, UserCheck, AlertCircle, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart as RePieChart, Pie, Cell as PieCell } from 'recharts';
import { CSV_DATA_DEMO, CSV_DATA_LIVE } from '../services/sampleLeads';

interface Props {
    onSelectPartner: (partner: PartnerData) => void;
    onLogout: () => void;
    dataMode?: 'live' | 'demo'; 
    onMatchUpdate?: (score: number) => void;
}

export interface AdminDashboardHandle {
    setActiveTab: (tab: 'portfolio' | 'matcher' | 'pipeline' | 'import') => void;
    triggerMatcher: () => void;
    triggerLoadSample: () => void;
    resetDemoState: () => void;
}

// --- HELPER: MAPPING CSV NAMES TO SEED DATA PARTNERS ---
// Maps CSV values to the actual Partner Entity Names in our DB
const PARTNER_MAPPING: Record<string, string> = {
    'novalabs': 'Skyline Systems Inc.',
    'streamline': 'Northwind Innovations',
    'summit software': 'Summit Software Inc.',
    'summit': 'Summit Software Inc.',
    'apex': 'Apex Data Corporation',
    'apex data corporation': 'Apex Data Corporation',
    'northwind': 'Northwind Innovations',
    'skyline': 'Skyline Systems Inc.',
    'meridian': 'Meridian Consulting',
    'beacon': 'Beacon IT Group',
    'dataforge': 'DataForge Solutions Ltd.'
};

const calculatePropensity = (p: PartnerData): number => {
    let score = 0;
    if (p.monthlyResale.includes('>$200k')) score += 30;
    else if (p.monthlyResale.includes('$50k')) score += 20;
    else if (p.monthlyResale.includes('$10k')) score += 10;
    if (p.arrGrowthTarget.includes('50%')) score += 25;
    else if (p.arrGrowthTarget.includes('25%')) score += 15;
    const teamSize = parseInt(p.teamSizeTech.split('-')[0]) || 0;
    if (p.teamSizeTech.includes('11+')) score += 25;
    else if (teamSize >= 5) score += 15;
    if (p.competencies.length > 2) score += 20;
    return Math.min(100, score);
};

const getTechFocus = (p: PartnerData) => {
    const focus = [];
    if (p.competencies.some(c => ['Machine Learning', 'Generative AI', 'Data & Analytics'].includes(c)) || p.aiReadinessScore && p.aiReadinessScore > 3) {
        focus.push({ type: 'AI', icon: Brain, color: 'text-indigo-600 bg-indigo-50' });
    }
    if (p.competencies.includes('DevOps') || p.iacExperience === 'Yes') {
        focus.push({ type: 'DevOps', icon: Infinity, color: 'text-cyan-600 bg-cyan-50' });
    }
    if (p.competencies.includes('Migration') || p.mapPhasesDelivered.length > 0) {
        focus.push({ type: 'Migrate', icon: Cloud, color: 'text-blue-600 bg-blue-50' });
    }
    return focus;
};

// Simulated Email
const sendEmailNotification = (to: string, subject: string, body: string) => {
    console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
};

// Internal Import Type
interface ImportedLead {
    id: string;
    customerName: string;
    contactPerson: string;
    email: string;
    description: string;
    estValue: number;
    region: string;
    segment: string;
    workload: string;
    preAssignedPartnerName?: string; 
    status: 'Ready' | 'Assigned' | 'Unassigned';
}

const parseCSVLine = (str: string): string[] => {
    const result = [];
    let cell = '';
    let quote = false;
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === '"' && str[i + 1] === '"') {
            cell += '"';
            i++;
        } else if (char === '"') {
            quote = !quote;
        } else if (char === ',' && !quote) {
            result.push(cell);
            cell = '';
        } else {
            cell += char;
        }
    }
    result.push(cell);
    return result;
};

const AdminDashboard = forwardRef<AdminDashboardHandle, Props>(({ onSelectPartner, onLogout, dataMode = 'demo', onMatchUpdate }, ref) => {
    const [view, setView] = useState<'portfolio' | 'matcher' | 'pipeline' | 'import'>('portfolio');
    const [partners, setPartners] = useState<(PartnerData & { lastUpdated?: string })[]>([]);
    const [unassignedLeads, setUnassignedLeads] = useState<Opportunity[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTrack, setFilterTrack] = useState<string>('All');
    const [notification, setNotification] = useState<{msg: string, type: 'success' | 'info'} | null>(null);

    // Import State
    const [importText, setImportText] = useState('');
    const [importedPreview, setImportedPreview] = useState<ImportedLead[]>([]);
    const [importStep, setImportStep] = useState<1|2>(1);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Matcher State
    const [matcherProcessing, setMatcherProcessing] = useState(false);
    const [matcherProgress, setMatcherProgress] = useState(0);
    const [matches, setMatches] = useState<{leadId: string, result: MatchResult}[]>([]);

    // Demo Ingest State
    const [isDemoIngesting, setIsDemoIngesting] = useState(false);
    const [demoIngestStep, setDemoIngestStep] = useState(0);
    const demoSteps = [
        "Initializing Bulk Ingestion Engine...",
        "Scanning CSV Data & Extracting Entities...",
        "AI Analysis: Mapping Partner Competencies...",
        "AI Analysis: Calculating Regional & Vertical Fit...",
        "AI Analysis: Scoring Propensity & Capacity...",
        "Finalizing Intelligent Match Recommendations..."
    ];

    useEffect(() => {
        refreshData();
        // Pre-populate demo data if in demo mode
        if (dataMode === 'demo') {
            setImportText(CSV_DATA_DEMO);
        }
    }, [dataMode]);

    const refreshData = () => {
        setPartners(dbService.getAllPartners());
        setUnassignedLeads(dbService.getUnassignedLeads());
    };

    const showToast = (msg: string, type: 'success' | 'info' = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const filteredPartners = partners.filter(p => {
        const matchesSearch = p.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              p.contactName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTrack = filterTrack === 'All' || p.calculatedTrack === filterTrack;
        return matchesSearch && matchesTrack;
    });

    // --- ANALYTICS ---
    const allAssignedOpportunities = partners.flatMap(p => 
        (p.opportunities || []).map(o => ({...o, partnerName: p.companyName, isAssigned: true}))
    );
    const totalPipeline = [...allAssignedOpportunities, ...unassignedLeads.map(l => ({...l, partnerName: 'Unassigned', isAssigned: false}))];
    
    const pipelineStats = {
        total: totalPipeline.length,
        unassigned: unassignedLeads.length,
        totalValue: totalPipeline.reduce((acc, curr) => acc + curr.estArr, 0),
        won: totalPipeline.filter(o => o.stage === 'Closed Won').length,
        conversionRate: totalPipeline.filter(o => o.status === 'Closed').length > 0 
            ? Math.round((totalPipeline.filter(o => o.stage === 'Closed Won').length / totalPipeline.filter(o => o.status === 'Closed').length) * 100)
            : 0
    };

    const techDistribution = useMemo(() => {
        let ai = 0, devops = 0, migrate = 0;
        partners.forEach(p => {
            if (getTechFocus(p).some(t => t.type === 'AI')) ai++;
            if (getTechFocus(p).some(t => t.type === 'DevOps')) devops++;
            if (getTechFocus(p).some(t => t.type === 'Migrate')) migrate++;
        });
        return [
            { name: 'AI / Data', value: ai, color: '#6366f1' },
            { name: 'DevOps', value: devops, color: '#06b6d4' },
            { name: 'Migration', value: migrate, color: '#3b82f6' }
        ];
    }, [partners]);

    const statusData = [
        { name: 'New', value: totalPipeline.filter(o => o.stage === 'New').length, color: '#64748b' },
        { name: 'Qualifying', value: totalPipeline.filter(o => o.stage === 'Qualifying').length, color: '#3b82f6' },
        { name: 'Proposal', value: totalPipeline.filter(o => o.stage === 'Proposal' || o.stage === 'Technical Validation').length, color: '#004481' },
        { name: 'Won', value: totalPipeline.filter(o => o.stage === 'Closed Won').length, color: '#16a34a' }
    ];

    // --- IMPORT FLOW ---
    const loadSampleData = () => {
        if (dataMode === 'live') {
            setImportText(CSV_DATA_LIVE);
            showToast("Loaded sample lead data", "info");
        } else {
            setImportText(CSV_DATA_DEMO);
            showToast("Loaded sample lead data", "success");
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            setImportText(event.target?.result as string);
            showToast("File loaded successfully");
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const parseImportData = () => {
        const rows = importText.split('\n').filter(r => r.trim() !== '');
        if (rows.length < 2) return;

        const headers = parseCSVLine(rows[0].toLowerCase());
        const partnerIdx = headers.findIndex(h => h.includes('partner') && !h.includes('internal'));
        
        const isLiveFormat = headers.includes('what pain drives your interest in migrating to the cloud?');
        const isDemoFormat = headers.includes('lead notes / aws status');

        const parsed: ImportedLead[] = rows.slice(1).map((row, idx) => {
            const cols = parseCSVLine(row);
            if (cols.length < 3) return null;

            let lead: ImportedLead = {
                id: `import-${Date.now()}-${idx}`,
                customerName: 'Unknown',
                contactPerson: 'Unknown',
                email: '',
                estValue: 50000, 
                region: 'Canada',
                description: '',
                segment: 'SMB',
                workload: 'General',
                status: 'Ready',
                preAssignedPartnerName: partnerIdx > -1 ? cols[partnerIdx] : undefined
            };

            if (isLiveFormat) {
                lead.customerName = cols[6] || 'Unknown Co.';
                lead.contactPerson = `${cols[0]} ${cols[1]}`;
                lead.email = cols[2];
                lead.region = cols[9] || 'Canada';
                lead.segment = cols[10] || 'General';
                lead.description = `${cols[12]}. ${cols[13]}. Using: ${cols[14]}`;
                lead.estValue = 50000;
            } else if (isDemoFormat) {
                lead.customerName = cols[5] || 'Unknown Co.';
                lead.contactPerson = `${cols[0]} ${cols[1]}`;
                lead.email = cols[2];
                lead.segment = cols[7];
                lead.description = cols[10];
                lead.estValue = 25000;
            } else {
                lead.customerName = cols[0];
                lead.contactPerson = cols[1];
                lead.email = cols[2];
                lead.estValue = parseInt(cols[3]) || 50000;
                lead.description = cols.join(', ');
            }
            return lead;
        }).filter(l => l !== null) as ImportedLead[];

        setImportedPreview(parsed);
        setImportStep(2);
    };

    const processDistribution = () => {
        let assignedCount = 0;
        let queuedCount = 0;

        importedPreview.forEach(lead => {
            const newOpp: Opportunity = {
                id: crypto.randomUUID(),
                title: lead.customerName,
                description: lead.description,
                customerSegment: lead.segment,
                estArr: lead.estValue,
                stage: 'New',
                status: 'Active',
                probability: 10,
                source: 'Bulk Upload',
                dateCreated: new Date().toISOString(),
                dateLastUpdated: new Date().toISOString(),
                contact: { name: lead.contactPerson, email: lead.email, role: 'Primary Contact' },
                history: []
            };

            let matchedPartner = null;
            if (lead.preAssignedPartnerName && lead.preAssignedPartnerName.length > 2) {
                // Try direct match
                const rawName = lead.preAssignedPartnerName.toLowerCase().trim();
                matchedPartner = partners.find(p => p.companyName.toLowerCase().includes(rawName));
                
                // Try Mapping
                if (!matchedPartner) {
                    for (const [key, val] of Object.entries(PARTNER_MAPPING)) {
                        if (rawName.includes(key)) {
                            matchedPartner = partners.find(p => p.companyName === val);
                            break;
                        }
                    }
                }
            }

            if (matchedPartner) {
                dbService.assignOpportunity(matchedPartner.email, newOpp);
                assignedCount++;
            } else {
                dbService.addUnassignedLead(newOpp);
                queuedCount++;
            }
        });

        refreshData();
        showToast(`Imported ${importedPreview.length} leads: ${assignedCount} Assigned directly, ${queuedCount} queued for matching.`, 'success');
        setImportText('');
        setImportedPreview([]);
        setImportStep(1);
        setView('pipeline');
    };

    // --- MATCHER LOGIC ---
    const runBatchMatcher = async () => {
        if (unassignedLeads.length === 0) return;
        setMatcherProcessing(true);
        setMatcherProgress(0);
        
        const newMatches = [];
        
        for (let i = 0; i < unassignedLeads.length; i++) {
            const lead = unassignedLeads[i];
            const req: OpportunityMatchRequest = {
                segment: lead.customerSegment,
                workload: "General", 
                complexity: "Medium",
                region: "Canada",
                description: lead.description
            };

            // Use our AI Service
            const results = await matchOpportunity(partners, req);
            if (results.length > 0) {
                // Attach the real partner object ref
                const p = partners.find(ptr => ptr.companyName === results[0].partnerName);
                if (p) {
                    newMatches.push({
                        leadId: lead.id,
                        result: { ...results[0], _originalPartner: p }
                    });
                }
            }
            setMatcherProgress(Math.round(((i + 1) / unassignedLeads.length) * 100));
            if (onMatchUpdate && results.length > 0) onMatchUpdate(results[0].matchScore);
            // Slight delay for visuals
            await new Promise(r => setTimeout(r, 200));
        }

        setMatches(newMatches);
        setMatcherProcessing(false);
    };

    const runDemoBatchMatcher = async (leadsToMatch: Opportunity[]) => {
        setMatcherProcessing(true);
        setMatcherProgress(0);
        
        const currentPartners = dbService.getAllPartners();
        
        for (let i = 0; i < leadsToMatch.length; i++) {
            const lead = leadsToMatch[i];
            
            // Mock matching logic for demo
            // Find a partner that matches the segment or description keywords
            let bestPartner = currentPartners[Math.floor(Math.random() * currentPartners.length)];
            
            // Try to find a better match
            const keywords = lead.description.toLowerCase();
            if (keywords.includes('data') || keywords.includes('ai')) {
                const apex = currentPartners.find(p => p.companyName.includes('Apex'));
                if (apex) bestPartner = apex;
            } else if (keywords.includes('migration')) {
                const northwind = currentPartners.find(p => p.companyName.includes('Northwind'));
                if (northwind) bestPartner = northwind;
            }

            const mockResult: MatchResult = {
                partnerName: bestPartner?.companyName || 'Unknown Partner',
                matchScore: 85 + Math.floor(Math.random() * 12),
                track: bestPartner?.calculatedTrack || 'Strategic',
                reasoning: `High alignment with ${lead.customerSegment} segment and proven expertise in ${lead.description.split(' ').slice(0, 3).join(' ')} workloads.`,
                _originalPartner: bestPartner
            };

            setMatches(prev => {
                const filtered = prev.filter(m => m.leadId !== lead.id);
                return [...filtered, { leadId: lead.id, result: mockResult }];
            });
            
            setMatcherProgress(Math.round(((i + 1) / leadsToMatch.length) * 100));
            if (onMatchUpdate) onMatchUpdate(mockResult.matchScore);
            await new Promise(r => setTimeout(r, 150));
        }

        setMatcherProcessing(false);
    };

    useEffect(() => {
        if (view === 'matcher' && unassignedLeads.length > 0 && matches.length === 0 && !matcherProcessing) {
            // Automatically run matcher if we enter the view and there are leads but no matches
            runDemoBatchMatcher(unassignedLeads);
        }
    }, [view, unassignedLeads.length, matches.length, matcherProcessing]);

    const startDemoBulkWorkflow = async () => {
        setIsDemoIngesting(true);
        setDemoIngestStep(0);

        // Step 0: Initializing
        await new Promise(r => setTimeout(r, 1000));
        setDemoIngestStep(1);

        // Step 1: Scanning
        await new Promise(r => setTimeout(r, 1200));
        const csvContent = dataMode === 'live' ? CSV_DATA_LIVE : CSV_DATA_DEMO;
        
        // Parse the data
        const rows = csvContent.split('\n').filter(r => r.trim() !== '');
        const headers = parseCSVLine(rows[0].toLowerCase());
        const isDemoFormat = headers.includes('lead notes / aws status');
        
        const parsed: ImportedLead[] = rows.slice(1).map((row, idx) => {
            const cols = parseCSVLine(row);
            if (cols.length < 3) return null;
            return {
                id: `demo-import-${Date.now()}-${idx}`,
                customerName: cols[5] || cols[0] || 'Unknown Co.',
                contactPerson: `${cols[0]} ${cols[1]}`,
                email: cols[2],
                segment: cols[7] || 'SMB',
                description: cols[10] || cols.join(', '),
                estValue: 25000,
                region: 'Canada',
                workload: 'General',
                status: 'Ready'
            } as ImportedLead;
        }).filter(l => l !== null) as ImportedLead[];

        setImportedPreview(parsed);
        setDemoIngestStep(2);

        // Step 2-5: AI Analysis Simulation
        for (let i = 2; i <= 5; i++) {
            await new Promise(r => setTimeout(r, 1500));
            setDemoIngestStep(i + 1);
        }

        // Step 6: Finalizing
        await new Promise(r => setTimeout(r, 1000));

        // Actually add to DB
        const newLeads: Opportunity[] = parsed.map(lead => ({
            id: crypto.randomUUID(),
            title: lead.customerName,
            description: lead.description,
            customerSegment: lead.segment,
            estArr: lead.estValue,
            stage: 'New',
            status: 'Active',
            probability: 10,
            source: 'AI Bulk Ingest',
            dateCreated: new Date().toISOString(),
            dateLastUpdated: new Date().toISOString(),
            contact: { name: lead.contactPerson, email: lead.email, role: 'Primary Contact' },
            history: []
        }));

        newLeads.forEach(l => dbService.addUnassignedLead(l));
        
        // Update state immediately to ensure Matcher view sees them
        const updatedLeads = dbService.getUnassignedLeads();
        setUnassignedLeads(updatedLeads);
        setPartners(dbService.getAllPartners());

        setIsDemoIngesting(false);
        setDemoIngestStep(0);
        setView('matcher');
        
        showToast("Bulk Ingestion Complete. AI Engine is analyzing results.", "success");
    };

    const applyMatch = (leadId: string) => {
        const match = matches.find(m => m.leadId === leadId);
        const lead = unassignedLeads.find(l => l.id === leadId);
        
        if (match && lead && match.result._originalPartner) {
            dbService.assignOpportunity(match.result._originalPartner.email, lead);
            dbService.removeUnassignedLead(leadId);
            setUnassignedLeads(prev => prev.filter(l => l.id !== leadId));
            setMatches(prev => prev.filter(m => m.leadId !== leadId));
            showToast(`Assigned ${lead.title} to ${match.result.partnerName}`);
            
            // Also refresh full partner list to reflect pipeline change
            setPartners(dbService.getAllPartners());
        }
    };

    const applyAllMatches = () => {
        let count = 0;
        matches.forEach(m => {
            const lead = unassignedLeads.find(l => l.id === m.leadId);
            if (lead && m.result._originalPartner) {
                dbService.assignOpportunity(m.result._originalPartner.email, lead);
                dbService.removeUnassignedLead(m.leadId);
                count++;
            }
        });
        refreshData();
        setMatches([]);
        showToast(`Batch assigned ${count} leads based on AI recommendations.`);
    };

    const performFullImport = (csvContent: string) => {
        // 1. Parse
        const rows = csvContent.split('\n').filter(r => r.trim() !== '');
        if (rows.length < 2) return;

        const headers = parseCSVLine(rows[0].toLowerCase());
        const partnerIdx = headers.findIndex(h => h.includes('partner') && !h.includes('internal'));
        
        const isLiveFormat = headers.includes('what pain drives your interest in migrating to the cloud?');
        const isDemoFormat = headers.includes('lead notes / aws status');

        const parsed: ImportedLead[] = rows.slice(1).map((row, idx) => {
            const cols = parseCSVLine(row);
            if (cols.length < 3) return null;

            let lead: ImportedLead = {
                id: `import-${Date.now()}-${idx}`,
                customerName: 'Unknown',
                contactPerson: 'Unknown',
                email: '',
                estValue: 50000, 
                region: 'Canada',
                description: '',
                segment: 'SMB',
                workload: 'General',
                status: 'Ready',
                preAssignedPartnerName: partnerIdx > -1 ? cols[partnerIdx] : undefined
            };

            if (isLiveFormat) {
                lead.customerName = cols[6] || 'Unknown Co.';
                lead.contactPerson = `${cols[0]} ${cols[1]}`;
                lead.email = cols[2];
                lead.region = cols[9] || 'Canada';
                lead.segment = cols[10] || 'General';
                lead.description = `${cols[12]}. ${cols[13]}. Using: ${cols[14]}`;
                lead.estValue = 50000;
            } else if (isDemoFormat) {
                lead.customerName = cols[5] || 'Unknown Co.';
                lead.contactPerson = `${cols[0]} ${cols[1]}`;
                lead.email = cols[2];
                lead.segment = cols[7];
                lead.description = cols[10];
                lead.estValue = 25000;
            } else {
                lead.customerName = cols[0];
                lead.contactPerson = cols[1];
                lead.email = cols[2];
                lead.estValue = parseInt(cols[3]) || 50000;
                lead.description = cols.join(', ');
            }
            return lead;
        }).filter(l => l !== null) as ImportedLead[];

        // 2. Process
        let assignedCount = 0;
        let queuedCount = 0;

        parsed.forEach(lead => {
            const newOpp: Opportunity = {
                id: crypto.randomUUID(),
                title: lead.customerName,
                description: lead.description,
                customerSegment: lead.segment,
                estArr: lead.estValue,
                stage: 'New',
                status: 'Active',
                probability: 10,
                source: 'Bulk Upload',
                dateCreated: new Date().toISOString(),
                dateLastUpdated: new Date().toISOString(),
                contact: { name: lead.contactPerson, email: lead.email, role: 'Primary Contact' },
                history: []
            };

            let matchedPartner = null;
            if (lead.preAssignedPartnerName && lead.preAssignedPartnerName.length > 2) {
                const rawName = lead.preAssignedPartnerName.toLowerCase().trim();
                matchedPartner = partners.find(p => p.companyName.toLowerCase().includes(rawName));
                if (!matchedPartner) {
                    for (const [key, val] of Object.entries(PARTNER_MAPPING)) {
                        if (rawName.includes(key)) {
                            matchedPartner = partners.find(p => p.companyName === val);
                            break;
                        }
                    }
                }
            }

            if (matchedPartner) {
                dbService.assignOpportunity(matchedPartner.email, newOpp);
                assignedCount++;
            } else {
                dbService.addUnassignedLead(newOpp);
                queuedCount++;
            }
        });

        // 3. Refresh
        refreshData();
        showToast(`Auto-imported ${parsed.length} leads (${queuedCount} queued for AI matching).`, 'success');
        
        // Update UI state to reflect "done"
        setImportText(csvContent);
        setImportedPreview(parsed);
        setImportStep(2); 
    };

    const resetDemoState = () => {
        setImportText('');
        setImportedPreview([]);
        setImportStep(1);
        setMatches([]);
        setMatcherProcessing(false);
        setMatcherProgress(0);
        // Reset DB for demo
        dbService.resetDemoData();
        refreshData();
        showToast("Demo state reset successfully", "info");
    };

    useImperativeHandle(ref, () => ({
        setActiveTab: (tab) => setView(tab),
        triggerMatcher: () => runBatchMatcher(),
        triggerLoadSample: () => performFullImport(dataMode === 'live' ? CSV_DATA_LIVE : CSV_DATA_DEMO),
        resetDemoState: () => resetDemoState()
    }));

    return (
        <div className="space-y-8 relative pb-20">
            {notification && (
                <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl z-50 text-white font-bold animate-in slide-in-from-bottom-5 flex items-center gap-3 ${notification.type === 'success' ? 'bg-green-600' : 'bg-[#004481]'}`}>
                    {notification.type === 'success' ? <CheckCircle size={20} /> : <Mail size={20} />}
                    {notification.msg}
                </div>
            )}

            {/* Admin Header */}
            <div className="bg-[#004481] rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
                 <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
                    <div>
                        <h1 className="text-3xl font-bold">Partner Command Center</h1>
                        <p className="text-blue-100 mt-2 max-w-2xl">
                            Manage the Canadian AWS ecosystem, track capability growth, and distribute opportunities.
                        </p>
                    </div>
                    <div className="flex bg-blue-900/50 p-1 rounded-lg backdrop-blur-sm">
                        <button id="admin-portfolio-tab" onClick={() => setView('portfolio')} className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${view === 'portfolio' ? 'bg-white text-[#004481] shadow' : 'text-blue-100 hover:text-white'}`}>Portfolio</button>
                        <button id="admin-matcher-tab" onClick={() => setView('matcher')} className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${view === 'matcher' ? 'bg-white text-[#004481] shadow' : 'text-blue-100 hover:text-white'}`}>Matcher <span className="ml-1 bg-orange-500 text-white text-[10px] px-1.5 rounded-full">{unassignedLeads.length}</span></button>
                        <button id="admin-import-tab" onClick={() => setView('import')} className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${view === 'import' ? 'bg-white text-[#004481] shadow' : 'text-blue-100 hover:text-white'}`}>Bulk Import</button>
                        <button id="admin-pipeline-tab" onClick={() => setView('pipeline')} className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${view === 'pipeline' ? 'bg-white text-[#004481] shadow' : 'text-blue-100 hover:text-white'}`}>Pipeline</button>
                    </div>
                 </div>
            </div>

            {/* MAIN VIEWS */}
            
            {/* 1. PORTFOLIO VIEW */}
            {view === 'portfolio' && (
                <div className="space-y-6 animate-in fade-in">
                    {/* Metrics */}
                    <div id="admin-metrics" className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div className="flex items-start justify-between">
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Active Partners</p><p className="text-3xl font-black text-slate-900 mt-1">{partners.length}</p></div>
                                <div className="p-2 bg-blue-50 text-[#004481] rounded-lg"><Rocket size={20} /></div>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded font-bold border border-purple-100">{partners.filter(p => p.calculatedTrack === PartnerTrack.TRACK_C).length} Strategic</span>
                                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold border border-blue-100">{partners.filter(p => p.calculatedTrack === PartnerTrack.TRACK_B).length} Emerging</span>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-start justify-between mb-2">
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg. Resell Propensity</p><p className="text-3xl font-black text-slate-900 mt-1">{Math.round(partners.reduce((acc, p) => acc + calculatePropensity(p), 0) / (partners.length || 1))}%</p></div>
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={20} /></div>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3"><div className="bg-emerald-500 h-full" style={{ width: `${Math.round(partners.reduce((acc, p) => acc + calculatePropensity(p), 0) / (partners.length || 1))}%` }}></div></div>
                        </div>
                        <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Ecosystem Technical Focus</p>
                                <div className="flex gap-4">
                                    {techDistribution.map(t => (
                                        <div key={t.name} className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor: t.color}}></div><div><p className="text-xs text-slate-500 font-bold">{t.name}</p><p className="text-lg font-bold text-slate-900">{t.value}</p></div></div>
                                    ))}
                                </div>
                            </div>
                            <div className="h-24 w-24"><ResponsiveContainer width="100%" height="100%"><RePieChart><Pie data={techDistribution} innerRadius={25} outerRadius={40} paddingAngle={5} dataKey="value">{techDistribution.map((entry, index) => (<PieCell key={`cell-${index}`} fill={entry.color} />))}</Pie></RePieChart></ResponsiveContainer></div>
                        </div>
                    </div>

                    {/* Table Controls */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input type="text" placeholder="Search partners..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#004481] outline-none transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <select className="flex-1 md:w-48 p-2.5 border border-slate-200 rounded-lg outline-none bg-white text-sm font-medium text-slate-700" value={filterTrack} onChange={(e) => setFilterTrack(e.target.value)}>
                                <option value="All">All Accounts</option>
                                <option value={PartnerTrack.TRACK_C}>Strategic</option>
                                <option value={PartnerTrack.TRACK_B}>Emerging</option>
                                <option value={PartnerTrack.TRACK_A}>Longtail</option>
                            </select>
                        </div>
                    </div>

                    {/* Partner Table */}
                    <div id="admin-partner-list" className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="p-5">Partner Entity</th>
                                    <th className="p-5">Account Type</th>
                                    <th className="p-5">Tech Focus</th>
                                    <th className="p-5 w-1/4">Vertical Expertise</th>
                                    <th className="p-5">Resell Propensity</th>
                                    <th className="p-5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredPartners.map((partner, idx) => {
                                    const propensity = calculatePropensity(partner);
                                    const focusAreas = getTechFocus(partner);
                                    const accountType = partner.calculatedTrack?.split(' - ')[0] || 'Unknown';
                                    return (
                                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="p-5"><div className="font-bold text-slate-800 text-lg">{partner.companyName}</div><div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin size={10} /> {partner.hqProvince.join(", ")}</div></td>
                                        <td className="p-5">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${accountType.includes('Strategic') ? "bg-purple-100 text-purple-700 border-purple-200" : accountType.includes('Emerging') ? "bg-blue-100 text-[#004481] border-blue-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>{accountType}</span>
                                        </td>
                                        <td className="p-5"><div className="flex gap-2">{focusAreas.map((f, i) => (<div key={i} className={`p-1.5 rounded-lg ${f.color}`} title={f.type}><f.icon size={16} /></div>))}</div></td>
                                        <td className="p-5"><div className="flex flex-wrap gap-1.5">{partner.industryVerticals.slice(0,3).map(v => (<span key={v} className="text-[10px] font-semibold bg-slate-50 px-2 py-1 rounded text-slate-600 border border-slate-200">{v}</span>))}</div></td>
                                        <td className="p-5"><div className="w-full max-w-[120px]"><div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden"><div className={`h-full rounded-full ${propensity > 70 ? 'bg-emerald-500' : 'bg-slate-400'}`} style={{ width: `${propensity}%` }}></div></div></div></td>
                                        <td className="p-5 text-right"><button onClick={() => onSelectPartner(partner)} className="text-[#004481] hover:text-blue-700 font-medium text-sm flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">Scorecard <ArrowRight size={14} /></button></td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 2. MATCHER VIEW */}
            {view === 'matcher' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="bg-gradient-to-r from-[#004481] to-blue-600 rounded-2xl p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Sparkles className="text-yellow-400" /> Unassigned Lead Queue</h2>
                            <p className="text-blue-100">Use AI to analyze capability fit for {unassignedLeads.length} unassigned leads.</p>
                        </div>
                        <div className="flex gap-4">
                            {unassignedLeads.length > 0 && !matcherProcessing && (
                                <button id="admin-run-matcher" onClick={runBatchMatcher} className="px-6 py-3 bg-white text-[#004481] font-bold rounded-xl shadow hover:bg-blue-50 flex items-center gap-2">
                                    <Brain size={18} /> Analyze & Match All
                                </button>
                            )}
                            {matches.length > 0 && (
                                <button onClick={applyAllMatches} className="px-6 py-3 bg-green-500 text-white font-bold rounded-xl shadow hover:bg-green-600 flex items-center gap-2">
                                    <CheckCircle size={18} /> Approve All Matches
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Processing State */}
                    {matcherProcessing && (
                        <div className="bg-white p-8 rounded-2xl shadow border border-slate-200 text-center">
                            <h3 className="font-bold text-lg mb-4">AI Analysis in Progress...</h3>
                            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden mb-2">
                                <div className="bg-[#004481] h-full transition-all duration-300" style={{ width: `${matcherProgress}%` }}></div>
                            </div>
                            <p className="text-slate-500 text-sm">Evaluating competencies, region, and industry fit.</p>
                        </div>
                    )}

                    {/* Match Results or Empty State */}
                    {unassignedLeads.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm mb-4"><Target size={32} className="text-slate-300" /></div>
                            <h3 className="text-lg font-bold text-slate-500">Queue Empty</h3>
                            <p className="text-slate-400">All leads have been distributed. Import more to continue.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                                    <tr>
                                        <th className="p-4">Customer</th>
                                        <th className="p-4">Description</th>
                                        <th className="p-4">AI Recommendation</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {unassignedLeads.map(lead => {
                                        const match = matches.find(m => m.leadId === lead.id);
                                        return (
                                            <tr key={lead.id} className="hover:bg-slate-50">
                                                <td className="p-4 font-bold text-slate-800">{lead.title}</td>
                                                <td className="p-4 max-w-md text-sm text-slate-500 truncate" title={lead.description}>{lead.description}</td>
                                                <td className="p-4">
                                                    {match ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${match.result.matchScore > 70 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                                {match.result.matchScore}%
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-[#004481]">{match.result.partnerName}</div>
                                                                <div className="text-xs text-slate-500">{match.result.reasoning}</div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs italic">Pending Analysis...</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    {match && (
                                                        <button onClick={() => applyMatch(lead.id)} className="px-3 py-1.5 bg-blue-50 text-[#004481] text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors">
                                                            Approve
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* 3. IMPORT WIZARD */}
            {view === 'import' && (
                <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
                    {isDemoIngesting ? (
                        <div className="bg-white p-12 rounded-3xl shadow-xl border border-slate-200 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
                                <div className="h-full bg-[#004481] transition-all duration-1000 ease-out" style={{ width: `${(demoIngestStep / demoSteps.length) * 100}%` }}></div>
                            </div>
                            
                            <div className="mb-8 flex justify-center">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center animate-pulse">
                                        <Brain size={48} className="text-[#004481]" />
                                    </div>
                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white animate-bounce">
                                        <Sparkles size={16} />
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 mb-2">AI Bulk Ingestion Engine</h3>
                            <p className="text-slate-500 mb-8 max-w-md mx-auto">Processing high-volume lead data through the Nimbus Cloud Intelligence Layer.</p>
                            
                            <div className="space-y-4 max-w-sm mx-auto text-left">
                                {demoSteps.map((step, idx) => (
                                    <div key={idx} className={`flex items-center gap-3 transition-all duration-500 ${idx < demoIngestStep ? 'opacity-100' : idx === demoIngestStep ? 'opacity-100 scale-105' : 'opacity-30'}`}>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${idx < demoIngestStep ? 'bg-green-500 text-white' : idx === demoIngestStep ? 'bg-[#004481] text-white animate-spin' : 'bg-slate-200 text-slate-400'}`}>
                                            {idx < demoIngestStep ? <CheckCircle size={14} /> : idx === demoIngestStep ? <RefreshCw size={14} /> : idx + 1}
                                        </div>
                                        <span className={`text-sm font-bold ${idx === demoIngestStep ? 'text-[#004481]' : 'text-slate-600'}`}>{step}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-12 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4 text-left">
                                <div className="p-2 bg-white rounded-lg shadow-sm"><Database size={20} className="text-[#004481]" /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Source Context</p>
                                    <p className="text-xs font-bold text-slate-700">AWS Partner Network (APN) Lead Export - Q1 2024</p>
                                </div>
                            </div>
                        </div>
                    ) : importStep === 1 ? (
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-start mb-6">
                                <div><h3 className="font-bold text-slate-900 text-xl">Import Lead Data</h3><p className="text-sm text-slate-500">Paste CSV data or load samples.</p></div>
                                <div className="flex gap-2">
                                    <button id="admin-demo-bulk-workflow" onClick={startDemoBulkWorkflow} className="px-4 py-2 bg-orange-500 text-white font-bold rounded-lg text-sm flex items-center gap-2 hover:bg-orange-600 shadow-md transition-all">
                                        <Sparkles size={16} /> Demo: AI Bulk Ingest & Match
                                    </button>
                                    <button id="admin-load-sample" onClick={loadSampleData} className={`px-4 py-2 border font-bold rounded-lg text-sm flex items-center gap-2 ${dataMode === 'live' ? 'border-red-100 text-red-600 bg-red-50' : 'border-green-100 text-green-600 bg-green-50'}`}><Database size={16} /> Load {dataMode} Sample</button>
                                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-slate-100 font-bold rounded-lg text-sm flex items-center gap-2 hover:bg-slate-200"><UploadCloud size={16} /> Upload CSV</button>
                                </div>
                            </div>
                            <textarea className="w-full h-64 p-4 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-[#004481] outline-none whitespace-pre" placeholder="Paste data..." value={importText} onChange={e => setImportText(e.target.value)} />
                            <div className="mt-6 flex justify-end"><button onClick={parseImportData} disabled={!importText.trim()} className="px-6 py-3 bg-[#004481] text-white font-bold rounded-lg hover:bg-blue-900 flex items-center gap-2">Next <ArrowRight size={18} /></button></div>
                        </div>
                    ) : (
                        importStep === 2 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                    <div><h3 className="font-bold text-slate-900">Preview & Action</h3><p className="text-sm text-slate-500">{importedPreview.length} leads detected.</p></div>
                                    <button id="btn-process-import" onClick={processDistribution} className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow flex items-center gap-2"><Send size={18} /> Process Import</button>
                                </div>
                                <div className="overflow-x-auto max-h-[500px]">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-100 text-slate-500 font-bold uppercase sticky top-0"><tr><th className="p-4">Customer</th><th className="p-4">Pre-Assigned Partner</th><th className="p-4">System Action</th></tr></thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {importedPreview.map((lead, i) => {
                                                const hasAssignment = lead.preAssignedPartnerName && lead.preAssignedPartnerName.length > 2;
                                                return (
                                                    <tr key={i} className="hover:bg-slate-50">
                                                        <td className="p-4 font-bold">{lead.customerName}</td>
                                                        <td className="p-4">{hasAssignment ? <span className="font-bold text-[#004481]">{lead.preAssignedPartnerName}</span> : <span className="text-slate-400 italic">None</span>}</td>
                                                        <td className="p-4">
                                                            {hasAssignment ? (
                                                                <span className="inline-flex items-center gap-1 text-green-600 font-bold bg-green-50 px-2 py-1 rounded text-xs"><CheckCircle size={12} /> Assign Direct</span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded text-xs"><Database size={12} /> Queue to Unassigned</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    )}
                </div>
            )}

            {/* 4. PIPELINE VIEW */}
            {view === 'pipeline' && (
                <div className="space-y-6 animate-in fade-in">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-start mb-4"><div className="p-3 bg-blue-50 text-[#004481] rounded-xl"><Target size={20} /></div><span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Pipeline</span></div>
                            <div className="text-3xl font-black text-slate-900">{pipelineStats.total}</div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-start mb-4"><div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><AlertCircle size={20} /></div><span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Unassigned</span></div>
                            <div className="text-3xl font-black text-slate-900">{pipelineStats.unassigned}</div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-start mb-4"><div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign size={20} /></div><span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Value</span></div>
                            <div className="text-3xl font-black text-slate-900">${(pipelineStats.totalValue / 1000).toFixed(1)}k</div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-start mb-4"><div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><BarChart3 size={20} /></div><span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Win Rate</span></div>
                            <div className="text-3xl font-black text-slate-900">{pipelineStats.conversionRate}%</div>
                        </div>
                    </div>

                    {/* Visualization */}
                    <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-6">Pipeline Stage Distribution</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={statusData}><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 600}} /><YAxis axisLine={false} tickLine={false} /><Tooltip cursor={{fill: 'transparent'}} /><Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50}>{statusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Bar></BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Master Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 text-lg">All Opportunities</h3>
                            <button onClick={refreshData} className="p-2 bg-slate-50 rounded-lg hover:bg-slate-100 text-slate-500"><RefreshCw size={16} /></button>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="p-4">Customer</th>
                                    <th className="p-4">Partner</th>
                                    <th className="p-4">Value</th>
                                    <th className="p-4">Stage</th>
                                    <th className="p-4 text-right">Last Updated</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {totalPipeline.map((opp, i) => (
                                    <tr key={i} className={`hover:bg-slate-50 ${!opp.isAssigned ? 'bg-orange-50/30' : ''}`}>
                                        <td className="p-4 font-bold text-slate-800">{opp.title}</td>
                                        <td className="p-4">
                                            {opp.isAssigned ? (
                                                <span className="font-bold text-[#004481]">{opp.partnerName}</span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-orange-600 font-bold bg-orange-100 px-2 py-1 rounded text-xs"><AlertCircle size={10} /> Unassigned</span>
                                            )}
                                        </td>
                                        <td className="p-4">${opp.estArr.toLocaleString()}</td>
                                        <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${opp.stage === 'Closed Won' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{opp.stage}</span></td>
                                        <td className="p-4 text-right text-slate-400 text-xs">{new Date(opp.dateLastUpdated).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
});

export default AdminDashboard;
