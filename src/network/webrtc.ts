import Peer from 'simple-peer';
import wrtc from 'wrtc';

type MessageHandler = (message: any) => void;

export class WebRTC {
  private peer: Peer.Instance | null = null;

  constructor(
    private isInitiator: boolean,
    private onMessage: MessageHandler
  ) {}

  public start(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.peer = new Peer({
        initiator: this.isInitiator,
        wrtc, // Pass wrtc for Node.js WebRTC support
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }, // Google's public STUN server
          ],
        },
      });

      this.peer.on('signal', (data) => {
        resolve(JSON.stringify(data));
      });

      this.peer.on('connect', () => {
        console.log('WebRTC: Connection established!');
      });

      this.peer.on('data', (data) => {
        const message = JSON.parse(data.toString());
        this.onMessage(message);
      });

      this.peer.on('error', (err) => {
        console.error('WebRTC Error:', err);
        reject(err);
      });
    });
  }

  public accept(joinCode: string): void {
    if (!this.peer) {
      throw new Error('Peer is not initialized. Call start() first.');
    }
    const signalData = JSON.parse(joinCode);
    this.peer.signal(signalData);
  }

  public sendMessage(message: any): void {
    if (!this.peer || !this.peer.connected) {
      console.error('Cannot send message, peer is not connected.');
      return;
    }
    this.peer.send(JSON.stringify(message));
  }
}
