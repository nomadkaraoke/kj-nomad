// DOM inspection test to see what elements are actually available
describe('DOM Inspection', () => {
  it('should inspect singer page elements', () => {
    cy.visit('/singer')
    
    // Wait for page to load
    cy.wait(3000)
    
    // Take screenshot for reference
    cy.screenshot('singer-page-inspection')
    
    // Log all input elements
    cy.get('input').then(($inputs) => {
      $inputs.each((index, input) => {
        cy.log(`Input ${index}: placeholder="${input.placeholder}", data-testid="${input.getAttribute('data-testid')}", name="${input.name}", type="${input.type}"`)
      })
    })
    
    // Log all elements with data-testid attributes
    cy.get('[data-testid]').then(($elements) => {
      $elements.each((index, element) => {
        cy.log(`Element ${index}: tag="${element.tagName}", data-testid="${element.getAttribute('data-testid')}"`)
      })
    })
    
    // Check for specific elements we expect
    cy.get('body').should('contain.text', 'Search for a song')
  })
  
  it('should inspect controller page elements', () => {
    cy.visit('/controller')
    
    // Wait for page to load
    cy.wait(3000)
    
    // Take screenshot for reference
    cy.screenshot('controller-page-inspection')
    
    // Log all buttons
    cy.get('button').then(($buttons) => {
      $buttons.each((index, button) => {
        cy.log(`Button ${index}: text="${button.textContent}", data-testid="${button.getAttribute('data-testid')}"`)
      })
    })
    
    // Check for queue elements
    cy.get('body').should('contain.text', 'KJ Controller')
  })
  
  it('should inspect player page elements', () => {
    cy.visit('/player')
    
    // Wait for page to load
    cy.wait(3000)
    
    // Take screenshot for reference
    cy.screenshot('player-page-inspection')
    
    // Look for video element
    cy.get('video').should('exist').then(($video) => {
      cy.log(`Video element: src="${$video.attr('src')}", data-testid="${$video.attr('data-testid')}"`)
    })
    
    // Look for ticker
    cy.get('[data-testid="ticker"]').should('exist')
  })
})