describe('Add measurement to new place', () => {
    const newModelName = "fartipelago7";
    const serial = '123456789';
    const addressPrefix = '315 East 69th Street N';
    const fullAddress = '315 East 69th Street New York, NY';
    const co2ppm = '793';
    beforeEach(() => {
        // https://docs.cypress.io/guides/end-to-end-testing/google-authentication
        cy.loginByGoogleApi();
        cy.request('http://localhost:3000/cypress_rails_reset_state');

    })
    it('can create a new measurement to a new place with a new device', () => {
        cy.visit('http://localhost:3001/devices');
        cy.contains("Select manufacturer").click()
        cy.contains('Aranet').click();
        cy.contains('Create new model for manufacturer Aranet').should('be.visible').click()
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
        cy.get('.pac-item').should('be.visible');
        cy.get('#co2trackers-places-autocomplete-form').type("{downArrow}");
        cy.get('#co2trackers-places-autocomplete-form').click();
        cy.get('#co2trackers-places-autocomplete-form').type("{enter}");
        cy.get('.pac-item').should('not.be.visible');
        cy.contains('not found').should('not.exist');
        cy.contains('Last google places query status').should('exist');
        cy.contains('Last google places query status: OK').should('exist');
        // cy.get('#co2trackers-places-autocomplete-form').type("");
        // cy.contains(fullAddress);

        cy.scrollTo('top');
        cy.contains("Upload a new measurement for", {timeout: 10_000}).should("be.visible");
        cy.contains("Upload a new measurement for").click();

        cy.get('#dropdown-basic').click();
        cy.contains(serial).click();

        cy.contains("new inner location").should("be.visible");
        cy.get("#co2ppm").type(co2ppm);
        cy.get('#crowding').type('4');
        cy.get('#location_where_inside_info').type('bedroom');
        cy.contains('Submit new measurement').click();

        cy.contains(co2ppm).should('be.visible');
        
    } )
} )