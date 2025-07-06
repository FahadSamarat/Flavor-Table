const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const express = require("express");
const router = express.Router();
const pg = require("pg");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const routeGuard = require("../middleware/verifyToken");

// Register with email
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).send("Username, email and password are required");
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password) 
       VALUES ($1, $2, $3) 
       RETURNING id, username, email`,
      [username, email, hashedPassword]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Registration error:", error);
    if (error.code === "23505") {
      if (error.constraint === "users_username_key") {
        return res.status(409).send("Username already exists");
      }
      if (error.constraint === "users_email_key") {
        return res.status(409).send("Email already exists");
      }
    }
    res.status(500).send("Internal server error");
  }
});

// Login with email
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Email and password are required");
  }

  try {
    const userResult = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    const user = userResult.rows[0];
    if (!user) return res.status(404).send("User not found");

    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) return res.status(401).send("Invalid credentials");

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({ 
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send("Internal server error");
  }
});

// Get user profile (protected route)
router.get("/profile", routeGuard, async (req, res) => {
  try {
    const userResult = await pool.query(
      `SELECT id, username, email FROM users WHERE id = $1`,
      [req.user.id]
    );

    const user = userResult.rows[0];
    if (!user) return res.status(404).send("User not found");

    res.json(user);
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).send("Internal server error");
  }
});

// Update user profile
router.put("/profile", routeGuard, async (req, res) => {
  const { username, email } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users 
       SET username = $1, email = $2 
       WHERE id = $3 
       RETURNING id, username, email`,
      [username, email, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).send("User not found");
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update profile error:", error);
    if (error.code === "23505") {
      if (error.constraint === "users_username_key") {
        return res.status(409).send("Username already exists");
      }
      if (error.constraint === "users_email_key") {
        return res.status(409).send("Email already exists");
      }
    }
    res.status(500).send("Internal server error");
  }
});

// Update user password
router.put("/password", routeGuard, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).send("Current and new password are required");
  }

  try {
    // First verify current password
    const userResult = await pool.query(
      `SELECT password FROM users WHERE id = $1`,
      [req.user.id]
    );
    const user = userResult.rows[0];
    
    const isMatched = await bcrypt.compare(currentPassword, user.password);
    if (!isMatched) return res.status(401).send("Current password is incorrect");

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `UPDATE users SET password = $1 WHERE id = $2`,
      [hashedPassword, req.user.id]
    );

    res.send("Password updated successfully");
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).send("Internal server error");
  }
});

module.exports = router;