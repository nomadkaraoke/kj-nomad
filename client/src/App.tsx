import { useState, useEffect, useRef } from 'react';
import './App.css';
import Player from './components/Player/Player';
import KjController from './components/KjController/KjController';
import SingerView from './components/SingerView/SingerView';

interface Song {
    id: string;
    artist: string;
    title: string;
    fileName: string;
}

interface QueueEntry {
    song: Song;
    singerName: string;
}


const App = () => {
  const [route, setRoute] = useState(window.location.hash);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [nowPlaying, setNowPlaying] = useState<any>(null);
  const [tickerText, setTickerText] = useState('Welcome to KJ-Nomad!');
  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');
    socket.current = ws;

    ws.onopen = () => {
      console.log('Connected to WebSocket');
      ws.send(JSON.stringify({ type: 'get_queue' }));
    };
    ws.onclose = () => console.log('Disconnected from WebSocket');

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        switch (message.type) {
            case 'queue_updated':
                setQueue(message.payload);
                break;
            case 'play':
                setNowPlaying({ ...message.payload, isFiller: false });
                break;
            case 'play_filler_music':
                setNowPlaying({ ...message.payload, isFiller: true });
                break;
            case 'pause':
                setNowPlaying(null);
                break;
            case 'ticker_updated':
                setTickerText(message.payload);
                break;
        }
    }

    const handleHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      ws.close();
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  let CurrentView;
  switch (route) {
    case '#/player':
      CurrentView = <Player nowPlaying={nowPlaying} socket={socket.current} tickerText={tickerText} />;
      break;
    case '#/controller':
      CurrentView = <KjController socket={socket.current} queue={queue} />;
      break;
    case '#/singer':
      CurrentView = <SingerView socket={socket.current} />;
      break;
    default:
      CurrentView = (
        <div>
          <h1>Welcome to KJ-Nomad</h1>
        </div>
      );
  }

  return (
    <div className="App">
      <header>
        <nav>
          <a href="#/">Home</a> | <a href="#/player">Player</a> | <a href="#/controller">KJ Controller</a> | <a href="#/singer">Singer View</a>
        </nav>
      </header>
      <main>
        {CurrentView}
      </main>
    </div>
  )
}

export default App;
