# Sangam Setu Command Center

Live project: https://mahakumbh-command-center-zeta.vercel.app

Sangam Setu is a command center dashboard built for the Mahakumbh Innovation Hackathon 2028 Round 2 challenge. The idea is simple: when an event is spread across ghats, bridges, roads, parking areas, medical posts, and volunteer teams, the control room should not be switching between ten different screens.

This project brings crowd movement, incidents, transport, volunteers, and resources into one operations view so administrators can understand what is happening and decide what to do next.

## Problem

Large scale events are not difficult only because of crowd size. They are difficult because the situation changes fast.

A bridge can get crowded in minutes. A parking corridor can suddenly become a bottleneck. A medical post may need backup before an incident becomes serious. Volunteers may be available, but not visible to the right officer at the right time.

Sangam Setu is designed around one practical question:

> What should the command team do in the next 15 to 30 minutes?

## What It Does

- Shows a live command dashboard for event administrators
- Displays a crowd heatmap style view for monitored event zones
- Uses a FastAPI endpoint to provide live crowd telemetry
- Tracks crowd load, estimated headcount, flow change, and risk level
- Shows open incidents and lets the user sort them by SLA
- Tracks bus turnaround time and volunteer coverage
- Shows resource deployment for medical teams, police, buses, water points, and volunteers
- Includes scenario simulation for morning flow, surge, rain diversion, and peak crowd watch
- Provides an AI assisted briefing with short operational recommendations
- Lets users export a command brief for handover or admin reporting
- Includes a pitch deck for presenting the idea

## Live Crowd Heatmap

The heatmap is built to feel like a real control room display. Instead of depending on heavy map tiles that can lag or load in blocks, the current version uses a fast dark map canvas with projected crowd density zones.

The backend sends live style data for each zone:

- zone name
- crowd load percentage
- estimated people count
- flow direction
- risk level
- latitude and longitude
- recommended action

The frontend uses this data to redraw the map and sector cards every few seconds.

## Tech Stack

- HTML
- CSS
- JavaScript
- Python
- FastAPI
- SVG based map visualization
- Vercel deployment

## Backend API

Main endpoint:

```text
/api/live
```

Example:

```text
/api/live?scenario=peak
```

Supported scenarios:

- normal
- surge
- rain
- peak

The current API simulates real time operations data. In a production setup, the same endpoint can be connected to CCTV analytics, gate counters, GPS feeds, volunteer check-ins, incident systems, and weather alerts.

## Run Locally

Start the frontend:

```bash
npx serve .
```

Start the FastAPI backend:

```bash
pip install -r requirements.txt
uvicorn api.index:app --reload --port 8000
```

Then open:

```text
http://127.0.0.1:4173
```

When deployed on Vercel, the frontend calls the API from the same domain. For a static-only local demo, the dashboard also has fallback data.

## Project Structure

```text
.
|-- index.html
|-- styles.css
|-- app.js
|-- api/
|   |-- index.py
|   |-- live.py
|   |-- health.py
|-- requirements.txt
|-- vercel.json
|-- decks/
|   |-- sangam-setu-command-center.pptx
|-- docs/
|   |-- architecture.md
|   |-- product-thinking.md
|   |-- demo-script.md
```

## Why This Is Useful

This is not just a chart dashboard. The goal is to help the command team act faster.

The dashboard combines multiple signals into a single view and turns them into short, useful prompts such as where to hold inflow, where to move volunteers, where to stage medical teams, and which zones need attention first.

## Future Scope

- Connect real CCTV crowd detection feeds
- Add GPS tracking for buses and emergency vehicles
- Add volunteer mobile app check-ins
- Add role based access for officers and sector teams
- Store live events in PostgreSQL or Redis
- Add WebSocket or Server Sent Events for instant updates
- Add audit logs for every operational decision
- Add notification dispatch through SMS or WhatsApp

## Submission Note

Built for:

```text
Round 2 Challenge Released
Mahakumbh Innovation Hackathon 2028 x Expert Hire
```

The project is meant to demonstrate a practical command center product, not just a static design mockup.
