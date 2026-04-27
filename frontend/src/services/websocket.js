/**
 * WebSocket service wrapping socket.io-client.
 */

import { io } from 'socket.io-client';

const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
    this.isConnected = false;
    this.sessionId = null;
  }

  connect() {
    if (this.socket && this.socket.connected) return;

    this.socket = io(WS_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      this._emit('connectionChange', true);
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      this._emit('connectionChange', false);
    });

    this.socket.on('connected', (data) => {
      this.sessionId = data.session_id;
      this._emit('sessionStart', data);
    });

    this.socket.on('result', (data) => this._emit('result', data));
    this.socket.on('emergency', (data) => this._emit('emergency', data));
    this.socket.on('disambiguate', (data) => this._emit('disambiguate', data));
    this.socket.on('isl_gloss', (data) => this._emit('islGloss', data));
    this.socket.on('error', (data) => this._emit('error', data));
    this.socket.on('configured', (data) => this._emit('configured', data));
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  sendFrame(frameBase64) {
    if (this.socket && this.isConnected) {
      this.socket.emit('frame', { frame: frameBase64, timestamp: Date.now() });
    }
  }

  sendTextInput(text, language = 'en') {
    if (this.socket && this.isConnected) {
      this.socket.emit('text_input', { text, language });
    }
  }

  configure(settings) {
    if (this.socket && this.isConnected) {
      this.socket.emit('configure', settings);
    }
  }

  reset() {
    if (this.socket && this.isConnected) {
      this.socket.emit('reset');
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    };
  }

  _emit(event, data) {
    (this.listeners[event] || []).forEach((cb) => cb(data));
  }
}

export const wsService = new WebSocketService();
export default wsService;