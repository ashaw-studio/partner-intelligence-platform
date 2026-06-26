
import { PartnerData, Opportunity, OpportunityStage } from "../types";
import { PILOT_PARTNERS } from "./seedData";

// Key for LocalStorage to simulate a backend database
const DB_KEY = 'partner_intel_db_v1';
const UNASSIGNED_KEY = 'partner_intel_unassigned_leads_v1';

export const dbService = {
    // Save or Update a Partner
    savePartner: (data: PartnerData): void => {
        const currentDb = dbService.getAllPartners();
        const existingIndex = currentDb.findIndex(p => p.email === data.email);
        
        if (existingIndex >= 0) {
            // Merge existing opportunities if we are overwriting (preserving existing pipeline)
            const existingOpps = currentDb[existingIndex].opportunities || [];
            // Use the new data, but ensure opportunities are preserved unless explicitly passed in data
            const newData = { ...data };
            if (!newData.opportunities || newData.opportunities.length === 0) {
                 newData.opportunities = existingOpps;
            }
            
            currentDb[existingIndex] = { ...newData, lastUpdated: new Date().toISOString() };
        } else {
            // Ensure array exists
            const newData = { ...data };
            if (!newData.opportunities) newData.opportunities = [];
            currentDb.push({ ...newData, lastUpdated: new Date().toISOString() });
        }
        
        localStorage.setItem(DB_KEY, JSON.stringify(currentDb));
    },

    // Retrieve all partners (Nimbus Admin View)
    getAllPartners: (): (PartnerData & { lastUpdated?: string })[] => {
        const raw = localStorage.getItem(DB_KEY);
        if (!raw) return [];
        try {
            const data = JSON.parse(raw);
            // Filter out internal test accounts
            return data.filter((p: PartnerData) => p.email !== 'Testuser@testing.com');
        } catch (e) {
            return [];
        }
    },

    // Retrieve specific partner (Partner Login)
    getPartnerByEmail: (email: string): PartnerData | undefined => {
        const all = dbService.getAllPartners();
        return all.find(p => p.email.toLowerCase() === email.toLowerCase());
    },

    // Assign an opportunity to a partner
    assignOpportunity: (partnerEmail: string, opportunity: Opportunity): void => {
        const all = dbService.getAllPartners();
        const idx = all.findIndex(p => p.email === partnerEmail);
        if (idx >= 0) {
            const partner = all[idx];
            if (!partner.opportunities) partner.opportunities = [];
            
            // Check if opp already exists to avoid duplicates
            if (!partner.opportunities.some(o => o.id === opportunity.id)) {
                // Add initial history entry if none exists
                if (opportunity.history.length === 0) {
                    opportunity.history.push({
                        date: new Date().toISOString(),
                        action: 'Assigned',
                        note: 'Opportunity assigned by Nimbus Cloud Admin',
                        actor: 'Admin'
                    });
                }
                partner.opportunities.push(opportunity);
                partner.lastUpdated = new Date().toISOString();
                all[idx] = partner;
                localStorage.setItem(DB_KEY, JSON.stringify(all));
            }
        }
    },

    // Update opportunity status and details
    updateOpportunityDetails: (partnerEmail: string, opportunityId: string, updates: Partial<Opportunity>, newHistoryItem?: { action: string, note: string, actor: 'Partner' | 'Admin' }): void => {
        const all = dbService.getAllPartners();
        const idx = all.findIndex(p => p.email === partnerEmail);
        if (idx >= 0) {
            const partner = all[idx];
            if (!partner.opportunities) return;
            
            const oppIdx = partner.opportunities.findIndex(o => o.id === opportunityId);
            if (oppIdx >= 0) {
                // Merge updates
                partner.opportunities[oppIdx] = {
                    ...partner.opportunities[oppIdx],
                    ...updates,
                    dateLastUpdated: new Date().toISOString()
                };

                // Handle status mapping for closed dates
                if (updates.stage === 'Closed Won' || updates.stage === 'Closed Lost') {
                    partner.opportunities[oppIdx].status = 'Closed';
                    partner.opportunities[oppIdx].dateClosed = new Date().toISOString();
                }

                // Add history
                if (newHistoryItem) {
                    partner.opportunities[oppIdx].history.unshift({
                        date: new Date().toISOString(),
                        action: newHistoryItem.action,
                        note: newHistoryItem.note,
                        actor: newHistoryItem.actor
                    });
                }

                partner.lastUpdated = new Date().toISOString();
                all[idx] = partner;
                localStorage.setItem(DB_KEY, JSON.stringify(all));
            }
        }
    },

    // --- UNASSIGNED LEADS MANAGEMENT ---
    
    getUnassignedLeads: (): Opportunity[] => {
        const raw = localStorage.getItem(UNASSIGNED_KEY);
        if (!raw) return [];
        try {
            const data = JSON.parse(raw);
            return Array.isArray(data) ? data : [];
        } catch (e) {
            return [];
        }
    },

    addUnassignedLead: (lead: Opportunity) => {
        const current = dbService.getUnassignedLeads();
        // Avoid dupes
        if (!current.some(l => l.id === lead.id)) {
            current.push(lead);
            localStorage.setItem(UNASSIGNED_KEY, JSON.stringify(current));
        }
    },

    removeUnassignedLead: (leadId: string) => {
        const current = dbService.getUnassignedLeads();
        const updated = current.filter(l => l.id !== leadId);
        localStorage.setItem(UNASSIGNED_KEY, JSON.stringify(updated));
    },

    clearUnassignedLeads: () => {
        localStorage.removeItem(UNASSIGNED_KEY);
    },

    // Reset DB for demo
    resetDemoData: () => {
        localStorage.removeItem(UNASSIGNED_KEY);
        // Clear all partners and re-seed
        localStorage.removeItem(DB_KEY);
        PILOT_PARTNERS.forEach(p => dbService.savePartner(p));
        console.log("Database reset for demo.");
    },

    // Seed DB for demo purposes if empty (Restored for App.tsx compatibility)
    seedDatabase: () => {
        const existing = dbService.getAllPartners();
        if (existing.length === 0) {
           PILOT_PARTNERS.forEach(p => dbService.savePartner(p));
           console.log("Database seeded with pilot partner data.");
        }
    }
};
