import path from "path";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import cors from "cors";
import { readFileSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";

// Import logger and create server-specific logger
import logger, { createLogger } from "./utils/logger.js";
const serverLogger = createLogger("server");
const httpLogger = createLogger("http");

// Import our new resolvers
import resolvers from "./graphql/resolvers/index.js";

// Ensure logs directory exists
const logsDir = join(dirname(fileURLToPath(import.meta.url)), "../logs");
if (!existsSync(logsDir)) {
  try {
    mkdirSync(logsDir, { recursive: true });
    serverLogger.info(`Created logs directory at ${logsDir}`);
  } catch (error) {
    serverLogger.error(`Failed to create logs directory: ${error.message}`, { error });
  }
}

// Load environment variables from .env file in the current directory
// or from the parent directory if not found in current
const result = dotenv.config();
if (result.error) {
  // Try parent directory
  dotenv.config({
    path: join(dirname(fileURLToPath(import.meta.url)), "../.env"),
  });
}

// Check if session secret is available
if (!process.env.SESSION_SECRET) {
  serverLogger.error("SESSION_SECRET environment variable is not set");
  serverLogger.error("Please create an .env file with SESSION_SECRET");
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- GraphQL Setup ---
// Load schema from file
const typeDefs = readFileSync(
  path.join(__dirname, "graphql/schema.graphql"),
  "utf-8"
);

// Create Apollo Server instance using loaded schema and imported resolvers
const apolloServer = new ApolloServer({
  typeDefs, // Loaded from file
  resolvers, // Imported from ./graphql/resolvers/
});

// HTTP request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(2, 15);
  
  // Log request start
  httpLogger.http(`${req.method} ${req.originalUrl}`, {
    requestId,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'http';
    
    httpLogger[logLevel](`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, {
      requestId,
      statusCode: res.statusCode,
      duration
    });
  });
  
  next();
};

// Start Apollo Server before applying middleware
// Note: We need an async function to use await here
async function startServer() {
  await apolloServer.start();
  serverLogger.info("Apollo GraphQL server started successfully");

  const app = express();
  const port = process.env.PORT || 3000;

  // Middleware setup
  app.use(cors()); // Enable CORS - might be needed for GraphQL clients
  app.use(requestLogger); // Add request logging
  app.use(express.json());
  app.use(express.static("dist"));
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: true,
      saveUninitialized: true,
      cookie: {
        secure: process.env.NODE_ENV === "production", // Set secure based on environment
        sameSite: true,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        path: "/",
      },
    })
  );
  serverLogger.debug("Express middleware configured");

  // Apply Apollo GraphQL middleware here, after session middleware
  // We pass the session info into the context for potential use in resolvers
  app.use(
    "/graphql",
    expressMiddleware(apolloServer, {
      context: async ({ req }) => ({ req, session: req.session }),
    })
  );
  serverLogger.debug("Apollo GraphQL middleware applied");

  // Client-side routing handler (must be after API routes)
  app.get("*", (_req, res) => {
    res.sendFile(join(__dirname, "../dist/index.html"));
  });

  // Export the app for testing (if needed, adjust for async start)
  // We might need to adjust testing setup later due to async start
  // export { app }; // Commenting out for now as app creation is inside async function

  // Only start the server if this file is being run directly
  if (process.argv[1] === fileURLToPath(import.meta.url)) {
    app.listen(port, () => {
      serverLogger.info(`Server running at http://localhost:${port}`);
      serverLogger.info(`GraphQL endpoint available at http://localhost:${port}/graphql`);
      serverLogger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  }

  // Return app for potential programmatic use/testing if needed outside this direct run
  return app;
}

// Start the server
startServer().catch((error) => {
  serverLogger.error(`Failed to start server: ${error.message}`, { error });
  process.exit(1);
});
