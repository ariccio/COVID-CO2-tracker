describe('Add measurement to new place', () => {
    const manufacturerName = 'blaaarghhh1'

    const newModelName = "fartipelago7";
    const serial = '123456789';
    const addressPrefix = '315 East 69th Street N';
    const fullAddress = '315 East 69th Street New York, NY';
    const co2ppm = '793';
    beforeEach(() => {
        cy.request('http://localhost:3000/cypress_rails_reset_state');
        // https://docs.cypress.io/guides/end-to-end-testing/google-authentication
        cy.loginByGoogleApi()

    })
    it('can create a new measurement to a new place with a new device', () => {
        cy.contains("Devices").click();
        cy.contains("Add your devices and view stats").should("be.visible");
        cy.contains("Select manufacturer").click();
        cy.contains("Create new manufacturer").click();
        cy.contains("Add a manufacturer to the database").should('exist');
        cy.get('div.fade.modal.show > div > div > div.modal-body > form > input').type(manufacturerName);
        cy.contains('Submit').click();


        cy.contains("Select manufacturer").click()
        cy.contains(manufacturerName).click();
        cy.contains(`Create new model for manufacturer ${manufacturerName}`).should('be.visible').click()
        cy.get('div.fade.modal.show > div > div > div.modal-body > form > input').type(newModelName);
        cy.contains("Create new model").click();
        cy.contains(`Add my ${newModelName}:`).click();
        cy.get('div.fade.modal.show > div > div > div.modal-body > form > input').type(serial);
        cy.contains(`Add new ${newModelName}`).click();

        // cy.visit('http://localhost:3001/');
        cy.contains('Home').click();
        cy.get('#co2trackers-places-autocomplete-form').scrollIntoView();
        cy.get('#co2trackers-places-autocomplete-form').click();
        cy.get('#co2trackers-places-autocomplete-form').type(addressPrefix);
        
        // thanks for saving me ten minutes: https://dev.to/granthair5/cypress-e2e-testing-with-google-maps-autocomplete-42hp
        cy.get('.pac-item', { timeout: 10_000 }).should('be.visible');
        cy.get('#co2trackers-places-autocomplete-form').type("{downArrow}");
        cy.get('#co2trackers-places-autocomplete-form').click();
        cy.get('#co2trackers-places-autocomplete-form').type("{enter}");
        
        
        // seems to sometimes still exist after gone
        // cy.get('.pac-item', { timeout: 10_000 }).should('not.be.visible');


        cy.contains('not found').should('not.exist');
        cy.contains('Last google places query status', { timeout: 30_000 }).should('exist');
        // cy.contains('Last google places query status: OK').should('exist');
        // cy.get('#co2trackers-places-autocomplete-form').type("");
        // cy.contains(fullAddress);

        cy.scrollTo('top');
        cy.contains("Upload a new measurement for", {timeout: 10_000}).should("be.visible");
        cy.contains("Upload a new measurement for").click();

        cy.get('#dropdown-basic').click();
        cy.contains(serial).click();

        cy.contains("New inner location").should("be.visible");
        cy.get("#co2ppm").type(co2ppm);
        cy.get('#crowding-input-field-id-for-testing').type('4');
        cy.get('#location_where_inside_info').type('bedroom');
        cy.contains('Submit new measurement').click();

        cy.contains(co2ppm).should('be.visible');
        
    } )
} )