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
import testRoutes from "./utils/testRoutes.js";
import promClient from "prom-client";
import promBundle from "express-prom-bundle";

// Import logger and create server-specific logger
import { createLogger } from "./utils/logger.js";
const serverLogger = createLogger("server");
const httpLogger = createLogger("http");

// Initialize Prometheus metrics
const collectDefaultMetrics = promClient.collectDefaultMetrics;
// Collect default metrics
collectDefaultMetrics({ register: promClient.register });

// Create custom metrics
// Only keep the metrics that don't overlap with express-prom-bundle
const graphqlOperationCount = new promClient.Counter({
  name: "graphql_operations_total",
  help: "Count of GraphQL operations",
  labelNames: ["operation", "type"], // type can be 'query' or 'mutation'
});

// Gauge for active users - based on recent activity
const activeUsersGauge = new promClient.Gauge({
  name: "active_users",
  help: "Number of users active in the last 5 minutes",
});

// Store the last activity time for each user
// This is a simple in-memory store - if our application scales to where
// multiple instances are needed and in-memory is not better than a shared
// cache, consider moving this to a shared cache like Redis
const userLastActivity = new Map();

// Function to count active users - those with activity in the last 5 minutes
function updateActiveUsersMetric() {
  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;

  // Count users with activity in the last 5 minutes
  let activeCount = 0;
  for (const lastActivity of userLastActivity.values()) {
    if (lastActivity > fiveMinutesAgo) {
      activeCount++;
    }
  }

  // Update the gauge with the accurate count
  activeUsersGauge.set(activeCount);

  // Clean up old entries to prevent memory leaks
  for (const [userId, lastActivity] of userLastActivity.entries()) {
    // Remove entries older than 30 minutes
    if (lastActivity < now - 30 * 60 * 1000) {
      userLastActivity.delete(userId);
    }
  }
}

// Schedule regular updates of the active users metric
setInterval(updateActiveUsersMetric, 30 * 1000); // Update every 30 seconds

// Register custom metrics
promClient.register.registerMetric(graphqlOperationCount);
promClient.register.registerMetric(activeUsersGauge);

// Import our new resolvers
import resolvers from "./graphql/resolvers/index.js";

// Get filename and dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure logs directory exists
const logsDir = join(__dirname, "../logs");
if (!existsSync(logsDir)) {
  try {
    mkdirSync(logsDir, { recursive: true });
    serverLogger.info(`Created logs directory at ${logsDir}`);
  } catch (error) {
    serverLogger.error(`Failed to create logs directory: ${error.message}`, {
      error,
    });
  }
}

// Load environment variables from env file in the current directory
dotenv.config();

// Enforce .env file with SESSION_SECRET is present as it is required in all environments
if (!process.env.SESSION_SECRET) {
  serverLogger.error("SESSION_SECRET environment variable is not set");
  serverLogger.error("Please create an .env file with SESSION_SECRET");
  process.exit(1);
}

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
  plugins: [
    {
      // Plugin to track GraphQL operations
      async requestDidStart(_requestContext) {
        return {
          async didResolveOperation(context) {
            const operationType = context.operation.operation;
            const operationName = context.operationName || "anonymous";
            graphqlOperationCount.inc({
              operation: operationName,
              type: operationType,
            });
          },
        };
      },
    },
  ],
});

// HTTP request logging middleware
const requestLogger = (req, res, next) => {
  // Skip logging in test environment unless explicitly enabled
  if (
    process.env.NODE_ENV === "test" &&
    process.env.ENABLE_TEST_LOGS !== "true"
  ) {
    return next();
  }

  const start = Date.now();
  const requestId = Math.random().toString(36).substring(2, 15);

  // Log request start
  httpLogger.http(`${req.method} ${req.originalUrl}`, {
    requestId,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  // Log response when finished
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? "warn" : "http";

    httpLogger[logLevel](
      `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`,
      {
        requestId,
        statusCode: res.statusCode,
        duration,
      }
    );
  });

  next();
};

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Set up Prometheus middleware (must be early in the middleware chain)
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  promClient: {
    collectDefaultMetrics: false, // We're already collecting default metrics
  },
  // Customize metric names to avoid conflicts with our custom metrics
  metricName: "prom_http_requests_total",
  httpDurationMetricName: "prom_http_request_duration_seconds",
});
app.use(metricsMiddleware);

// Apply basic middleware immediately
app.use(cors()); // Enable CORS - might be needed for GraphQL clients
app.use(requestLogger); // Add request logging
app.use(express.json());
app.use(express.static("dist"));

// Configure session middleware with appropriate settings for test/dev/prod
const sessionOptions = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production", // Set secure based on environment
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
};

// Set up testing environment
if (process.env.NODE_ENV === "test") {
  // In test environments, make sure cookies work with supertest
  sessionOptions.resave = true;
  sessionOptions.saveUninitialized = true;
  sessionOptions.cookie.sameSite = false;

  // Apply test routes
  app.use(testRoutes);
}

app.use(session(sessionOptions));
serverLogger.debug("Express middleware configured");

// Expose metrics endpoint for Prometheus to scrape
app.get("/metrics", async (_req, res) => {
  try {
    res.set("Content-Type", promClient.register.contentType);
    res.end(await promClient.register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

// Start Apollo Server immediately (rather than waiting for startServer to be called)
// This ensures GraphQL middleware is available as soon as the module is loaded
let isServerStarted = false;
let startPromise;

// Initialize the Apollo server once at module load time
const initApolloServer = async () => {
  if (!isServerStarted) {
    await apolloServer.start();

    // Apply GraphQL middleware immediately
    app.use(
      "/graphql",
      expressMiddleware(apolloServer, {
        context: async ({ req }) => ({ req, session: req.session }),
      })
    );

    isServerStarted = true;
    serverLogger.info("Apollo GraphQL server started successfully");
    serverLogger.debug("Apollo GraphQL middleware applied");

    // Client-side routing handler (must be after API routes)
    app.get("*", (_req, res) => {
      res.sendFile(join(__dirname, "../dist/index.html"));
    });
  }
  return app;
};

// Start the initialization immediately
startPromise = initApolloServer();

// This function now just ensures the initialization is complete
async function startServer() {
  await startPromise;
  return app;
}

// Export the necessary functions and objects for testing
export { app, startServer };

// Only start the HTTP server if this file is being run directly (not imported for testing)
// Check if we're NOT in test mode or we haven't set a variable to disable auto-start
if (
  process.env.NODE_ENV !== "test" ||
  process.env.DISABLE_AUTO_START !== "true"
) {
  startServer()
    .then((configuredApp) => {
      configuredApp.listen(port, () => {
        serverLogger.info(`Server running at http://localhost:${port}`);
        serverLogger.info(
          `GraphQL endpoint available at http://localhost:${port}/graphql`
        );
        serverLogger.info(
          `Metrics endpoint available at http://localhost:${port}/metrics`
        );
        serverLogger.info(
          `Environment: ${process.env.NODE_ENV || "development"}`
        );
      });
    })
    .catch((error) => {
      serverLogger.error(`Failed to start server: ${error.message}`, { error });
      process.exit(1);
    });
}

// Add middleware to track user activity
app.use((req, _res, next) => {
  // Record activity time for authenticated users
  if (req.session && req.session.userId) {
    userLastActivity.set(req.session.userId, Date.now());
  }
  next();
});
