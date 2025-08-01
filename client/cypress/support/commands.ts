// Custom Cypress commands for KJ-Nomad E2E testing
/// <reference types="./index.d.ts" />

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
  // Clear queue via API call since WebSocket may not be reliable for this
  cy.request({
    method: 'POST',
    url: '/api/queue/clear',
    failOnStatusCode: false
  }).then(() => {
    // Give the server a moment to clear the queue
    cy.wait(500)
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
  // First try the specific play-next-button, then fallback to text matching
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="play-next-button"]').length > 0) {
      cy.get('[data-testid="play-next-button"]', { timeout: 10000 })
        .should('be.visible')
        .click()
    } else {
      cy.get('button')
        .contains(/play next|start this song|start/i, { timeout: 10000 })
        .should('be.visible')
        .click()
    }
  })
  
  // Wait for WebSocket message to be sent and processed
  cy.wait(2000)
})

// Wait for video to start playing
Cypress.Commands.add('waitForVideoToPlay', () => {
  // First wait for video to have a src attribute
  cy.get('[data-testid="video"], video', { timeout: 15000 })
    .should('be.visible')
    .and('have.attr', 'src')
  
  // Then wait for it to actually start playing
  cy.get('[data-testid="video"], video')
    .should('have.prop', 'paused', false)
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
  
  // Wait for WebSocket message to be sent and processed
  cy.wait(1000)
})

// Wait for ticker to show specific text
Cypress.Commands.add('waitForTicker', (text: string) => {
  cy.get('[data-testid="ticker"], .ticker', { timeout: 10000 })
    .should('contain.text', text)
})

// Wait for now-playing element to appear with specific singer
Cypress.Commands.add('waitForNowPlaying', (singerName?: string) => {
  cy.get('[data-testid="now-playing"]', { timeout: 10000 })
    .should('be.visible')
  
  if (singerName) {
    cy.get('[data-testid="now-playing"]')
      .should('contain.text', singerName)
  }
})

export {}