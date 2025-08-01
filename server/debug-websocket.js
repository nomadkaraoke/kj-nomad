import WebSocket from 'ws';

console.log('Connecting to WebSocket...');
const ws = new WebSocket('ws://localhost:8080');

ws.on('open', function open() {
  console.log('Connected to WebSocket');
  
  // Test 1: Add a song to queue
  console.log('Step 1: Adding song to queue...');
  ws.send(JSON.stringify({
    type: 'request_song',
    payload: { songId: '4', singerName: 'Test Singer' }
  }));
  
  setTimeout(() => {
    // Test 2: Get queue
    console.log('Step 2: Getting queue...');
    ws.send(JSON.stringify({
      type: 'get_queue'
    }));
  }, 1000);
  
  setTimeout(() => {
    // Test 3: Play next song
    console.log('Step 3: Playing next song...');
    ws.send(JSON.stringify({
      type: 'play',
      payload: { 
        songId: '4', 
        fileName: 'Test Artist - Test Song.mp4',
        singer: 'Test Singer'
      }
    }));
  }, 2000);
  
  setTimeout(() => {
    // Test 4: Remove from queue
    console.log('Step 4: Removing from queue...');
    ws.send(JSON.stringify({
      type: 'remove_from_queue',
      payload: { songId: '4' }
    }));
  }, 3000);
  
  setTimeout(() => {
    // Test 5: Update ticker
    console.log('Step 5: Updating ticker...');
    ws.send(JSON.stringify({
      type: 'ticker_updated',
      payload: 'Test ticker message'
    }));
  }, 4000);
  
  setTimeout(() => {
    console.log('Closing connection...');
    ws.close();
  }, 5000);
});

ws.on('message', function message(data) {
  console.log('Received:', JSON.parse(data.toString()));
});

ws.on('error', function error(err) {
  console.error('WebSocket error:', err);
});

ws.on('close', function close() {
  console.log('WebSocket connection closed');
});