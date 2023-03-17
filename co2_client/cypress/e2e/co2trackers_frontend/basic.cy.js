/// <reference types="cypress" />

describe('fartipelago', () => {
    beforeEach(() => {
        cy.visit('http://localhost:3001')
    })
    it('goofy placeholder text', () => {
        cy.contains('welcome');
    })
})