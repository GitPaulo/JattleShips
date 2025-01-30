import prompts from 'prompts';
import chalk from 'chalk';
import clipboardy from 'clipboardy';

import { ShipType } from '../core/ships.js';

export async function promptStart(): Promise<void> {
  console.clear();
  const asciiArt = `
                                     |__
                                     |\\/ 
                                     ---
                                     / | [
                              !      | |||
                            _/|     _/|-++'
                        +  +--|    |--|--|_ |-
                     { /|__|  |/\\__|  |--- |||__/
                    +---------------___[}-_===_.'____                 /\\
                ____\`-' ||___-{]_| _[}-  |     |_[___\\==--            \\/   _
 __..._____--==/___]_|__|_____________________________[___\\==--____,------' .7
|                                                                           /
 \\_________________________________________________________________________|`;

  console.log('\x1b[1;37m'); // Set bold white text
  console.log(asciiArt);
  console.log('\x1b[0m'); // Reset terminal formatting

  console.log(chalk.blue('\t\t\t\tJattleShips\n'));

  return pressAnyKey('Press ENTER key to continue...');
}

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

export function printJoinCodePretty(joinCode: string): void {
  // Square border around it (it has multi lines)
  console.log(chalk.blueBright('Share this code with your friend:'));
  console.log(chalk.yellowBright('┌───'));
  console.log(chalk.yellow(joinCode));
  console.log(chalk.yellowBright('└───'));
}

export async function pressAnyKey(message: string): Promise<void> {
  await prompts({
    type: 'text',
    name: 'key',
    message,
  });
}

export async function promptForName(): Promise<{ playerName: string }> {
  return await prompts({
    type: 'text',
    name: 'playerName',
    message: 'Name yourself:',
  });
}

export async function promptCopyToClipboard(value: string): Promise<void> {
  const response = await prompts({
    type: 'confirm',
    name: 'copy',
    message: 'Would you like to copy this code to your clipboard?',
    initial: true,
  });

  if (response.copy) {
    try {
      await clipboardy.write(value);
      console.log(chalk.green('Code copied to clipboard!'));
    } catch (error) {
      console.error(chalk.red('Failed to copy to clipboard:', error));
    }
  } else {
    console.log(chalk.gray('Code not copied.'));
  }
}

export async function promptShipPlacement(
  ship: ShipType
): Promise<{ x: string; y: number; orientation: 'horizontal' | 'vertical' }> {
  console.log(
    chalk.green(`Please place your ${ship.name} (${ship.length} cells long)`)
  );

  const { position } = await prompts({
    type: 'text',
    name: 'position',
    message: `Enter starting coordinate (e.g., A5) for your ${ship.name}:`,
    validate: (value) =>
      /^[A-Ja-j][1-9]$|^[A-Ja-j]10$/.test(value)
        ? true
        : 'Invalid format. Use A1 - J10.',
  });

  const x = position[0].toUpperCase(); // A-J
  const y = parseInt(position.slice(1), 10); // 1-10

  const { orientation } = await prompts({
    type: 'select',
    name: 'orientation',
    message: 'Choose ship orientation:',
    choices: [
      { title: 'Horizontal', value: 'horizontal' },
      { title: 'Vertical', value: 'vertical' },
    ],
  });

  return { x, y, orientation };
}

export async function promptNextPlacement(): Promise<'next' | 'undo'> {
  const { action } = await prompts({
    type: 'select',
    name: 'action',
    message: 'What would you like to do next?',
    choices: [
      { title: 'Place Next Ship', value: 'next' },
      { title: 'Undo Last Placement', value: 'undo' },
    ],
  });

  return action;
}

export async function countDownMessage(
  message: string,
  duration: number
): Promise<void> {
  console.log(chalk.yellow(message));

  for (let i = duration; i > 0; i--) {
    console.log(chalk.yellowBright(i.toString()));
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

export async function promptAttackCoordinates(): Promise<{
  x: number;
  y: number;
}> {
  const { x, y } = await prompts([
    {
      type: 'text',
      name: 'x',
      message: 'Enter attack column (A-J):',
      validate: (value) =>
        /^[A-Ja-j]$/.test(value) ? true : 'Invalid column. Enter A-J.',
    },
    {
      type: 'number',
      name: 'y',
      message: 'Enter attack row (1-10):',
      validate: (value) =>
        value >= 1 && value <= 10 ? true : 'Invalid row. Enter 1-10.',
    },
  ]);

  return { x: x.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0), y: y - 1 };
}
