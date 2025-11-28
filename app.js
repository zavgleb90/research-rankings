// GLOBAL DATA
let universities = [];
let authors = [];

// Load data on startup
async function loadData() {
    universities = await fetch("data/universitiesSub.json").then(r => r.json());
    authors = await fetch("data/authorsSub.json").then(r => r.json());
    updateRankings(); // initial page load
}

// Filter + aggregate for universities
function computeUniversityRankings(startYear, endYear) {
    // Step 1: filter by year
    const filtered = universities.filter(r => r.year >= startYear && r.year <= endYear);

    // Step 2: aggregate counts
    const counts = {};
    filtered.forEach(row => {
        if (!counts[row.university]) counts[row.university] = 0;
        counts[row.university] += 1;
    });

    // Step 3: convert to array
    const ranking = Object.keys(counts).map((uni, i) => ({
        university: uni,
        articles: counts[uni]
    }));

    // Step 4: sort descending
    ranking.sort((a, b) => b.articles - a.articles);

    // Step 5: add rank numbers
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
    const yearRange = document.getElementById("yearRange").value; // e.g. "2020-2024"
    const [startYear, endYear] = yearRange.split("-").map(Number);

    const rankings = computeUniversityRankings(startYear, endYear);
    renderTable(rankings);
}

// Event listener
document.getElementById("yearRange").addEventListener("change", updateRankings);

// Start!
loadData();

