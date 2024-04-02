/// <reference types="cypress" />

describe('fartipelago', () => {
    beforeEach(() => {
        cy.request('http://localhost:3000/cypress_rails_reset_state')
        // cy.visit('http://localhost:3001');
    })
    it('goofy placeholder text', () => {
        cy.request('http://localhost:3000/api/v1/stats/show')

        cy.visit('http://localhost:3001/');
        cy.contains('Welcome');
        // cy.title().log();
        cy.log(`title: ${cy.title()}`);
    })
})