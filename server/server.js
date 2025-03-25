import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import route modules
import authRoutes from './routes/auth.js';
import calculatorRoutes from './routes/calculators.js';
import templateRoutes from './routes/templates.js';
import courseRoutes from './routes/courses.js';

// Load environment variables from .env file in the current directory
// or from the parent directory if not found in current
const result = dotenv.config();
if (result.error) {
    // Try parent directory
    dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '../.env') });
}

// Check if session secret is available
if (!process.env.SESSION_SECRET) {
    console.error('Warning: SESSION_SECRET environment variable is not set.');
    console.error('Please make sure you have created an .env file with SESSION_SECRET.');
    process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('dist'));
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: true,
        saveUninitialized: true,
        cookie: {
            secure: false,
            sameSite: true,
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            path: '/'
        }
    })
);

// Register route modules
app.use('/api', authRoutes);
app.use('/api/calculators', calculatorRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/courses', courseRoutes);

// Update the client-side routing handler to use join
app.get('*', (_req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
});

// Export the app for testing and start the server conditionally
export { app };

// Only start the server if this file is being run directly (not imported for tests)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}
