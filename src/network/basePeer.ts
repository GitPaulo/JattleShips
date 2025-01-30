import Peer from 'simple-peer';
// @ts-ignore
import wrtc from 'wrtc';

import {
  GameMessage,
  MessagePayload,
  MessageType,
  ResponseHandler,
  WebRTCConnection,
} from './webRTCConnection.js';
import { Config } from '../config.js';

export abstract class BasePeer implements WebRTCConnection {
  protected peer: Peer.Instance | null = null;
  private messageHandlers: ((message: GameMessage) => void)[] = [];
  private pendingResponses: Map<MessageType, ResponseHandler<any>[]> =
    new Map();

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
      const message = JSON.parse(data.toString()) as GameMessage;
      if (Config.debug) console.log('WebRTC: Message received:', message);

      // Handle pending response promises first
      const handlers = this.pendingResponses.get(message.type) || [];
      if (handlers.length > 0) {
        const handler = handlers.shift()!;
        handler(message);
        if (handlers.length === 0) {
          this.pendingResponses.delete(message.type);
        }
      }

      // Then handle general message subscribers
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
    if (Config.debug) console.log('WebRTC: Sending message:', message);
    this.peer.send(JSON.stringify(message));
  }
  
  public waitForMessage<T extends MessageType>(
    type: T
  ): Promise<MessagePayload<T>> {
    return new Promise((resolve) => {
      const handlers = this.pendingResponses.get(type) || [];
      handlers.push((message: MessagePayload<T>) => resolve(message));
      this.pendingResponses.set(type, handlers);
    });
  }

  public async sendAndWaitForResponse<T extends MessageType>(
    message: GameMessage,
    responseType: T
  ): Promise<MessagePayload<T>> {
    this.sendMessage(message);
    return this.waitForMessage(responseType);
  }
}
