// GLOBAL DATA
let universities = [];

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

    if (!startSel || !endSel) return;

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

/* -----------------------------------------
   Compute FULL University Ranking (correct)
----------------------------------------- */
function computeFullUniversityRanking(startYear, endYear) {
    // Step 1: filter by year
    const yearFiltered = universities.filter(r =>
        r.year >= startYear && r.year <= endYear
    );

    // Step 2: count publications per university
    const counts = {};
    yearFiltered.forEach(r => {
        if (!counts[r.university]) counts[r.university] = 0;
        counts[r.university] += 1;
    });

    // Step 3: convert to array
    let ranking = Object.keys(counts).map(uni => ({
        university: uni,
        articles: counts[uni]
    }));

    // Step 4: sort and assign TRUE ranks ONCE
    ranking.sort((a, b) => b.articles - a.articles);
    ranking.forEach((r, i) => r.rank = i + 1);

    return ranking;
}

/* -----------------------------------------
   Update Rankings (preserve ranks)
----------------------------------------- */
function updateRankings() {
    const startSel = document.getElementById("startYear");
    const endSel = document.getElementById("endYear");
    if (!startSel || !endSel) return;

    const startYear = Number(startSel.value);
    const endYear = Number(endSel.value);

    const searchInput = document.getElementById("universitySearch");
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : "";

    // Step 1: compute full ranking with correct ranks
    let fullRanking = computeFullUniversityRanking(startYear, endYear);

    // Step 2: apply search WITHOUT re-ranking
    let filteredRanking = fullRanking.filter(r =>
        r.university.toLowerCase().includes(searchTerm)
    );

    // Step 3: render filtered results with original ranks
    renderTable(filteredRanking);
}

// RENDER TABLE
function renderTable(rows) {
    const tbody = document.getElementById("tableBody");
    if (!tbody) return;

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

// Listeners
document.addEventListener("change", updateRankings);

const uniSearch = document.getElementById("universitySearch");
if (uniSearch) {
    uniSearch.addEventListener("input", updateRankings);
}


// Start!
loadData();


