module.exports = {
  e2e: {
    baseUrl: 'http://localhost:8080',
    supportFile: 'cypress/support/e2e.ts',
    video: true,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
      require('cypress-fail-fast/plugin')(on, config);
      return config;
    },
    env: {
      // Environment variables for testing
      testSingerName: 'Cypress Test Singer',
      testArtist: 'Test Artist',
      testSong: 'Test Song',
    },
  },
};
