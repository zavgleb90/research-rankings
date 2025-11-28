let authorsData = [];
let MIN_YEAR = 9999;
let MAX_YEAR = 0;

async function loadAuthors() {
    authorsData = await fetch("./data/authorsSub.json").then(r => r.json());

    // detect bounds
    authorsData.forEach(a => {
        if (a.year < MIN_YEAR) MIN_YEAR = a.year;
        if (a.year > MAX_YEAR) MAX_YEAR = a.year;
    });

    populateYearDropdowns();
    updateAuthorsRankings();
}

function populateYearDropdowns() {
    const startSel = document.getElementById("startYear");
    const endSel = document.getElementById("endYear");

    startSel.innerHTML = "";
    endSel.innerHTML = "";

    for (let y = MIN_YEAR; y <= MAX_YEAR; y++) {
        const s = document.createElement("option");
        s.value = y;
        s.textContent = y;
        startSel.appendChild(s);

        const e = document.createElement("option");
        e.value = y;
        e.textContent = y;
        endSel.appendChild(e);
    }

    // Default show entire range
    startSel.value = MIN_YEAR;
    endSel.value = MAX_YEAR;
}

function computeAuthorRankings(startYear, endYear) {
    // Step 1: filter by year
    let filtered = authorsData.filter(a =>
        a.year >= startYear &&
        a.year <= endYear
    );

    // Step 2: count articles per author
    const counts = {};
    filtered.forEach(a => {
        if (!counts[a.author]) counts[a.author] = 0;
        counts[a.author] += 1;
    });

    // Step 3: build ranking array
    const ranking = Object.keys(counts).map(author => ({
        author: author,
        articles: counts[author]
    }));

    // Step 4: sort and assign ranks ONCE
    ranking.sort((a, b) => b.articles - a.articles);
    ranking.forEach((r, i) => r.rank = i + 1);

    return ranking;
}

function updateAuthorsRankings() {
    const startY = Number(document.getElementById("startYear").value);
    const endY = Number(document.getElementById("endYear").value);
    const search = document.getElementById("authorSearch").value.trim().toLowerCase();

    // Step 1: compute full ranking
    let fullRanking = computeAuthorRankings(startY, endY);

    // Step 2: apply search filter WITHOUT re-ranking
    let filteredRanking = fullRanking.filter(r =>
        r.author.toLowerCase().includes(search)
    );

    // Step 3: render the filtered list with original ranks
    renderAuthorsTable(filteredRanking);
}


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

document.addEventListener("change", updateAuthorsRankings);
document.getElementById("authorSearch").addEventListener("input", updateAuthorsRankings);

loadAuthors();
