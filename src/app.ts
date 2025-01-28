import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Config } from './config.ts';
import { Game } from './core/game.ts';
import { pressAnyKey } from './utils/prompts.js';

async function main() {
  // Parse CLI arguments
  const argv = yargs(hideBin(process.argv))
    .option('debug', {
      alias: 'd',
      type: 'boolean',
      description: 'Enable debug logs',
    })
    .help()
    .argv;

  // Set debug mode in the global Config
  Config.debug = (argv as any).debug || false;

  console.clear();
  console.log('JattleShips!');

  await pressAnyKey('Press ENTER key to continue...');

  const game = new Game();
  await game.start();
}

main().catch((err) => {
  console.error('An error occurred:', err);
});
