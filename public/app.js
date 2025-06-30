// ====== Search Section ======
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

// ====== Random Section ======
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



// ====== Save to Favorites Function ======
async function saveToFavorites(recipe) {
  try {
    // Safely extract and normalize ingredients
    let ingredients = recipe.usedIngredients || recipe.ingredients || [];

    if (typeof ingredients === 'string') {
      try {
        // Only parse if it looks like JSON
        if (ingredients.trim().startsWith('[')) {
          ingredients = JSON.parse(ingredients);
        } else {
          // Wrap as single item
          ingredients = [ingredients.trim()];
        }
      } catch {
        ingredients = [ingredients.trim()];
      }
    }

    if (!Array.isArray(ingredients)) {
      ingredients = [];
    }
console.log("Saving this:", JSON.stringify({
  ingredients: ingredients
}, null, 2));
    const res = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: recipe.title,
        image: recipe.image,
        instructions: recipe.instructions || "",
        ingredients: ingredients,
        readyin: recipe.readyInMinutes || null
      })
    });

    if (!res.ok) {
      const errorData = await res.json();
      if (errorData.error?.includes("unique_violation")) {
        alert("Already in favorites!");
        return;
      }
      throw new Error("Failed to save recipe.");
    }

    alert("Saved to favorites!");
    updateFavoritesCounter();

  } catch (err) {
    console.error("Error saving recipe:", err);
    alert("Could not save recipe to favorites.");
  }
}



// ====== Make saveToFavorites globally available ======
window.saveToFavorites = saveToFavorites;

// ====== Load Favorites ======
async function loadFavorites() {
  try {
    const res = await fetch("/api/recipes");
    const recipes = await res.json();

    const favoritesList = document.getElementById("favoritesList");

    if (!Array.isArray(recipes) || recipes.length === 0) {
      favoritesList.innerHTML = "<p>No favorite recipes saved yet.</p>";
      return;
    }

    favoritesList.innerHTML = recipes.map(recipe => {
      let ingredientsArray = [];
      if (Array.isArray(recipe.ingredients)) {
        ingredientsArray = recipe.ingredients;
      } else if (typeof recipe.ingredients === 'string') {
        try {
          ingredientsArray = JSON.parse(recipe.ingredients);
        } catch (e) {
          ingredientsArray = recipe.ingredients.split(',').map(i => i.trim());
        }
      }

      return `
        <div class="recipe itemContainer">
          <h3>${recipe.title}</h3>
          <img src="${recipe.image}" alt="${recipe.title}">
          <p>Ingredients:</p>
          <ul>
            ${ingredientsArray.map(i => `<li>${i}</li>`).join("")}
          </ul>
          <p>Instructions:</p>
          <p>${recipe.instructions || 'N/A'}</p>
          <p>Ready in:(minutes)</p>
          <p>${recipe.readyin ? `${recipe.readyin} minutes` : 'Unknown'}</p>
          <button class="save-btn edit-btn" onclick='openEditModal(${JSON.stringify(recipe)})'>Edit</button>
          <button class="remove-btn delete-btn" onclick='deleteRecipe(${recipe.id})'>Delete</button>
        </div>
      `;
    }).join("");

  } catch (err) {
    console.error(err);
    document.getElementById("favoritesList").innerHTML = "<p>Failed to load favorite recipes.</p>";
  }
}

// ====== Delete Recipe ======
async function deleteRecipe(id) {
  if (!confirm("Are you sure you want to delete this recipe?")) return;

  try {
    const res = await fetch(`/api/recipes/${id}`, {
      method: "DELETE"
    });

    if (!res.ok) throw new Error("Failed to delete recipe.");
    updateFavoritesCounter();
    alert("Recipe deleted.");
    loadFavorites();
  } catch (err) {
    console.error(err);
    alert("Failed to delete recipe.");
  }
}

// ====== Edit Modal Functions ======
function openEditModal(recipe) {
  document.getElementById("recipeId").value = recipe.id;
  document.getElementById("recipeTitle").value = recipe.title;
  document.getElementById("recipeImage").value = recipe.image || "";
  document.getElementById("recipeIngredients").value = (recipe.ingredients || []).join(", ");
  document.getElementById("recipeInstructions").value = recipe.instructions || "";
  document.getElementById("recipeReadyIn").value = recipe.readyin || "";

  document.getElementById("editModal").style.display = "block";
}

function closeModal() {
  document.getElementById("editModal").style.display = "none";
}

// ====== Update Form Submission ======
document.getElementById("updateForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("recipeId").value;
  const updatedRecipe = {
    title: document.getElementById("recipeTitle").value,
    image: document.getElementById("recipeImage").value,
    instructions: document.getElementById("recipeInstructions").value,
    ingredients: document.getElementById("recipeIngredients").value
                  .split(",")
                  .map(i => i.trim()),
    readyin: parseInt(document.getElementById("recipeReadyIn").value) || null
  };

  try {
    const res = await fetch(`/api/recipes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedRecipe)
    });

    if (!res.ok) throw new Error("Failed to update recipe.");

    alert("Recipe updated.");
    closeModal();
    loadFavorites();
  } catch (err) {
    console.error(err);
    alert("Failed to update recipe.");
  }
});

// ====== Favorites Counter ======
async function updateFavoritesCounter() {
  const favnmpr = document.getElementById("fav-nmpr");
  if (!favnmpr) return;

  try {
    const res = await fetch("/api/recipes");
    const recipes = await res.json();
    favnmpr.textContent = recipes.length > 0 ? ` (${recipes.length})` : '';
  } catch (err) {
    console.error("Could not update favorites counter:", err);
  }
}

// ====== DOMContentLoaded ======
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("favoritesList")) {
    loadFavorites();
  }

  updateFavoritesCounter();

  const links = document.querySelectorAll(".nav a");
  const currentPath = window.location.pathname;

  links.forEach(link => {
    if (link.getAttribute("href") === currentPath) {
      link.classList.add("active");
    }
  });
});