// GLOBAL DATA
let authorsData = [];

let MIN_YEAR = 9999;
let MAX_YEAR = 0;

/* =======================================================
   LOAD DATA
======================================================= */
async function loadAuthors() {
    authorsData = await fetch("./data/authorsSub.json").then(r => r.json());

    // Detect year bounds
    authorsData.forEach(a => {
        if (a.year < MIN_YEAR) MIN_YEAR = a.year;
        if (a.year > MAX_YEAR) MAX_YEAR = a.year;
    });

    populateYearDropdowns();
    populateJournalFilter();
    updateAuthorsRankings();
}

/* =======================================================
   YEAR FILTER
======================================================= */
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

    startSel.value = MIN_YEAR;
    endSel.value = MAX_YEAR;
}

/* =======================================================
   JOURNAL FILTER (MULTI SELECT)
======================================================= */
function populateJournalFilter() {
    const container = document.getElementById("journalCheckboxes");
    container.innerHTML = "";

    const allJournals = [...new Set(authorsData.map(a => a.journal))].filter(j => j && j.trim() !== "").sort();

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

        // event listener
        div.querySelector("input")
            .addEventListener("change", updateAuthorsRankings);
    });
}

/* =======================================================
   COMPUTE FULL AUTHOR RANKING (preserves rank order)
======================================================= */
function computeFullAuthorRanking(startYear, endYear, selectedJournals) {
    let filtered = authorsData.filter(a =>
        a.year >= startYear &&
        a.year <= endYear
    );

    // Filter by journals ONLY IF user selected journals
    if (selectedJournals.length > 0) {
        filtered = filtered.filter(a =>
            selectedJournals.includes(a.journal)
        );
    }

    // Count articles per author
    const counts = {};
    filtered.forEach(a => {
        if (!counts[a.author]) counts[a.author] = 0;
        counts[a.author] += 1;
    });

    // Convert to ranking array
    let ranking = Object.keys(counts).map(author => ({
        author: author,
        articles: counts[author]
    }));

    // Sort descending + assign true ranks
    ranking.sort((a, b) => b.articles - a.articles);
    ranking.forEach((r, i) => r.rank = i + 1);

    return ranking;
}

/* =======================================================
   UPDATE RANKINGS
======================================================= */
function updateAuthorsRankings() {
    const startYear = Number(document.getElementById("startYear").value);
    const endYear = Number(document.getElementById("endYear").value);
    const searchTerm = document.getElementById("authorSearch").value.trim().toLowerCase();

    // Extract selected journals
    const journalSel = document.getElementById("journalFilter");
    const selectedJournals = Array.from(document.querySelectorAll("#journalCheckboxes input:checked")).map(cb => cb.value);

    // Step 1: compute full correct ranking
    let fullRanking = computeFullAuthorRanking(startYear, endYear, selectedJournals);

    // Step 2: apply search without re-ranking
    let filteredRanking = fullRanking.filter(r =>
        r.author.toLowerCase().includes(searchTerm)
    );

    renderAuthorsTable(filteredRanking);
}

/* =======================================================
   RENDER TABLE
======================================================= */
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

/* =======================================================
   EVENT LISTENERS
======================================================= */
document.addEventListener("change", updateAuthorsRankings);
document.getElementById("authorSearch").addEventListener("input", updateAuthorsRankings);

document.getElementById("journalFilter").addEventListener("change", updateAuthorsRankings);

/* =======================================================
   START
======================================================= */
loadAuthors();
