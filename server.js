// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();

// Import Express framework and JSON middleware
import express, { json } from "express";

// Import database query function from local db module
import { query } from "./src/index.js";

// Create Express application instance
const app = express();

// Set server port from environment variable or default to 3000
const port = process.env.PORT || 3000;


// Enable JSON request body parsing middleware
app.use(json());

// Root endpoint - simple API status check
app.get("/", (_req, res) => res.send("API is running"));

// Health check endpoint - verifies database connectivity
app.get("/health", async (_req, res) => {
  try {
    // Execute a simple database query to test connection
    const { rows } = await query("SELECT NOW() as now");
    // Return success response with current database timestamp
    res.json({ ok: true, now: rows[0].now });
  } catch (err) {
    // Log error and return failure response
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

// Products endpoint - retrieve all active products
// Sample: list products from the schema
app.get("/products", async (_req, res) => {
  try {
    // Query database for active products, ordered by newest first
    const { rows } = await query(
      `SELECT id, title, description, price_cents
       FROM products
       WHERE is_active = TRUE
       ORDER BY id DESC`
    );
    // Return products as JSON array
    res.json(rows);
  } catch (err) {
    // Log error and return standardized error response
    console.error(err);
    res.status(500).json({ error: "query_failed" });
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
