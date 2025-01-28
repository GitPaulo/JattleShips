export class Player {
  public board: number[][];
  public fogOfWar: number[][];

  constructor() {
    this.board = Array(10).fill(0).map(() => Array(10).fill(0)); // 10x10 board
    this.fogOfWar = Array(10).fill(0).map(() => Array(10).fill(0)); // Hidden opponent's board
  }

  // TODO: Implement player
}
