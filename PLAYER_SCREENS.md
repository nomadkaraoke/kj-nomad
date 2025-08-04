Context: @/ARCHITECTURE.md @/FEATURES.md @/ONBOARDING_FLOW.md and @/MONETIZATION.md 

In a previous chat, we re-worked the onboarding flow so after the user completes the initial onboarding flow, the main app "home" page is now just the primary KJ control UI (see screenshot attached) - @/client/src/pages/HomePage.tsx 

We added a dedicated Player Screens section to the home page which is supposed to guide the KJ on how to set up player screens, and configure any existing screens which are connected to the server - but I think this needs a lot more work: @/client/src/test/PlayerScreenManager.test.tsx 

First, there should be clear instructions for how to set up a player screen, guiding the KJ to either browse to http://[IP]:8080/player in a web browser on the player device, or install and run the KJ-Nomad app on the player device. In either case, the player device should automatically scan for and detect the server running on the local network, after which it should appear in the "Player Screens" list in the KJ admin UI.

Once a Player Screen has been connected, the KJ should be able to configure it from the admin UI. For example for any given player screen, the KJ should be able to:
- Mute / unmute audio output from each player screens (as typically they will likely only need one device outputting sound)
- Turn on/off the ticker bar at the bottom (which may make sense for a screen behind the singer but could be distracting for the screen used by the singer themselves to read lyrics on)
- Turn on/off a full-height sidebar which cycles through the full singer rotation and next queued songs, making the karaoke video player smaller but giving the audience more info about what songs are coming up next.
- Turn on/off the video player entirely so only the singer rotation and/or ticker bar are shown; considering @/MONETIZATION.md for some KJs they may only want use the KJ-Nomad system to show the rotation and encourage tipping but without any video playback required at all

Context: @/ARCHITECTURE.md @/FEATURES.md @/ONBOARDING_FLOW.md and @/MONETIZATION.md 

In a previous chat, we re-worked the onboarding flow so after the user completes the initial onboarding flow, the main app "home" page is now just the primary KJ control UI (see screenshot attached) - @/client/src/pages/HomePage.tsx 

We added a dedicated Player Screens section to the home page to guide the KJ on how to set up player screens, and configure any existing screens which are connected to the server - described in @/PLAYER_SCREENS.md  but this still needs more work: @/client/src/test/PlayerScreenManager.test.tsx  

the basic functionality works but it's hard to identify which screen is which; please number the screens (e.g. screen 1,2,3) rather than showing the UUID, and add a button to temporarily display the screen number on that screen in a large overlay for a few seconds to make it easy to identify connected screens.

please also add some additional metadata about each connected screen, e.g. the viewport / window size in pixels, and what kind of device it is (e.g. what web browser and OS it's loaded on, whether it's running in the KJ-Nomad app or just a browser, and anything else which might be useful and easy to collect from the player screen frontend code)

additionally, we need some sort of indicator showing which screens are actively connected - if a player screen doesn't respond for a few seconds we should assume it's disconnected and make that clear in the admin UI. the KJ should be able to actively disconnect/remove any player screen. if it's a disconnected screen, that just removes it from the admin panel. if it's a connected one, a signal should be sent to that screen to tell it to shut down (which should then stop any playback / tickers / etc., end all communication, and show a "Player Screen Disconnected, thanks for using KJ-Nomad" message or similar).

Please review the existing code and implementation and make a plan to make this setup work as I've described it here.