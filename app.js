const sectors = [
  { name: "Sangam Nose", load: 91, flow: "+12%", risk: "high", heat_index_c: 38.9, x: 18, y: 22 },
  { name: "Sector 4 Bridge", load: 84, flow: "+9%", risk: "high", heat_index_c: 38.0, x: 50, y: 20 },
  { name: "Gate 7 Entry", load: 77, flow: "+5%", risk: "medium", heat_index_c: 39.7, x: 82, y: 30 },
  { name: "Rail Shuttle Hub", load: 69, flow: "-2%", risk: "medium", heat_index_c: 36.6, x: 20, y: 54 },
  { name: "Medical Post C", load: 58, flow: "+1%", risk: "low", heat_index_c: 40.4, x: 50, y: 54 },
  { name: "Parking Corridor", load: 42, flow: "-8%", risk: "low", heat_index_c: 41.3, x: 82, y: 62 },
  { name: "Akhara Route", load: 73, flow: "+4%", risk: "medium", heat_index_c: 37.5, x: 23, y: 82 },
  { name: "Pontoon East", load: 81, flow: "+7%", risk: "high", heat_index_c: 38.7, x: 52, y: 84 },
  { name: "Food Court Belt", load: 63, flow: "+3%", risk: "medium", heat_index_c: 39.1, x: 80, y: 84 }
];

const scenarios = {
  normal: { crowd: 72, incidents: 18, bus: 11, volunteers: 86 },
  surge: { crowd: 88, incidents: 29, bus: 18, volunteers: 74 },
  rain: { crowd: 79, incidents: 24, bus: 16, volunteers: 81 },
  heatwave: { crowd: 80, incidents: 31, bus: 15, volunteers: 79 }
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
      const heat = sector.heat_index_c ? ` · ${sector.heat_index_c}C heat index` : "";
      return `
        <div class="sector" style="background:${riskColor(load > 82 ? "high" : load > 64 ? "medium" : "low")}">
          <strong>${sector.name}</strong>
          <span>${load}% load · ${sector.flow} flow${heat}</span>
          <div class="load-bar"><i style="width:${load}%"></i></div>
        </div>
      `;
    })
    .join("");
}

function renderHeatwaveMap(sectorData = sectors, generatedAt = "static demo feed") {
  const hottest = [...sectorData].sort((a, b) => (b.heat_index_c || 0) - (a.heat_index_c || 0))[0];
  const timestamp = generatedAt.includes("T")
    ? new Date(generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : generatedAt;

  byId("heatwaveMap").innerHTML = `
    <div class="heat-label">Live heatwave layer · hottest: ${hottest.name} ${hottest.heat_index_c}C · ${timestamp}</div>
    ${sectorData
      .map((sector) => {
        const heat = sector.heat_index_c || 36;
        const risk = heat >= 41 || sector.risk === "high" ? "high" : heat >= 38 ? "medium" : "low";
        const size = Math.max(52, Math.min(96, 34 + heat * 1.25));
        return `
          <div class="heat-point ${risk}" style="left:${sector.x || 50}%; top:${sector.y || 50}%; width:${size}px; height:${size}px">
            <strong>${Math.round(heat)}C</strong>
            <span>${sector.name.split(" ")[0]}</span>
          </div>
        `;
      })
      .join("")}
  `;
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
      : name === "heatwave"
        ? "Heat index is crossing safe operating thresholds near Parking Corridor and Medical Post C. Push water carts, shaded holding, and medical patrols before crowd density rises further."
        : "Crowd pressure is rising near Sangam Nose and Sector 4 pontoon bridge. Keep one medical quick-response unit staged at Gate 7 and release three volunteer teams from the low-load parking corridor.";
}

function applyLivePayload(payload) {
  byId("crowdMetric").textContent = `${payload.crowd_load}%`;
  byId("incidentMetric").textContent = payload.open_incidents;
  byId("busMetric").textContent = `${payload.bus_turnaround_min}m`;
  byId("volunteerMetric").textContent = `${payload.volunteer_coverage}%`;
  byId("briefingText").textContent = payload.briefing;
  byId("feedStatus").textContent = `FastAPI live feed · ${payload.sectors.length} sectors · generated ${new Date(payload.generated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
  renderSectors(payload.sectors);
  renderHeatwaveMap(payload.sectors, payload.generated_at);
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
  const multiplier = name === "surge" ? 1.16 : name === "rain" ? 1.08 : 1;
  byId("crowdMetric").textContent = `${scenario.crowd}%`;
  byId("incidentMetric").textContent = scenario.incidents;
  byId("busMetric").textContent = `${scenario.bus}m`;
  byId("volunteerMetric").textContent = `${scenario.volunteers}%`;
  renderSectors(sectors, multiplier);
  renderHeatwaveMap(sectors);
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
renderHeatwaveMap();
renderIncidents();
renderResources();
renderActions();
startLivePolling();
