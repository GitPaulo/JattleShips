import prompts from 'prompts';
import chalk from 'chalk';
import clipboardy from 'clipboardy';

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
  console.log(chalk.yellow(`Generated Code: ${chalk.bold(value)}`));

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
