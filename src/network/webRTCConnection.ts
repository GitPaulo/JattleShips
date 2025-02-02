export type GameMessage =
  | { type: 'playerInfo'; name: string }
  | { type: 'shipPlacementReady' }
  | { type: 'attack'; x: number; y: number }
  | {
      type: 'attackResult';
      x: number;
      y: number;
      hit: boolean;
      sunk?: boolean;
      sunkPositions?: { x: number; y: number }[];
    }
  | { type: 'gameOver'; winner: string };

export type MessageType = GameMessage['type'];
export type MessagePayload<T extends MessageType> = Extract<
  GameMessage,
  { type: T }
>;
export type ResponseHandler<T> = (response: T) => void;

export interface WebRTCConnection {
  sendMessage(message: GameMessage): void;
  waitForMessage<T extends MessageType>(type: T): Promise<MessagePayload<T>>;
  sendAndWaitForResponse<T extends MessageType>(
    message: GameMessage,
    responseType: T
  ): Promise<MessagePayload<T>>;
}
