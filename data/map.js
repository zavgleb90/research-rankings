// map.js (placeholder)
// For now: just make Top N slider label update and basic reset behavior.

document.addEventListener("DOMContentLoaded", () => {
  const topNSlider = document.getElementById("topNSlider");
  const topNValue = document.getElementById("topNValue");

  if (topNSlider && topNValue) {
    topNValue.textContent = topNSlider.value;
    topNSlider.addEventListener("input", () => {
      topNValue.textContent = topNSlider.value;
    });
  }

  const resetBtn = document.getElementById("resetMapFiltersBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      // Reset slider
      if (topNSlider) {
        topNSlider.value = 50;
        topNValue.textContent = "50";
      }

      // Reset dropdowns if present
      const discipline = document.getElementById("disciplineFilter");
      const group = document.getElementById("groupFilter");
      if (discipline) discipline.value = "ALL";
      if (group) group.value = "ALL";

      // Uncheck all journals (means ALL)
      document.querySelectorAll("#journalCheckboxes input").forEach(cb => cb.checked = false);

      // Year dropdown reset will be handled once you populate years (later)
      // For now, do nothing else.
    });
  }
});
