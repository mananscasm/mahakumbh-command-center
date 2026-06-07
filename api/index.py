from datetime import datetime, timezone
from math import sin
from random import Random
from typing import Literal

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


app = FastAPI(
    title="Sangam Setu Operations API",
    version="1.1.0",
    description="Live crowd-density feed for the Mahakumbh command center prototype.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


RiskLevel = Literal["low", "medium", "high"]
Scenario = Literal["normal", "surge", "rain", "peak"]


class CrowdZone(BaseModel):
    name: str
    load: int
    flow: str
    people_estimate: int
    risk: RiskLevel
    advisory: str
    lat: float
    lng: float


class LiveOperationsResponse(BaseModel):
    generated_at: str
    scenario: Scenario
    crowd_load: int
    open_incidents: int
    bus_turnaround_min: int
    volunteer_coverage: int
    map_center: list[float]
    zones: list[CrowdZone]
    sectors: list[CrowdZone]
    briefing: str


BASE_ZONES = [
    ("Sangam Nose", 91, 82000, 25.4307, 81.8848),
    ("Sector 4 Bridge", 84, 52000, 25.4268, 81.8726),
    ("Gate 7 Entry", 77, 43000, 25.4388, 81.8618),
    ("Rail Shuttle Hub", 69, 36000, 25.4446, 81.8429),
    ("Medical Post C", 58, 12000, 25.4218, 81.8688),
    ("Parking Corridor", 42, 26000, 25.4561, 81.8337),
    ("Akhara Route", 73, 48000, 25.4185, 81.8572),
    ("Pontoon East", 81, 39000, 25.4243, 81.8918),
    ("Food Court Belt", 63, 28000, 25.4332, 81.8526),
]

SCENARIO_SHIFT = {
    "normal": {"load": 0, "people": 1.0, "incidents": 18, "bus": 11, "volunteers": 86},
    "surge": {"load": 11, "people": 1.26, "incidents": 29, "bus": 18, "volunteers": 74},
    "rain": {"load": 6, "people": 1.12, "incidents": 24, "bus": 16, "volunteers": 81},
    "peak": {"load": 14, "people": 1.38, "incidents": 34, "bus": 19, "volunteers": 72},
}


def clamp(value: float, low: int, high: int) -> int:
    return max(low, min(high, round(value)))


def risk_for(load: int) -> RiskLevel:
    if load >= 84:
        return "high"
    if load >= 65:
        return "medium"
    return "low"


def advisory_for(risk: RiskLevel) -> str:
    if risk == "high":
        return "Hold inflow, open release lane, and deploy marshals before next pulse."
    if risk == "medium":
        return "Watch density trend and keep one volunteer team ready for redeployment."
    return "Normal patrol rhythm; keep corridor clear for emergency access."


@app.get("/health")
@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/live", response_model=LiveOperationsResponse)
@app.get("/api/live", response_model=LiveOperationsResponse)
def live_operations(
    scenario: Scenario = Query("normal"),
) -> LiveOperationsResponse:
    shift = SCENARIO_SHIFT[scenario]
    now = datetime.now(timezone.utc)
    minute_wave = sin(now.minute / 60 * 6.283)
    seeded = Random(now.minute + now.hour * 60)
    zones: list[CrowdZone] = []

    for index, (name, base_load, base_people, lat, lng) in enumerate(BASE_ZONES):
        pulse = minute_wave * (3 + index % 3) + seeded.uniform(-1.7, 1.7)
        load = clamp(base_load + shift["load"] + pulse, 24, 98)
        people = clamp(base_people * shift["people"] + (pulse * 420), 5000, 125000)
        risk = risk_for(load)
        flow = f"{'+' if pulse >= 0 else ''}{round(pulse, 1)}%"
        zones.append(
            CrowdZone(
                name=name,
                load=load,
                flow=flow,
                people_estimate=people,
                risk=risk,
                advisory=advisory_for(risk),
                lat=lat + seeded.uniform(-0.00045, 0.00045),
                lng=lng + seeded.uniform(-0.00045, 0.00045),
            )
        )

    crowd_load = clamp(sum(zone.load for zone in zones) / len(zones), 0, 100)
    densest = max(zones, key=lambda zone: zone.load)
    busiest = max(zones, key=lambda zone: zone.people_estimate)

    briefing = (
        f"Highest crowd density is at {densest.name} ({densest.load}% load). "
        f"Largest estimated headcount is near {busiest.name} ({busiest.people_estimate:,} people). "
        "Keep release corridors open, hold inflow at high-risk gates, and redeploy volunteers from low-load zones."
    )

    return LiveOperationsResponse(
        generated_at=now.isoformat(),
        scenario=scenario,
        crowd_load=crowd_load,
        open_incidents=shift["incidents"],
        bus_turnaround_min=shift["bus"],
        volunteer_coverage=shift["volunteers"],
        map_center=[25.4307, 81.8848],
        zones=zones,
        sectors=zones,
        briefing=briefing,
    )
