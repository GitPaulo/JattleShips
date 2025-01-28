import chalk from 'chalk';
import { promptMainMenu } from './utils/prompts.ts';
import { WebRTC } from './network/webrtc.ts';

async function main() {
  console.clear();
  console.log(chalk.blueBright('JattleShips!'));

  const choice = await promptMainMenu();
  if (choice === 'host') {
    console.log(chalk.green('You chose to host a game.'));
    const webrtc = new WebRTC(true, (message) => {
      console.log(chalk.yellow('Message from opponent:'), message);
    });

    console.log(chalk.blue('Generating join code...'));
    const joinCode = await webrtc.start();
    console.log(
      chalk.blueBright('Share this join code with your opponent:'),
      joinCode
    );

    await new Promise((resolve) => {
      process.stdin.once('data', () => resolve(true));
    });

    console.log(chalk.green('Connection established!'));
    // TODO: Gameplay logic for host
  } else if (choice === 'join') {
    console.log(chalk.green('You chose to join a game.'));
    const webrtc = new WebRTC(false, (message) => {
      console.log(chalk.yellow('Message from opponent:'), message);
    });

    const joinCode = await promptMainMenu();
    console.log(chalk.blue('Joining the game...'));
    await webrtc.start();
    webrtc.accept(joinCode);

    console.log(chalk.green('Connection established!'));
    // TODO: Gameplay logic for joiner
  } else {
    console.log(chalk.red('Exiting game. Goodbye!'));
  }
}

main().catch((err) => {
  console.error(chalk.red('An error occurred:'), err);
});
