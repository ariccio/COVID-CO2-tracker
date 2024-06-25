import { defineConfig } from "cypress";

// Populate process.env with values from .env file
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
console.log(process.env);

export default defineConfig({
  env: {
    // https://docs.cypress.io/guides/end-to-end-testing/google-authentication
    googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    googleClientId: process.env.REACT_APP_GOOGLE_CLIENTID,
    googleClientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,    
  },
  e2e: {
    setupNodeEvents(on, config) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('cypress-terminal-report/src/installLogsPrinter')(on);

      // implement node event listeners here
      on('before:browser:launch', (browser, launchOptions) => {
        /* ... */
      })

    },
    // baseUrl: 'http://localhost:3001', // Honestly should import from PORT or some shit, yes. Whatever.
    excludeSpecPattern: '*.cy.example.js'
  },
  video: false,
  trashAssetsBeforeRuns: false
});
