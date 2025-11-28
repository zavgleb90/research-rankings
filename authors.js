// GLOBAL DATA
let authorsData = [];

// Year bounds
const MIN_YEAR = 2010;
const MAX_YEAR = 2024;

// Load data on startup
async function loadAuthors() {
    authorsData = await fetch("./data/authorsSub.json").then(r => r.json());
    populateYearDropdowns();
    updateAuthorsRankings();
}

// Populate year dropdowns
function populateYearDropdowns() {
    const startSel = document.getElementById("startYear");
    const endSel = document.getElementById("endYear");

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

    // Default range
    startSel.value = 2016;
    endSel.value = 2024;
}

// Compute author rankings
function computeAuthorRankings(startYear, endYear, searchTerm = "") {
    let filtered = authorsData.filter(a =>
        a.year >= startYear &&
        a.year <= endYear
    );

    if (searchTerm.length > 0) {
        const lower = searchTerm.toLowerCase();
        filtered = filtered.filter(a => a.author.toLowerCase().includes(lower));
    }

    // Count by author
    const counts = {};
    filtered.forEach(a => {
        if (!counts[a.author]) counts[a.author] = 0;
        counts[a.author] += 1;
    });

    const ranking = Object.keys(counts).map(author => ({
        author: author,
        articles: counts[author]
    }));

    ranking.sort((a, b) => b.articles - a.articles);
    ranking.forEach((r, i) => r.rank = i + 1);

    return ranking;
}

// Render table
function renderAuthorsTable(rows) {
    const tbody = document.getElementById("authorsTableBody");
    tbody.innerHTML = "";

    rows.forEach(r => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${r.rank}</td>
            <td>${r.author}</td>
            <td>${r.articles}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Update rankings
function updateAuthorsRankings() {
    const startY = Number(document.getElementById("startYear").value);
    const endY = Number(document.getElementById("endYear").value);
    const search = document.getElementById("authorSearch").value.trim();

    const ranking = computeAuthorRankings(startY, endY, search);
    renderAuthorsTable(ranking);
}

// Event listeners
document.addEventListener("change", updateAuthorsRankings);
document.getElementById("authorSearch").addEventListener("input", updateAuthorsRankings);

// Start!
loadAuthors();
