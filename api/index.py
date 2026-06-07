from datetime import datetime, timezone
from math import sin
from random import Random
from typing import Literal

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


app = FastAPI(
    title="Sangam Setu Operations API",
    version="1.0.0",
    description="Live operational feed for the Mahakumbh command center prototype.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


RiskLevel = Literal["low", "medium", "high"]


class SectorSignal(BaseModel):
    name: str
    load: int
    flow: str
    temperature_c: float
    heat_index_c: float
    risk: RiskLevel
    advisory: str
    x: int
    y: int


class LiveOperationsResponse(BaseModel):
    generated_at: str
    scenario: str
    crowd_load: int
    open_incidents: int
    bus_turnaround_min: int
    volunteer_coverage: int
    heat_alert_level: RiskLevel
    sectors: list[SectorSignal]
    briefing: str


BASE_SECTORS = [
    ("Sangam Nose", 91, 34.8, 38.9, 18, 22),
    ("Sector 4 Bridge", 84, 34.1, 38.0, 50, 20),
    ("Gate 7 Entry", 77, 35.2, 39.7, 82, 30),
    ("Rail Shuttle Hub", 69, 33.4, 36.6, 20, 54),
    ("Medical Post C", 58, 35.7, 40.4, 50, 54),
    ("Parking Corridor", 42, 36.2, 41.3, 82, 62),
    ("Akhara Route", 73, 34.0, 37.5, 23, 82),
    ("Pontoon East", 81, 34.6, 38.7, 52, 84),
    ("Food Court Belt", 63, 35.0, 39.1, 80, 84),
]

SCENARIO_SHIFT = {
    "normal": {"load": 0, "heat": 0.0, "incidents": 18, "bus": 11, "volunteers": 86},
    "surge": {"load": 11, "heat": 0.6, "incidents": 29, "bus": 18, "volunteers": 74},
    "rain": {"load": 6, "heat": -1.8, "incidents": 24, "bus": 16, "volunteers": 81},
    "heatwave": {"load": 8, "heat": 3.4, "incidents": 31, "bus": 15, "volunteers": 79},
}


def clamp(value: float, low: int, high: int) -> int:
    return max(low, min(high, round(value)))


def risk_for(load: int, heat_index: float) -> RiskLevel:
    if load >= 84 or heat_index >= 41:
        return "high"
    if load >= 65 or heat_index >= 38:
        return "medium"
    return "low"


def advisory_for(risk: RiskLevel, heat_index: float) -> str:
    if risk == "high" and heat_index >= 41:
        return "Start shade-water push and stage medical QRU within 90 seconds."
    if risk == "high":
        return "Hold inflow and open a release lane for the next crowd pulse."
    if risk == "medium":
        return "Watch for density rise; keep volunteer marshal team on standby."
    return "Normal patrol rhythm; keep one redeployable team available."


@app.get("/health")
@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/live", response_model=LiveOperationsResponse)
@app.get("/api/live", response_model=LiveOperationsResponse)
def live_operations(
    scenario: Literal["normal", "surge", "rain", "heatwave"] = Query("normal"),
) -> LiveOperationsResponse:
    shift = SCENARIO_SHIFT[scenario]
    now = datetime.now(timezone.utc)
    minute_wave = sin(now.minute / 60 * 6.283)
    seeded = Random(now.minute + now.hour * 60)
    sectors: list[SectorSignal] = []

    for index, (name, base_load, base_temp, base_heat, x, y) in enumerate(BASE_SECTORS):
        pulse = minute_wave * (3 + index % 3) + seeded.uniform(-1.7, 1.7)
        load = clamp(base_load + shift["load"] + pulse, 24, 98)
        temperature = round(base_temp + shift["heat"] + seeded.uniform(-0.25, 0.25), 1)
        heat_index = round(base_heat + shift["heat"] + seeded.uniform(-0.35, 0.35), 1)
        risk = risk_for(load, heat_index)
        flow = f"{'+' if pulse >= 0 else ''}{round(pulse, 1)}%"
        sectors.append(
            SectorSignal(
                name=name,
                load=load,
                flow=flow,
                temperature_c=temperature,
                heat_index_c=heat_index,
                risk=risk,
                advisory=advisory_for(risk, heat_index),
                x=x,
                y=y,
            )
        )

    crowd_load = clamp(sum(sector.load for sector in sectors) / len(sectors), 0, 100)
    max_heat = max(sector.heat_index_c for sector in sectors)
    heat_alert_level = risk_for(crowd_load, max_heat)
    hottest = max(sectors, key=lambda sector: sector.heat_index_c)
    densest = max(sectors, key=lambda sector: sector.load)

    briefing = (
        f"Heat stress is highest at {hottest.name} ({hottest.heat_index_c}C heat index) "
        f"while crowd pressure peaks at {densest.name} ({densest.load}% load). "
        "Prioritize water points, shaded holding, and medical staging before the next 15-minute movement pulse."
    )

    return LiveOperationsResponse(
        generated_at=now.isoformat(),
        scenario=scenario,
        crowd_load=crowd_load,
        open_incidents=shift["incidents"],
        bus_turnaround_min=shift["bus"],
        volunteer_coverage=shift["volunteers"],
        heat_alert_level=heat_alert_level,
        sectors=sectors,
        briefing=briefing,
    )
