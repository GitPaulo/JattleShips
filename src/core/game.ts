// Libs
import chalk from 'chalk';

// JattleShips
import {
  countDownMessage,
  pressAnyKey,
  printAttackResultHit,
  printAttackResultMiss,
  printAttackResultSunk,
  printGameOver,
  printJoinCodePretty,
  promptAttackCoordinates,
  promptCopyToClipboard,
  promptForName,
  promptJoinCode,
  promptMainMenu,
  promptNextPlacement,
  promptShipPlacement,
} from '../utils/prompts.js';
import { Player } from './player.js';
import { Initiator } from '../network/initiator.js';
import { Joiner } from '../network/joiner.js';
import { FogBoard } from './fogBoard.js';
import { Board } from './board.js';
import { SHIP_CONFIG } from './ships.js';
import { Config } from '../config';

export enum GameState {
  MENU = 'menu',
  CONNECTING = 'connecting',
  SETUP = 'setup',
  GAME = 'game',
  END = 'end',
}

export class Game {
  private state: GameState = GameState.MENU;
  private webrtc: Initiator | Joiner | null = null;
  private localPlayer: Player | null = null;
  private opponentPlayer: Player | null = null;
  private board: Board | null = null;
  private fogBoard: FogBoard | null = null;
  private gameOverWinner: string | null = null;
  private isMyTurn: boolean = false;

  async start() {
    while (true) {
      switch (this.state) {
        case GameState.MENU:
          await this.handleMenu();
          break;
        case GameState.CONNECTING:
          await this.handleConnecting();
          break;
        case GameState.SETUP:
          await this.handleSetup();
          break;
        case GameState.GAME:
          await this.handleGameLoop();
          break;
        case GameState.END:
          await this.handleEnd();
          break;
      }
    }
  }

  public getLocalPlayer(): Player | null {
    return this.localPlayer;
  }

  public getOpponentPlayer(): Player | null {
    return this.opponentPlayer;
  }

  private async handleMenu() {
    const choice = await promptMainMenu();

    switch (choice) {
      case 'host':
        this.webrtc = new Initiator();
        break;
      case 'join':
        this.webrtc = new Joiner();
        break;
      case 'exit':
        process.exit(0);
    }

    this.state = GameState.CONNECTING;
  }

  private async handleConnecting() {
    if (!this.webrtc) throw new Error('WebRTC instance not initialized.');

    console.clear();
    console.log(chalk.blue('Matchmaking'));

    if (this.webrtc instanceof Initiator) {
      // Prompt user to share offer code
      const offerCode = await this.webrtc.start();
      printJoinCodePretty(offerCode);
      await promptCopyToClipboard(offerCode);

      // Prompt for accept code and accept it
      console.log(chalk.yellow("Enter the opponent's join code:"));
      const { joinCode: answerCode } = await promptJoinCode();
      this.webrtc.accept(answerCode);
    } else {
      // Prompt for user for offer code
      console.log(chalk.yellow('Enter the join code from the host:'));
      const { joinCode: offerCode } = await promptJoinCode();

      // Accept offer code and prompt user to share answer code
      const answerCode = await this.webrtc.start(offerCode);
      printJoinCodePretty(answerCode);
      await promptCopyToClipboard(answerCode);

      // Wait for connection webRTC connection to be established
      console.log(chalk.green('Waiting to connect...'));
      await this.webrtc.awaitConnection();
    }

    // Note: we setup the promise before awaiting input to avoid missing messages
    const opponentInfoPromise =
      this.webrtc.waitForMessage<'playerInfo'>('playerInfo');

    // Prompt player name
    console.clear();
    const { playerName } = await promptForName();
    console.log(chalk.green(`Your name: ${playerName}`));
    this.localPlayer = new Player(playerName);
    this.webrtc.sendMessage({ type: 'playerInfo', name: playerName });

    // Wait for opponent info and setup the game
    const opponentInfo = await opponentInfoPromise;
    this.opponentPlayer = new Player(opponentInfo.name);
    console.log(chalk.blue('Opponent connected:', opponentInfo.name));

    await countDownMessage(
      chalk.green('Setup complete. Starting the game!'),
      3
    );
    this.state = GameState.SETUP;
  }

  private async handleSetup() {
    if (!this.webrtc) throw new Error('Game: WebRTC not initialized.');

    console.clear();
    console.log(chalk.green('Starting the game...'));

    this.board = new Board(Config.boardSize, this);
    this.fogBoard = new FogBoard(Config.boardSize, this);

    const opponentFinishedPromise =
      this.webrtc.waitForMessage<'shipPlacementReady'>('shipPlacementReady');

    for (const ship of SHIP_CONFIG) {
      let isLastPlacement = ship === SHIP_CONFIG[SHIP_CONFIG.length - 1];
      let remainingShipTypeCount = ship.count;

      while (remainingShipTypeCount > 0) {
        console.clear();
        this.board.displayBoard();
        console.log(
          chalk.blueBright(
            `Placing ${ship.name} (${remainingShipTypeCount} remaining)...`
          )
        );

        const { x, y, orientation } = await promptShipPlacement(ship);
        const colIndex = x.charCodeAt(0) - 'A'.charCodeAt(0);
        const rowIndex = y - 1;

        if (!this.board.placeShip(ship, colIndex, rowIndex, orientation))
          continue;
        console.clear();
        console.log(chalk.green(`${ship.name} placed successfully!`));
        this.board.displayBoard();
        remainingShipTypeCount--;

        while (remainingShipTypeCount < ship.count && !isLastPlacement) {
          const action = await promptNextPlacement();
          if (action === 'undo' && this.board.undoLastPlacement()) {
            console.log(chalk.red('Last placement undone.'));
            remainingShipTypeCount++;
          } else {
            break;
          }
        }
      }
    }

    console.log(chalk.blue('All ships placed. Waiting for opponent...'));
    this.webrtc.sendMessage({ type: 'shipPlacementReady' });
    await opponentFinishedPromise;

    this.isMyTurn = this.webrtc instanceof Initiator;
    this.state = GameState.GAME;
  }

  private async handleGameLoop() {
    if (!this.webrtc || !this.board || !this.fogBoard)
      throw new Error('Game not properly initialized.');

    this.gameOverWinner = null;
    this.webrtc.waitForMessage<'gameOver'>('gameOver').then((message) => {
      this.gameOverWinner = message.winner;
    });

    while (this.state === GameState.GAME) {
      console.clear();
      this.board.displayBoard();
      this.fogBoard.displayFogBoard();

      if (this.isMyTurn) {
        await this.handlePlayerTurn();
      } else {
        await this.handleOpponentTurn();
      }

      if (this.checkWinCondition()) break;
    }
  }

  private checkWinCondition(): boolean {
    if (!this.board || !this.fogBoard) return false;

    if (this.board.allShipsSunk()) {
      this.webrtc?.sendMessage({
        type: 'gameOver',
        winner: this.opponentPlayer?.name || 'Unknown',
      });
      // send attack message in case of wait stuck
      this.webrtc?.sendMessage({ type: 'attack', x: 0, y: 0 });
      console.log(chalk.magenta('Game Over! You lost.'));
      this.state = GameState.END;
      return true;
    }

    return false;
  }

  private checkGameOver() {
    if (this.gameOverWinner) {
      console.log(chalk.magenta(`Game Over! ${this.gameOverWinner} wins.`));
      this.state = GameState.END;
    }
  }

  private async handlePlayerTurn() {
    if (!this.webrtc || !this.board || !this.fogBoard) {
      throw new Error('Game not properly initialized.');
    }

    console.log(chalk.yellow('Your turn! Select attack coordinates.'));
    const { x, y } = await promptAttackCoordinates();

    const response = await this.webrtc.sendAndWaitForResponse(
      { type: 'attack', x, y },
      'attackResult'
    );

    const updateType = response.sunk ? 'sunk' : response.hit ? 'hit' : 'miss';
    this.fogBoard.update(response.x, response.y, updateType);

    this.checkGameOver();
    this.isMyTurn = false;
  }

  private async handleOpponentTurn() {
    if (!this.webrtc || !this.board || !this.fogBoard) {
      throw new Error('Game not properly initialized.');
    }

    console.log(chalk.yellow("Waiting for opponent's move..."));

    const opponentAttack = await this.webrtc.waitForMessage<'attack'>('attack');
    const hitResult = this.board?.processAttack(
      opponentAttack.x,
      opponentAttack.y
    ) ?? {
      hit: false,
      sunk: false,
    };

    this.webrtc.sendMessage({
      type: 'attackResult',
      x: opponentAttack.x,
      y: opponentAttack.y,
      hit: hitResult.hit,
      sunk: hitResult.sunk,
    });

    const resultType = hitResult.sunk ? 'sunk' : hitResult.hit ? 'hit' : 'miss';
    console.clear();
    this.board.displayBoard();
    switch (resultType) {
      case 'hit':
        await printAttackResultHit(opponentAttack);
        break;
      case 'sunk':
        await printAttackResultSunk(opponentAttack);
        break;
      case 'miss':
        await printAttackResultMiss(opponentAttack);
        break;
    }

    if (this.board?.allShipsSunk()) {
      this.gameOverWinner = this.opponentPlayer?.name || 'Unknown';
      this.webrtc.sendMessage({
        type: 'gameOver',
        winner: this.gameOverWinner,
      });
      this.state = GameState.END;
      return;
    }

    this.checkGameOver();
    this.isMyTurn = true;
  }

  private async handleEnd() {
    console.clear();
    printGameOver(this.gameOverWinner || 'Unknown');
    console.log(chalk.blueBright('Thank you for playing JattleShips!'));

    await pressAnyKey('Press ENTER key to return to menu...');
    console.clear();

    this.state = GameState.MENU;
  }
}
