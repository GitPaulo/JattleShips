import chalk from 'chalk';

import { ShipType } from './ships.js';
import { Game } from './game';
import { printBoardFooter, printBoardHeader } from '../utils/prompts';

export type Cell =
  | '🌊' // Ocean (empty water)
  | '❌' // Missed attack
  | '✅' // Hit (ship is damaged but still afloat)
  | '💀' // Sunk ship (entire ship destroyed)
  | '💥' // Received hit (opponent hit a ship on this player's board)
  | '☁️' // Unknown cell (Fog Board only)
  | string; // Ship ID (e.g., 'B1' for Battleship, 'S2' for Submarine)

type PlacedShip = {
  id: number; // Equivalent to the index in placedShips array
  ship: ShipType;
  positions: { x: number; y: number }[];
  hits: number;
  isSunk?: boolean;
};

export class Board {
  private readonly grid: Cell[][] = [];
  private readonly placedShips: PlacedShip[] = []; // Stores ships in placement order
  private size: number;
  private game: Game;

  constructor(size: number, game: Game) {
    this.game = game;
    this.size = size;
    this.grid = Array.from({ length: size }, () => Array(size).fill('🌊'));
  }

  public displayBoard() {
    const localPlayer = this.game.getLocalPlayer();
    console.log(chalk.blueBright(`Your Board (${localPlayer?.name}'s Defense):`));
    printBoardHeader(this.size);

    for (let row = 0; row < this.size; row++) {
      let rowDisplay = `${row + 1}`.padStart(2, ' ') + '| ';

      for (let col = 0; col < this.size; col++) {
        rowDisplay += this.grid[row][col] + ' ';
      }

      console.log(rowDisplay);
    }

    printBoardFooter(this.size);
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

    for (let i = 0; i < ship.length; i++) {
      const row = orientation === 'horizontal' ? y : y + i;
      const col = orientation === 'horizontal' ? x + i : x;

      let symbol = ship.displayChar; // Default to the ship's display character
      if (ship.length === 1) {
        // Single-cell ships use ↔️ (horizontal) or ↕️ (vertical)
        symbol = orientation === 'horizontal' ? '↔️' : '↕️';
      } else if (i === 0) {
        symbol = orientation === 'horizontal' ? '⬅️' : '⬆️'; // Left or Top boundary
      } else if (i === ship.length - 1) {
        symbol = orientation === 'horizontal' ? '➡️' : '⬇️'; // Right or Bottom boundary
      }

      this.grid[row][col] = symbol;
      positions.push({ x: col, y: row });
    }

    this.placedShips.push({ id: shipId, ship, positions, hits: 0 });
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

  private markSunkenShips(): PlacedShip[] {
    const newlySunkShips: PlacedShip[] = [];

    for (const ship of this.placedShips) {
      if (ship.hits === ship.ship.length && !ship.isSunk) {
        ship.isSunk = true;
        // Mark all positions as sunk
        for (const pos of ship.positions) {
          this.grid[pos.y][pos.x] = '💀';
        }
        newlySunkShips.push(ship);
      }
    }

    return newlySunkShips;
  }

  processAttack(
    x: number,
    y: number
  ): { hit: boolean; sunk: boolean; shipId?: string } {
    const cell = this.grid[y][x];

    if (cell === '🌊' || cell === '❌' || cell === '💀') {
      if (cell === '🌊') {
        this.markCell(x, y, '❌');
      }
      return { hit: false, sunk: false };
    }

    // Find the ship at this position using array search
    const shipAtPosition = this.placedShips.find((placed) =>
      placed.positions.some((pos) => pos.x === x && pos.y === y)
    );

    if (shipAtPosition) {
      shipAtPosition.hits++;
      this.markCell(x, y, '💥');

      // Check for any newly sunk ships
      const sunkShips = this.markSunkenShips();

      // If the ship we just hit was sunk, return its ID
      if (sunkShips.includes(shipAtPosition)) {
        return {
          hit: true,
          sunk: true,
          shipId: shipAtPosition.ship.displayChar,
        };
      }

      return { hit: true, sunk: false };
    }

    return { hit: false, sunk: false };
  }

  allShipsSunk(): boolean {
    return this.placedShips.every((ship) => ship.hits === ship.ship.length);
  }

  markCell(x: number, y: number, value: Cell) {
    this.grid[y][x] = value;
  }
}
