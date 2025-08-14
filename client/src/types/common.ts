// Common type definitions for KJ-Nomad client

export interface MockWebSocket extends Partial<WebSocket> {
  send: (data: string) => void;
  readyState?: number;
  close?: () => void;
}

export interface WebSocketMessage {
  type: string;
  payload?: unknown;
}

export interface MockWindow extends Window {
  socket?: MockWebSocket;
  testSocket?: MockWebSocket;
}

export interface Song {
  id: string;
  artist: string; // legacy, unused
  title: string;  // mirrors fileName
  fileName: string;
}

export interface QueueItem {
  song: Song;
  singerName: string;
}