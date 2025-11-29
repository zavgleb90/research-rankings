// GLOBAL DATA
let universitiesData = [];

let MIN_YEAR = 9999;
let MAX_YEAR = 0;

/* =======================================================
   LOAD DATA
======================================================= */
async function loadUniversities() {
    universitiesData = await fetch("./data/universitiesSub.json").then(r => r.json());

    // Build journal → discipline mapping
    window.journalDisciplineMap = {};
    universitiesData.forEach(u => {
        journalDisciplineMap[u.journal] = u.disciplineAbbr;
    });

    // Build journal → group mapping
    window.journalGroupMap = {};
    universitiesData.forEach(u => {
        journalGroupMap[u.journal] = {
            utd24: u.utd24,
            ft50: u.ft50
        };
    });

    // Detect year bounds
    universitiesData.forEach(u => {
        if (u.year < MIN_YEAR) MIN_YEAR = u.year;
        if (u.year > MAX_YEAR) MAX_YEAR = u.year;
    });

    populateYearDropdowns();
    populateJournalCheckboxes();
    populateDisciplineDropdown();
    updateUniversityRankings();
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
        universitiesData
            .map(u => u.journal)
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
    });

    // Attach listener AFTER all checkboxes exist
    document.querySelectorAll("#journalCheckboxes input").forEach(cb => {
        cb.addEventListener("change", () => {

            // Manual journal change → reset discipline/group
            document.getElementById("disciplineFilter").value = "ALL";
            document.getElementById("groupFilter").value = "ALL";

            updateUniversityRankings();
        });
    });
}

/* =======================================================
   DISCIPLINE FILTER
======================================================= */
function populateDisciplineDropdown() {
    const sel = document.getElementById("disciplineFilter");
    const disciplines = [...new Set(universitiesData.map(u => u.disciplineAbbr))].sort();

    disciplines.forEach(d => {
        const opt = document.createElement("option");
        opt.value = d;
        opt.textContent = d;
        sel.appendChild(opt);
    });

    sel.value = "ALL";
}

/* =======================================================
   COMPUTE FULL UNIVERSITY RANKING (Preserve actual ranks)
======================================================= */
function computeFullUniversityRanking(startYear, endYear, selectedJournals, selectedDiscipline, selectedGroup) {

    // STEP 1 — YEAR filter
    let filtered = universitiesData.filter(u =>
        u.year >= startYear && u.year <= endYear
    );

    // STEP 2 — JOURNAL CHECKBOX filter
    if (selectedJournals.length > 0) {
        filtered = filtered.filter(u => selectedJournals.includes(u.journal));
    }

    // STEP 3 — DISCIPLINE filter
    if (selectedDiscipline !== "ALL") {
        filtered = filtered.filter(u => u.disciplineAbbr === selectedDiscipline);
    }

    // STEP 4 — GROUP filter (UTD24 / FT50)
    if (selectedGroup === "UTD24") {
        filtered = filtered.filter(u => u.utd24 === 1);
    } else if (selectedGroup === "FT50") {
        filtered = filtered.filter(u => u.ft50 === 1);
    }

    // STEP 5 — Count papers per university
    const counts = {};
    filtered.forEach(u => {
        if (!counts[u.university]) counts[u.university] = 0;
        counts[u.university] += 1;
    });

    // Convert to ranking array
    let ranking = Object.keys(counts).map(university => ({
        university: university,
        articles: counts[university]
    }));

    // Sort & assign true rank
    ranking.sort((a, b) => b.articles - a.articles);
    ranking.forEach((r, i) => r.rank = i + 1);

    return ranking;
}

/* =======================================================
   UPDATE TABLE
======================================================= */
function updateUniversityRankings() {

    const startYear = Number(document.getElementById("startYear").value);
    const endYear   = Number(document.getElementById("endYear").value);

    const searchTerm = document.getElementById("universitySearch").value.trim().toLowerCase();

    const selectedDiscipline = document.getElementById("disciplineFilter").value;
    const selectedGroup = document.getElementById("groupFilter").value;

    const selectedJournals = Array.from(
        document.querySelectorAll("#journalCheckboxes input:checked")
    ).map(cb => cb.value);

    // Compute rankings
    let fullRanking = computeFullUniversityRanking(
        startYear,
        endYear,
        selectedJournals,
        selectedDiscipline,
        selectedGroup
    );

    // Apply name search — preserve rank
   let filteredRanking = fullRanking.filter(r =>
       r.university.toLowerCase().includes(searchTerm)
   );
   
   // LIMIT TO TOP 100 ONLY WHEN NO SEARCH TERM
   if (searchTerm === "") {
       filteredRanking = filteredRanking.slice(0, 100);
   }
   
   renderUniversityTable(filteredRanking);

}

/* =======================================================
   AUTO-SELECT JOURNALS FOR DISCIPLINE
======================================================= */
function applyDisciplineFilter(discipline) {
    document.querySelectorAll("#journalCheckboxes input").forEach(cb => {
        const journal = cb.value;
        const journalDisc = journalDisciplineMap[journal];
        cb.checked = (journalDisc === discipline);
    });

    updateUniversityRankings();
}

/* =======================================================
   AUTO-SELECT JOURNALS FOR GROUP (UTD24 / FT50)
======================================================= */
function applyGroupFilter(group) {
    document.querySelectorAll("#journalCheckboxes input").forEach(cb => {
        const journal = cb.value;
        const g = journalGroupMap[journal];

        if (group === "UTD24") {
            cb.checked = (g.utd24 === 1);
        } else if (group === "FT50") {
            cb.checked = (g.ft50 === 1);
        }
    });

    updateUniversityRankings();
}

/* =======================================================
   RENDER TABLE
======================================================= */
function renderUniversityTable(rows) {
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

/* =======================================================
   EVENT LISTENERS
======================================================= */
document.addEventListener("change", updateUniversityRankings);
document.getElementById("universitySearch").addEventListener("input", updateUniversityRankings);

// Discipline → auto-select journals
document.getElementById("disciplineFilter").addEventListener("change", function () {
    const val = this.value;

    if (val === "ALL") {
        updateUniversityRankings();
        return;
    }

    // Reset group filter
    document.getElementById("groupFilter").value = "ALL";

    applyDisciplineFilter(val);
});

// Group → auto-select journals
document.getElementById("groupFilter").addEventListener("change", function () {
    const val = this.value;

    if (val === "ALL") {
        updateUniversityRankings();
        return;
    }

    // Reset discipline filter
    document.getElementById("disciplineFilter").value = "ALL";

    applyGroupFilter(val);
});

// Reset button
document.getElementById("resetFiltersBtn").addEventListener("click", resetAllFilters);

/* =======================================================
   RESET ALL FILTERS
======================================================= */
function resetAllFilters() {

    // Reset search
    document.getElementById("universitySearch").value = "";

    // Reset discipline and group
    document.getElementById("disciplineFilter").value = "ALL";
    document.getElementById("groupFilter").value = "ALL";

    // Reset years
    document.getElementById("startYear").value = MIN_YEAR;
    document.getElementById("endYear").value = MAX_YEAR;

    // Uncheck all journals
    document.querySelectorAll("#journalCheckboxes input").forEach(cb => {
        cb.checked = false;
    });

    updateUniversityRankings();
}

/* =======================================================
   START
======================================================= */
loadUniversities();

