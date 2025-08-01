// Type definitions for Cypress commands

export interface MockWebSocket {
  send: (data: string) => void;
  readyState?: number;
  close?: () => void;
}

export interface TestWindow extends Window {
  socket?: MockWebSocket;
  testSocket?: MockWebSocket;
}