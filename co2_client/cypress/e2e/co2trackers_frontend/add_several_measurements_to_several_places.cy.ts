describe("add multiple measurements to multiple places", () => {
    const manufacturerName = 'blaaarghhh1'

    const newModelName = "fartipelago7";
    const serial = '123456789';
    const addressPrefix = '315 East 69th Street N';
    const fullAddress = '315 East 69th Street New York, NY';
    
    const sublocationOne = {
        co2ppm: '793',
        sublocationOneDesc: 'bedroom'
    };

    const sublocationTwo = {
        co2ppm: '841',
        sublocationTwoDesc: 'lobby'
    }


    beforeEach(() => {
        cy.request('http://localhost:3000/cypress_rails_reset_state');
        // https://docs.cypress.io/guides/end-to-end-testing/google-authentication
        cy.loginByGoogleApi()

    })
    it('can create a new measurement to a new place with a new device', () => {

        // 1 ------
        cy.contains("Devices").click();
        cy.contains("Select manufacturer").click();
        cy.contains("Create new manufacturer").click();
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
        
        
        cy.contains('not found').should('not.exist');
        cy.contains('Last google places query status', { timeout: 30_000 }).should('exist');
        
        cy.contains('Autocomplete message').should('not.exist');
        cy.contains('Submitting...').should('not.exist');
        cy.scrollTo('top');
        cy.contains("Upload a new measurement for", {timeout: 10_000}).should("exist");
        cy.contains("Upload a new measurement for").click();

        cy.get('#sublocation-dropdown-create-new-measurement').click();
        cy.contains(serial).click();

        cy.contains("New inner location").should("be.visible");
        cy.get("#co2ppm").type(sublocationOne.co2ppm);
        cy.get('#crowding-input-field-id-for-testing').type('4');
        cy.get('#location_where_inside_info').type(sublocationOne.sublocationOneDesc);
        cy.contains('Submit new measurement').click();

        cy.contains(sublocationOne.co2ppm).should('be.visible');

        // 2 ----
        
        cy.contains("Upload a new measurement for").click();
        cy.get('#sublocation-dropdown-create-new-measurement').click();
        // cy.get(`#dropdown-item-for-${sublocationOne.sublocationOneDesc}`).click();
        // cy.contains("New sublocation").click();
        cy.get('#sublocation-dropdown-createmeasurement-nothing-selected').click();
        cy.get('#location_where_inside_info').type(sublocationTwo.sublocationTwoDesc);
        cy.get("#co2ppm").type(sublocationTwo.co2ppm);
        cy.get('#crowding-input-field-id-for-testing').type('4');
        cy.contains('Submit new measurement').click();
        cy.contains(sublocationTwo.sublocationTwoDesc).should('be.visible');

        // 3 ----
        cy.contains("Upload a new measurement for").click();
        cy.get('#sublocation-dropdown-create-new-measurement');
        cy.contains(sublocationOne.sublocationOneDesc);
        // cy.get(`#dropdown-item-for-${sublocationOne.sublocationOneDesc}`).click();
        cy.get("#co2ppm").type('499');
        cy.get('#crowding-input-field-id-for-testing').type('4');
        cy.contains('Submit new measurement').click();
        cy.contains(sublocationTwo.sublocationTwoDesc).should('be.visible');




        // validate
        cy.get(`#measurements-sublocation-table-for-testing-${sublocationOne.sublocationOneDesc}`).should('exist');
        cy.get(`#measurements-sublocation-table-for-testing-${sublocationTwo.sublocationTwoDesc}`).should('exist');

        cy.get(`#measurements-sublocation-table-for-testing-${sublocationOne.sublocationOneDesc}`).contains(`${sublocationOne.co2ppm}`);
        cy.get(`#measurements-sublocation-table-for-testing-${sublocationTwo.sublocationTwoDesc}`).contains(`${sublocationTwo.co2ppm}`);

    } )
})