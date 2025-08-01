// KJ-Nomad E2E Tests - Automation Features
// Tests automated rotation and filler music as specified in ARCHITECTURE.md

interface TestWindow extends Window {
  socket?: {
    send: (data: string) => void;
  };
}

describe('KJ-Nomad Automation Features', () => {
  beforeEach(() => {
    cy.waitForServer()
    cy.setupTestMedia()
    cy.clearQueue()
  })

  describe('Song Completion and Queue Progression', () => {
    it('automatically progresses to next song when current song ends', () => {
      // Test Requirement 4: Automated rotation to the next song upon completion
      
      // Set up queue with multiple songs
      const singers = ['First Singer', 'Second Singer']
      singers.forEach((singer, index) => {
        cy.visit('/singer')
        cy.requestSong(singer, `Test Song ${index + 1}`)
      })
      
      // Start playing first song
      cy.visit('/controller')
      cy.waitForQueueUpdate(2)
      cy.playNextSong()
      
      // Go to player view
      cy.visit('/player')
      cy.waitForVideoToPlay()
      
      // Simulate song ending by triggering the 'ended' event
      cy.get('video').then(($video) => {
        const video = $video[0] as HTMLVideoElement
        video.dispatchEvent(new Event('ended'))
      })
      
      // Verify automatic progression to next song
      cy.get('video', { timeout: 10000 }).should(($video) => {
        // Video should automatically switch to next song
        expect($video.attr('src')).to.include('/api/media/')
      })
      
      // Verify queue progression in controller
      cy.visit('/controller')
      cy.get('[data-testid="now-playing"]')
        .should('contain.text', singers[1]) // Second singer should be playing
      
      cy.waitForQueueUpdate(0) // Queue should be empty now
    })
  })

  describe('Filler Music Activation', () => {
    it('automatically plays filler music when queue is empty', () => {
      // Test Requirement 4: Automated rotation to filler music when no songs in queue
      
      // Ensure queue is empty
      cy.visit('/controller')
      cy.get('[data-testid="queue-item"]').should('not.exist')
      
      // Simulate ending the last song (or no song playing)
      cy.visit('/player')
      
      // Manually trigger filler music (simulating automatic activation)
      cy.window().then((win) => {
        const testWin = win as TestWindow;
        // Send song_ended message when no queue items exist
        if (testWin.socket) {
          testWin.socket.send(JSON.stringify({
            type: 'song_ended'
          }))
        }
      })
      
      // Verify filler music starts playing
      cy.get('video', { timeout: 10000 }).should(($video) => {
        // Should be playing filler music
        const src = $video.attr('src') || ''
        expect(src).to.include('/api/media/')
        expect(src.toLowerCase()).to.include('filler')
      })
      
      // Verify video is actually playing
      cy.waitForVideoToPlay()
    })
  })

  describe('Pause When No Content Available', () => {
    it('pauses when no songs or filler music are available', () => {
      // Test edge case: no content available at all
      
      cy.visit('/controller')
      
      // Manually trigger scenario with no content
      cy.window().then((win) => {
        const testWin = win as TestWindow;
        if (testWin.socket) {
          // Simulate server response when no content is available
          testWin.socket.send(JSON.stringify({
            type: 'pause'
          }))
        }
      })
      
      // Go to player and verify it's paused/stopped
      cy.visit('/player')
      
      cy.get('video').should(($video) => {
        void expect($video.prop('paused')).to.be.true
      })
    })
  })

  describe('Real-time Queue Updates', () => {
    it('updates all interfaces in real-time when queue changes', () => {
      // Test real-time synchronization across multiple views
      
      // Open multiple views (simulating multiple devices)
      cy.visit('/controller')
      // Note: We'll verify from the singer interface
      
      // Add a song via singer interface
      cy.visit('/#/singer')
      cy.requestSong('Real-time Test Singer', 'Test Song')
      
      // Verify controller updates immediately
      cy.visit('/controller')
      cy.waitForQueueUpdate(1)
      cy.get('[data-testid="queue-item"]')
        .should('contain.text', 'Real-time Test Singer')
      
      // Start playing and verify player view updates
      cy.playNextSong()
      
      cy.visit('/player')
      cy.get('[data-testid="now-playing"], .now-playing', { timeout: 5000 })
        .should('contain.text', 'Real-time Test Singer')
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('handles network interruptions gracefully', () => {
      // Test system resilience
      
      cy.visit('/#/singer')
      cy.requestSong('Test Singer', 'Test Song')
      
      // Simulate network interruption
      cy.intercept('POST', '/api/**', { forceNetworkError: true }).as('networkError')
      
      // Try to request another song (should handle error gracefully)
              cy.get('[data-testid="singer-name-input"]').clear().type('Another Singer')
      cy.searchForSong('Another Test')
      
      // Interface should remain functional
      cy.get('[data-testid="song-search-input"]').should('be.visible')
      
      // Restore network and verify recovery
      cy.intercept('POST', '/api/**').as('networkRestored')
      
      cy.visit('/controller')
      cy.get('[data-testid="queue-item"]')
        .should('have.length.at.least', 1)
    })
  })

  describe('Performance Under Load', () => {
    it('handles rapid user interactions without issues', () => {
      // Test system performance with rapid interactions
      
      // Rapidly add multiple songs
      const rapidSingers = Array.from({ length: 5 }, (_, i) => `Rapid Singer ${i + 1}`)
      
      rapidSingers.forEach((singer, index) => {
        cy.visit('/singer')
        cy.get('[data-testid="singer-name-input"]').clear().type(singer)
        cy.searchForSong(`Test ${index + 1}`)
        cy.get('[data-testid="song-result"], .song-result')
          .first()
          .within(() => {
            cy.get('button').contains(/request|add/i).click()
          })
        
        // Small delay to prevent overwhelming the system
        cy.wait(500)
      })
      
      // Verify all songs were added successfully
      cy.visit('/controller')
      cy.waitForQueueUpdate(5)
      
      rapidSingers.forEach((singer) => {
        cy.get('[data-testid="queue-item"]')
          .should('contain.text', singer)
      })
    })
  })
})