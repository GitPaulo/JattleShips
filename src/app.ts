#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { Config } from './config.js';
import { Game } from './core/game.js';
import { promptStart } from './utils/prompts.js';

/**
 * JattleShips!
 *    by GitPaulo
 */
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
  
  // Prompt start
  await promptStart();

  const game = new Game();
  await game.start();
}

main().catch((err) => {
  console.error('An error occurred:', err);
});
