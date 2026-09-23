import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl:
      process.env.CYPRESS_BASE_URL ?? "https://hotel-ops.localhost",

    setupNodeEvents(_on, config) {
      const username = process.env.STAGING_ADMIN_USERNAME;
      const password = process.env.STAGING_ADMIN_PASSWORD;

      if (username && password) {
        config.env.UAT_ADMIN_USERNAME = username;
        config.env.UAT_ADMIN_PASSWORD = password;
      }

      return config;
    },
  },
});
