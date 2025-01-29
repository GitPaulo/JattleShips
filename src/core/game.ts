// Libs
import chalk from 'chalk';

// JattleShips
import {
  countDownMessage,
  pressAnyKey, printJoinCodePretty,
  promptCopyToClipboard,
  promptForName,
  promptJoinCode,
  promptMainMenu,
  promptNextPlacement,
  promptShipPlacement,
} from '../utils/prompts.ts';
import { Player } from './player.ts';
import { Initiator } from '../network/initiator.ts';
import { Joiner } from '../network/joiner.ts';
import { FogBoard } from './fogBoard.ts';
import { Board } from './board.ts';
import { GameMessage } from '../network/webRTCConnection.js';
import { SHIP_CONFIG } from './ships.js';

export enum GameState {
  MENU = 'menu',
  SETUP = 'setup',
  GAME = 'game',
  END = 'end',
}

export class Game {
  private state: GameState = GameState.MENU;
  private webrtc: Initiator | Joiner | null = null;
  private hostPlayer: Player | null = null;
  private joinPlayer: Player | null = null;
  private Board: Board | null = null;
  private FogBoard: FogBoard | null = null;
  private opponentReady: boolean = false;

  async start() {
    while (true) {
      switch (this.state) {
        case GameState.MENU:
          await this.handleMenu();
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

  private async handleMenu() {
    const choice = await promptMainMenu();
    if (choice === 'host') {
      this.webrtc = new Initiator();
    } else if (choice === 'join') {
      this.webrtc = new Joiner();
    }

    if (this.webrtc) {
      this.webrtc.onMessage(this.handleMessage.bind(this));
    }

    this.state = GameState.SETUP;
  }

  private async handleSetup() {
    console.clear();
    console.log(chalk.blue('Game Setup'));

    if (!this.webrtc) throw new Error('WebRTC instance not initialized.');

    if (this.webrtc instanceof Initiator) {
      const offerCode = await this.webrtc.start();
      printJoinCodePretty(offerCode);
      await promptCopyToClipboard(offerCode);

      console.log(chalk.green('Waiting for answer from the joiner...'));
      const { joinCode: answerCode } = await promptJoinCode();
      this.webrtc.accept(answerCode);
    } else if (this.webrtc instanceof Joiner) {
      console.log(chalk.yellow('Enter the offer code from the initiator:'));
      const { joinCode: offerCode } = await promptJoinCode();

      console.log(
        chalk.yellow('Connecting to initiator and generating answer...')
      );
      const answerCode = await this.webrtc.start(offerCode);
      printJoinCodePretty(answerCode);
      await promptCopyToClipboard(answerCode);

      console.log(chalk.green('Waiting to connect to the initiator...'));
      await this.webrtc.awaitConnection();
    }

    // Set up the listener BEFORE prompting for a name
    // The webRTC message will be queued by event loop
    let opponentName: string | null = null;
    const opponentNamePromise = new Promise<void>((resolve) => {
      this.webrtc?.onMessage((message) => {
        if (message.type === 'playerInfo') {
          this.joinPlayer = new Player(message.name);
          opponentName = message.name;
          resolve();
        }
      });
    });

    console.clear();
    const { playerName } = await promptForName();
    console.log(chalk.green(`Your name: ${playerName}`));
    this.hostPlayer = new Player(playerName);

    this.webrtc.sendMessage({ type: 'playerInfo', name: playerName });
    console.log(chalk.blue('Waiting for opponent to be ready...'));
    await opponentNamePromise;

    await countDownMessage(chalk.green('Setup complete. Starting the game!'), 3);
    this.state = GameState.GAME;
  }

  private async handleGameLoop() {
    if (!this.webrtc) throw new Error('Game: WebRTC not initialized.');

    console.clear();
    console.log(chalk.green('Starting the game...'));

    this.Board = new Board();
    this.FogBoard = new FogBoard();

    for (const ship of SHIP_CONFIG) {
      let remainingShips = ship.count; // Track how many of this type are left

      while (remainingShips > 0) {
        console.clear();
        this.Board.displayBoard();

        console.log(
          chalk.blueBright(
            `Placing ${ship.name} (${remainingShips} remaining)...`
          )
        );

        const { x, y, orientation } = await promptShipPlacement(ship);
        const colIndex = x.charCodeAt(0) - 'A'.charCodeAt(0);
        const rowIndex = y - 1;

        if (this.Board.placeShip(ship, colIndex, rowIndex, orientation)) {
          console.log(chalk.green(`${ship.name} placed successfully!`));
          remainingShips--;

          // **Prompt to continue or undo**
          let undoing = true;
          while (undoing) {
            const action = await promptNextPlacement();

            if (action === 'undo') {
              if (this.Board.undoLastPlacement()) {
                console.log(chalk.red('Last placement undone.'));
                remainingShips++; // Restore ship count
              } else {
                console.log(chalk.yellow('No more ships to undo.'));
              }
            } else {
              undoing = false; // Continue placing next ship
            }
          }
        } else {
          console.log(chalk.red(`Invalid placement. Try again.`));
        }
      }
    }

    console.log(chalk.blue('All ships placed. Waiting for opponent...'));
    this.webrtc.sendMessage({ type: 'shipPlacementReady' });

    await new Promise<void>((resolve) => {
      this.webrtc?.onMessage((message) => {
        if (message.type === 'shipPlacementReady') {
          console.log(chalk.green('Opponent is ready! Starting attack phase.'));
          resolve();
        }
      });
    });

    console.log(chalk.green('Game begins!'));
  }

  private async handleEnd() {
    console.clear();
    console.log(chalk.green('Game Over!'));
    console.log(chalk.blueBright('Thank you for playing JattleShips.'));

    await pressAnyKey('Press ENTER key to return to menu...');

    this.state = GameState.MENU;
  }

  private handleMessage(message: GameMessage) {
    switch (message.type) {
      case 'playerInfo':
        this.joinPlayer = new Player(message.name);
        break;

      case 'shipPlacementReady':
        this.opponentReady = true;
        break;

      case 'attack':
        console.log(
          chalk.red(`Opponent attacked: (${message.x}, ${message.y})`)
        );
        // TODO: Handle attack logic
        break;

      case 'attackResult':
        console.log(chalk.red(`Attack result: (${message.x}, ${message.y})`));
        // TODO: Handle attack result logic;
        break;
      case 'gameOver':
        console.log(chalk.magenta(`Game Over! ${message.winner} wins.`));
        // TODO: Handle game over logic
        this.state = GameState.END;
        break;

      default:
        console.log(chalk.yellow('Received unknown message type:'), message);
    }
  }
}
