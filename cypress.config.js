import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3001",
    setupNodeEvents(on, config) {
      // Log additional info for debugging
      on("before:browser:launch", (browser, launchOptions) => {
        console.log("Launching browser for tests in test environment");
        return launchOptions;
      });
    },
    experimentalStudio: true,
  },
  viewportWidth: 1280,
  viewportHeight: 800,
});
