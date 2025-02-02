import chalk from 'chalk';

import { Cell } from './board.js';
import { Game } from './game';
import { printBoardFooter, printBoardHeader } from '../utils/prompts';

export class FogBoard {
  private readonly grid: Cell[][];
  private size: number;
  private game: Game;

  constructor(
    size: number,
    game: Game
  ) {
    this.size = size;
    this.game = game;
    this.grid = Array.from({ length: size }, () => Array(size).fill('☁️'));
  }

  public update(x: number, y: number, result: 'hit' | 'miss' | 'sunk') {
    if (result === 'miss') {
      this.grid[y][x] = '❌';
    } else if (result === 'hit') {
      this.grid[y][x] = '✔️';
    } else if (result === 'sunk') {
      this.grid[y][x] = '✔️';
      // TODO - Implement ship sinking
    }
  }

  public displayFogBoard() {
    const opponentPlayer = this.game.getOpponentPlayer();
    console.log(
      chalk.blueBright(`Their Board (${opponentPlayer?.name}'s Attack):`)
    );
    printBoardHeader(this.size);

    for (let row = 0; row < 10; row++) {
      let rowDisplay = `${row + 1}`.padStart(2, ' ') + '| ';

      for (let col = 0; col < 10; col++) {
        rowDisplay += this.grid[row][col] + ' ';
      }

      console.log(rowDisplay);
    }

    printBoardFooter(this.size);
  }
}
