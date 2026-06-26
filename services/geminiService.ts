
import { GoogleGenAI } from "@google/genai";
import { PartnerData, OpportunityMatchRequest, MatchResult } from "../types";

// Current, valid Gemini model id for the @google/genai SDK.
const MODEL = "gemini-2.5-flash";

// Lazy initialization — only creates the client when an API key is available
const getAI = () => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    return new GoogleGenAI({ apiKey: key });
};

// Deterministic, partner-aware response used when no API key is configured
// (e.g. the public demo build) or when the AI service is unreachable. This
// keeps the consultant useful and on-message without requiring a live key.
const buildFallbackConsultantReply = (partnerData: PartnerData, userMessage: string): string => {
    const track = partnerData.calculatedTrack || "your current track";
    const ai = partnerData.scores?.ai ?? 0;
    const cap = partnerData.scores?.capability ?? 0;
    const name = partnerData.companyName || "your practice";

    const recs: string[] = [];
    if (ai < 50) recs.push("stand up a first Generative AI use case on Amazon Bedrock to lift your AI Readiness score");
    if (cap < 60) recs.push("target one additional AWS Competency or Service Delivery designation to deepen capability");
    recs.push("register active opportunities in ACE and tap MAP funding to accelerate migration deals");

    return (
        `Here's how I'd think about accelerating ${name} (${track}):\n\n` +
        recs.map((r, i) => `${i + 1}. ${r}.`).join("\n") +
        `\n\n(Demo note: this is a deterministic response. Add a GEMINI_API_KEY to enable live, fully conversational AI replies.)`
    );
};

export const generateConsultantResponse = async (
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    partnerData: PartnerData,
    userMessage: string
): Promise<string> => {
    const ai = getAI();
    if (!ai) {
        // No key configured — return a helpful, on-brand fallback instead of an error.
        return buildFallbackConsultantReply(partnerData, userMessage);
    }

    const systemInstruction = `
    You are the "Nimbus Cloud AWS Practice Consultant" AI.
    You are analyzing the scorecard data of an AWS Partner named ${partnerData.companyName}.

    Here is their raw data context:
    ${JSON.stringify(partnerData, null, 2)}

    Your goal is to enable partner transformation.

    Tracks:
    - Track A (Foundations): Needs playbooks, co-sell structure, 1-2 validated wins.
    - Track B (Delivery Ready): Needs to accelerate funding execution, joint GTM.
    - Track C (Strategic): Prioritize for strategic accounts, co-invest.

    Current Status:
    - Track: ${partnerData.calculatedTrack}
    - Capabilities: ${partnerData.scores?.capability}/100
    - AI Readiness: ${partnerData.scores?.ai}/100

    Analyze their specific gaps and recommend concrete next actions. Be concise and practical.
    `;

    try {
        // Gemini requires the conversation history to begin with a 'user' turn.
        // The UI seeds a 'model' greeting, so drop any leading model turns.
        const safeHistory = [...history];
        while (safeHistory.length && safeHistory[0].role === 'model') {
            safeHistory.shift();
        }

        const chat = ai.chats.create({
            model: MODEL,
            config: { systemInstruction },
            history: safeHistory,
        });

        const result = await chat.sendMessage({ message: userMessage });
        return result.text || buildFallbackConsultantReply(partnerData, userMessage);
    } catch (error) {
        console.error("Gemini API Error:", error);
        return buildFallbackConsultantReply(partnerData, userMessage);
    }
};

// Deterministic fallback matcher: ranks partners by capability/score so the
// demo always returns sensible results without an API key.
const buildFallbackMatches = (partners: PartnerData[]): MatchResult[] => {
    return [...partners]
        .sort((a, b) => (b.scores?.capability ?? 0) - (a.scores?.capability ?? 0))
        .slice(0, 3)
        .map((p, i) => ({
            partnerName: p.companyName,
            matchScore: 92 - i * 7,
            track: p.calculatedTrack || 'Unknown',
            reasoning: `Strong capability profile (${p.scores?.capability ?? 0}/100) and relevant competencies for this workload.`,
        }));
};

export const matchOpportunity = async (
    partners: PartnerData[],
    opportunity: OpportunityMatchRequest
): Promise<MatchResult[]> => {
    if (partners.length === 0) return [];

    const ai = getAI();
    if (!ai) {
        return buildFallbackMatches(partners);
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
    Act as the Nimbus Cloud Partner Matching Engine.

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
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const text = response.text;
        if (!text) throw new Error("No response");

        // Sanitize markdown if model ignores instructions
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanText);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : buildFallbackMatches(partners);
    } catch (e) {
        console.error(e);
        return buildFallbackMatches(partners);
    }
};
