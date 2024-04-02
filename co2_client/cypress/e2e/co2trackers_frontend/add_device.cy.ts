

describe('Add device', () => {
    const newModelName = "fartipelago8";
    const serial = '123456789';
    beforeEach(() => {
        cy.request('http://localhost:3000/cypress_rails_reset_state');
        // https://docs.cypress.io/guides/end-to-end-testing/google-authentication
        cy.loginByGoogleApi();

    })
    it('can select device, try to add model', () => {
        // cy.visit('http://localhost:3001/');
        // cy.visit('http://localhost:3001/devices');
        cy.contains("Devices").click();
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
        cy.get('div.fade.modal.show > div > div > div.modal-body > form > input').type(serial);

        cy.contains(`Add new ${newModelName}`).click();

        cy.contains(newModelName).should("be.visible");


        // cy.visit('http://localhost:3001/devices');
        cy.contains("Devices").click();
        cy.contains("Select manufacturer").click()
        cy.get('#dropdown-for-testing-basic-id').contains("Aranet").should("be.visible");
        cy.get('#dropdown-for-testing-basic-id').contains("Aranet").click()
        cy.get('[id^=manufacturer-model-entry]').log("ids:")
        cy.get(`#manufacturer-model-entry-id-${newModelName}`).should("be.visible");
        cy.get(`#manufacturer-model-entry-id-${newModelName}`).get('button').contains("Pick").click();

        // cy.visit('http://localhost:3001/profile');
        cy.get('#basic-nav-dropdown').click();
        cy.get('#basic-nav-profile-link-id-for-testing').click();
        // cy.contains("Alexander Riccio's profile").click();
        cy.contains(serial).should("be.visible");
        // cy.contains(`Add my ${newModelName}:`).should("be.visible");
    })

    it("doesn't leak devices into db when testing", () => {
        cy.contains("Devices").click();
        cy.contains("Select manufacturer").click();
        cy.contains('Aranet').should('be.visible').click();
        cy.contains('aranet4').should("be.visible");
        cy.contains(newModelName).should("not.exist");
    })


})