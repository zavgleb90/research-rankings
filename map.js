// ================================
// GLOBALS
// ================================
let universitiesData = [];
let geoData = [];
let geoByUniversity = new Map();

let MIN_YEAR = 9999;
let MAX_YEAR = 0;

let map;
let markerLayer;

let pageInitialized = false;

// ================================
// LOAD
// ================================
async function loadMapPage() {
  // 1) rankings data
  universitiesData = await fetch("./data/universitiesSub.json").then(r => r.json());

  // 2) geo data (Phase 1)
  geoData = await fetch("./data/university_geo.json").then(r => r.json());

  // index geo by university name
  geoData.forEach(g => {
    if (g && g.university) geoByUniversity.set(g.university, g);
  });

  // detect year bounds from universities dataset
  universitiesData.forEach(r => {
    if (r.year < MIN_YEAR) MIN_YEAR = r.year;
    if (r.year > MAX_YEAR) MAX_YEAR = r.year;
  });

  populateYearDropdowns();
  populateDisciplineDropdown();
  populateJournalCheckboxes();

  initLeafletMap();

  // defaults
  document.getElementById("startYear").value = MIN_YEAR;
  document.getElementById("endYear").value = MAX_YEAR;

  pageInitialized = true;

  updateMap(); // initial render
}

// ================================
// UI POPULATION
// ================================
function populateYearDropdowns() {
  const startSel = document.getElementById("startYear");
  const endSel = document.getElementById("endYear");

  startSel.innerHTML = "";
  endSel.innerHTML = "";

  for (let y = MIN_YEAR; y <= MAX_YEAR; y++) {
    const s = document.createElement("option");
    s.value = y;
    s.textContent = y;
    startSel.appendChild(s);

    const e = document.createElement("option");
    e.value = y;
    e.textContent = y;
    endSel.appendChild(e);
  }
}

function populateDisciplineDropdown() {
  const sel = document.getElementById("disciplineFilter");
  const disciplines = [...new Set(universitiesData.map(r => r.disciplineAbbr))].filter(Boolean).sort();

  disciplines.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    sel.appendChild(opt);
  });

  sel.value = "ALL";
}

function populateJournalCheckboxes() {
  const container = document.getElementById("journalCheckboxes");
  container.innerHTML = "";

  const allJournals = [...new Set(
    universitiesData.map(r => r.journal).filter(j => j && j.trim() !== "")
  )].sort();

  allJournals.forEach(journal => {
    const id = "journal_" + journal.replace(/\W+/g, "_");
    const div = document.createElement("div");
    div.innerHTML = `
      <label>
        <input type="checkbox" value="${journal}" id="${id}">
        ${journal}
      </label>
    `;
    container.appendChild(div);
  });

  // manual journal edits reset discipline/group (same logic as authors)
  document.querySelectorAll("#journalCheckboxes input").forEach(cb => {
    cb.addEventListener("change", () => {
      document.getElementById("disciplineFilter").value = "ALL";
      document.getElementById("groupFilter").value = "ALL";
      updateMap();
    });
  });
}

// ================================
// MAP INIT
// ================================
function initLeafletMap() {
  map = L.map("map", { worldCopyJump: true }).setView([20, 0], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  markerLayer = L.layerGroup().addTo(map);
}

// ================================
// APPLY FILTERS + AGGREGATE
// ================================
function computeUniversityCounts() {
  const startYear = Number(document.getElementById("startYear").value);
  const endYear   = Number(document.getElementById("endYear").value);

  const discipline = document.getElementById("disciplineFilter").value;
  const group = document.getElementById("groupFilter").value;

  const topN = Number(document.getElementById("topNSlider").value);

  const selectedJournals = Array.from(
    document.querySelectorAll("#journalCheckboxes input:checked")
  ).map(cb => cb.value);

  // 1) Year filter
  let filtered = universitiesData.filter(r => r.year >= startYear && r.year <= endYear);

  // 2) Journal checkboxes (if any checked)
  if (selectedJournals.length > 0) {
    filtered = filtered.filter(r => selectedJournals.includes(r.journal));
  }

  // 3) Discipline
  if (discipline !== "ALL") {
    filtered = filtered.filter(r => r.disciplineAbbr === discipline);
  }

  // 4) Group
  if (group === "UTD24") {
    filtered = filtered.filter(r => r.utd24 === 1);
  } else if (group === "FT50") {
    filtered = filtered.filter(r => r.ft50 === 1);
  }

  // Aggregate counts
  const counts = {};
  filtered.forEach(r => {
    if (!counts[r.university]) counts[r.university] = 0;
    counts[r.university] += 1;
  });

  // Convert + sort
  let arr = Object.keys(counts).map(u => ({
    university: u,
    articles: counts[u]
  }));

  arr.sort((a, b) => b.articles - a.articles);

  // Assign ranks
  arr.forEach((r, i) => r.rank = i + 1);

  // Return full + top slice
  const top = arr.slice(0, topN);
  return { full: arr, top };
}

// ================================
// RENDER MAP
// ================================
function updateMap() {
  if (!pageInitialized) return;

  markerLayer.clearLayers();

  // UI: Top N label
  const topN = Number(document.getElementById("topNSlider").value);
  document.getElementById("topNValue").textContent = `Top N: ${topN}`;

  const { top } = computeUniversityCounts();

  // determine max for linear scaling
  const maxCount = top.length ? Math.max(...top.map(d => d.articles)) : 1;

  let missingGeo = 0;

  top.forEach(row => {
    const g = geoByUniversity.get(row.university);

    if (!g || g.lat == null || g.lon == null) {
      missingGeo += 1;
      return;
    }

    const lat = Number(g.lat);
    const lon = Number(g.lon);

    // Linear scaling: radius between 5 and 22
    const radius = 5 + (17 * (row.articles / maxCount));

    const popupHtml = `
      <div style="min-width:220px;">
        <div style="font-weight:bold; margin-bottom:6px;">
          #${row.rank} — ${row.university}
        </div>
        <div><b>Articles:</b> ${row.articles}</div>
        <div><b>Country:</b> ${g.country || ""} (${g.country_code || ""})</div>
      </div>
    `;

    L.circleMarker([lat, lon], {
      radius,
      weight: 1,
      fillOpacity: 0.65
    })
    .addTo(markerLayer)
    .bindPopup(popupHtml);
  });

  const note = document.getElementById("missingGeoNote");
  note.textContent = missingGeo
    ? `Note: ${missingGeo} of the Top N universities have no usable coordinates yet (Phase 2 will improve this).`
    : "";
}

// ================================
// DISCIPLINE/GROUP → auto-check journals
// ================================
function applyDisciplineFilterToJournals(discipline) {
  // get journals in discipline from data
  const setJ = new Set(
    universitiesData
      .filter(r => r.disciplineAbbr === discipline)
      .map(r => r.journal)
      .filter(Boolean)
  );

  document.querySelectorAll("#journalCheckboxes input").forEach(cb => {
    cb.checked = setJ.has(cb.value);
  });

  updateMap();
}

function applyGroupFilterToJournals(group) {
  const setJ = new Set();

  universitiesData.forEach(r => {
    if (group === "UTD24" && r.utd24 === 1) setJ.add(r.journal);
    if (group === "FT50" && r.ft50 === 1) setJ.add(r.journal);
  });

  document.querySelectorAll("#journalCheckboxes input").forEach(cb => {
    cb.checked = setJ.has(cb.value);
  });

  updateMap();
}

// ================================
// RESET
// ================================
function resetAllFilters() {
  document.getElementById("startYear").value = MIN_YEAR;
  document.getElementById("endYear").value = MAX_YEAR;

  document.getElementById("disciplineFilter").value = "ALL";
  document.getElementById("groupFilter").value = "ALL";

  document.getElementById("topNSlider").value = 100;
  document.getElementById("topNValue").textContent = "Top N: 100";

  // uncheck all journals (means ALL journals)
  document.querySelectorAll("#journalCheckboxes input").forEach(cb => cb.checked = false);

  updateMap();
}

// ================================
// LISTENERS
// ================================
document.addEventListener("change", (e) => {
  if (!pageInitialized) return;

  // year changes, slider changes, etc.
  if (["startYear", "endYear", "topNSlider"].includes(e.target.id)) {
    updateMap();
  }
});

// Discipline dropdown behavior (same style as authors)
document.getElementById("disciplineFilter").addEventListener("change", function () {
  const val = this.value;
  if (val === "ALL") { updateMap(); return; }
  document.getElementById("groupFilter").value = "ALL";
  applyDisciplineFilterToJournals(val);
});

// Group dropdown behavior (same style as authors)
document.getElementById("groupFilter").addEventListener("change", function () {
  const val = this.value;
  if (val === "ALL") { updateMap(); return; }
  document.getElementById("disciplineFilter").value = "ALL";
  applyGroupFilterToJournals(val);
});

document.getElementById("resetFiltersBtn").addEventListener("click", resetAllFilters);

// ================================
// START
// ================================
loadMapPage();
