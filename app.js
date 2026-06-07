const sectors = [
  { name: "Sangam Nose", load: 91, flow: "+12%", risk: "high" },
  { name: "Sector 4 Bridge", load: 84, flow: "+9%", risk: "high" },
  { name: "Gate 7 Entry", load: 77, flow: "+5%", risk: "medium" },
  { name: "Rail Shuttle Hub", load: 69, flow: "-2%", risk: "medium" },
  { name: "Medical Post C", load: 58, flow: "+1%", risk: "low" },
  { name: "Parking Corridor", load: 42, flow: "-8%", risk: "low" },
  { name: "Akhara Route", load: 73, flow: "+4%", risk: "medium" },
  { name: "Pontoon East", load: 81, flow: "+7%", risk: "high" },
  { name: "Food Court Belt", load: 63, flow: "+3%", risk: "medium" }
];

const scenarios = {
  normal: { crowd: 72, incidents: 18, bus: 11, volunteers: 86 },
  surge: { crowd: 88, incidents: 29, bus: 18, volunteers: 74 },
  rain: { crowd: 79, incidents: 24, bus: 16, volunteers: 81 }
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

function riskColor(risk) {
  if (risk === "high") return "linear-gradient(135deg, rgba(184,82,69,.46), rgba(91,36,31,.28))";
  if (risk === "medium") return "linear-gradient(135deg, rgba(201,150,61,.42), rgba(94,68,24,.28))";
  return "linear-gradient(135deg, rgba(128,168,107,.3), rgba(49,78,43,.24))";
}

function renderSectors(multiplier = 1) {
  byId("sectorMap").innerHTML = sectors
    .map((sector) => {
      const load = Math.min(98, Math.round(sector.load * multiplier));
      return `
        <div class="sector" style="background:${riskColor(load > 82 ? "high" : load > 64 ? "medium" : "low")}">
          <strong>${sector.name}</strong>
          <span>${load}% load · ${sector.flow} flow</span>
          <div class="load-bar"><i style="width:${load}%"></i></div>
        </div>
      `;
    })
    .join("");
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

function applyScenario(name) {
  const scenario = scenarios[name];
  const multiplier = name === "surge" ? 1.16 : name === "rain" ? 1.08 : 1;
  byId("crowdMetric").textContent = `${scenario.crowd}%`;
  byId("incidentMetric").textContent = scenario.incidents;
  byId("busMetric").textContent = `${scenario.bus}m`;
  byId("volunteerMetric").textContent = `${scenario.volunteers}%`;
  renderSectors(multiplier);
  byId("briefingText").textContent =
    name === "surge"
      ? "Arrival velocity is above plan near Sangam Nose. Hold two bus batches at the rail shuttle hub, open the Sector 4 release lane, and deploy volunteer marshals before the next 15-minute pulse."
      : name === "rain"
        ? "Rain diversion is pushing people toward covered corridors. Keep the pontoon bridge under one-way control, move water refill crews laterally, and protect medical access at Gate 7."
        : "Crowd pressure is rising near Sangam Nose and Sector 4 pontoon bridge. Keep one medical quick-response unit staged at Gate 7 and release three volunteer teams from the low-load parking corridor.";
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

byId("scenarioSelect").addEventListener("change", (event) => applyScenario(event.target.value));
byId("sortIncidentsBtn").addEventListener("click", () => renderIncidents(true));
byId("simulateBtn").addEventListener("click", () => {
  tickClock(15);
  applyScenario(byId("scenarioSelect").value === "normal" ? "surge" : byId("scenarioSelect").value);
});
byId("openIncidentBtn").addEventListener("click", () => byId("incidentDialog").showModal());
byId("submitIncidentBtn").addEventListener("click", addIncident);
byId("downloadBriefBtn").addEventListener("click", exportBrief);

renderSectors();
renderIncidents();
renderResources();
renderActions();
