export type GameMessage =
  | { type: 'playerInfo'; name: string } // Starts exchange of names
  | { type: 'shipPlacementReady'; } // Ends ship placement for a player (both send this)
  | { type: 'attack'; x: number; y: number } //  Attack sent
  | { type: 'attackResult'; x: number; y: number; hit: boolean; sunk?: boolean } // Attack feedback
  | { type: 'gameOver'; winner: string }; // Once one player calculates game over it sends this

export interface WebRTCConnection {
  sendMessage(message: GameMessage): void;
  onMessage(callback: (message: GameMessage) => void): void;
}
