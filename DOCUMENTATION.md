# Partner Intelligence Platform — Product Documentation

## 1. Executive Summary

The **Partner Intelligence Platform** modernizes how Nimbus Cloud assesses, enables, and accelerates its cloud partner ecosystem. It replaces reactive, spreadsheet-based management with a proactive, AI-powered revenue engine.

**Pilot scope:** AWS partners in Canada (7 active partners). Architecture supports multi-cloud and global expansion.

### Core Value Propositions

- **Accelerated Time-to-Revenue:** Automatically identifies eligible vendor funding (MAP, OLA, POC), helping partners close deals faster.
- **Data-Driven Lead Routing:** Generative AI matches opportunities to the partner with the highest probability of closing, based on verified capabilities — not relationships.
- **24/7 Partner Enablement:** AI Practice Consultant provides personalized strategic advice tailored to each partner's exact scorecard and gaps.
- **Ecosystem Visibility:** Real-time view of the entire partner base — identifying capability gaps (e.g., shortage of AI/ML partners) before they impact revenue.

---

## 2. User Stories

### For Cloud Partners
- Complete an intuitive intake assessment (50+ data points) without spreadsheets
- See a real-time "Maturity Score" across Capability, Capacity, and AI Readiness
- Simulate vendor funding eligibility for upcoming projects
- Get AI-driven strategic advice on practice growth and tier advancement

### For Nimbus Cloud Admins (PDMs / Leadership)
- View all partners in a centralized dashboard, categorized by Maturity Track (A/B/C)
- Bulk-import leads from CSV and have the system auto-parse and route them
- Use AI Matching to get top 3 best-fit partners per lead with confidence scores
- Track the full pipeline from lead assignment through deal close

---

## 3. How the Modules Work

### A. Intake Wizard (`IntakeWizard.tsx`)
A multi-step form capturing 50+ data points: demographics, business model, certifications, AWS competencies, and AI readiness. On submission, the Scoring Engine calculates maturity scores and assigns a Track.

### B. Partner Dashboard (`Dashboard.tsx`)
The partner's "mission control" — visualizes scores via radar and bar charts, breaks down business model (resell vs. services), and houses the Funding Calculator. Also passes the partner's full profile into the AI Consultant for context-aware advice.

### C. Admin Command Center (`AdminDashboard.tsx`)
The global view for Nimbus Cloud. Aggregates all partner profiles into a searchable, filterable grid. Contains the Lead Import tool and AI Matching engine.

### D. AI Services (`geminiService.ts` & `ChatBot.tsx`)
Powered by Google Gemini. For partners, it acts as an interactive consultant. For admins, it acts as a silent analysis engine that processes lead arrays against partner capabilities and returns structured match recommendations.

---

## 4. Scoring Engine

### Track System (Maturity Levels)
- **Track A (Foundational):** Registered but limited delivery experience
- **Track B (Growth):** 1+ competency or SDP with validated references
- **Track C (Strategic):** 2+ competencies, robust engineering team, SDP active

### Vector Scores (0–100 each)

**Capability Score** — Technical depth
- AWS Competencies × 5 points
- Service Delivery Programs × 3 points
- Public Sector status + 10 points

**Capacity Score** — Execution scale
- Derived from technical team size bands (1–5 engineers = 30pts, 11+ = 80pts, etc.)

**AI Readiness Score** — GenAI maturity
- 19-dimension Likert scale (0–5 per dimension)
- Averaged and normalized to 0–100

---

## 5. AI-Powered Features

### Practice Consultant (Partner-Facing)
The chatbot injects the partner's complete scorecard into the system prompt. The AI responds with specific, actionable advice referencing their exact gaps — not generic recommendations.

### Opportunity Matcher (Admin-Facing)
For each unassigned lead, the AI evaluates all partners using weighted criteria:
- **40%** Capability alignment (competencies vs. workload type)
- **20%** Track maturity (complex deals → Track B/C only)
- **15%** Geographic proximity
- **10%** Industry vertical overlap

Returns top 3 matches with confidence scores and plain-English reasoning.

---

## 6. Production Roadmap

| Area | Current (MVP) | Production Target |
|---|---|---|
| Data | LocalStorage (browser) | PostgreSQL / DynamoDB |
| Auth | Simulated RBAC | SSO / AWS Cognito |
| AI Backend | Client-side API calls | Serverless edge functions |
| Hosting | Vercel (static) | Enterprise cloud deployment |
| Scope | AWS Canada (7 partners) | Multi-cloud, global |
| Integration | Manual CSV import | API sync with vendor portals |

---

## 7. Security Notes

- **API Keys:** Loaded via environment variables, never hardcoded. In production, AI calls move server-side.
- **Data Isolation:** Multi-tenant isolation simulated in MVP. Production uses database-level row security.
- **PII Handling:** Demo data is anonymized. Live data import uses the file upload feature (not stored in code).
