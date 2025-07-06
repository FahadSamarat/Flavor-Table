require("dotenv").config();
const express = require("express");
const axios = require("axios");
const router = express.Router();

const pg = require("pg");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const routeGuard = require("../middleware/verifyToken");



// GET recipes from DB
router.get("/api/recipes/all", routeGuard, async (req, res) => {
  try {
    const result = await pool.query(
  `SELECT * FROM recipes WHERE user_id = $1 ORDER BY id DESC`,
  [req.user.id]
);

    
    const recipes = result.rows.map(row => ({
      ...row,
      ingredients: Array.isArray(row.ingredients) ? row.ingredients : []
    }));

    res.json(recipes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve recipes." });
  }
});

// POST a new recipe
router.post("/api/recipes", routeGuard, async (req, res) => {
  const { title, image, instructions, ingredients, readyin } = req.body;

  let ingredientsArray = [];

  // Safely handle ingredients
  if (typeof ingredients === 'string') {
    try {
      // Only parse if it looks like JSON
      if (ingredients.trim().startsWith('[')) {
        ingredientsArray = JSON.parse(ingredients);
      } else {
        // Wrap as single item
        ingredientsArray = [ingredients.trim()];
      }
    } catch {
      ingredientsArray = [ingredients.trim()];
    }
  } else if (Array.isArray(ingredients)) {
    ingredientsArray = ingredients;
  } else {
    ingredientsArray = [];
  }

  try {
const result = await pool.query(
  `INSERT INTO recipes (title, image, instructions, ingredients, readyin, user_id)
   VALUES ($1, $2, $3, $4, $5, $6)
   RETURNING *`,
  [title, image, instructions, JSON.stringify(ingredientsArray), readyin, req.user.id]
);



    res.json(result.rows[0]);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Failed to save recipe." });
  }
});

// PUT /api/recipes/:id - update a recipe
router.put("/api/recipes/:id", routeGuard, async (req, res) => {
  const id = req.params.id;
  const { title, image, instructions, ingredients, readyin } = req.body;

  try {
    const result = await pool.query(
      `UPDATE   recipes
       SET title = $1, image = $2, instructions = $3, ingredients = $4, readyin = $5
       WHERE id = $6
       RETURNING *`,
      [title, image, instructions, JSON.stringify(ingredients || []), readyin, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update recipe." });
  }
});

// DELETE /api/recipes/:id
router.delete("/api/recipes/:id", routeGuard, async (req, res) => {
  const id = req.params.id;
  
  try {
    const result = await pool.query("DELETE FROM recipes WHERE id = $1 RETURNING *", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    res.json({ message: "Recipe deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete recipe." });
  }
});


// food api
const API_KEY = process.env.KEY;

// GET /recipes/search
router.get("/recipes/search", async (req, res) => {
  const { ingredients } = req.query;

  if (!ingredients) {
    return res.status(400).json({ error: "Missing ingredients parameter" });
  }

  try {
    const response = await axios.get("https://api.spoonacular.com/recipes/findByIngredients", {
      params: {
        ingredients: ingredients,
        number: 10,
        apiKey: API_KEY,
      },
    });

    const simplifiedResults = response.data.map((recipe) => ({
      title: recipe.title,
      image: recipe.image,
      usedIngredients: recipe.usedIngredients.map((i) => i.name),
      missedIngredients: recipe.missedIngredients.map((i) => i.name),
    }));

    res.json(simplifiedResults);
  } catch (error) {
    console.error("Error fetching from Spoonacular:", error.message);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

// GET /recipes/random
router.get("/recipes/random", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.spoonacular.com/recipes/random`,
      {
        params: {
          apiKey: API_KEY,
          number: 5
        }
      }
    );

    const simplified = response.data.recipes.map(recipe => ({
      title: recipe.title,
      image: recipe.image,
      instructions: recipe.instructions,
      ingredients: recipe.extendedIngredients.map(ing => ing.original)
    }));

    res.json(simplified); // Return array of simplified recipes
  } catch (error) {
    console.error("Error fetching random recipe:", error.message);
    res.status(500).json({ error: "Failed to fetch random recipes" });
  }
});


module.exports = router;
