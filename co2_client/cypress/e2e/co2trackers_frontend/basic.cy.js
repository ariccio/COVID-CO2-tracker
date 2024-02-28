/// <reference types="cypress" />

describe('fartipelago', () => {
    beforeEach(() => {
        cy.request('http://localhost:3002/cypress_rails_reset_state')
        // cy.visit('http://localhost:3001');
    })
    it('goofy placeholder text', () => {
        cy.visit('http://localhost:3001/');
        cy.contains('Welcome');
        // cy.title().log();
        cy.log(`title: ${cy.title()}`);
    })
})