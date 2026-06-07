# Sangam Setu Command Center

Event Operations Command Center Dashboard for **Round 2 Challenge Released | Mahakumbh Innovation Hackathon 2028 x Expert Hire**.

Sangam Setu is a centralized command center prototype for large-scale event operations. It brings transportation, crowd movement, incidents, volunteers, and resource deployment into a single operational view for administrators and event managers.

## Why This Exists

Large pilgrimage events create fast-changing operational pressure: crowd density rises near ghats, transport hubs saturate, medical requests need quick routing, and volunteer deployment can lag behind reality. The dashboard is designed around one question:

> What should the command team do in the next 15-30 minutes?

## Product Highlights

- Live command overview with crowd load, open incidents, transport turnaround, and volunteer coverage
- Sector heatmap for crowd movement and pressure zones
- Scenario switcher for morning flow, royal bath surge, and rain diversion
- Incident priority queue with SLA sorting and quick incident logging
- Deployment board for medical teams, volunteers, police, buses, and water points
- AI-assisted briefing that converts operational signals into short, actionable guidance
- Exportable command brief for shift handover or admin reporting

## Tech Stack

- HTML, CSS, and JavaScript
- Static-first deployment through Vercel
- No backend dependency for the demo path, making it reliable for judging and live presentation

## Run Locally

Open `index.html` directly in a browser, or run a static server:

```bash
npx serve .
```

## Deployment

This repository is Vercel-ready. Deploy from the project folder:

```bash
vercel --prod
```

## Repository Structure

```text
.
├── index.html
├── styles.css
├── app.js
├── vercel.json
├── decks/
│   └── sangam-setu-command-center.pptx
├── docs/
│   ├── architecture.md
│   ├── product-thinking.md
│   └── demo-script.md
└── assets/
```

## Future Scope

- Real-time feeds from CCTV analytics, Bluetooth/Wi-Fi density counters, GPS buses, helpline systems, and volunteer check-ins
- Role-based access for sector officers, transport admins, medical desk, and central command
- GIS-backed geofencing and predictive crowd modeling
- WhatsApp/SMS integration for volunteer dispatch
- Audit trail for every operational decision
