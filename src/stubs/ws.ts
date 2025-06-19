// Stub implementation for WebSocket when ws package is not available
// This is a minimal implementation for development/testing purposes

import { EventEmitter } from 'events';

export interface WebSocketStub extends EventEmitter {
  readyState: number;
  send(data: string): void;
  close(): void;
}

export class WebSocket extends EventEmitter implements WebSocketStub {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  public readyState: number = WebSocket.CONNECTING;

  constructor(url: string, options?: any) {
    super();
    console.warn('Using WebSocket stub - real WebSocket functionality not available');
    
    // Simulate connection
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.emit('open');
    }, 100);
  }

  send(data: string): void {
    if (this.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    console.log('WebSocket stub send:', data);
  }

  close(): void {
    this.readyState = WebSocket.CLOSING;
    setTimeout(() => {
      this.readyState = WebSocket.CLOSED;
      this.emit('close');
    }, 100);
  }
}

export class WebSocketServer extends EventEmitter {
  constructor(options: any) {
    super();
    console.warn('Using WebSocket Server stub - real WebSocket functionality not available');
  }

  close(): void {
    this.emit('close');
  }
}

export default WebSocket;
