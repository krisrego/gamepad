const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const robotjs = require("robotjs");

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // In production, replace with your React app's URL
    methods: ["GET", "POST"],
  },
});

app.use(cors());

// Track active keys to prevent stuck keys
const activeKeys = new Set();

// Key mappings
const KEY_MAPPINGS = {
  // D-pad
  up: "up",
  down: "down",
  left: "left",
  right: "right",

  // Buttons
  A: "z",
  B: "x",
  X: "c",
  Y: "v",

  // Shoulder buttons
  L: "q",
  ZL: "1",
  R: "e",
  ZR: "3",

  // Special buttons
  plus: "=",
  minus: "-",
  home: "escape",
};

// Analog stick zones to key mappings
const ZONE_MAPPINGS = {
  left: {
    N: ["w"],
    NE: ["w", "d"],
    E: ["d"],
    SE: ["s", "d"],
    S: ["s"],
    SW: ["s", "a"],
    W: ["a"],
    NW: ["w", "a"],
  },
  right: {
    N: ["up"],
    NE: ["up", "right"],
    E: ["right"],
    SE: ["down", "right"],
    S: ["down"],
    SW: ["down", "left"],
    W: ["left"],
    NW: ["up", "left"],
  },
};

// Function to safely toggle keys
const toggleKey = (key, state) => {
  try {
    robotjs.keyToggle(key, state);
    console.log(`Key ${key} ${state}`);
  } catch (error) {
    console.error(`Error toggling key ${key} to ${state}:`, error);
  }
};

// Function to release all active keys
const releaseAllKeys = () => {
  activeKeys.forEach((key) => {
    toggleKey(key, "up");
  });
  activeKeys.clear();
};

io.on("connection", (socket) => {
  console.log("Controller connected:", socket.id);

  // Handle button press
  socket.on("button-press", (button) => {
    const key = KEY_MAPPINGS[button];
    if (key) {
      toggleKey(key, "down");
      activeKeys.add(key);
    }
  });

  // Handle button release
  socket.on("button-release", (button) => {
    const key = KEY_MAPPINGS[button];
    if (key) {
      toggleKey(key, "up");
      activeKeys.delete(key);
    }
  });

  // Handle analog stick zone changes
  socket.on("stick-zone-change", ({ side, zone }) => {
    // Release previous keys for this stick
    const previousKeys = Array.from(activeKeys).filter((key) =>
      key.startsWith(`${side}-`)
    );

    previousKeys.forEach((key) => {
      const actualKey = key.replace(`${side}-`, "");
      toggleKey(actualKey, "up");
      activeKeys.delete(key);
    });

    // Press new keys for current zone
    if (zone && ZONE_MAPPINGS[side][zone]) {
      ZONE_MAPPINGS[side][zone].forEach((key) => {
        toggleKey(key, "down");
        activeKeys.add(`${side}-${key}`);
      });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Controller disconnected:", socket.id);
    releaseAllKeys();
  });
});

// Error handling
server.on("error", (err) => {
  console.error("Server error:", err);
  releaseAllKeys();
});

process.on("SIGINT", () => {
  console.log("\nGracefully shutting down server...");
  releaseAllKeys();
  process.exit(0);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  releaseAllKeys();
  process.exit(1);
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(
    "Make sure to note down your local IP address to connect from phone"
  );
  console.log("Key mappings:", KEY_MAPPINGS);
});
