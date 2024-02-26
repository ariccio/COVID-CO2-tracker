/// <reference types="cypress" />

describe('fartipelago', () => {
    beforeEach(() => {
        cy.request('http://localhost:3002/cypress_rails_reset_state')
        // cy.visit('http://localhost:3001');
    })
    it('goofy placeholder text', () => {
        cy.contains('Welcome');
        // cy.title().log();
        cy.log(`title: ${cy.title()}`);
    })
    it('test 2', () => {
        cy.get('#welcome-header').contains('Welcome');

    })
})