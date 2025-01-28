import Peer from 'simple-peer';
// @ts-ignore
import wrtc from 'wrtc';
import { Config } from '../config.ts';

type MessageHandler = (message: any) => void;

export class Joiner {
  private peer: Peer.Instance | null = null;
  private onMessage: MessageHandler;

  constructor(onMessage: MessageHandler) {
    this.onMessage = onMessage;
  }

  public async start(offer: string): Promise<string> {
    if (Config.debug) console.log('Joiner: Starting WebRTC...');

    return new Promise((resolve, reject) => {
      this.peer = new Peer({
        wrtc,
      });

      this.peer.on('signal', (data) => {
        if (Config.debug) console.log('Joiner: Answer signal generated:', data);
        if (data.type === 'answer') {
          const encodedData = Buffer.from(JSON.stringify(data)).toString(
            'base64'
          );
          resolve(encodedData);
        }
      });

      this.peer.on('connect', () => {
        if (Config.debug) console.log('Joiner: Connected to initiator!');
      });

      this.peer.on('data', (data) => {
        const message = JSON.parse(data.toString());
        if (Config.debug) console.log('Joiner: Message received:', message);
        this.onMessage(message);
      });

      this.peer.on('error', (err) => {
        console.error('Joiner: Error occurred:', err);
        reject(err);
      });

      this.peer.on('close', () => {
        if (Config.debug) console.log('Joiner: Connection closed.');
      });

      this.accept(offer);
    });
  }

  public accept(offer: string): void {
    if (!this.peer) {
      throw new Error('Joiner: Peer not initialized.');
    }

    const decodedOffer = JSON.parse(Buffer.from(offer, 'base64').toString());
    if (Config.debug)
      console.log("Joiner: Accepting initiator's offer:", decodedOffer);

    try {
      this.peer.signal(decodedOffer);
    } catch (error) {
      console.error("Joiner: Error signaling initiator's offer:", error);
    }
  }

  public async awaitConnection(): Promise<void> {
    if (!this.peer) {
      throw new Error('Joiner: Peer not initialized.');
    }

    return new Promise((resolve) => {
      this.peer?.on('connect', () => {
        if (Config.debug) console.log('Joiner: Connection established.');
        resolve();
      });
    });
  }
}
