import Peer from 'simple-peer';
// @ts-ignore
import wrtc from 'wrtc';
import { GameMessage, WebRTCConnection } from './webRTCConnection.ts';
import { Config } from '../config.ts';

export abstract class BasePeer implements WebRTCConnection {
  protected peer: Peer.Instance | null = null;
  private messageHandlers: ((message: any) => void)[] = [];

  constructor() {}

  protected initializePeer(initiator: boolean) {
    this.peer = new Peer({
      initiator,
      wrtc,
    });

    this.peer.on('connect', () => {
      if (Config.debug) console.log('WebRTC: Connection established.');
    });

    this.peer.on('data', (data) => {
      const message = JSON.parse(data.toString());
      if (Config.debug) console.log('WebRTC: Message received:', message);
      this.messageHandlers.forEach((handler) => handler(message));
    });

    this.peer.on('error', (err) => {
      console.error('WebRTC: Error occurred:', err);
    });

    this.peer.on('close', () => {
      if (Config.debug) console.log('WebRTC: Connection closed.');
    });
  }

  public sendMessage(message: GameMessage): void {
    if (!this.peer || !this.peer.connected) {
      console.error('WebRTC: Cannot send message, peer is not connected.');
      return;
    }
    this.peer.send(JSON.stringify(message));
  }

  public onMessage(callback: (message: GameMessage) => void): void {
    this.messageHandlers.push(callback);
  }
}
