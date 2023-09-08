

describe('Add device', () => {
    beforeEach(() => {
        // https://docs.cypress.io/guides/end-to-end-testing/google-authentication
        cy.loginByGoogleApi();
    })
    it('can select device', () => {
        cy.visit('/');
        cy.visit('http://localhost:3001/devices');
        cy.contains("Add your devices and view stats").should("be.visible");
        cy.contains("Select manufacturer").should("be.visible");
        cy.contains("Select manufacturer").click();
        // cy.get('.dropdown-basic').find('[type="button"]').find
    })
})