
import { GoogleGenAI } from "@google/genai";
import { PartnerData, OpportunityMatchRequest, MatchResult } from "../types";

// Lazy initialization — only creates the client when an API key is available
const getAI = () => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    return new GoogleGenAI({ apiKey: key });
};

export const generateConsultantResponse = async (
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    partnerData: PartnerData,
    userMessage: string
): Promise<string> => {
    if (!process.env.GEMINI_API_KEY) {
        return "API Key is missing. Please configure the environment.";
    }

    const systemInstruction = `
    You are the "Nimbus Cloud AWS Practice Consultant" AI. 
    You are analyzing the scorecard data of an AWS Partner named ${partnerData.companyName}.
    
    Here is their raw data context:
    ${JSON.stringify(partnerData, null, 2)}
    
    Your Goal is to enable partner transformation.
    
    Tracks:
    - Track A (Foundations): Needs playbooks, co-sell structure, 1-2 validated wins.
    - Track B (Delivery Ready): Needs to accelerate funding execution, joint GTM.
    - Track C (Strategic): Prioritize for strategic accounts, co-invest.
    
    Current Status:
    - Track: ${partnerData.calculatedTrack}
    - Capabilities: ${partnerData.scores?.capability}/100
    - AI Readiness: ${partnerData.scores?.ai}/100
    
    Analyze their specific gaps and recommend Nimbus Cloud actions based on the "Nimbus actions" column in the rubric.
    `;

    try {
        const ai = getAI();
        if (!ai) return "API Key is missing. Please configure the environment.";
        
        const model = "gemini-3-flash-preview"; 
        const chat = ai.chats.create({
            model: model,
            config: {
                systemInstruction: systemInstruction,
            },
            history: history, 
        });

        const result = await chat.sendMessage({ message: userMessage });
        return result.text || "I couldn't generate a response at this time.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "I apologize, but I am having trouble connecting to the consultant service right now. Please try again later.";
    }
};

export const matchOpportunity = async (
    partners: PartnerData[],
    opportunity: OpportunityMatchRequest
): Promise<MatchResult[]> => {
     if (partners.length === 0) return [];

     if (!process.env.GEMINI_API_KEY) {
         console.warn("API Key missing, using fallback match logic.");
         return partners.slice(0, 3).map(p => ({
             partnerName: p.companyName,
             matchScore: 50 + Math.floor(Math.random() * 40),
             track: p.calculatedTrack || 'Unknown',
             reasoning: "Automated fallback match due to missing API key."
         }));
     }

     // Minified context to save tokens
     const partnersContext = partners.map(p => ({
         name: p.companyName,
         track: p.calculatedTrack,
         competencies: p.competencies,
         location: p.hqProvince,
         verticals: p.industryVerticals,
         score: p.scores
     }));

     const prompt = `
     Act as the Nimbus Cloud Partner Matching Engine (MVP).
     
     Opportunity Profile:
     - Segment: ${opportunity.segment}
     - Workload: ${opportunity.workload}
     - Complexity: ${opportunity.complexity}
     - Region: ${opportunity.region}
     - Description: ${opportunity.description}
     
     Scoring Rules (Weights):
     - Capability Fit (40%): Do competencies match workload?
     - Track / Maturity (20%): Track A for simple, B/C for complex.
     - Operational Readiness (15%): Region match.
     - Strategic Alignment (10%): Vertical match.
     
     Task:
     Evaluate the provided partners and return the TOP 3 matches.
     If a partner is a hard mismatch (wrong region, totally wrong capabilities), do not list them or give them 0 score.
     
     Partners:
     ${JSON.stringify(partnersContext)}
     
     IMPORTANT: Return ONLY valid JSON. Do not include markdown formatting like \`\`\`json.
     
     Format:
     [
         { 
             "partnerName": "string", 
             "matchScore": number (0-100), 
             "track": "string", 
             "reasoning": "string (explain why based on rubric)",
             "blockers": ["string"] (optional)
         }
     ]
     `;

     try {
         const ai = getAI();
         if (!ai) throw new Error("No API key");
         
         const response = await ai.models.generateContent({
             model: "gemini-3-flash-preview",
             contents: prompt,
             config: {
                 responseMimeType: "application/json"
             }
         });
         
         const text = response.text;
         if(!text) throw new Error("No response");

         // Sanitize markdown if model ignores instructions
         const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
         
         return JSON.parse(cleanText);
     } catch (e) {
         console.error(e);
         // Fallback mock logic if API fails
         return partners.slice(0, 3).map(p => ({
             partnerName: p.companyName,
             matchScore: 50,
             track: p.calculatedTrack || 'Unknown',
             reasoning: "Automated fallback match due to AI service interruption."
         }));
     }
};
