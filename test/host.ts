import Peer from 'simple-peer';
// @ts-ignore
import wrtc from 'wrtc';
import prompts from 'prompts';

(async () => {
  const peer = new Peer({ initiator: true, wrtc });

  // Listen for the offer signal and display it
  peer.on('signal', async (data) => {
    if (data.type === 'offer') {
      console.log('Share this offer with the joiner:', JSON.stringify(data));

      // Wait for the joiner's answer
      const response = await prompts({
        type: 'text',
        name: 'answer',
        message: 'Paste the joiner’s answer:'
      });

      peer.signal(JSON.parse(response.answer));
    }
  });

  peer.on('connect', () => {
    console.log('Connection established with the joiner!');
    peer.send('Hello from Host!');
  });

  peer.on('data', (data) => {
    console.log('Received message from joiner:', data.toString());
  });
})();
