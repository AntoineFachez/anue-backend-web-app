// functions/app.js

const express = require("express");
const cors = require("cors");
const allowedOrigins = require("./config/allowedOrigins.js");

const { Logging } = require("@google-cloud/logging");
const logging = new Logging();
const log = logging.log("gemini_api_requests");

// --- Routes Imports ---
const dataRoutes = require("./api/dataRoutes");

const app = express();

// --- Global Middleware ---
// 1. CORS for allowed origins
app.use(cors({ origin: allowedOrigins, credentials: true }));
// 2. JSON Body Parser
app.use(express.json());

// --- API Routes ---
// app.use("/ai", aiRoutes);
// app.use("/agent", orchestratorApp);
app.use("/data", dataRoutes);
// app.use("/sdui", blueprintRoutes);
// app.use("/vision", visionRoutes);

// Example Routes
app.get("/hello", (req, res) => {
  res.status(200).json({ message: "Hello from the unified Express app!" });
});

module.exports = app;
