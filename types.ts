
// Enums and Constants for the Questionnaire

export enum PartnerTrack {
    TRACK_A = "Longtail Account - Foundational",
    TRACK_B = "Emerging Account - Growth",
    TRACK_C = "Strategic Account - Scale"
}

export const PROVINCES = [
    "Alberta (AB)", "British Columbia (BC)", "Manitoba (MB)", "New Brunswick (NB)", 
    "Newfoundland and Labrador (NL)", "Nova Scotia (NS)", "Northwest Territories (NT)", 
    "Nunavut (NU)", "Ontario (ON)", "Prince Edward Island (PE)", "Quebec (QC)", 
    "Saskatchewan (SK)", "Yukon (YT)"
];

export const BUSINESS_MODELS = [
    "MSP", "VAR", "Consultancy", "ISV", "SI / GSI", "Born-in-Cloud", "ProServe Boutique", "Other"
];

export const INDUSTRY_VERTICALS = [
    "Manufacturing", "Retail", "Hi‑Tech", "Telco", "Media & Entertainment", "Sports", "Games",
    "Automotive", "Energy & Utilities", "Financial Services (FSI)", "ISV / Software", 
    "Healthcare", "Public Sector", "Other"
];

export const PUBLIC_SECTOR_SEGMENTS = [
    "Federal Govt", "Provincial Govt", "Municipal Govt", "Education K-12", "Higher Ed",
    "Healthcare - Hospitals", "Public Health", "Nonprofit", "Crown Corps", "Utilities", 
    "Public Safety", "Indigenous Org"
];

export const AWS_PROGRAMS = [
    "Think Big for Small Business", "Well‑Architected Partner", "ISV Accelerate", "Immersion Days"
];

export const COMPETENCY_LIST = [
    "Migration", "DevOps", "Data & Analytics", "Machine Learning", "Security", "Containers", 
    "Microsoft Workloads", "SAP", "Mainframe", "Networking", "Healthcare", "Life Sciences", 
    "Financial Services", "Retail", "Government", "Education", "Nonprofit", "Media & Entertainment", 
    "Telecommunications", "Energy", "HPC", "IoT", "Generative AI"
];

export const SDP_LIST = [
    "API Gateway", "AppFlow", "Aurora", "CloudFront", "Control Tower", "Direct Connect", 
    "DynamoDB", "EKS", "ECS/Fargate", "Lambda", "RDS", "Redshift", "Glue", "Kinesis", 
    "EMR", "OpenSearch", "SageMaker", "QuickSight", "Connect", "WAF", "Transit Gateway", 
    "DMS", "MGN", "Backup", "Outposts"
];

// AI Matrix Types
export interface AiReadinessMatrix {
    [key: string]: number; // 0-5
}

export const AI_MATRIX_ROWS = [
    "[Use case] RAG on enterprise data",
    "[Use case] Contact Center AI",
    "[Use case] Copilots / chatbots",
    "[Use case] Code productivity",
    "[Use case] Document understanding",
    "[Use case] Forecasting / personalization",
    "[Use case] Anomaly / fraud detection",
    "[Use case] Vision or speech",
    "[Service] Amazon Bedrock",
    "[Service] Amazon Q Business",
    "[Service] Amazon SageMaker",
    "[Service] Amazon Kendra / OpenSearch",
    "[Service] Comprehend / Textract",
    "[Service] Amazon Personalize / Forecast",
    "[Model] Foundation models via Bedrock",
    "[Model] Open-source models on ECS/EKS",
    "[Model] Fine-tuning on SageMaker",
    "[Model] Classical ML on SageMaker",
    "[Model] Third-party ISV AI"
];

export type OpportunityStage = 'New' | 'Qualifying' | 'Technical Validation' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';

export interface OpportunityContact {
    name: string;
    email: string;
    role: string;
}

export interface OpportunityHistory {
    date: string;
    action: string;
    note: string;
    actor: 'Admin' | 'Partner';
}

export interface Opportunity {
    id: string;
    title: string;
    customerSegment: string;
    description: string;
    estArr: number;
    // Enhanced Fields
    contact?: OpportunityContact;
    stage: OpportunityStage; 
    status: 'Active' | 'Closed'; // High level status
    probability: number;
    source: 'Manual' | 'Bulk Upload' | 'Lead Form' | 'AI Bulk Ingest';
    history: OpportunityHistory[];
    partnerActionItems?: string;
    
    dateCreated: string;
    dateLastUpdated: string;
    dateClosed?: string;
}

export interface PartnerData {
    // 1. Intake Agreement & Profile
    agreedToTerms: boolean;
    contactName: string;
    email: string;
    roleTitle: string;
    roleCategory: string; // "Alliance", "Sales Leader", etc.
    companyName: string;
    website: string;
    
    // 2. Geography
    hqProvince: string[];
    sellToProvinces: string[];
    sellToUSA: boolean;
    
    // 3. Business Strategy
    segmentFocus: string; // Enterprise, SMB, etc.
    businessModel: string[];
    industryVerticals: string[];
    publicSectorActive: boolean;
    publicSectorSegments: string[];
    publicSectorContracts: string; // Optional text
    
    // 4. AWS Alignment
    enrolledPrograms: string[];
    competencies: string[];
    sdpStatus: string[];
    pursuingResale: string; // Yes/No
    resaleAssistanceNeeded: string;
    monthlyResale: string;
    arrGrowthTarget: string;
    cloudCheckrUsage: string;
    
    // 5. Technical Capacity (Team)
    teamSizeSales: string; // Banded 0, 1, 2-3...
    teamSizeTech: string;
    headcount: {
        sa: string;
        delivery: string;
        dataAi: string;
        finOps: string;
        pm: string;
    };
    certCount: {
        practitioner: string;
        associate_sa: string;
        associate_dev: string;
        associate_sysops: string;
        pro_sa: string;
        pro_devops: string;
        specialty_security: string;
        specialty_data: string;
        specialty_ml: string;
        specialty_db: string;
        specialty_net: string;
        specialty_sap: string;
    };
    
    // 6. Delivery
    iacExperience: string; // Yes/No/Maybe
    deliversAssessments: string;
    mapFamiliarity: number; // 0-100 scale UI, or string
    mapPhasesDelivered: string[];
    distributorPsValue: number; // 1-10
    distributorPsNeeds: string; // Open text
    
    // 7. AI & Modernization
    buildsAiSolutions: string; // Yes prod, Yes POC, No
    aiReadinessMatrix: AiReadinessMatrix;
    aiOffersDescription: string;
    aiGtmInterest: string;
    
    // 8. References & ACE
    provideReferences: boolean;
    referenceDetails: string;
    aceWinRate: string;
    aceArrValue: string;
    demandGenRoutes: string[];
    aceUsageMaturity: string;
    hasSca: boolean;
    
    // 9. Offerings & Support
    hasPackagedOffers: boolean;
    packagedOffersDetails: string;
    managedServicesMaturity: number; // 1-10 slider
    interestedIn24x7Support: boolean;
    interestedInMdf: string; // Yes/No/Maybe
    gtmActivities: string[];
    enablementNeeds: string[];
    
    // 10. Contacts
    primaryBusinessContact: { name: string; email: string };
    primaryTechContact: { name: string; email: string };

    // Calculated / Legacy Fields for Compatibility
    calculatedTrack?: PartnerTrack;
    scores?: {
        capability: number;
        capacity: number;
        growth: number;
        ai: number;
    }
    // Mapping old fields to new structure for type safety if needed
    awsTeamSize?: number; // derived from teamSizeTech
    aiReadinessScore?: number; // derived from matrix
    
    // Opportunity / Pipeline Data
    opportunities: Opportunity[];
}

export const INITIAL_PARTNER_DATA: PartnerData = {
    agreedToTerms: false,
    contactName: "",
    email: "",
    roleTitle: "",
    roleCategory: "",
    companyName: "",
    website: "",
    hqProvince: [],
    sellToProvinces: [],
    sellToUSA: false,
    segmentFocus: "",
    businessModel: [],
    industryVerticals: [],
    publicSectorActive: false,
    publicSectorSegments: [],
    publicSectorContracts: "",
    enrolledPrograms: [],
    competencies: [],
    sdpStatus: [],
    pursuingResale: "Yes",
    resaleAssistanceNeeded: "No",
    monthlyResale: "<$10k",
    arrGrowthTarget: "10–25%",
    cloudCheckrUsage: "",
    teamSizeSales: "0",
    teamSizeTech: "0",
    headcount: { sa: "0", delivery: "0", dataAi: "0", finOps: "0", pm: "0" },
    certCount: {
        practitioner: "0", associate_sa: "0", associate_dev: "0", associate_sysops: "0",
        pro_sa: "0", pro_devops: "0", specialty_security: "0", specialty_data: "0",
        specialty_ml: "0", specialty_db: "0", specialty_net: "0", specialty_sap: "0"
    },
    iacExperience: "No",
    deliversAssessments: "No, but I'd like to explore",
    mapFamiliarity: 0,
    mapPhasesDelivered: [],
    distributorPsValue: 5,
    distributorPsNeeds: "",
    buildsAiSolutions: "No, but I'm interested to learn more",
    aiReadinessMatrix: {},
    aiOffersDescription: "",
    aiGtmInterest: "Maybe — need more info",
    provideReferences: false,
    referenceDetails: "",
    aceWinRate: "",
    aceArrValue: "<$50k",
    demandGenRoutes: [],
    aceUsageMaturity: "",
    hasSca: false,
    hasPackagedOffers: false,
    packagedOffersDetails: "",
    managedServicesMaturity: 3,
    interestedIn24x7Support: false,
    interestedInMdf: "Maybe",
    gtmActivities: [],
    enablementNeeds: [],
    primaryBusinessContact: { name: "", email: "" },
    primaryTechContact: { name: "", email: "" },
    opportunities: []
};

export interface OpportunityMatchRequest {
    segment: string;
    workload: string;
    complexity: 'Simple' | 'Medium' | 'Complex';
    region: string;
    description: string;
}

export interface MatchResult {
    partnerName: string;
    matchScore: number;
    track: string;
    reasoning: string;
    blockers?: string[];
    // Helper to find original partner data to assign opp
    _originalPartner?: PartnerData;
}
