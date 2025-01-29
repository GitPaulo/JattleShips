export type GameMessage =
  | { type: 'playerInfo'; name: string }
  | { type: 'shipPlacement'; ships: number[][] } // 2D array of ship positions
  | { type: 'attack'; x: number; y: number }
  | { type: 'attackResult'; x: number; y: number; hit: boolean; sunk?: boolean }
  | { type: 'gameOver'; winner: string };

export interface WebRTCConnection {
  sendMessage(message: GameMessage): void;
  onMessage(callback: (message: GameMessage) => void): void;
}
