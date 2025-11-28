// GLOBAL DATA
let universities = [];
let authors = [];

// Available years (you said 2016–2024)
const MIN_YEAR = 2010;
const MAX_YEAR = 2024;

// Populate dropdowns
function populateYearDropdowns() {
    const startSel = document.getElementById("startYear");
    const endSel = document.getElementById("endYear");

    for (let y = MIN_YEAR; y <= MAX_YEAR; y++) {
        let opt1 = document.createElement("option");
        opt1.value = y;
        opt1.textContent = y;
        startSel.appendChild(opt1);

        let opt2 = document.createElement("option");
        opt2.value = y;
        opt2.textContent = y;
        endSel.appendChild(opt2);
    }

    // Default range = 2016–2024
    startSel.value = 2016;
    endSel.value = 2024;
}

// Load data on startup
async function loadData() {
    universities = await fetch("./data/universitiesSub.json").then(r => r.json());
    authors = await fetch("./data/authorsSub.json").then(r => r.json());

    populateYearDropdowns();
    updateRankings();
}

// Compute university ranking
function computeUniversityRankings(startYear, endYear) {
    const filtered = universities.filter(r =>
        r.year >= startYear && r.year <= endYear
    );

    const counts = {};
    filtered.forEach(row => {
        if (!counts[row.university]) counts[row.university] = 0;
        counts[row.university] += 1;
    });

    const ranking = Object.keys(counts).map(uni => ({
        university: uni,
        articles: counts[uni]
    }));

    ranking.sort((a, b) => b.articles - a.articles);
    ranking.forEach((r, i) => r.rank = i + 1);

    return ranking;
}

// Render HTML table
function renderTable(rows) {
    const tbody = document.getElementById("tableBody");
    tbody.innerHTML = "";

    rows.forEach(r => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${r.rank}</td>
            <td>${r.university}</td>
            <td>${r.articles}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Update all
function updateRankings() {
    const startYear = Number(document.getElementById("startYear").value);
    const endYear = Number(document.getElementById("endYear").value);

    if (startYear > endYear) return;

    const rankings = computeUniversityRankings(startYear, endYear);
    renderTable(rankings);
}

// Event listeners
document.addEventListener("change", updateRankings);

// Start!
loadData();
