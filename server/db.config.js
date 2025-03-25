import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const config = {
    production: {
        path: join(__dirname, 'database.sqlite')
    },
    development: {
        path: join(__dirname, 'development-database.sqlite')
    },
    test: {
        path: join(__dirname, 'test-database.sqlite')
    }
};

export default config;