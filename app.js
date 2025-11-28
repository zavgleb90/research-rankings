// GLOBAL DATA
let universities = [];
let authors = [];

let MIN_YEAR = 9999;
let MAX_YEAR = 0;

// Load data on startup
async function loadData() {
    universities = await fetch("./data/universitiesSub.json").then(r => r.json());

    // detect year range automatically
    universities.forEach(r => {
        if (r.year < MIN_YEAR) MIN_YEAR = r.year;
        if (r.year > MAX_YEAR) MAX_YEAR = r.year;
    });

    populateYearDropdowns();
    updateRankings();
}

// Populate dropdowns using detected min/max
function populateYearDropdowns() {
    const startSel = document.getElementById("startYear");
    const endSel = document.getElementById("endYear");

    startSel.innerHTML = "";
    endSel.innerHTML = "";

    for (let y = MIN_YEAR; y <= MAX_YEAR; y++) {
        let s = document.createElement("option");
        s.value = y;
        s.textContent = y;
        startSel.appendChild(s);

        let e = document.createElement("option");
        e.value = y;
        e.textContent = y;
        endSel.appendChild(e);
    }

    // Default = ALL YEARS
    startSel.value = MIN_YEAR;
    endSel.value = MAX_YEAR;
}

// Compute rankings
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

// RENDER TABLE
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

// MAIN UPDATE FUNCTION
function updateRankings() {
    const startYear = Number(document.getElementById("startYear").value);
    const endYear = Number(document.getElementById("endYear").value);

    if (startYear > endYear) return;

    const rankings = computeUniversityRankings(startYear, endYear);
    renderTable(rankings);
}

// Listeners
document.addEventListener("change", updateRankings);

// Start!
loadData();
