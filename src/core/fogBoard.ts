import { Cell } from './board.ts';
import chalk from 'chalk';

export class FogBoard {
  private grid: Cell[][];

  constructor(private size: number = 10) {
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
    console.log(chalk.blueBright('Your Opponents Board (Attack):'));
    console.log('    A  B  C  D  E  F  G  H  I  J');
    console.log('  -------------------------------');
    
    for (let row = 0; row < 10; row++) {
      let rowDisplay = `${row + 1}`.padStart(2, ' ') + '| ';

      for (let col = 0; col < 10; col++) {
        rowDisplay += this.grid[row][col] + ' ';
      }

      console.log(rowDisplay);
    }

    console.log('  -------------------------------');
  }
}
