describe('Add manufacturer', () => {
    const name = 'blaaarghhh1'
    beforeEach(() => {
        cy.request('http://localhost:3000/cypress_rails_reset_state');
        // https://docs.cypress.io/guides/end-to-end-testing/google-authentication
        cy.loginByGoogleApi();
    })
    it('cannot create an extant manufacturer', () => {
        const spy = cy.spy(window, 'alert');
        // cy.visit('http://localhost:3001/');
        // cy.visit('http://localhost:3001/devices');
        cy.contains("Devices").click();
        cy.contains("Add your devices and view stats").should("be.visible");
        cy.contains("Select manufacturer").should("be.visible");
        cy.contains("Select manufacturer").click();
        cy.contains("Create new manufacturer").click();
        cy.contains('Please reduce administrative burden').should('exist');
        cy.contains("Add a manufacturer to the database").should('exist');
        // cy.get('div.fade.modal.show > div > div > div.modal-body > form > input').type('Aranet');


        // cy.get('.btn-primary').click();
        cy.contains('Submit').click();

        // cy.get('div.fade.modal.show > div > div > div.modal-footer').get('.spinner-border').should('be.visible');
        // should fail:
        cy.contains('Please reduce administrative burden').should('exist');
        cy.contains("Add a manufacturer to the database").should('exist');

        //try again:
        // cy.get('div.fade.modal.show > div > div > div.modal-body > form > input').type('blaaarghhh');


        // cy.contains('Submit').click();

        // // cy.get('div.fade.modal.show > div > div > div.modal-footer').get('.spinner-border').should('be.visible');
        // // should fail:
        // cy.contains('Please reduce administrative burden').should('not.exist');
        // cy.contains("Add a manufacturer to the database").should('not.exist');
    })
    it('can create a new manufacturer, and it exists after creating it', () => {
        // const spy = cy.spy(window, 'alert');
        cy.window().then((win: Cypress.AUTWindow) => {
            cy.spy(win, 'alert').as('winAlertSpy');
        })
        // cy.visit('http://localhost:3001/');
        // cy.visit('http://localhost:3001/devices');
        cy.contains("Devices").click();
        cy.contains("Add your devices and view stats").should("be.visible");
        cy.contains("Select manufacturer").should("be.visible");
        cy.contains("Select manufacturer").click();
        cy.contains("Create new manufacturer").click();
        cy.contains('Please reduce administrative burden').should('exist');
        cy.contains("Add a manufacturer to the database").should('exist');
        cy.get('div.fade.modal.show > div > div > div.modal-body > form > input').type(name);
        cy.contains('Submit').click();

        cy.contains('Please reduce administrative burden').should('not.exist');
        cy.contains("Add a manufacturer to the database").should('not.exist');
        cy.contains("Select manufacturer").click();
        cy.contains(name).should('exist');
        cy.get('@winAlertSpy').should('not.be.called');

    })
})