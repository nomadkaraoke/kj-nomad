// Cypress global interface extensions
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
      
      /**
       * Wait for now-playing element to appear with optional singer name
       */
      waitForNowPlaying(singerName?: string): Chainable<void>
    }
  }
}