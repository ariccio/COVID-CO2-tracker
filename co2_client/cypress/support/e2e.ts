// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('cypress-terminal-report/src/installLogsCollector')();

// https://github.com/cypress-io/cypress/issues/25397#issuecomment-2030468503
// fetch(Cypress.env('baseUrl'), { method: 'GET' })