// HOME SNAPSHOT (Top 10) — 2022–2024, all journals
const HOME_START_YEAR = 2022;
const HOME_END_YEAR = 2024;

async function loadHomeSnapshot() {
  try {
    const [authorsData, universitiesData] = await Promise.all([
      fetch("./data/authorsSub.json").then(r => r.json()),
      fetch("./data/universitiesSub.json").then(r => r.json())
    ]);

    const topAuthors = computeTopCounts(
      authorsData,
      "author",
      HOME_START_YEAR,
      HOME_END_YEAR,
      10
    );

    const topUniversities = computeTopCounts(
      universitiesData,
      "university",
      HOME_START_YEAR,
      HOME_END_YEAR,
      10
    );

    renderHomeTable("homeAuthorsBody", topAuthors, "author");
    renderHomeTable("homeUniversitiesBody", topUniversities, "university");

  } catch (err) {
    console.error("Home snapshot error:", err);
  }
}

// Generic counter: counts rows by key within year range
function computeTopCounts(data, keyField, startYear, endYear, topN) {
  const filtered = data.filter(r => r.year >= startYear && r.year <= endYear);

  const counts = {};
  filtered.forEach(r => {
    const key = r[keyField];
    if (!key) return;
    counts[key] = (counts[key] || 0) + 1;
  });

  const ranking = Object.keys(counts).map(name => ({
    name,
    articles: counts[name]
  }));

  // assign ranks
  ranking.sort((a, b) => b.articles - a.articles);
  assignTieRanks(ranking, "articles", "rank");

  return ranking.slice(0, topN);
}

function renderHomeTable(tbodyId, rows, mode) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  tbody.innerHTML = "";

  rows.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.rank}</td>
      <td>${r.name}</td>
      <td>${r.articles}</td>
    `;
    tbody.appendChild(tr);
  });
}

function assignTieRanks(sortedRows, valueKey, rankKey = "rank") {
  // sortedRows must already be sorted DESC by valueKey
  let prevValue = null;
  let currentRank = 0;

  for (let i = 0; i < sortedRows.length; i++) {
    const v = sortedRows[i][valueKey];

    if (prevValue === null || v !== prevValue) {
      // new value group → rank is position (i+1)
      currentRank = i + 1;
      prevValue = v;
    }
    sortedRows[i][rankKey] = currentRank;
  }

  return sortedRows;
}

loadHomeSnapshot();
