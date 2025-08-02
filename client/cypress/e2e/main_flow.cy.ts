// KJ-Nomad E2E Tests - Core User Flows
// Tests the critical user journeys as specified in ARCHITECTURE.md

describe('KJ-Nomad Core User Flows', () => {
  beforeEach(() => {
    // Wait for server to be ready and set up test environment
    cy.waitForServer()
    cy.setupTestMedia()
    cy.clearQueue()
  })

  describe('Singer Song Request Flow', () => {
    it('allows a singer to successfully search for and request a song', () => {
      // Test Requirement 1: Singer successfully searching for and requesting a song
      cy.visit('/singer')
      
      // Verify singer interface loads
      cy.contains('Search for a song', { timeout: 10000 }).should('be.visible')
      cy.get('[data-testid="singer-name-input"]').should('be.visible')
      cy.get('[data-testid="song-search-input"]').should('be.visible')
      
      // Singer enters their name
      const singerName = Cypress.env('testSingerName')
      cy.get('[data-testid="singer-name-input"]').type(singerName)
      
      // Singer searches for a song
      cy.searchForSong('Test')
      
      // Verify search results appear
      cy.get('[data-testid="song-result"], .song-result', { timeout: 10000 })
        .should('have.length.at.least', 1)
      
      // Request the first song found
      cy.get('[data-testid="song-result"], .song-result')
        .first()
        .within(() => {
          cy.get('button').contains(/request|add/i).click()
        })
      
      // Verify success message
      cy.contains(/requested|added|success/i, { timeout: 5000 }).should('be.visible')
    })
  })

  describe('KJ Queue Management Flow', () => {
    it('allows KJ to see song requests and manage the queue', () => {
      // First, add a song to the queue
      cy.visit('/singer')
      cy.requestSong(Cypress.env('testSingerName'), 'Test')
      
      // Test Requirement 2: KJ seeing the request appear in the queue
      cy.visit('/controller')
      
      // Verify queue interface loads
      cy.contains('Queue', { timeout: 10000 }).should('be.visible')
      
      // Verify the requested song appears in queue
      cy.waitForQueueUpdate(1)
      cy.get('[data-testid="queue-item"]')
        .should('contain.text', Cypress.env('testSingerName'))
      
      // KJ should be able to play the song
      cy.playNextSong()
      
      // Verify queue updates after playing
      cy.waitForNowPlaying(Cypress.env('testSingerName'))
    })
  })

  describe('Player Video Playback Flow', () => {
    it('correctly plays the selected song in player view', () => {
      // Set up: Add and start a song
      cy.visit('/singer')
      cy.requestSong(Cypress.env('testSingerName'), 'Test')
      
      cy.visit('/controller')
      cy.waitForQueueUpdate(1)
      cy.playNextSong()
      
      // Test Requirement 3: Player view correctly playing the selected song
      cy.visit('/player')
      
      // Verify video element exists and is configured correctly
      cy.get('video', { timeout: 15000 }).should('be.visible')
      
      // Verify video source is set correctly
      cy.get('video').should('have.attr', 'src').and('include', '/api/media/')
      
      // Wait for video to actually start playing
      cy.waitForVideoToPlay()
      
      // Verify video controls and state
      cy.get('video').should(($video) => {
        void expect($video.prop('currentTime')).to.be.greaterThan(0)
        void expect($video.prop('paused')).to.be.false
      })
      
      // Verify ticker is displayed
      cy.get('[data-testid="ticker"], .ticker').should('be.visible')
    })
  })

  describe('Ticker Real-time Updates', () => {
    it('shows real-time updates to the scrolling ticker', () => {
      // Test Requirement 5: Real-time updates to the scrolling ticker
      const testMessage = `Test Message ${Date.now()}`
      
      // Update ticker from KJ interface
      cy.visit('/controller')
      cy.updateTicker(testMessage)
      
      // Verify ticker updates in player view
      cy.visit('/player')
      cy.waitForTicker(testMessage)
      
      // Verify ticker updates in singer view
      cy.visit('/singer')
      cy.waitForTicker(testMessage)
    })
  })

  describe('Multiple User Concurrent Flow', () => {
    it('handles multiple singers requesting songs concurrently', () => {
      // Add multiple songs to queue
      const singers = ['Singer One', 'Singer Two', 'Singer Three']
      
      singers.forEach((singer, index) => {
        cy.visit('/singer')
        cy.requestSong(singer, `Test ${index + 1}`)
      })
      
      // Verify all songs appear in KJ queue
      cy.visit('/controller')
      cy.waitForQueueUpdate(3)
      
      singers.forEach((singer) => {
        cy.get('[data-testid="queue-item"]')
          .should('contain.text', singer)
      })
      
      // Play through songs and verify progression
      cy.playNextSong()
      
      // Verify first song is now playing
      cy.waitForNowPlaying(singers[0])
      
      // Verify queue reduced by one
      cy.waitForQueueUpdate(2)
    })
  })
})
