/// <reference types="cypress" />

declare namespace Cypress {
    interface Chainable<Subject> {
        loginByGoogleApi(): Chainable<any>
    }
}