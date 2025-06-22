require("dotenv").config();
const express = require("express");
const axios = require("axios");
const router = express.Router();

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
