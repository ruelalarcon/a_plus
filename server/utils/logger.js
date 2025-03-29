/**
 * Logger Module
 *
 * This module provides a centralized logging system for the application using Winston.
 * It supports different log levels and formats logs in a consistent, structured way.
 */

import winston from "winston";

// Define log levels and colors
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};

// Add colors to Winston
winston.addColors(colors);

// Determine log level based on environment
const level = process.env.NODE_ENV === "production" ? "info" : "debug";

// Define log format
const format = winston.format.combine(
  // Add timestamp
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  // Add colors for console
  winston.format.colorize({ all: true }),
  // Define the format of the message
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}] ${info.message}`
  )
);

// Define which transports to use (where logs should go)
const transports = [
  // Console transport
  new winston.transports.Console(),
  // File transport for errors
  new winston.transports.File({
    filename: "logs/error.log",
    level: "error",
  }),
  // File transport for all logs
  new winston.transports.File({ filename: "logs/all.log" }),
];

// Create the logger
const logger = winston.createLogger({
  level,
  levels,
  format,
  transports,
});

/**
 * Function to create a context-specific logger
 * @param {string} context - The context for the logger (e.g., file name, component name)
 * @returns {Object} - Logger with context-specific methods
 */
export const createLogger = (context) => {
  return {
    error: (message, meta = {}) =>
      logger.error(`[${context}] ${message}`, { meta }),
    warn: (message, meta = {}) =>
      logger.warn(`[${context}] ${message}`, { meta }),
    info: (message, meta = {}) =>
      logger.info(`[${context}] ${message}`, { meta }),
    http: (message, meta = {}) =>
      logger.http(`[${context}] ${message}`, { meta }),
    debug: (message, meta = {}) =>
      logger.debug(`[${context}] ${message}`, { meta }),
  };
};

export default logger;
