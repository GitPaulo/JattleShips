import chalk from 'chalk';
import { ShipType } from './ships.js';

type Cell = '🌊' | '❌' | '✔️' | '💀' | string; // The string represents a ship ID

type PlacedShip = {
  id: number; // Equivalent to the index in placedShips array
  ship: ShipType;
  positions: { x: number; y: number }[];
};

export class Board {
  private grid: Cell[][] = [];
  private placedShips: PlacedShip[] = []; // Stores ships in placement order

  constructor() {
    // Initialize 10x10 grid with water (🌊)
    this.grid = Array.from({ length: 10 }, () => Array(10).fill('🌊'));
  }

  public displayBoard() {
    console.clear(); // Clear screen for clean board updates
    console.log(chalk.blueBright('Your Board:'));
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

  public placeShip(
    ship: ShipType,
    x: number,
    y: number,
    orientation: 'horizontal' | 'vertical'
  ): boolean {
    if (!this.isPlacementValid(ship, x, y, orientation)) {
      return false; // Invalid placement
    }

    const shipId = this.placedShips.length; // Assign a unique ID based on placement order
    const positions: { x: number; y: number }[] = [];

    // Place the ship
    for (let i = 0; i < ship.length; i++) {
      const row = orientation === 'horizontal' ? y : y + i;
      const col = orientation === 'horizontal' ? x + i : x;
      this.grid[row][col] = ship.displayChar; // Store ship's display character
      positions.push({ x: col, y: row });
    }

    // Store the ship placement
    this.placedShips.push({ id: shipId, ship, positions });

    this.displayBoard(); // Show updated board after placement
    return true;
  }

  public undoLastPlacement(): boolean {
    if (this.placedShips.length === 0) return false; // No placements to undo

    const lastShip = this.placedShips.pop(); // Remove last placed ship
    if (!lastShip) return false;

    // Remove the ship from the grid
    for (const pos of lastShip.positions) {
      this.grid[pos.y][pos.x] = '🌊'; // Reset to ocean
    }

    this.displayBoard(); // Show updated board after undo
    return true;
  }

  private isPlacementValid(
    ship: ShipType,
    x: number,
    y: number,
    orientation: 'horizontal' | 'vertical'
  ): boolean {
    for (let i = 0; i < ship.length; i++) {
      const row = orientation === 'horizontal' ? y : y + i;
      const col = orientation === 'horizontal' ? x + i : x;

      // Check if out of bounds
      if (row >= 10 || col >= 10) {
        return false;
      }

      // Check for overlap
      if (this.grid[row][col] !== '🌊') {
        return false;
      }
    }
    return true;
  }
}
