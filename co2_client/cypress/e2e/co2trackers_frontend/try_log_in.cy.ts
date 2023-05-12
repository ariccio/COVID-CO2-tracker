

describe('try logging in', () => {
    beforeEach(() => {
        // https://docs.cypress.io/guides/end-to-end-testing/google-authentication
        cy.loginByGoogleApi();
    })
    it('shows correct stuff', () => {
        cy.visit('http://localhost:3001/devices');
        cy.contains("Add your devices and view stats").should("be.visible");
        // cy.contains("logging in...").should("not.exist");
        cy.visit('/');
    })
})