/// <reference types="cypress" />


describe('try to create a device when not logged in', () => {
    beforeEach(() => {
        cy.visit('http://localhost:3001/devices');
    })
    it ('renders something useful when not logged in', () => {
        cy.contains("Add your devices and view stats").should("not.exist");
    })
})