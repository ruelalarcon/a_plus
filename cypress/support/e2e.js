// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Configure global behavior
beforeEach(() => {
  // Preserve cookies between tests
  cy.intercept('**/graphql', (req) => {
    // Add a delay to GraphQL requests to make tests more realistic
    req.on('response', (res) => {
      // You can add assertions or modify responses if needed
    });
  }).as('graphqlRequests');
});

// Alternatively you can use CommonJS syntax:
// require('./commands')