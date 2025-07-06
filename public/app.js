// ====== Set Axios Authorization Header if Token Exists ======
const protectedPages = ["/profile", "/favorite"]; // add all protected routes here
const currentPage = window.location.pathname;

if (protectedPages.includes(currentPage)) {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login";
  }
}

// Register Handler
document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("registerUsername").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

  try {
    const res = await axios.post("api/auth/register", { username, email, password });
    alert("Registration successful. Please login.");
    window.location.href = "/login.html"; // Redirect to login
  } catch (err) {
    alert(err.response?.data || "Registration failed");
  }
});

// Login Handler
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    // const res = await axios.post("api/auth/login", { email, password });
    // localStorage.setItem("token", res.data.token);
    // alert("Login successful!");
    // window.location.href = "/profile.html"; // Redirect to profile
    const res = await axios.post("api/auth/login", { email, password });
    localStorage.setItem("token", res.data.token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
    alert("Login successful!");
    window.location.href = "/profile"; // Or profile.html
  } catch (err) {
    alert(err.response?.data || "Login failed");
  }
});

// Load Profile Info
async function loadProfile() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login";
    return;
  }

  try {
    const res = await axios.get("/api/auth/profile", {
      headers: { Authorization: `Bearer ${token}` }
    });

    document.getElementById("profileUsername").textContent = res.data.username;
console.log("Token:", token);
console.log("Response:", res.data);

    
    document.getElementById("profileEmail").textContent = res.data.email;
  } catch (err) {
    console.error(err);
    alert("Failed to load profile");
    localStorage.removeItem("token");
    window.location.href = "/login";
  }
}

// Logout
function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login.html";
}


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
    let ingredients = recipe.usedIngredients || recipe.ingredients || [];

    if (typeof ingredients === 'string') {
      try {
        if (ingredients.trim().startsWith('[')) {
          ingredients = JSON.parse(ingredients);
        } else {
          ingredients = [ingredients.trim()];
        }
      } catch {
        ingredients = [ingredients.trim()];
      }
    }

    if (!Array.isArray(ingredients)) {
      ingredients = [];
    }

    console.log("Saving this:", JSON.stringify({ ingredients }, null, 2));
    const token = localStorage.getItem("token");

    await axios.post(
      "/api/recipes",
      {
        title: recipe.title,
        image: recipe.image,
        instructions: recipe.instructions || "",
        ingredients: ingredients,
        readyin: recipe.readyInMinutes || null
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    alert("Saved to favorites!");
    updateFavoritesCounter();
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data?.error?.includes("unique_violation")) {
      alert("Already in favorites!");
    } else {
      console.error("Error saving recipe:", err);
      alert("Could not save recipe to favorites.");
    }
  }
}

window.saveToFavorites = saveToFavorites;

// ====== Load Favorites ======
async function loadFavorites() {
  try {
    const token = localStorage.getItem("token");

    const { data: recipes } = await axios.get("/api/recipes/all", {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
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
        } catch {
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
          <p>Ready in:</p>
          <p>${recipe.readyin ? `${recipe.readyin} minutes` : 'Unknown'}</p>
          <button 
            class="save-btn edit-btn" 
            data-recipe='${JSON.stringify(recipe).replace(/'/g, "&apos;")}' 
            onclick="openEditModalFromButton(this)"
          >
            Edit
          </button>
          <button class="remove-btn delete-btn" onclick='deleteRecipe(${recipe.id})'>Delete</button>
        </div>
      `;
    }).join("");

  } catch (err) {
    console.error(err);
    document.getElementById("favoritesList").innerHTML = "<p>Failed to load favorite recipes.</p>";
  }
}
function openEditModalFromButton(button) {
  const recipe = JSON.parse(button.dataset.recipe);
  openEditModal(recipe);
}

// ====== Delete Recipe ======
async function deleteRecipe(id) {
  if (!confirm("Are you sure you want to delete this recipe?")) return;

  try {
            const token = localStorage.getItem("token");


    await axios.delete(`/api/recipes/${id}`,{
  headers: {
    Authorization: `Bearer ${token}`
  }});
    alert("Recipe deleted.");
    updateFavoritesCounter();
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
        const token = localStorage.getItem("token");

    await axios.put(`/api/recipes/${id}`, updatedRecipe,{
  headers: {
    Authorization: `Bearer ${token}`
  }
});
    alert("Recipe updated.");
    closeModal();
    loadFavorites();
  } catch (err) {s
    console.error(err);
    alert("Failed to update recipe.");
  }
});

// ====== Favorites Counter ======
async function updateFavoritesCounter() {

  const favnmpr = document.getElementById("fav-nmpr");
  if (!favnmpr) return;

  try {
        const token = localStorage.getItem("token");
  if (!token) {
    return;
  }
        const { data: recipes } = await axios.get("/api/recipes/all", {
      headers: { Authorization: `Bearer ${token}` }
    });
    favnmpr.textContent = recipes.length > 0 ? ` (${recipes.length})` : '';
  } catch (err) {
    console.error("Could not update favorites counter:", err);
  }
}


// ====== user name nav ======
async function usernav() {
    const token = localStorage.getItem("token");
  if (!token) {
    return;
  }

  try {
    const res = await axios.get("/api/auth/profile", {
      headers: { Authorization: `Bearer ${token}` }
    });

    document.getElementById("user-n").textContent = ` (${res.data.username})`;

  } catch (err) {
    console.error("Could not update user nav name:", err);
  }
}

// ====== DOMContentLoaded ======
// document.addEventListener("DOMContentLoaded", () => {
//   const currentPath = window.location.pathname;

//   if (currentPath === "/profile.html") {
//     loadProfile();
//   }

//   if (document.getElementById("favoritesList")) {
//     loadFavorites();
//   }

//   updateFavoritesCounter();

//   const links = document.querySelectorAll(".nav a");
//   links.forEach(link => {
//     if (link.getAttribute("href") === currentPath) {
//       link.classList.add("active");
//     }
//   });
// });
document.addEventListener("DOMContentLoaded", () => {
  const currentPath = window.location.pathname;

  if (currentPath === "/profile") {
    loadProfile();
  }

  if (currentPath === "/favorite" || document.getElementById("favoritesList")) {
    loadFavorites();
  }

  updateFavoritesCounter();
  usernav();

  const links = document.querySelectorAll(".nav a");
  links.forEach(link => {
    if (link.getAttribute("href") === currentPath) {
      link.classList.add("active");
    }
  });
});

