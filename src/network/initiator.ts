import { BasePeer } from './basePeer.ts';
import { Config } from '../config.ts';

export class Initiator extends BasePeer {
  constructor() {
    super();
    this.initializePeer(true);
  }

  public async start(): Promise<string> {
    if (Config.debug) console.log('Initiator: Starting WebRTC...');

    return new Promise((resolve, reject) => {
      if (!this.peer) return reject(new Error('Initiator: Peer not initialized.'));

      this.peer.on('signal', (data) => {
        if (Config.debug) console.log('Initiator: Offer signal generated:', data);
        const encodedData = Buffer.from(JSON.stringify(data)).toString('base64');
        resolve(encodedData);
      });
    });
  }

  public accept(answer: string): void {
    if (!this.peer) throw new Error('Initiator: Peer not initialized.');

    const decodedAnswer = JSON.parse(Buffer.from(answer, 'base64').toString());
    if (Config.debug) console.log("Initiator: Accepting joiner's answer:", decodedAnswer);

    try {
      this.peer.signal(decodedAnswer);
    } catch (error) {
      console.error("Initiator: Error signaling joiner's answer:", error);
    }
  }
}
