import prompts from 'prompts';

import { WebRTC } from '../src/network/webrtc.ts';

async function main() {
  const response = await prompts({
    type: 'select',
    name: 'role',
    message: 'Are you hosting or joining?',
    choices: [
      { title: 'Host', value: 'host' },
      { title: 'Join', value: 'join' },
    ],
  });

  const isHost = response.role === 'host';
  const webrtc = new WebRTC(isHost, (message) => {
    console.log('Received message:', message);
  });

  if (isHost) {
    console.log('Generating join code...');
    const joinCode = await webrtc.start();
    console.log('Share this join code with the other player:', joinCode);

    await prompts({
      type: 'text',
      name: 'ready',
      message: 'Press Enter after sharing the join code',
    });
  } else {
    const joinCodeResponse = await prompts({
      type: 'text',
      name: 'joinCode',
      message: 'Enter the join code provided by the host:',
    });

    await webrtc.start();
    webrtc.accept(joinCodeResponse.joinCode);
  }

  console.log('Connection established! You can now send messages.');

  // Test sending messages
  while (true) {
    const messageResponse = await prompts({
      type: 'text',
      name: 'message',
      message: 'Enter a message to send:',
    });

    webrtc.sendMessage({ text: messageResponse.message });
  }
}

main().catch((err) => console.error('Error:', err));
