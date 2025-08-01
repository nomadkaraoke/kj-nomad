// Custom Cypress commands for KJ-Nomad E2E testing

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Wait for KJ-Nomad server to be ready
       */
      waitForServer(): Chainable<void>
      
      /**
       * Set up test media files for testing
       */
      setupTestMedia(): Chainable<void>
      
      /**
       * Clear the song queue
       */
      clearQueue(): Chainable<void>
      
      /**
       * Search for a song in the singer interface
       */
      searchForSong(query: string): Chainable<void>
      
      /**
       * Request a song as a singer
       */
      requestSong(singerName: string, songQuery: string): Chainable<void>
      
      /**
       * Wait for queue to update with specific song
       */
      waitForQueueUpdate(expectedCount?: number): Chainable<void>
      
      /**
       * Play the next song as KJ
       */
      playNextSong(): Chainable<void>
      
      /**
       * Wait for video to start playing
       */
      waitForVideoToPlay(): Chainable<void>
      
      /**
       * Update ticker message
       */
      updateTicker(message: string): Chainable<void>
      
      /**
       * Wait for ticker to show specific text
       */
      waitForTicker(text: string): Chainable<void>
    }
  }
}

// Wait for server to be ready
Cypress.Commands.add('waitForServer', () => {
  cy.request({
    url: '/',
    retryOnStatusCodeFailure: true,
    timeout: 30000
  }).then(() => {
    // Give the server a moment to fully initialize
    cy.wait(1000)
  })
})

// Set up test media (this would be done by CI setup script)
Cypress.Commands.add('setupTestMedia', () => {
  // In a real setup, this would create test media files
  // For now, we'll assume test files exist
  cy.log('Test media should be set up by CI pipeline')
})

// Clear the song queue via API or direct manipulation
Cypress.Commands.add('clearQueue', () => {
  // We can clear queue by removing all items via WebSocket or API
  cy.window().then((win) => {
    // If there's a global socket connection, use it to clear queue
    if ((win as any).testSocket) {
      (win as any).testSocket.send(JSON.stringify({
        type: 'clear_queue'
      }))
    }
  })
})

// Search for a song
Cypress.Commands.add('searchForSong', (query: string) => {
  cy.get('[data-testid="song-search-input"]', { timeout: 10000 })
    .should('be.visible')
    .clear()
    .type(query)
  
  // Wait for search results to appear
  cy.wait(1000)
})

// Request a song as a singer
Cypress.Commands.add('requestSong', (singerName: string, songQuery: string) => {
  // Fill in singer name
  cy.get('[data-testid="singer-name-input"]', { timeout: 10000 })
    .should('be.visible')
    .clear()
    .type(singerName)
  
  // Search for song
  cy.searchForSong(songQuery)
  
  // Click on first search result
  cy.get('[data-testid="song-result"]', { timeout: 10000 })
    .first()
    .should('be.visible')
    .within(() => {
      cy.get('button').contains(/request|add/i).click()
    })
})

// Wait for queue to update
Cypress.Commands.add('waitForQueueUpdate', (expectedCount?: number) => {
  if (expectedCount !== undefined) {
    cy.get('[data-testid="queue-item"]', { timeout: 10000 })
      .should('have.length', expectedCount)
  } else {
    cy.get('[data-testid="queue-item"]', { timeout: 10000 })
      .should('exist')
  }
})

// Play next song as KJ
Cypress.Commands.add('playNextSong', () => {
  cy.get('button')
    .contains(/play next|start/i, { timeout: 10000 })
    .should('be.visible')
    .click()
})

// Wait for video to start playing
Cypress.Commands.add('waitForVideoToPlay', () => {
  cy.get('video', { timeout: 15000 })
    .should('be.visible')
    .and('have.prop', 'paused', false)
    .and(($video) => {
      expect($video.prop('currentTime')).to.be.greaterThan(0)
    })
})

// Update ticker message
Cypress.Commands.add('updateTicker', (message: string) => {
  cy.get('[data-testid="ticker-input"]', { timeout: 10000 })
    .should('be.visible')
    .clear()
    .type(message)
  
  cy.get('[data-testid="update-ticker-button"]')
    .click()
})

// Wait for ticker to show specific text
Cypress.Commands.add('waitForTicker', (text: string) => {
  cy.get('[data-testid="ticker"], .ticker', { timeout: 10000 })
    .should('contain.text', text)
})

export {}