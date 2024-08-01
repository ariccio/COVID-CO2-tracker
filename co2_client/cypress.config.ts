import { defineConfig } from "cypress";
import fs from 'fs'
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
      });

      // https://docs.cypress.io/guides/guides/screenshots-and-videos#Delete-videos-for-specs-without-failing-or-retried-tests
      on(
        'after:spec',
        (spec: Cypress.Spec, results: CypressCommandLine.RunResult) => {
          if (results && results.video) {
            // Do we have failures for any retry attempts?
            const failures = results.tests.some((test) =>
              test.attempts.some((attempt) => attempt.state === 'failed')
            )
            if (!failures) {
              // delete the video if the spec passed and no tests retried
              fs.unlinkSync(results.video)
            }
          }
        }
      )

    },
    // baseUrl: 'http://localhost:3001', // Honestly should import from PORT or some shit, yes. Whatever.
    excludeSpecPattern: '*.cy.example.js'
  },
  retries: {
    // Configure retry attempts for `cypress run`
    // Default is 0
    runMode: 2,
    // Configure retry attempts for `cypress open`
    // Default is 0
    openMode: 0
  },
  video: true,
  trashAssetsBeforeRuns: false
});
