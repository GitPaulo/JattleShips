import { BasePeer } from './basePeer.ts';
import { Config } from '../config.ts';

export class Joiner extends BasePeer {
  constructor() {
    super();
    this.initializePeer(false);
  }

  public async start(offer: string): Promise<string> {
    if (Config.debug) console.log('Joiner: Starting WebRTC...');

    return new Promise((resolve, reject) => {
      if (!this.peer) return reject(new Error('Joiner: Peer not initialized.'));

      this.peer.on('signal', (data) => {
        if (Config.debug) console.log('Joiner: Answer signal generated:', data);
        if (data.type === 'answer') {
          const encodedData = Buffer.from(JSON.stringify(data)).toString('base64');
          resolve(encodedData);
        }
      });

      this.accept(offer);
    });
  }

  public accept(offer: string): void {
    if (!this.peer) throw new Error('Joiner: Peer not initialized.');

    const decodedOffer = JSON.parse(Buffer.from(offer, 'base64').toString());
    if (Config.debug) console.log("Joiner: Accepting initiator's offer:", decodedOffer);

    try {
      this.peer.signal(decodedOffer);
    } catch (error) {
      console.error("Joiner: Error signaling initiator's offer:", error);
    }
  }

  public async awaitConnection(): Promise<void> {
    if (!this.peer) throw new Error('Joiner: Peer not initialized.');

    return new Promise((resolve) => {
      this.peer?.on('connect', () => {
        if (Config.debug) console.log('Joiner: Connection established.');
        resolve();
      });
    });
  }
}
