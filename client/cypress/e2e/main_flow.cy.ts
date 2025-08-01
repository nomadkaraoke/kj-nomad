describe('Main User Flow', () => {
  it('allows a singer to request a song and the KJ to play it', () => {
    // Start with the singer view
    cy.visit('http://localhost:5173/#/singer');

    // Singer requests a song
    cy.get('input[placeholder="Your Name"]').type('Cypress');
    cy.get('input[placeholder="Search for a song..."]').type('a-ha');
    cy.contains('a-ha - Take On Me').parent().find('button').click();

    // KJ view
    cy.visit('http://localhost:5173/#/controller');
    cy.contains('a-ha - Take On Me (Cypress)').should('be.visible');
    cy.contains('Play Next').click();

    // Player view
    cy.visit('http://localhost:5173/#/player');
    cy.get('video').should('have.prop', 'src', 'http://localhost:8080/api/media/a-ha%20-%20Take%20On%20Me.mp4');
    cy.get('video').should((video) => {
        expect(video.prop('paused')).to.be.false;
    });
  });
});
