// ======================================
// GLOBAL DATA
// ======================================
let articlesData = [];

let MIN_YEAR = 9999;
let MAX_YEAR = 0;

// ======================================
// LOAD DATA
// ======================================
async function loadArticles() {
    articlesData = await fetch("./data/articlesSub.json").then(r => r.json());

    // Detect year bounds
    articlesData.forEach(a => {
        if (a.year < MIN_YEAR) MIN_YEAR = a.year;
        if (a.year > MAX_YEAR) MAX_YEAR = a.year;
    });

    populateYearDropdowns();
    populateArticleJournalCheckboxes();
    setDefaultYearRangeToLastThreeYears();
    runArticleSearch();  // initial load
}

// ======================================
// YEAR DROPDOWNS
// ======================================
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

    // Temporary default; we'll correct in setDefaultYearRangeToLastThreeYears()
    startSel.value = MIN_YEAR;
    endSel.value = MAX_YEAR;
}

function setDefaultYearRangeToLastThreeYears() {
    const startSel = document.getElementById("startYear");
    const endSel = document.getElementById("endYear");

    const defaultEnd = MAX_YEAR;
    const defaultStart = Math.max(MIN_YEAR, MAX_YEAR - 2); // last 3 years inclusive

    startSel.value = defaultStart;
    endSel.value = defaultEnd;
}

// ======================================
// JOURNAL CHECKBOXES
// ======================================
function populateArticleJournalCheckboxes() {
    const container = document.getElementById("articleJournalCheckboxes");
    container.innerHTML = "";

    const allJournals = [...new Set(
        articlesData
            .map(a => a.journal)
            .filter(j => j && j.trim() !== "")
    )].sort();

    allJournals.forEach(journal => {
        const id = "article_journal_" + journal.replace(/\W+/g, "_");

        const div = document.createElement("div");
        div.innerHTML = `
            <label>
                <input type="checkbox" value="${journal}" id="${id}" checked>
                ${journal}
            </label>
        `;
        container.appendChild(div);
    });

    // Optional: update on checkbox change
    document.querySelectorAll("#articleJournalCheckboxes input").forEach(cb => {
        cb.addEventListener("change", () => {
            // We won't reset anything here, just allow re-filtering on click
            // If you want live update, uncomment:
            // runArticleSearch();
        });
    });
}

// ======================================
// MAIN SEARCH FUNCTION
// ======================================
function runArticleSearch() {
    const startYear = Number(document.getElementById("startYear").value);
    const endYear   = Number(document.getElementById("endYear").value);

    const searchTerm = document.getElementById("articleSearch")
        .value.trim().toLowerCase();

    // Which journals are selected?
    const selectedJournals = Array.from(
        document.querySelectorAll("#articleJournalCheckboxes input:checked")
    ).map(cb => cb.value);

    // Step 1: filter by year
    let filtered = articlesData.filter(a =>
        a.year >= startYear && a.year <= endYear
    );

    // Step 2: filter by journals (if at least one is selected)
    if (selectedJournals.length > 0) {
        filtered = filtered.filter(a => selectedJournals.includes(a.journal));
    }

    // Step 3: filter by title search (if not empty)
    if (searchTerm !== "") {
        filtered = filtered.filter(a =>
            a.title.toLowerCase().includes(searchTerm)
        );
    }

    renderArticleTable(filtered);
}

// ======================================
// RENDER TABLE
// ======================================
function renderArticleTable(rows) {
    const tbody = document.getElementById("articleTableBody");
    tbody.innerHTML = "";

    rows.forEach(a => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${a.year}</td>
            <td>${a.journal}</td>
            <td>${a.title}</td>
            <td>${a.authors || ""}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ======================================
// RESET FILTERS
// ======================================
function resetArticleFilters() {
    document.getElementById("articleSearch").value = "";

    // Reset year to last three years
    setDefaultYearRangeToLastThreeYears();

    // Re-check all journals
    document.querySelectorAll("#articleJournalCheckboxes input").forEach(cb => {
        cb.checked = true;
    });

    runArticleSearch();
}

// ======================================
// EVENT LISTENERS
// ======================================
document.getElementById("articleSearchBtn").addEventListener("click", runArticleSearch);
document.getElementById("articleResetBtn").addEventListener("click", resetArticleFilters);

// Optional: run search when Enter is pressed in title box
document.getElementById("articleSearch").addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
        runArticleSearch();
    }
});

// Optional: update when year dropdowns change
document.addEventListener("change", (e) => {
    if (e.target.id === "startYear" || e.target.id === "endYear") {

        // Ignore the initial automatic changes caused by loading the dropdowns
        if (!window.articlesPageInitialized) return;

        // Optional: auto-run search
        // runArticleSearch();
    }
});

// ======================================
// START
// ======================================
loadArticles().then(() => {
    window.articlesPageInitialized = true;
});

