// GLOBAL DATA
let authorsData = [];

// Year bounds — will be detected from data
let MIN_YEAR = 9999;
let MAX_YEAR = 0;

async function loadAuthors() {
    authorsData = await fetch("./data/authorsSub.json").then(r => r.json());

    // Detect min/max years automatically
    authorsData.forEach(a => {
        if (a.year < MIN_YEAR) MIN_YEAR = a.year;
        if (a.year > MAX_YEAR) MAX_YEAR = a.year;
    });

    populateYearDropdowns();
    updateAuthorsRankings();
}

/* -------------------------------
   Populate Start/End Year Menus
--------------------------------*/
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

    // Default = full range
    startSel.value = MIN_YEAR;
    endSel.value = MAX_YEAR;
}

/* -------------------------------
   Compute FULL Author Rankings
--------------------------------*/
function computeFullAuthorRanking(startYear, endYear) {
    // Filter by year
    let yearFiltered = authorsData.filter(a =>
        a.year >= startYear && a.year <= endYear
    );

    // Count articles per author
    const counts = {};
    yearFiltered.forEach(a => {
        if (!counts[a.author]) counts[a.author] = 0;
        counts[a.author] += 1;
    });

    // Convert to ranking list
    let ranking = Object.keys(counts).map(author => ({
        author: author,
        articles: counts[author]
    }));

    // Sort DESC
    ranking.sort((a, b) => b.articles - a.articles);

    // Assign TRUE ranks
    ranking.forEach((r, i) => r.rank = i + 1);

    return ranking;
}

/* -------------------------------
   Main Update Function
--------------------------------*/
function updateAuthorsRankings() {
    const startY = Number(document.getElementById("startYear").value);
    const endY = Number(document.getElementById("endYear").value);
    const searchTerm = document.getElementById("authorSearch").value.trim().toLowerCase();

    // Step 1: compute full ranking with correct ranks
    let fullRanking = computeFullAuthorRanking(startY, endY);

    // Step 2: Apply search WITHOUT re-ranking
    let filtered = fullRanking.filter(r =>
        r.author.toLowerCase().includes(searchTerm)
    );

    // Step 3: Display filtered list with original ranks
    renderAuthorsTable(filtered);
}

/* -------------------------------
   Render Table
--------------------------------*/
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

/* -------------------------------
   Event Listeners
--------------------------------*/
document.addEventListener("change", updateAuthorsRankings);
document.getElementById("authorSearch").addEventListener("input", updateAuthorsRankings);

/* -------------------------------
   Start
--------------------------------*/
loadAuthors();
