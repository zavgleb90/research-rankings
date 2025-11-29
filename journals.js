// ===============================
// GLOBAL DATA
// ===============================
let authorsData = [];
let universitiesData = [];

let MIN_YEAR = 9999;
let MAX_YEAR = 0;


// ===============================
// LOAD DATA
// ===============================
async function loadJournalData() {

    authorsData = await fetch("./data/authorsSub.json").then(r => r.json());
    universitiesData = await fetch("./data/universitiesSub.json").then(r => r.json());

    // Detect combined year range
    authorsData.forEach(a => {
        if (a.year < MIN_YEAR) MIN_YEAR = a.year;
        if (a.year > MAX_YEAR) MAX_YEAR = a.year;
    });

    universitiesData.forEach(u => {
        if (u.year < MIN_YEAR) MIN_YEAR = u.year;
        if (u.year > MAX_YEAR) MAX_YEAR = u.year;
    });

    populateYearDropdowns();
    updateJournalSummaries();
}


// ===============================
// YEAR FILTER DROPDOWNS
// ===============================
function populateYearDropdowns() {
    const startSel = document.getElementById("startYear");
    const endSel = document.getElementById("endYear");

    startSel.innerHTML = "";
    endSel.innerHTML = "";

    for (let y = MIN_YEAR; y <= MAX_YEAR; y++) {
        const opt1 = document.createElement("option");
        opt1.value = y;
        opt1.textContent = y;
        startSel.appendChild(opt1);

        const opt2 = document.createElement("option");
        opt2.value = y;
        opt2.textContent = y;
        endSel.appendChild(opt2);
    }

    startSel.value = MIN_YEAR;
    endSel.value = MAX_YEAR;
}


// ===============================
// BUILD SUMMARY FOR EACH JOURNAL
// ===============================
function updateJournalSummaries() {
    const startYear = Number(document.getElementById("startYear").value);
    const endYear   = Number(document.getElementById("endYear").value);

    const searchTerm = document.getElementById("journalSearch")
        .value.trim().toLowerCase();

    const container = document.getElementById("journalsContainer");
    container.innerHTML = "";

    // Collect list of journals
    const allJournals = [...new Set(authorsData.map(a => a.journal))].sort();

    allJournals.forEach(journal => {

        if (!journal.toLowerCase().includes(searchTerm))
            return;

        const journalAuthors = authorsData.filter(a =>
            a.journal === journal &&
            a.year >= startYear &&
            a.year <= endYear
        );

        const journalUniversities = universitiesData.filter(u =>
            u.journal === journal &&
            u.year >= startYear &&
            u.year <= endYear
        );

        const total = journalAuthors.length;

        // Skip journals with 0 articles
        if (total === 0) return;

        // === Top Universities ===
        let uniCounts = {};
        journalUniversities.forEach(u => {
            if (!uniCounts[u.university]) uniCounts[u.university] = 0;
            uniCounts[u.university]++;
        });

        let topUni = Object.keys(uniCounts)
            .map(u => ({
                university: u,
                count: uniCounts[u],
                pct: ((uniCounts[u] / total) * 100).toFixed(1)
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

        // === Top Authors ===
        let authCounts = {};
        journalAuthors.forEach(a => {
            if (!authCounts[a.author]) authCounts[a.author] = 0;
            authCounts[a.author]++;
        });

        let topAuth = Object.keys(authCounts)
            .map(a => ({
                author: a,
                count: authCounts[a],
                pct: ((authCounts[a] / total) * 100).toFixed(1)
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);


        // ===========================
        // RENDER THIS JOURNAL BLOCK
        // ===========================
        const block = document.createElement("div");
        block.className = "journal-block";
        block.innerHTML = `
            <h2>${journal}</h2>
            <p><strong>Total Articles (${startYear}–${endYear}):</strong> ${total}</p>

            <h3>Top Universities</h3>
            <ul>
                ${topUni.map(u =>
                    `<li>${u.university} — ${u.count} (${u.pct}%)</li>`
                ).join("")}
            </ul>

            <h3>Top Authors</h3>
            <ul>
                ${topAuth.map(a =>
                    `<li>${a.author} — ${a.count} (${a.pct}%)</li>`
                ).join("")}
            </ul>

            <hr>
        `;

        container.appendChild(block);
    });
}


// ===============================
// RESET FILTERS
// ===============================
document.getElementById("resetJournalFilters").addEventListener("click", () => {
    document.getElementById("startYear").value = MIN_YEAR;
    document.getElementById("endYear").value = MAX_YEAR;
    document.getElementById("journalSearch").value = "";
    updateJournalSummaries();
});


// ===============================
// EVENT LISTENERS
// ===============================
document.addEventListener("change", updateJournalSummaries);
document.getElementById("journalSearch").addEventListener("input", updateJournalSummaries);


// ===============================
// START
// ===============================
loadJournalData();
