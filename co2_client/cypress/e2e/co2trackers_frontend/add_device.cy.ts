

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
        cy.contains("Select manufacturer").click()
        
        // cy.contains("Select manufacturer").parent().debug();
        cy.get('#dropdown-for-testing-basic-id').contains("Aranet").should("be.visible");
        cy.get('#dropdown-for-testing-basic-id').contains("Contoso").should("be.visible");
        cy.get('#dropdown-for-testing-basic-id').contains("Create new manufacturer").should("be.visible");
        cy.get('#dropdown-for-testing-basic-id').should("not.have.text", 'microsoft');


        // cy.get('.dropdown-basic').find('[type="button"]').find
        // cy.reload();
        // cy.contains("Select manufacturer").click();
    })
})