const express = require("express");
const rateLimit = require("express-rate-limit"); // Import rate limiter
const router = require("./api/routes"); // Import the router from your routes file

const app = express();

// Define the rate limiter
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 350, // limit each IP to 350 requests per windowMs
});

app.use(express.json()); // Enable JSON body parsing for requests
app.use(limiter); // Use the rate limiter
app.use("/api", router); // Use your router for all requests starting with /api

// Start server
app.listen(3000, () => console.log("Server running on port 3000"));
