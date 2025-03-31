import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const config = {
  production: {
    path: join(__dirname, "prod.db"),
  },
  development: {
    path: join(__dirname, "dev.db"),
  },
  test: {
    path: join(__dirname, "test.db"),
  },
};

export default config;
