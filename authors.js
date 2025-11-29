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
    populateJournalCheckboxes();
    populateDisciplineDropdown();
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
   JOURNAL FILTER (CHECKBOXES)
======================================================= */
function populateJournalCheckboxes() {
    const container = document.getElementById("journalCheckboxes");
    container.innerHTML = "";

    const allJournals = [...new Set(
        authorsData
            .map(a => a.journal)
            .filter(j => j && j.trim() !== "")
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

        // Event listener for each checkbox
        div.querySelector("input").addEventListener("change", updateAuthorsRankings);
    });
}

/* =======================================================
   DISCIPLINE FILTER
======================================================= */
function populateDisciplineDropdown() {
    const sel = document.getElementById("disciplineFilter");
    const disciplines = [...new Set(authorsData.map(a => a.disciplineAbbr))].sort();

    disciplines.forEach(d => {
        const opt = document.createElement("option");
        opt.value = d;
        opt.textContent = d;
        sel.appendChild(opt);
    });

    sel.value = "ALL";
}

/* =======================================================
   COMPUTE FULL AUTHOR RANKING (Preserve actual ranks)
======================================================= */
function computeFullAuthorRanking(startYear, endYear, selectedJournals, selectedDiscipline, selectedGroup) {

    // STEP 1 — YEAR filter
    let filtered = authorsData.filter(a =>
        a.year >= startYear && a.year <= endYear
    );

    // STEP 2 — JOURNAL CHECKBOX filter
    if (selectedJournals.length > 0) {
        filtered = filtered.filter(a => selectedJournals.includes(a.journal));
    }

    // STEP 3 — DISCIPLINE filter
    if (selectedDiscipline !== "ALL") {
        filtered = filtered.filter(a => a.disciplineAbbr === selectedDiscipline);
    }

    // STEP 4 — GROUP filter (UTD24 / FT50)
    if (selectedGroup === "UTD24") {
        filtered = filtered.filter(a => a.utd24 === 1);
    } else if (selectedGroup === "FT50") {
        filtered = filtered.filter(a => a.ft50 === 1);
    }

    // STEP 5 — Count papers per author
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

    // Sort & assign true rank
    ranking.sort((a, b) => b.articles - a.articles);
    ranking.forEach((r, i) => r.rank = i + 1);

    return ranking;
}

/* =======================================================
   UPDATE TABLE
======================================================= */
function updateAuthorsRankings() {

    const startYear = Number(document.getElementById("startYear").value);
    const endYear   = Number(document.getElementById("endYear").value);

    const searchTerm = document.getElementById("authorSearch").value.trim().toLowerCase();

    const selectedDiscipline = document.getElementById("disciplineFilter").value;
    const selectedGroup = document.getElementById("groupFilter").value;

    const selectedJournals = Array.from(
        document.querySelectorAll("#journalCheckboxes input:checked")
    ).map(cb => cb.value);

    // Compute rankings
    let fullRanking = computeFullAuthorRanking(
        startYear,
        endYear,
        selectedJournals,
        selectedDiscipline,
        selectedGroup
    );

    // Apply name search — preserve rank
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
document.getElementById("disciplineFilter").addEventListener("change", updateAuthorsRankings);
document.getElementById("groupFilter").addEventListener("change", updateAuthorsRankings);

/* =======================================================
   START
======================================================= */
loadAuthors();
