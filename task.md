

Skip to content
Using Gmail with screen readers
Conversations
45% of 15 GB used
Terms · Privacy · Program Policies
Last account activity: 14 minutes ago
Details
Apollo
# Frontend Engineer Take-Home: SOC Alerts Dashboard

## Overview

Build a small full-stack web application that helps a Security Operations Center (SOC) analyst triage security alerts. **You don't need any cybersecurity background** — everything you need to know is in this document.

### Domain Primer (the only cyber context you need)

A SOC analyst's job is to watch a stream of *alerts* — potential security incidents flagged by automated detection systems — and decide which ones are real threats worth investigating. A medium-sized organization can produce thousands of alerts per day from dozens of systems, most of them noise. Good triage tooling is the difference between catching a real attack and missing it in the flood.

Each alert in the dataset has roughly these fields:

| Field | Meaning |
|---|---|
| `id`, `timestamp`, `title` | Identifiers and a short human-readable summary |
| `severity` | `critical` \| `high` \| `medium` \| `low` \| `info` |
| `status` | `new` \| `investigating` \| `resolved` \| `false_positive` |
| `category` | `malware` \| `phishing` \| `unauthorized_access` \| `data_exfiltration` \| `policy_violation` \| `suspicious_login` |
| `source` | Detection system that raised it (e.g. `endpoint-agent`, `email-gateway`, `firewall`, `cloud-audit`) |
| `affected_asset` | Hostname, user, or IP involved |
| `assignee` | Analyst handling it (or `null`) |
| `description` | Longer explanation |
| `raw_event` | Nested JSON blob from the underlying system |

That's the whole domain. If anything is unclear, just ask.

---

## The Task

Build a web app with three primary views:

1. **Alerts Dashboard** — at-a-glance summary of the alert landscape, aggregated by severity, category, and status
2. **Alerts List** — filterable, sortable list of alerts
3. **Alert Detail** — drill-down view of a single alert with the ability to act on it

### Data

You are responsible for generating your own mock dataset. The record structure described in the domain primer above is what we'll be looking for; aim for **about 1000 records** with realistic-looking distributions (a long tail of low/info-severity alerts, a handful of criticals, timestamps spread across recent weeks, a mix of categories and sources, etc.). How you generate it is up to you — a script, an LLM, hand-crafted, whatever — just commit the dataset (or the generator) to the repo and mention your approach in your report.

We're not grading the dataset itself, but a thoughtful one will make your dashboard more interesting to evaluate.

---

## Functional Requirements

### Must-haves

**Authentication** — the app must be behind a login:
- A login screen and a logout action
- A single seeded analyst account is sufficient (share the credentials with us when you submit)
- Unauthenticated requests to the API and unauthenticated visits to app routes are rejected / redirected to login
- We're not grading cryptographic rigor — a clean, conventional implementation (session cookies, JWT, whatever you'd normally reach for) is exactly what we want. Don't roll your own crypto, and don't over-engineer it either.

**Backend API** with at minimum:
- `POST /login` and `POST /logout` (or equivalent for your auth approach)
- `GET /alerts` — list with pagination, filtering, and sorting
- `GET /alerts/:id` — single alert
- `PATCH /alerts/:id` — update status, severity, and/or assignee

**Alerts Dashboard view** with:
- Aggregated counts and breakdowns of all alerts by **severity**, **category**, and **status**
- Visualizations are your call (charts, big-number tiles, a mix — whichever best communicates the shape of the data). We're looking at how you decide what to show, not which chart library you picked.
- Clicking into an aggregate (e.g. a severity slice, a category bar) should take the analyst to the Alerts List filtered to that subset

**Alerts List view** with:
- A table or list showing the key fields
- Filters for at least severity, status, category, and time range
- Sortable by severity and timestamp
- Pagination or virtualized scrolling

**Alert Detail view** with:
- All alert fields visible, including the `raw_event` JSON
- Ability to manually change **status** and **severity**
- A **dismiss** action (a one-click shortcut to mark the alert resolved or as a false positive — your judgment on which makes more sense)
- Changes persist (refresh the page, they're still there)

### Nice-to-haves (pick any you have time for)

- Real-time updates (new/changed alerts without page reload)
- Saved filter presets
- Bulk actions on the list view
- A timeline / trend chart of alerts over time
- Automated tests

---

## Technical Requirements

- **Frontend:** any modern framework (React, Vue, Svelte, Solid, etc.)
- **Backend:** any language and framework — Node, Python, Go, Rust, whatever you're fastest in. SQLite, an in-memory store, or even a JSON file is fine for persistence
- **Hosting:** deployed and reachable via a public URL. Vercel, Netlify, Render, Fly, Railway, etc. all have free tiers that work well for this
- **Browser support:** latest Chrome/Firefox is sufficient

We're deliberately not prescriptive about libraries, state management, styling, or component patterns. Pick what you'd reach for in production and be ready to explain why.

---

## Deliverables

1. **Live URL** to the deployed app
2. **Source repository** (GitHub or similar) with the source code
3. **Short report (1–2 pages)** covering:
   - The architecture and the main tech choices you made
   - What you built and what you intentionally cut
   - Key trade-offs and decisions
   - What you'd tackle next with more time
   - Anything you're particularly proud of, or that didn't go the way you hoped

---

## Evaluation Criteria

We weigh these roughly equally:

- **Product sense** — does it actually help a SOC analyst do their job?
- **Code quality** — structure, readability, idiomatic use of your stack
- **UI/UX craft** — clarity, visual hierarchy, responsiveness, attention to detail
- **System thinking** — API design, data flow, state management, error handling, loading/empty states
- **Communication** — clarity of the report

A smaller, well-built, polished app beats a feature-stuffed but rough one. We're looking for the engineer we'd want to ship production code with, not the one who can cram the most checkboxes into a weekend.

---

## Time and Scope

We expect this to take **6–8 hours of focused work.** Please don't go significantly past that. If you catch yourself wanting to, stop and note in your report what you would have done with more time — we'd rather see good scope judgment than maximum output.

---

Good luck, and have fun with it.
frontend-take-home-assessment.md
Displaying frontend-take-home-assessment.md.