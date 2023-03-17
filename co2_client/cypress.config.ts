import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'http://localhost:3001', // Honestly should import from PORT or some shit, yes. Whatever.
    excludeSpecPattern: '*.cy.example.js'
  },
  video: false,
});
