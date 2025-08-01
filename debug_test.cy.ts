// Debug test to check basic page loading
describe('Debug Test', () => {
  it('should load the singer page and check for elements', () => {
    // Visit the singer page
    cy.visit('/singer')
    
    // Wait longer for the page to load
    cy.wait(5000)
    
    // Take a screenshot
    cy.screenshot('singer-page-debug')
    
    // Check if the main container exists
    cy.get('body').should('exist')
    
    // Log what we can see in the DOM
    cy.get('body').then(($body) => {
      cy.log('Body content:', $body.html().substring(0, 500))
    })
    
    // Check if React app is loaded
    cy.get('#root').should('exist')
    
    // Look for any loading or error states
    cy.get('#root').then(($root) => {
      cy.log('Root content:', $root.html().substring(0, 500))
    })
  })
})