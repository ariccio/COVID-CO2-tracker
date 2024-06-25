/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

function getLoginTokenPostRequest() {
    return {
        method: 'POST',
        url: 'https://www.googleapis.com/oauth2/v4/token',
        body: {
          grant_type: 'refresh_token',
          client_id: Cypress.env('googleClientId'),
          client_secret: Cypress.env('googleClientSecret'),
          refresh_token: Cypress.env('googleRefreshToken'),
        }
      };
} 

  function userInfoRequestWithAccessToken(access_token) {
    return {
        method: 'GET',
        url: 'https://www.googleapis.com/oauth2/v3/userinfo',
        headers: { Authorization: `Bearer ${access_token}` },
      }
  }

function idBody(tokenResponseBody: any) {
    const id_token = tokenResponseBody.id_token;
    // cy.log(`using id_token: ${id_token}`)
    return JSON.stringify({
        user: {
            id_token
        }
    })
}

function getUserInfo(tokenResponseBody) {
    cy.log("getting user info...");
    if (tokenResponseBody === null) {
        cy.log("Body null!");
        // return;
    }
    if (tokenResponseBody.access_token === undefined) {
        cy.log("access_token undefined!");
        // return;
    }
    if (tokenResponseBody.access_token === null) {
        cy.log("access_token null!");
        // return;
    }
    if (tokenResponseBody.access_token === '') {
        cy.log("access_token empty!");
        // return;
    }
    const userInfoRequest = userInfoRequestWithAccessToken(tokenResponseBody.access_token);
    return cy.request(userInfoRequest).then(({body: infoRequestResponseBody}) => {
        cy.log(`infoResponseRequestBody: ${JSON.stringify(infoRequestResponseBody)}`);
        cy.log(`tokenResponseBody: ${JSON.stringify(tokenResponseBody)}`);
        const opts: Partial<Cypress.RequestOptions> = {
            url: 'localhost:3000/api/v1/auth',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                credentials: 'include', //for httpOnly cookie
            },
            body: idBody(tokenResponseBody)
        };
        return cy.request(opts).then(() => {
            const userItem = {
                token: tokenResponseBody.id_token,
                user: {
                    googleId: infoRequestResponseBody.sub,
                    email: infoRequestResponseBody.email,
                    givenName: infoRequestResponseBody.given_name,
                    familyName: infoRequestResponseBody.family_name,
                    imageUrl: infoRequestResponseBody.picture,
                    name: infoRequestResponseBody.name,
                },
            }
            window.localStorage.setItem('googleCypress', JSON.stringify(userItem))
            const frontendPort = Cypress.env('DEFAULT_FRONTEND_PORT');
            cy.log(`frontend port: ${frontendPort}`)
            return cy.visit(`http://localhost:${frontendPort}/`);
        })
    })
}

Cypress.Commands.add('loginByGoogleApi', () => {
    // https://docs.cypress.io/guides/end-to-end-testing/google-authentication
    cy.log('Logging in to Google');
    return cy.request(getLoginTokenPostRequest()).then(({body}) => {
        cy.log(JSON.stringify(body));
        return getUserInfo(body);
    })

})