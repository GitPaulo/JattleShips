import Peer from 'simple-peer';
// @ts-ignore
import wrtc from 'wrtc';
import prompts from 'prompts';

(async () => {
  const peer = new Peer({ initiator: false, wrtc });

  // Prompt for the host's offer
  const response = await prompts({
    type: 'text',
    name: 'offer',
    message: 'Paste the host’s offer:'
  });

  // Signal the host's offer
  peer.signal(JSON.parse(response.offer));

  // Listen for the answer signal and display it
  peer.on('signal', (data) => {
    if (data.type === 'answer') {
      console.log('Share this answer with the host:', JSON.stringify(data));
    }
  });

  peer.on('connect', () => {
    console.log('Connection established with the host!');
    peer.send('Hello from Joiner!');
  });

  peer.on('data', (data) => {
    console.log('Received message from host:', data.toString());
  });
})();
