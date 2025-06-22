
// Search
const searchForm = document.getElementById("searchForm");
if (searchForm) {
  searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const ingredients = document.getElementById("ingredientsInput").value.trim();
    const resultsDiv = document.getElementById("results");

    resultsDiv.innerHTML = "Loading...";

    try {
      const res = await fetch(`/recipes/search?ingredients=${encodeURIComponent(ingredients)}`);
      const data = await res.json();

      if (data.error) {
        resultsDiv.innerHTML = `<p>Error: ${data.error}</p>`;
        return;
      }

      if (data.length === 0) {
        resultsDiv.innerHTML = "<p>No recipes found.</p>";
        return;
      }

resultsDiv.innerHTML = data.map(recipe => `
  <div class="recipe itemContainer">
    <h3>${recipe.title}</h3>
    <img src="${recipe.image}" alt="${recipe.title}">
    <p><strong>Used:</strong> ${recipe.usedIngredients.join(", ")}</p>
    <p><strong>Missing:</strong> ${recipe.missedIngredients.join(", ")}</p>
    <button class='save-btn' onclick='saveToFavorites(${JSON.stringify(recipe)})'>Save to Favorites</button>
  </div>
`).join("");

    } catch (err) {
      resultsDiv.innerHTML = `<p>Failed to fetch recipes.</p>`;
      console.error(err);
    }
  });
}


// Random
const randomBtn = document.getElementById("randomBtn");
if (randomBtn) {
  randomBtn.addEventListener("click", async () => {
    const randomDiv = document.getElementById("randomResult");
    randomDiv.innerHTML = "Fetching random recipes...";

    try {
      const res = await fetch("/recipes/random");
      const data = await res.json();

      if (data.error) {
        randomDiv.innerHTML = `<p>Error: ${data.error}</p>`;
        return;
      }

      randomDiv.innerHTML = data.map(recipe => `
        <div class="recipe itemContainer">
          <h3>${recipe.title}</h3>
          <img src="${recipe.image}" alt="${recipe.title}" width="200">
          <h4>Ingredients:</h4>
          <ul>
            ${recipe.ingredients.map(i => `<li>${i}</li>`).join("")}
          </ul>
          <h4>Instructions:</h4>
          <p>${recipe.instructions || "No instructions provided."}</p>
          <button class="saveRandomBtn">Save to Favorites</button>
        </div>
      `).join("");

      // Add listeners for each "Save to Favorites" button
      const buttons = document.querySelectorAll(".saveRandomBtn");
      buttons.forEach((btn, index) => {
        btn.addEventListener("click", () => {
          saveToFavorites(data[index]);
        });
      });

    } catch (err) {
      randomDiv.innerHTML = `<p>Failed to load recipes.</p>`;
      console.error(err);
    }
  });
}

function saveToFavorites(recipe) {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  // Check if already saved
  const exists = favorites.some(r => r.title === recipe.title);
  if (exists) {
    alert("Already in favorites!");
    return;
  }

  favorites.push(recipe);
  localStorage.setItem("favorites", JSON.stringify(favorites));
  updateFavoritesCounter(); // <- add this
  alert("Saved to favorites!");
}


//favorite
const favoritesList = document.getElementById("favoritesList");
if (favoritesList) {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  if (favorites.length === 0) {
    favoritesList.innerHTML = "<p>No favorite recipes saved yet.</p>";
  } else {
    favoritesList.innerHTML = favorites.map(recipe => `
      <div class="recipe itemContainer">
        <h3>${recipe.title}</h3>
        <img src="${recipe.image}" alt="${recipe.title}">
        <p><strong>Ingredients:</strong></p>
        <ul>
          ${(recipe.ingredients || recipe.usedIngredients || []).map(i => `<li>${i}</li>`).join("")}
        </ul>
        <button class="remove-btn" data-title="${recipe.title}">Remove</button>
      </div>
    `).join("");

    // Attach remove buttons
    document.querySelectorAll(".remove-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const titleToRemove = btn.dataset.title;
        let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
        favorites = favorites.filter(recipe => recipe.title !== titleToRemove);
        localStorage.setItem("favorites", JSON.stringify(favorites));
        updateFavoritesCounter();
        location.reload()
      });
    });
  }
}

function updateFavoritesCounter() {
  const favnmpr = document.getElementById("fav-nmpr");
  if (favnmpr) {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    if(favorites.length > 0){
    favnmpr.textContent = ' (' + favorites.length + ')';
    } else {
          favnmpr.textContent = '';
    }
  }
}

updateFavoritesCounter();


// page visit
  document.addEventListener("DOMContentLoaded", function () {
    const links = document.querySelectorAll(".nav a");
    const currentPath = window.location.pathname;

    links.forEach(link => {
      if (link.getAttribute("href") === currentPath) {
        link.classList.add("active");
      }
    });
  });