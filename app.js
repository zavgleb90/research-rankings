// GLOBAL DATA
let universities = [];

let MIN_YEAR = 9999;
let MAX_YEAR = 0;

let uniJournalDisciplineMap = {};
let uniJournalGroupMap = {};

// Load data on startup
async function loadData() {
    universities = await fetch("./data/universitiesSub.json").then(r => r.json());

    // detect year range automatically
    universities.forEach(r => {
        if (r.year < MIN_YEAR) MIN_YEAR = r.year;
        if (r.year > MAX_YEAR) MAX_YEAR = r.year;
    });

    populateYearDropdowns();
    populateUniDisciplineDropdown();
    populateUniJournalCheckboxes();
    populateUniGroupFilter();

    updateRankings();
}

/* -----------------------------------------
   Populate Year Dropdowns
----------------------------------------- */
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

    startSel.value = MIN_YEAR;
    endSel.value = MAX_YEAR;
}

/* -----------------------------------------
   Compute FULL University Ranking
----------------------------------------- */
function computeFullUniversityRanking(startYear, endYear) {
    let filtered = universities.filter(r =>
        r.year >= startYear &&
        r.year <= endYear &&
        passesDisciplineFilter(r) &&
        passesGroupFilter(r) &&
        passesJournalFilter(r)
    );

    // Count publications per university
    const counts = {};
    filtered.forEach(r => {
        if (!counts[r.university]) counts[r.university] = 0;
        counts[r.university] += 1;
    });

    let ranking = Object.keys(counts).map(uni => ({
        university: uni,
        articles: counts[uni]
    }));

    ranking.sort((a, b) => b.articles - a.articles);
    ranking.forEach((r, i) => r.rank = i + 1);

    return ranking;
}

/* -----------------------------------------
   FILTER LOGIC
----------------------------------------- */

// Discipline filter
function passesDisciplineFilter(row) {
    const sel = document.getElementById("uniDisciplineFilter");
    if (!sel || sel.value === "ALL") return true;
    return row.disciplineAbbr === sel.value;
}

// Group filter (UTD24 / FT50)
function passesGroupFilter(row) {
    const sel = document.getElementById("uniGroupFilter");
    if (!sel || sel.value === "ALL") return true;

    if (sel.value === "UTD24") return row.utd24 === 1;
    if (sel.value === "FT50") return row.ft50 === 1;

    return true;
}

// Journal checkboxes
function passesJournalFilter(row) {
    const checked = [...document.querySelectorAll("#uniJournalCheckboxes input:checked")]
                    .map(cb => cb.value);

    if (checked.length === 0) return true;  // no journal filter applied

    return checked.includes(row.journal);
}

/* -----------------------------------------
   Dropdown: Discipline
----------------------------------------- */
function populateUniDisciplineDropdown() {
    const sel = document.getElementById("uniDisciplineFilter");
    sel.innerHTML = '<option value="ALL">All Disciplines</option>';

    const disc = [...new Set(universities.map(u => u.disciplineAbbr))].sort();
    disc.forEach(d => {
        const opt = document.createElement("option");
        opt.value = d;
        opt.textContent = d;
        sel.appendChild(opt);
    });

    // Build journal → discipline map
    universities.forEach(r => {
        uniJournalDisciplineMap[r.journal] = r.disciplineAbbr;
    });

    // Listener: discipline → auto-check journals
    sel.addEventListener("change", () => {
        const val = sel.value;

        if (val === "ALL") {
            updateRankings();
            return;
        }

        document.getElementById("uniGroupFilter").value = "ALL";

        document.querySelectorAll("#uniJournalCheckboxes input").forEach(cb => {
            cb.checked = (uniJournalDisciplineMap[cb.value] === val);
        });

        updateRankings();
    });
}

/* -----------------------------------------
   Dropdown: Group (UTD/FT)
----------------------------------------- */
function populateUniGroupFilter() {
    const sel = document.getElementById("uniGroupFilter");

    // Build journal → group map
    universities.forEach(r => {
        uniJournalGroupMap[r.journal] = {
            utd24: r.utd24,
            ft50: r.ft50
        };
    });

    // Listener
    sel.addEventListener("change", () => {
        const val = sel.value;

        if (val === "ALL") {
            updateRankings();
            return;
        }

        document.getElementById("uniDisciplineFilter").value = "ALL";

        document.querySelectorAll("#uniJournalCheckboxes input").forEach(cb => {
            const g = uniJournalGroupMap[cb.value];
            if (val === "UTD24") cb.checked = (g.utd24 === 1);
            if (val === "FT50") cb.checked = (g.ft50 === 1);
        });

        updateRankings();
    });
}

/* -----------------------------------------
   Journal Checkboxes
----------------------------------------- */
function populateUniJournalCheckboxes() {
    const container = document.getElementById("uniJournalCheckboxes");
    container.innerHTML = "";

    const allJournals = [...new Set(
        universities.map(u => u.journal).filter(j => j && j.trim() !== "")
    )].sort();

    allJournals.forEach(journal => {
        const id = "uni_journal_" + journal.replace(/\W+/g, "_");

        const div = document.createElement("div");
        div.innerHTML = `
            <label>
                <input type="checkbox" value="${journal}" id="${id}">
                ${journal}
            </label>
        `;
        container.appendChild(div);
    });

    // Manual click = reset discipline & group
    document.querySelectorAll("#uniJournalCheckboxes input").forEach(cb => {
        cb.addEventListener("change", () => {
            document.getElementById("uniDisciplineFilter").value = "ALL";
            document.getElementById("uniGroupFilter").value = "ALL";
            updateRankings();
        });
    });
}

/* -----------------------------------------
   Reset Button
----------------------------------------- */
document.getElementById("uniResetFiltersBtn")?.addEventListener("click", () => {

    document.getElementById("uniDisciplineFilter").value = "ALL";
    document.getElementById("uniGroupFilter").value = "ALL";

    document.querySelectorAll("#uniJournalCheckboxes input").forEach(cb => cb.checked = false);

    document.getElementById("startYear").value = MIN_YEAR;
    document.getElementById("endYear").value = MAX_YEAR;

    const uniSearch = document.getElementById("universitySearch");
    if (uniSearch) uniSearch.value = "";

    updateRankings();
});

/* -----------------------------------------
   UPDATE RANKINGS
----------------------------------------- */
function updateRankings() {
    const startYear = Number(document.getElementById("startYear").value);
    const endYear = Number(document.getElementById("endYear").value);
    const searchTerm = document.getElementById("universitySearch")?.value.trim().toLowerCase() || "";

    let fullRanking = computeFullUniversityRanking(startYear, endYear);

    let filtered = fullRanking.filter(r =>
        r.university.toLowerCase().includes(searchTerm)
    );

    renderTable(filtered);
}

/* -----------------------------------------
   RENDER TABLE
----------------------------------------- */
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

/* -----------------------------------------
   Listeners
----------------------------------------- */
document.addEventListener("change", updateRankings);

document.addEventListener("DOMContentLoaded", () => {
    const uniSearch = document.getElementById("universitySearch");
    if (uniSearch) {
        uniSearch.addEventListener("input", updateRankings);
    }
});

// Start!
loadData();
