# Architecture

## Current Prototype

```mermaid
flowchart LR
  A[Static Frontend] --> B[Operational State in JS]
  B --> C[Dashboard Metrics]
  B --> D[Sector Heatmap]
  B --> E[Incident Queue]
  B --> F[AI Briefing Panel]
```

The Round 2 prototype is intentionally static-first. It demonstrates the command center experience without requiring live data credentials during judging.

## Production Architecture

```mermaid
flowchart LR
  CCTV[CCTV / Video Analytics] --> Stream[Event Data Bus]
  GPS[Bus GPS + Parking Sensors] --> Stream
  Help[Helpline + Field Reports] --> Stream
  Volunteer[Volunteer App Check-ins] --> Stream
  Stream --> API[Operations API]
  API --> Rules[Risk Scoring + SLA Engine]
  Rules --> Dashboard[Command Center UI]
  Rules --> Notify[Dispatch via SMS / WhatsApp]
  Dashboard --> Audit[Decision Audit Log]
```

## Data Sources

- Crowd density counters
- CCTV analytics
- GPS from buses and emergency vehicles
- Incident reports from helpline operators
- Volunteer attendance and location check-ins
- Medical post capacity
- Barricade and gate status

## AI Use

AI is used as an operations summarizer, not as an unchecked decision maker. The system should explain why it recommends an action and should keep a human officer in the approval loop for dispatch decisions.
