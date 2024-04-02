

describe('try logging in', () => {
    beforeEach(() => {
        // https://docs.cypress.io/guides/end-to-end-testing/google-authentication
        cy.loginByGoogleApi();
    })
    it('shows correct stuff', () => {
        cy.visit('http://localhost:3001/');
        // cy.visit('http://localhost:3001/devices');
        cy.contains("Devices").click();
        cy.contains("Add your devices and view stats").should("be.visible");
        // cy.contains("logging in...").should("not.exist");
        // cy.visit('http://localhost:3001/profile');
        cy.contains("Alexander Riccio").click();
        cy.contains("Alexander Riccio's profile").click();

    })
})