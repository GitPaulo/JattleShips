import Peer from 'simple-peer';
// @ts-ignore
import wrtc from 'wrtc';
import { Config } from '../config.ts';

type MessageHandler = (message: any) => void;

export class Initiator {
  private peer: Peer.Instance | null = null;
  private onMessage: MessageHandler;

  constructor(onMessage: MessageHandler) {
    this.onMessage = onMessage;
  }

  public async start(): Promise<string> {
    if (Config.debug) console.log('Initiator: Starting WebRTC...');

    return new Promise((resolve, reject) => {
      this.peer = new Peer({
        initiator: true,
        wrtc,
      });

      this.peer.on('signal', (data) => {
        if (Config.debug)
          console.log('Initiator: Offer signal generated:', data);
        const encodedData = Buffer.from(JSON.stringify(data)).toString(
          'base64'
        );
        resolve(encodedData);
      });

      this.peer.on('connect', () => {
        if (Config.debug) console.log('Initiator: Connection established!');
      });

      this.peer.on('data', (data) => {
        const message = JSON.parse(data.toString());
        if (Config.debug) console.log('Initiator: Message received:', message);
        this.onMessage(message);
      });

      this.peer.on('error', (err) => {
        console.error('Initiator: Error occurred:', err);
        reject(err);
      });

      this.peer.on('close', () => {
        if (Config.debug) console.log('Initiator: Connection closed.');
      });
    });
  }

  public accept(answer: string): void {
    if (!this.peer) {
      throw new Error('Initiator: Peer not initialized.');
    }

    const decodedAnswer = JSON.parse(Buffer.from(answer, 'base64').toString());
    if (Config.debug)
      console.log("Initiator: Accepting joiner's answer:", decodedAnswer);

    try {
      this.peer.signal(decodedAnswer);
    } catch (error) {
      console.error("Initiator: Error signaling joiner's answer:", error);
    }
  }
}
