export type ShipType = {
  displayChar: string; // Display character
  name: string; // Human-readable name
  length: number; // Ship size
  count: number; // Number of ships of this type per player
};

export const SHIP_CONFIG: ShipType[] = [
  { displayChar: '⬛', name: 'Carrier', length: 5, count: 1 },
  { displayChar: '🟪', name: 'Battleship', length: 4, count: 1 },
  { displayChar: '🟧', name: 'Cruiser', length: 3, count: 1 },
  { displayChar: '🟨', name: 'Submarine', length: 2, count: 1 },
  { displayChar: '⬜', name: 'Destroyer', length: 1, count: 1 },
];

/**
 export const SHIP_CONFIG: ShipType[] = [
 { displayChar: '⬛', name: 'Carrier', length: 5, count: 1 },
 { displayChar: '🟪', name: 'Battleship', length: 4, count: 2 },
 { displayChar: '🟧', name: 'Cruiser', length: 3, count: 2 },
 { displayChar: '🟨', name: 'Submarine', length: 2, count: 2 },
 { displayChar: '⬜', name: 'Destroyer', length: 1, count: 3 },
 ];
 */
