const sectors = [
  { name: "Sangam Nose", load: 91, flow: "+12%", risk: "high", people_estimate: 82000, lat: 25.4307, lng: 81.8848 },
  { name: "Sector 4 Bridge", load: 84, flow: "+9%", risk: "high", people_estimate: 52000, lat: 25.4268, lng: 81.8726 },
  { name: "Gate 7 Entry", load: 77, flow: "+5%", risk: "medium", people_estimate: 43000, lat: 25.4388, lng: 81.8618 },
  { name: "Rail Shuttle Hub", load: 69, flow: "-2%", risk: "medium", people_estimate: 36000, lat: 25.4446, lng: 81.8429 },
  { name: "Medical Post C", load: 58, flow: "+1%", risk: "low", people_estimate: 12000, lat: 25.4218, lng: 81.8688 },
  { name: "Parking Corridor", load: 42, flow: "-8%", risk: "low", people_estimate: 26000, lat: 25.4561, lng: 81.8337 },
  { name: "Akhara Route", load: 73, flow: "+4%", risk: "medium", people_estimate: 48000, lat: 25.4185, lng: 81.8572 },
  { name: "Pontoon East", load: 81, flow: "+7%", risk: "high", people_estimate: 39000, lat: 25.4243, lng: 81.8918 },
  { name: "Food Court Belt", load: 63, flow: "+3%", risk: "medium", people_estimate: 28000, lat: 25.4332, lng: 81.8526 }
];

const scenarios = {
  normal: { crowd: 72, incidents: 18, bus: 11, volunteers: 86 },
  surge: { crowd: 88, incidents: 29, bus: 18, volunteers: 74 },
  rain: { crowd: 79, incidents: 24, bus: 16, volunteers: 81 },
  peak: { crowd: 91, incidents: 34, bus: 19, volunteers: 72 }
};

const incidents = [
  ["MK-2048", "Sangam Nose", "Crowd pressure", "Assigned", 9, "high"],
  ["MK-2049", "Gate 7", "Medical assistance", "Dispatched", 7, "high"],
  ["MK-2050", "Rail Shuttle Hub", "Transport delay", "Watching", 18, "medium"],
  ["MK-2051", "Sector 4 Bridge", "Lost person", "Assigned", 22, "medium"],
  ["MK-2052", "Parking Corridor", "Barricade repair", "Queued", 31, "low"]
];

const resources = [
  ["Medical QRU", "12 teams active", "2 units ready near Gate 7"],
  ["Volunteer Marshals", "432 checked in", "62 can be redeployed"],
  ["Police Units", "38 sector posts", "4 mobile teams available"],
  ["Buses", "186 running", "Turnaround pressure at rail hub"],
  ["Water Points", "94% stocked", "Sector 4 refill in 26 minutes"]
];

const recommendations = [
  {
    title: "Open counter-flow at Sector 4",
    body: "Create a one-way release lane for 20 minutes to reduce bridge density before the next arrival wave."
  },
  {
    title: "Stage medical team at Gate 7",
    body: "Two heat-exhaustion reports came from adjacent lanes. Keep QRU within 90 seconds of the entry gate."
  },
  {
    title: "Shift volunteers from parking corridor",
    body: "Parking load is below threshold. Move three teams to Sangam Nose and Pontoon East."
  }
];

const byId = (id) => document.getElementById(id);
const API_BASE =
  location.protocol === "file:" ||
  ((location.hostname === "127.0.0.1" || location.hostname === "localhost") && location.port !== "8000")
    ? "http://127.0.0.1:8000"
    : "";
let livePoll;

function riskColor(risk) {
  if (risk === "high") return "linear-gradient(135deg, rgba(184,82,69,.46), rgba(91,36,31,.28))";
  if (risk === "medium") return "linear-gradient(135deg, rgba(201,150,61,.42), rgba(94,68,24,.28))";
  return "linear-gradient(135deg, rgba(128,168,107,.3), rgba(49,78,43,.24))";
}

function renderSectors(sectorData = sectors, multiplier = 1) {
  byId("sectorMap").innerHTML = sectorData
    .map((sector) => {
      const load = Math.min(98, Math.round(sector.load * multiplier));
      const people = sector.people_estimate ? ` · ${sector.people_estimate.toLocaleString()} people` : "";
      return `
        <div class="sector" style="background:${riskColor(load > 82 ? "high" : load > 64 ? "medium" : "low")}">
          <strong>${sector.name}</strong>
          <span>${load}% load · ${sector.flow} flow${people}</span>
          <div class="load-bar"><i style="width:${load}%"></i></div>
        </div>
      `;
    })
    .join("");
}

function projectZone(sector) {
  const bounds = {
    minLat: 25.416,
    maxLat: 25.459,
    minLng: 81.831,
    maxLng: 81.895
  };
  const x = ((sector.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 1000;
  const y = (1 - (sector.lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 560;
  return {
    x: Math.max(70, Math.min(930, x)),
    y: Math.max(70, Math.min(490, y))
  };
}

function renderCrowdMap(sectorData = sectors) {
  const density = sectorData
    .map((sector) => {
      const point = projectZone(sector);
      const radius = Math.max(56, Math.min(128, 34 + (sector.load || 0)));
      return `
        <circle
          class="map-density ${sector.risk}"
          cx="${point.x.toFixed(1)}"
          cy="${point.y.toFixed(1)}"
          r="${radius}"
          data-name="${sector.name}"
          data-load="${sector.load}"
          data-people="${(sector.people_estimate || 0).toLocaleString()}"
          data-advisory="${sector.advisory || "Monitor crowd movement."}"
        />
      `;
    })
    .join("");

  byId("crowdMap").innerHTML = `
    <div class="map-tooltip" id="mapTooltip"></div>
    <svg viewBox="0 0 1000 560" role="img" aria-label="Prayagraj live crowd heatmap">
      <rect width="1000" height="560" fill="#020817" />
      <g opacity="0.6">
        ${Array.from({ length: 12 }, (_, i) => `<path class="map-road" d="M ${40 + i * 86} 0 L ${10 + i * 72} 560" />`).join("")}
        ${Array.from({ length: 9 }, (_, i) => `<path class="map-road" d="M 0 ${40 + i * 62} C 220 ${80 + i * 38}, 420 ${i % 2 ? 10 : 120}, 1000 ${65 + i * 55}" />`).join("")}
        <path class="map-road major" d="M 58 388 C 238 318, 370 302, 520 238 C 638 188, 776 158, 960 120" />
        <path class="map-road major" d="M 140 90 C 248 186, 330 260, 480 326 C 650 398, 760 442, 930 520" />
        <path class="map-road major" d="M 72 462 C 230 420, 420 420, 600 368 C 770 318, 850 278, 970 270" />
      </g>
      <path class="map-river" d="M 620 0 C 660 74, 672 128, 646 192 C 620 256, 658 318, 748 356 C 834 392, 908 426, 1000 528 L 1000 0 Z" />
      <path class="map-river" d="M 0 66 C 132 112, 232 112, 360 76 C 480 42, 538 54, 620 0 L 770 0 C 676 78, 548 120, 406 128 C 238 138, 126 154, 0 210 Z" opacity="0.78" />
      <text class="map-label" x="72" y="252">CHOWK</text>
      <text class="map-label" x="268" y="336">Kydganj</text>
      <text class="map-label" x="650" y="218">SANGAM</text>
      <text class="map-label" x="716" y="328">Arail</text>
      <text class="map-label" x="104" y="144">Civil Lines</text>
      <g>${density}</g>
    </svg>
  `;

  const tooltip = byId("mapTooltip");
  byId("crowdMap").querySelectorAll(".map-density").forEach((circle) => {
    circle.addEventListener("mouseenter", () => {
      tooltip.innerHTML = `<strong>${circle.dataset.name}</strong>${circle.dataset.load}% load · ${circle.dataset.people} people<br>${circle.dataset.advisory}`;
      tooltip.classList.add("is-visible");
    });
    circle.addEventListener("mouseleave", () => tooltip.classList.remove("is-visible"));
  });
}

function renderIncidents(sortBySla = false) {
  const rows = [...incidents].sort((a, b) => (sortBySla ? a[4] - b[4] : 0));
  byId("incidentTable").innerHTML = rows
    .map(
      ([ticket, zone, type, status, sla, priority]) => `
        <tr>
          <td>${ticket}</td>
          <td>${zone}</td>
          <td>${type}</td>
          <td><span class="pill ${priority}">${status}</span></td>
          <td>${sla}m</td>
        </tr>
      `
    )
    .join("");
}

function renderResources() {
  byId("resourceBoard").innerHTML = resources
    .map(
      ([name, count, note]) => `
        <div class="resource">
          <strong>${name}</strong>
          <span>${count}</span>
          <p>${note}</p>
        </div>
      `
    )
    .join("");
}

function renderActions() {
  byId("actionsList").innerHTML = recommendations
    .map(
      (item, index) => `
        <div class="action">
          <b>${index + 1}. ${item.title}</b>
          <span>${item.body}</span>
        </div>
      `
    )
    .join("");
}

function fallbackBriefing(name) {
  return name === "surge"
    ? "Arrival velocity is above plan near Sangam Nose. Hold two bus batches at the rail shuttle hub, open the Sector 4 release lane, and deploy volunteer marshals before the next 15-minute pulse."
    : name === "rain"
      ? "Rain diversion is pushing people toward covered corridors. Keep the pontoon bridge under one-way control, move water refill crews laterally, and protect medical access at Gate 7."
      : name === "peak"
        ? "Peak crowd movement is building near Sangam Nose, Sector 4 Bridge, and Gate 7. Hold inflow, protect release corridors, and redeploy volunteers from low-load parking zones."
        : "Crowd pressure is rising near Sangam Nose and Sector 4 pontoon bridge. Keep one medical quick-response unit staged at Gate 7 and release three volunteer teams from the low-load parking corridor.";
}

function applyLivePayload(payload) {
  byId("crowdMetric").textContent = `${payload.crowd_load}%`;
  byId("incidentMetric").textContent = payload.open_incidents;
  byId("busMetric").textContent = `${payload.bus_turnaround_min}m`;
  byId("volunteerMetric").textContent = `${payload.volunteer_coverage}%`;
  byId("briefingText").textContent = payload.briefing;
  byId("feedStatus").textContent = `FastAPI live crowd feed · ${payload.zones.length} zones · generated ${new Date(payload.generated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
  renderSectors(payload.zones);
  renderCrowdMap(payload.zones, payload.map_center);
}

async function fetchLiveOperations(name) {
  const response = await fetch(`${API_BASE}/api/live?scenario=${encodeURIComponent(name)}`, {
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(`Live API returned ${response.status}`);
  }
  return response.json();
}

function applyScenario(name) {
  const scenario = scenarios[name];
  const multiplier = name === "surge" ? 1.16 : name === "rain" ? 1.08 : name === "peak" ? 1.22 : 1;
  byId("crowdMetric").textContent = `${scenario.crowd}%`;
  byId("incidentMetric").textContent = scenario.incidents;
  byId("busMetric").textContent = `${scenario.bus}m`;
  byId("volunteerMetric").textContent = `${scenario.volunteers}%`;
  renderSectors(sectors, multiplier);
  renderCrowdMap(sectors);
  byId("briefingText").textContent = fallbackBriefing(name);
  byId("feedStatus").textContent = "Static fallback feed active. Start FastAPI locally or deploy on Vercel for live polling.";
}

async function refreshLiveScenario() {
  const scenario = byId("scenarioSelect").value;
  try {
    const payload = await fetchLiveOperations(scenario);
    applyLivePayload(payload);
  } catch (error) {
    applyScenario(scenario);
  }
}

function startLivePolling() {
  clearInterval(livePoll);
  refreshLiveScenario();
  livePoll = setInterval(refreshLiveScenario, 8000);
}

function addIncident() {
  const ticket = `MK-${2053 + incidents.length}`;
  incidents.unshift([
    ticket,
    byId("incidentZone").value,
    byId("incidentType").value,
    "Queued",
    12,
    "medium"
  ]);
  byId("incidentMetric").textContent = Number(byId("incidentMetric").textContent) + 1;
  byId("incidentNote").value = "";
  renderIncidents(true);
  byId("incidentDialog").close();
}

function exportBrief() {
  const text = [
    "Sangam Setu Command Brief",
    `Time: ${byId("clock").textContent}`,
    `Crowd load: ${byId("crowdMetric").textContent}`,
    `Open incidents: ${byId("incidentMetric").textContent}`,
    "",
    byId("briefingText").textContent
  ].join("\n");
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "sangam-setu-command-brief.txt";
  anchor.click();
  URL.revokeObjectURL(url);
}

function tickClock(minutes = 0) {
  const current = byId("clock").textContent.replace(" IST", "");
  const [hour, minute] = current.split(":").map(Number);
  const date = new Date(2028, 0, 14, hour, minute + minutes);
  byId("clock").textContent = `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")} IST`;
}

byId("scenarioSelect").addEventListener("change", () => startLivePolling());
byId("sortIncidentsBtn").addEventListener("click", () => renderIncidents(true));
byId("simulateBtn").addEventListener("click", () => {
  tickClock(15);
  if (byId("scenarioSelect").value === "normal") {
    byId("scenarioSelect").value = "surge";
  }
  startLivePolling();
});
byId("openIncidentBtn").addEventListener("click", () => byId("incidentDialog").showModal());
byId("submitIncidentBtn").addEventListener("click", addIncident);
byId("downloadBriefBtn").addEventListener("click", exportBrief);

renderSectors();
renderCrowdMap();
renderIncidents();
renderResources();
renderActions();
startLivePolling();
