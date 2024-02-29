

describe('Add device', () => {
    const newModelName = "fartipelago2";
    beforeEach(() => {
        // https://docs.cypress.io/guides/end-to-end-testing/google-authentication
        cy.loginByGoogleApi();
        cy.request('http://localhost:3002/cypress_rails_reset_state');

    })
    it('can select device, try to add model', () => {
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

        cy.contains('Aranet').click();
        // cy.contains("Create new Aranet").click();
        
        cy.contains('Create new model for manufacturer Aranet').should('be.visible').click()
        // cy.get('.dropdown-basic').find('[type="button"]').find
        // cy.reload();
        // cy.contains("Select manufacturer").click();

        
        cy.get('div.fade.modal.show > div > div > div.modal-body > form > input').should("be.visible");
        cy.get('div.fade.modal.show > div > div > div.modal-body > form > input').type(newModelName);
        cy.contains("Create new model").click();


        cy.contains(`Add my ${newModelName}:`).click();

        cy.get('div.fade.modal.show > div > div > div.modal-body > form > input').should("be.visible");
        cy.get('div.fade.modal.show > div > div > div.modal-body > form > input').type('123456789');

        cy.contains(`Add new ${newModelName}`).click();

        cy.contains(newModelName).should("be.visible");


        cy.visit('http://localhost:3001/devices');
        cy.contains("Select manufacturer").click()
        cy.get('#dropdown-for-testing-basic-id').contains("Aranet").should("be.visible");
        cy.get('#dropdown-for-testing-basic-id').contains("Aranet").click()
        cy.get('[id^=manufacturer-model-entry]').log("ids:")
        cy.get(`#manufacturer-model-entry-id-${newModelName}`).should("be.visible");

    })

    it("doesn't leak devices into db when testing", () => {
        cy.visit('http://localhost:3001/devices');
        cy.contains("Select manufacturer").click();
        cy.contains('Create new model for manufacturer Aranet').should('be.visible').click();
        // cy.contains(newModelName).should("not.exist");
        cy.contains(newModelName).should("be.visible");
    })


})