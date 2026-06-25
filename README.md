# Partner Intelligence Platform

> A full-stack portfolio project: an AI-powered ecosystem portal that digitizes cloud-partner assessment, funding optimization, and intelligent lead matching. Built around a fictional cloud distributor, **Nimbus Cloud**, managing its AWS partner network.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6-purple?logo=vite)
![AI](https://img.shields.io/badge/AI-Google%20Gemini-orange?logo=google)

---

## About This Project

This is a **personal portfolio demo** I built to showcase product thinking and full-stack engineering across a realistic B2B SaaS workflow: partner onboarding, scoring, AI-assisted consulting, and pipeline management.

> **All data is fictional.** Company names, contacts, emails, and phone numbers are invented for demonstration. Emails use the reserved `.example.com` domain and phone numbers use the reserved `555` range. Nothing in this repository represents a real organization, customer, or individual.

The domain — a distributor enabling cloud partners — is modeled on patterns common to the cloud channel (AWS partner programs like MAP, OLA, MDF, and ACE are publicly documented). It's a vehicle for demonstrating the engineering, not a representation of any specific company.

---

## The Problem It Solves

Managing a partner ecosystem is often manual, spreadsheet-heavy, and hard to scale:

- **No visibility** into partner technical maturity across regions
- **Missed funding** — partners don't know what programs they qualify for
- **Slow lead routing** — manually matching opportunities to the right partner takes hours
- **Relationship-based decisions** instead of data-driven ones

## The Solution

A single intelligence layer across the partner lifecycle:

| Capability | What It Does | Why It Matters |
|---|---|---|
| **Partner Scorecard** | 360° maturity assessment across Capability, Capacity, AI Readiness | Replaces subjective assessments with data |
| **Funding Calculator** | Instant funding estimates (MAP, OLA, POC, MDF) based on tier | Accelerates deal velocity |
| **AI Practice Consultant** | Context-aware chatbot that knows each partner's exact gaps | Enablement at scale, 24/7 |
| **Bulk Lead Ingestion** | CSV import with automatic parsing and partner detection | Minutes instead of days |
| **AI Opportunity Matcher** | Ranks top partner matches per lead with confidence scores | Data-driven routing |
| **Pipeline Governance** | End-to-end deal tracking from assignment through close | Full ecosystem visibility |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS |
| **Build** | Vite 6 |
| **Charts** | Recharts |
| **AI** | Google Gemini (with graceful fallbacks when no key is configured) |
| **Server** | Express + Vite middleware (`server.ts`) |
| **Data** | LocalStorage (simulates a backend; designed to swap for a real DB) |

---

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- (Optional) a [Google Gemini API Key](https://aistudio.google.com/apikey) — AI features fall back gracefully without one

### Setup
```bash
# Install dependencies
npm install

# (Optional) configure AI features
cp .env.example .env
# add your GEMINI_API_KEY to .env

# Start the dev server
npm run dev
```

Open **http://localhost:3000**.

> Without a Gemini API key, the AI Consultant and Opportunity Matcher use deterministic fallback responses. Every other feature works fully.

---

## Demo Walkthrough (10 minutes)

The app ships with **7 pre-seeded fictional partners** and sample lead data for a complete end-to-end demo.

### Phase 1 — Partner Experience
1. Select **"Partner Portal"** → **"Show Demo Users"** → choose **Apex Data Corporation**
2. **Executive Scorecard** — view the 360° maturity radar, certifications, AI readiness
3. **Funding Calculator** — select Migration, enter $500K ARR → instant funding breakdown
4. **AI Consultant** — ask *"How can I increase my AI readiness score?"* and watch it reference specific gaps

### Phase 2 — Admin Experience
1. Log out → select **"Nimbus Cloud Admin"**
2. **Portfolio** — browse all partners, filter by Track (A/B/C), search by name
3. **Bulk Import** → **"Load Live Sample"** → process the CSV → leads auto-distributed
4. **AI Matcher** → watch it analyze each unassigned lead and rank partner matches
5. **Approve matches** → verify in the **Pipeline** view

### Phase 3 — Closing the Loop
1. Log back in as the partner who received a lead
2. Move the opportunity to **"Closed Won"**
3. Switch to Admin → the deal appears as won in the master Pipeline

---

## How the Scoring Works

Partners are evaluated across three vectors (0–100 each):

| Score | Measures | Calculation |
|---|---|---|
| **Capability** | Technical depth & certifications | Competencies ×5 + service deliveries ×3 + public-sector bonus |
| **Capacity** | Ability to execute at scale | Team-size bands → score tiers |
| **AI Readiness** | GenAI maturity | 19-dimension matrix (0–5), normalized to 100 |

Partners are classified into **Tracks**: A (Foundational), B (Growth), C (Strategic).

### AI-Powered Matching
For each unassigned lead the matcher weighs capability alignment, track maturity, geographic proximity, and vertical overlap, then returns ranked matches with plain-English reasoning.

---

## Architecture

```
├── App.tsx                 # Root SPA — routing & state
├── components/
│   ├── AdminDashboard.tsx  # Portfolio, CSV import, AI matcher, pipeline
│   ├── Dashboard.tsx       # Partner scorecard, funding calc, opportunities
│   ├── IntakeWizard.tsx    # Multi-step partner assessment
│   ├── ChatBot.tsx         # AI Practice Consultant
│   ├── PartnerLogin.tsx    # Partner authentication (simulated)
│   └── Presentation.tsx    # Built-in guided presentation mode
├── services/
│   ├── dbService.ts        # Persistence layer (LocalStorage)
│   ├── geminiService.ts    # Google Gemini integration + fallbacks
│   ├── seedData.ts         # Fictional partner profiles
│   └── sampleLeads.ts      # Fictional lead dataset
├── types.ts                # TypeScript interfaces & constants
├── server.ts               # Express + Vite dev server
└── vite.config.ts          # Build configuration
```

---

## Notes for Reviewers

- **Auth is simulated.** The login flow is a demo persona switcher — there is no real authentication, and it is not intended for production use as-is.
- **Data is client-side.** LocalStorage stands in for a database to keep the demo zero-setup. The `dbService` interface is deliberately DB-shaped so it could be swapped for a real backend.
- **AI is optional.** All AI calls degrade gracefully so the app is fully demoable offline.

---

## License

MIT — see notes above. Built as a personal portfolio project; all data is fictional.
