
import React, { useState, useEffect } from 'react';
import { 
    PartnerData, INITIAL_PARTNER_DATA, PartnerTrack, 
    PROVINCES, BUSINESS_MODELS, INDUSTRY_VERTICALS, 
    PUBLIC_SECTOR_SEGMENTS, COMPETENCY_LIST, 
    SDP_LIST, AI_MATRIX_ROWS 
} from '../types';
import { CheckCircle, ArrowRight, ArrowLeft, Info, Building, Globe, Server, Wrench, Truck, Sparkles, Trophy, X } from 'lucide-react';

interface Props {
    onComplete: (data: PartnerData) => void;
    initialData?: PartnerData | null;
    startAtStep?: number;
    onCancel?: () => void;
}

const STEPS = [
    { label: "Start", icon: Info },
    { label: "Profile", icon: Building },
    { label: "Business", icon: Globe },
    { label: "Alignment", icon: Server },
    { label: "Technical", icon: Wrench },
    { label: "Delivery", icon: Truck },
    { label: "GenAI", icon: Sparkles },
    { label: "Sales & ACE", icon: Trophy },
    { label: "Finalize", icon: CheckCircle }
];

// --- Extracted UI Components (outside main component to prevent re-creation on each render) ---
const SectionHeader = ({ title, sub }: { title: string, sub?: string }) => (
    <div className="mb-8 border-b border-slate-100 pb-4">
        <h3 className="text-2xl font-bold text-[#004481]">{title}</h3>
        {sub && <p className="text-slate-500 mt-1 text-sm">{sub}</p>}
    </div>
);

const Label = ({ children, required }: { children?: React.ReactNode, required?: boolean }) => (
    <label className="block text-sm font-semibold text-slate-700 mb-2">
        {children} {required && <span className="text-[#FF9900]">*</span>}
    </label>
);

const TextInput = ({ val, onChange, placeholder }: { val: string, onChange: (s: string) => void, placeholder?: string }) => (
    <input 
        type="text" 
        className="w-full p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#004481] focus:border-transparent outline-none transition-all shadow-sm"
        value={val}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
    />
);

const SelectInput = ({ val, onChange, options }: { val: string, onChange: (s: string) => void, options: string[] }) => (
    <div className="relative">
         <select 
            className="w-full p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#004481] focus:border-transparent outline-none transition-all shadow-sm appearance-none"
            value={val}
            onChange={(e) => onChange(e.target.value)}
        >
            <option value="">Select option...</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
             <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
    </div>
);

const RadioGroup = ({ label, value, options, onChange }: { label: string, value: any, options: string[], onChange: (v: string) => void }) => (
    <div className="mb-6">
        <Label>{label}</Label>
        <div className="flex flex-wrap gap-3 mt-2">
            {options.map(opt => (
                <button
                    key={opt}
                    onClick={() => onChange(opt)}
                    className={`px-5 py-2.5 rounded-lg text-sm border font-medium transition-all ${
                        value === opt 
                        ? 'bg-blue-50 border-[#004481] text-[#004481] shadow-sm' 
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400'
                    }`}
                >
                    {opt}
                </button>
            ))}
        </div>
    </div>
);

const MultiSelectField = ({ selected, options, onToggle }: { selected: string[], options: string[], onToggle: (item: string) => void }) => (
    <div className="flex flex-wrap gap-2">
        {options.map(opt => {
            const isSelected = selected.includes(opt);
            return (
                <button
                    key={opt}
                    onClick={() => onToggle(opt)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                        isSelected 
                        ? 'bg-[#004481] text-white border-[#004481] shadow-md transform scale-105' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                >
                    {opt}
                </button>
            );
        })}
    </div>
);

const IntakeWizard: React.FC<Props> = ({ onComplete, initialData, startAtStep = 0, onCancel }) => {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState<PartnerData>(INITIAL_PARTNER_DATA);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
            setIsEditMode(true);
            // If startAtStep is provided (and > 0), jump there, otherwise default to 1 for edits
            setStep(startAtStep > 0 ? startAtStep : 1); 
        }
    }, [initialData, startAtStep]);

    const handleJumpToStep = (index: number) => {
        // Only allow jumping if we are in edit mode or if the step is previously visited (simple logic: Edit mode allows all)
        if (isEditMode || index < step) {
            setStep(index);
        }
    };

    const updateField = (field: keyof PartnerData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const updateNested = (parent: keyof PartnerData, key: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [parent]: {
                ...(prev[parent] as object),
                [key]: value
            }
        }));
    };

    const toggleArrayItem = (field: keyof PartnerData, item: string) => {
        const currentArr = formData[field] as string[];
        if (currentArr.includes(item)) {
            updateField(field, currentArr.filter(i => i !== item));
        } else {
            updateField(field, [...currentArr, item]);
        }
    };

    const updateAiMatrix = (rowKey: string, val: number) => {
        setFormData(prev => ({
            ...prev,
            aiReadinessMatrix: {
                ...prev.aiReadinessMatrix,
                [rowKey]: val
            }
        }));
    };

    const calculateScoreAndSubmit = () => {
        let capScore = 0;
        capScore += (formData.competencies.length * 5);
        capScore += (formData.sdpStatus.length * 3);
        if (formData.publicSectorActive) capScore += 10;
        if (formData.mapPhasesDelivered.length > 0) capScore += 15;
        if (formData.hasPackagedOffers) capScore += 10;
        
        const techTeamVal = formData.teamSizeTech === "11+" ? 15 : parseInt(formData.teamSizeTech.split('-')[0]) || 0;
        let capacityScore = Math.min(100, (techTeamVal * 10)); 

        const matrixValues = Object.values(formData.aiReadinessMatrix) as number[];
        const aiSum = matrixValues.reduce((a: number, b: number) => a + b, 0);
        const aiAvg = matrixValues.length > 0 ? aiSum / matrixValues.length : 0;
        const aiScore = Math.min(100, aiAvg * 20); 

        let track = PartnerTrack.TRACK_A;
        const hasDeliveryRefs = formData.referenceDetails && formData.referenceDetails.length > 10;
        const hasSDP = formData.sdpStatus.length > 0;
        const isAdvanced = formData.competencies.length >= 2 && techTeamVal >= 5;
        
        if (isAdvanced && hasSDP && hasDeliveryRefs) {
            track = PartnerTrack.TRACK_C;
        } else if (hasSDP || (formData.competencies.length >= 1 && hasDeliveryRefs)) {
            track = PartnerTrack.TRACK_B;
        }

        const finalData: PartnerData = {
            ...formData,
            calculatedTrack: track,
            awsTeamSize: techTeamVal, 
            aiReadinessScore: parseFloat(aiAvg.toFixed(1)),
            scores: {
                capability: Math.min(100, capScore),
                capacity: Math.min(100, capacityScore),
                growth: 65,
                ai: aiScore
            }
        };

        onComplete(finalData);
    };

    // --- UI Components are defined outside the component above ---

    const renderStepContent = () => {
        switch(step) {
            case 0:
                return (
                    <div className="text-center py-12">
                        <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-[#004481]">
                            <Info size={40} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Technical Practice Assessment</h2>
                        <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
                            This intake form allows Nimbus Cloud to assess your AWS practice maturity, identify funding opportunities, and route leads effectively.
                        </p>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-left max-w-2xl mx-auto mb-8">
                             <h4 className="font-bold text-slate-800 mb-2">Confidentiality Statement</h4>
                             <p className="text-sm text-slate-500">
                                Your responses are kept confidential and shared with AWS only for readiness assessment purposes. This is not a legal commitment.
                             </p>
                        </div>
                        <label className="flex items-center justify-center gap-3 cursor-pointer group">
                            <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${formData.agreedToTerms ? 'bg-[#004481] border-[#004481]' : 'border-slate-300 group-hover:border-[#004481]'}`}>
                                {formData.agreedToTerms && <CheckCircle size={14} className="text-white" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={formData.agreedToTerms} onChange={(e) => updateField('agreedToTerms', e.target.checked)} />
                            <span className="font-medium text-slate-800">I have read the disclaimer and agree to proceed.</span>
                        </label>
                    </div>
                );

            case 1: 
                return (
                    <div className="space-y-6 animate-in fade-in">
                        <SectionHeader title="Partner Profile" sub="Core contact and entity details." />
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><Label required>Full Name</Label><TextInput val={formData.contactName} onChange={(v) => updateField('contactName', v)} /></div>
                                <div><Label required>Email Address</Label><TextInput val={formData.email} onChange={(v) => updateField('email', v)} /></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><Label required>Role / Title</Label><TextInput val={formData.roleTitle} onChange={(v) => updateField('roleTitle', v)} /></div>
                                <div><Label>Role Category</Label><SelectInput val={formData.roleCategory} onChange={(v) => updateField('roleCategory', v)} options={["Alliance", "Sales Leader", "Cloud Practice Lead", "Owner/Executive", "Solutions Architect", "Marketing", "Other"]} /></div>
                            </div>
                            <div><Label required>Company Entity Name</Label><TextInput val={formData.companyName} onChange={(v) => updateField('companyName', v)} /></div>
                            <div><Label>Website URL</Label><TextInput val={formData.website} onChange={(v) => updateField('website', v)} placeholder="https://" /></div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6 animate-in fade-in">
                        <SectionHeader title="Business Focus" sub="Where and how you operate." />
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-8">
                            <div><Label>HQ & Operations</Label><MultiSelectField selected={formData.hqProvince as string[]} options={PROVINCES} onToggle={(item) => toggleArrayItem('hqProvince', item)} /></div>
                            <div><Label>Business Model (Multi-select)</Label><MultiSelectField selected={formData.businessModel as string[]} options={BUSINESS_MODELS} onToggle={(item) => toggleArrayItem('businessModel', item)} /></div>
                            <div><Label>Primary Industry Verticals</Label><MultiSelectField selected={formData.industryVerticals as string[]} options={INDUSTRY_VERTICALS} onToggle={(item) => toggleArrayItem('industryVerticals', item)} /></div>
                        </div>
                        
                        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                            <Label>Public Sector Practice?</Label>
                            <div className="flex gap-4 mb-4 mt-2">
                                <button onClick={() => updateField('publicSectorActive', true)} className={`px-4 py-2 rounded-lg text-sm font-medium ${formData.publicSectorActive ? 'bg-[#004481] text-white' : 'bg-white text-slate-600'}`}>Yes</button>
                                <button onClick={() => updateField('publicSectorActive', false)} className={`px-4 py-2 rounded-lg text-sm font-medium ${!formData.publicSectorActive ? 'bg-[#004481] text-white' : 'bg-white text-slate-600'}`}>No</button>
                            </div>
                            {formData.publicSectorActive && (
                                <div className="animate-in fade-in">
                                    <Label>Segments Served</Label>
                                    <MultiSelectField selected={formData.publicSectorSegments as string[]} options={PUBLIC_SECTOR_SEGMENTS} onToggle={(item) => toggleArrayItem('publicSectorSegments', item)} />
                                    <div className="mt-4">
                                        <Label>Contracts / Vehicle Details</Label>
                                        <textarea 
                                            className="w-full p-3 bg-white border border-slate-300 rounded-lg text-sm"
                                            value={formData.publicSectorContracts}
                                            onChange={(e) => updateField('publicSectorContracts', e.target.value)}
                                            placeholder="e.g. Federal Standing Offer, Provincial Vendor of Record..."
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6 animate-in fade-in">
                        <SectionHeader title="AWS Alignment" sub="Programs and revenue standing." />
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                             <div><Label>AWS Competencies</Label><MultiSelectField selected={formData.competencies as string[]} options={COMPETENCY_LIST} onToggle={(item) => toggleArrayItem('competencies', item)} /></div>
                             <div className="pt-4 border-t border-slate-100"><Label>Service Delivery Programs (SDP)</Label><div className="h-40 overflow-y-auto border border-slate-200 rounded-lg p-3 bg-slate-50 mt-2"><MultiSelectField selected={formData.sdpStatus as string[]} options={SDP_LIST} onToggle={(item) => toggleArrayItem('sdpStatus', item)} /></div></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <RadioGroup label="Monthly Resale (MRR)" value={formData.monthlyResale} options={["<$10k", "$10k–$50k", "$50k–$200k", ">$200k"]} onChange={(v) => updateField('monthlyResale', v)} />
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <RadioGroup label="Growth Target (YoY)" value={formData.arrGrowthTarget} options={["<10%", "10–25%", "25–50%", "50%+"]} onChange={(v) => updateField('arrGrowthTarget', v)} />
                            </div>
                        </div>
                    </div>
                );

            case 4:
                 return (
                    <div className="space-y-6 animate-in fade-in">
                         <SectionHeader title="Technical Capacity" sub="Team structure and certifications." />
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <RadioGroup label="Sales Team Size" value={formData.teamSizeSales} options={["0", "1", "2-3", "4-6", "7+"]} onChange={(v) => updateField('teamSizeSales', v)} />
                             </div>
                             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <RadioGroup label="Technical Team Size" value={formData.teamSizeTech} options={["0", "1", "2-3", "4-6", "7-10", "11+"]} onChange={(v) => updateField('teamSizeTech', v)} />
                             </div>
                         </div>
                         <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Trophy size={18} className="text-[#FF9900]" /> Certification Count</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div><Label>Cloud Practitioner</Label><SelectInput val={formData.certCount.practitioner} onChange={(v) => updateNested('certCount', 'practitioner', v)} options={["0","1-2","3-4","5+"]} /></div>
                                <div><Label>Assoc. Architect</Label><SelectInput val={formData.certCount.associate_sa} onChange={(v) => updateNested('certCount', 'associate_sa', v)} options={["0","1-2","3-4","5+"]} /></div>
                                <div><Label>Pro Architect</Label><SelectInput val={formData.certCount.pro_sa} onChange={(v) => updateNested('certCount', 'pro_sa', v)} options={["0","1-2","3-4","5+"]} /></div>
                                <div><Label>Security Spec.</Label><SelectInput val={formData.certCount.specialty_security} onChange={(v) => updateNested('certCount', 'specialty_security', v)} options={["0","1-2","3-4","5+"]} /></div>
                            </div>
                         </div>
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-6 animate-in fade-in">
                        <SectionHeader title="Delivery & Modernization" sub="Methodologies and professional services." />
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                            <RadioGroup label="Infrastructure as Code (IaC) Adoption" value={formData.iacExperience} options={["Yes", "No", "Maybe"]} onChange={(v) => updateField('iacExperience', v)} />
                            <div className="border-t border-slate-100 pt-6">
                                <RadioGroup label="Do you deliver Assessments?" value={formData.deliversAssessments} options={["Yes - in‑house", "Yes - leverage Nimbus", "No, but interested"]} onChange={(v) => updateField('deliversAssessments', v)} />
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <Label>MAP Phases Delivered In-House</Label>
                            <div className="mt-3">
                                <MultiSelectField selected={formData.mapPhasesDelivered as string[]} options={["Assess", "Mobilize", "Migrate & Modernize"]} onToggle={(item) => toggleArrayItem('mapPhasesDelivered', item)} />
                            </div>
                        </div>
                    </div>
                );

            case 6:
                return (
                    <div className="space-y-6 animate-in fade-in">
                        <SectionHeader title="AI & GenAI Readiness" sub="Rate your maturity from 0 (None) to 5 (Scaled)." />
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 mb-6">
                             <RadioGroup label="Do you build AI solutions today?" value={formData.buildsAiSolutions} options={["Yes (production)", "Yes (POC)", "No"]} onChange={(v) => updateField('buildsAiSolutions', v)} />
                        </div>
                        
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-slate-50 p-4 border-b border-slate-200 grid grid-cols-12 gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <div className="col-span-6">Capability / Service</div>
                                <div className="col-span-6 text-center flex justify-between px-2"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div>
                            </div>
                            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                                {AI_MATRIX_ROWS.map(row => {
                                    const val = formData.aiReadinessMatrix[row] || 0;
                                    return (
                                        <div key={row} className="p-4 grid grid-cols-12 gap-2 items-center hover:bg-slate-50 transition-colors">
                                            <div className="col-span-6 text-sm font-medium text-slate-700 truncate pr-2" title={row}>{row}</div>
                                            <div className="col-span-6 flex justify-between px-2">
                                                {[0,1,2,3,4,5].map(score => (
                                                    <div key={score} className="flex items-center justify-center w-full">
                                                        <input 
                                                            type="radio" 
                                                            name={row} 
                                                            className="w-4 h-4 text-[#004481] cursor-pointer focus:ring-[#004481]" 
                                                            checked={val === score} 
                                                            onChange={() => updateAiMatrix(row, score)} 
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                );
            
            case 7:
                 return (
                    <div className="space-y-6 animate-in fade-in">
                        <SectionHeader title="Sales Excellence" sub="ACE Pipeline and References." />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <Label>ACE Win Rate (%)</Label><TextInput val={formData.aceWinRate} onChange={(v) => updateField('aceWinRate', v)} placeholder="e.g. 25" />
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <Label>ACE ARR Value (Avg)</Label><SelectInput val={formData.aceArrValue} onChange={(v) => updateField('aceArrValue', v)} options={["<$50k", "$50k–$250k", "$250k–$1M", ">$1M"]} />
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <Label required>Customer References (Evidence Check)</Label>
                            <p className="text-sm text-slate-500 mb-3">Please list 2-3 customer references (Name, Industry, Workload, Outcome).</p>
                            <textarea 
                                className="w-full p-4 border border-slate-300 rounded-lg text-sm h-32 focus:ring-2 focus:ring-[#004481] focus:border-transparent outline-none"
                                value={formData.referenceDetails} 
                                onChange={(e) => updateField('referenceDetails', e.target.value)} 
                                placeholder="Example: Acme Corp, Mfg, Migration. Reduced costs by 20%..."
                            />
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                             <Label>Packaged Offers / Solutions</Label>
                             <RadioGroup label="Do you have repeatable offers?" value={formData.hasPackagedOffers ? "Yes" : "No"} options={["Yes", "No"]} onChange={(v) => updateField('hasPackagedOffers', v === "Yes")} />
                             {formData.hasPackagedOffers && (
                                <textarea 
                                    className="w-full p-3 bg-white border border-slate-300 rounded-lg text-sm mt-2"
                                    value={formData.packagedOffersDetails}
                                    onChange={(e) => updateField('packagedOffersDetails', e.target.value)}
                                    placeholder="Describe your solution (e.g., Data Lake Foundation)"
                                />
                             )}
                        </div>
                    </div>
                );

            case 8:
                return (
                    <div className="space-y-6 animate-in fade-in">
                        <SectionHeader title="Final Details" sub="Review contacts and GTM needs." />
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                             <Label>GTM Activities of Interest</Label>
                             <div className="mt-3"><MultiSelectField selected={formData.gtmActivities as string[]} options={["Case Study", "Webinar", "Workshop", "Marketplace Listing", "Event Sponsorship", "Campaign/ABM"]} onToggle={(item) => toggleArrayItem('gtmActivities', item)} /></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <Label>Primary Business Contact</Label><TextInput val={formData.primaryBusinessContact.name} onChange={(v) => updateNested('primaryBusinessContact', 'name', v)} placeholder="Name" />
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <Label>Primary Technical Contact</Label><TextInput val={formData.primaryTechContact.name} onChange={(v) => updateNested('primaryTechContact', 'name', v)} placeholder="Name" />
                            </div>
                        </div>
                    </div>
                );

            default: return null;
        }
    };

    // --- Main Layout ---
    return (
        <div className="flex flex-col lg:flex-row gap-8 min-h-[700px] relative">
             {/* Cancel Button for Edit Mode */}
             {(isEditMode || onCancel) && (
                 <button 
                    onClick={onCancel}
                    className="absolute top-0 right-0 m-4 lg:-top-12 lg:right-0 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors flex items-center gap-1 text-sm font-bold"
                 >
                     <X size={16} /> Cancel & Return
                 </button>
             )}

             {/* Left Progress Sidebar */}
             <div className="w-full lg:w-64 flex-shrink-0">
                 <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-24">
                     <h4 className="font-bold text-slate-800 mb-6 text-sm uppercase tracking-wide">Progress</h4>
                     <div className="space-y-0 relative">
                         <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-slate-100 -z-10"></div>
                         {STEPS.map((s, i) => {
                             const Icon = s.icon;
                             const isCurrent = i === step;
                             const isCompleted = i < step;
                             const isClickable = isEditMode || isCompleted;
                             return (
                                 <div 
                                    key={i} 
                                    className={`flex items-center gap-3 py-3 ${isClickable ? 'cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded-lg' : 'opacity-50'}`}
                                    onClick={() => handleJumpToStep(i)}
                                 >
                                     <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors z-10 ${
                                         isCurrent ? 'bg-[#004481] border-[#004481] text-white' : 
                                         isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                                         'bg-white border-slate-200 text-slate-300'
                                     }`}>
                                         {isCompleted ? <CheckCircle size={14} /> : <Icon size={14} />}
                                     </div>
                                     <span className={`text-sm font-medium ${isCurrent ? 'text-[#004481]' : isCompleted ? 'text-slate-600' : 'text-slate-400'}`}>
                                         {s.label}
                                     </span>
                                 </div>
                             )
                         })}
                     </div>
                 </div>
             </div>

             {/* Right Content */}
             <div className="flex-1 bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col">
                 <div className="flex-1 p-8 md:p-10">
                     {renderStepContent()}
                 </div>

                 {/* Actions Footer */}
                 <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center rounded-b-xl">
                     {step === 0 ? (
                         <div className="w-full flex justify-end">
                             <button 
                                 onClick={() => setStep(1)}
                                 disabled={!formData.agreedToTerms}
                                 className="flex items-center gap-2 px-8 py-4 bg-[#004481] text-white rounded-lg shadow-lg hover:shadow-xl hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-lg"
                             >
                                 Start Assessment <ArrowRight size={20} />
                             </button>
                         </div>
                     ) : (
                         <>
                             <button 
                                 onClick={() => setStep(s => s - 1)}
                                 className="flex items-center gap-2 px-6 py-3 text-slate-600 hover:text-slate-900 font-medium hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                             >
                                 <ArrowLeft size={18} /> Back
                             </button>

                             {step < STEPS.length - 1 ? (
                                 <button 
                                     onClick={() => setStep(s => s + 1)}
                                     className="flex items-center gap-2 px-8 py-3 bg-[#004481] text-white rounded-lg shadow-md hover:bg-blue-900 transition-all font-bold"
                                 >
                                     Continue <ArrowRight size={18} />
                                 </button>
                             ) : (
                                 <button 
                                     onClick={calculateScoreAndSubmit}
                                     className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-all font-bold"
                                 >
                                     {isEditMode ? 'Update Profile' : 'Submit Assessment'} <CheckCircle size={18} />
                                 </button>
                             )}
                         </>
                     )}
                 </div>
             </div>
        </div>
    );
};

export default IntakeWizard;
