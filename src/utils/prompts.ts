import prompts from 'prompts';
import chalk from 'chalk';

export async function promptMainMenu(): Promise<string> {
  const response = await prompts({
    type: 'select',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      { title: 'Host a Game', value: 'host' },
      { title: 'Join a Game', value: 'join' },
      { title: 'Exit', value: 'exit' },
    ],
  });

  return response.action;
}

export async function promptJoinCode(): Promise<{ joinCode: string }> {
  return await prompts({
    type: 'text',
    name: 'joinCode',
    message: 'Enter the join code:',
  });
}

export async function pressAnyKey(message: string): Promise<void> {
  await prompts({
    type: 'text',
    name: 'key',
    message,
  });
}
