// Libs
import chalk from 'chalk';

// JattleShips
import {
  pressAnyKey,
  promptCopyToClipboard,
  promptForName,
  promptJoinCode,
  promptMainMenu,
} from '../utils/prompts.ts';
import { Player } from './player.ts';
import { Initiator } from '../network/initiator.ts';
import { Joiner } from '../network/joiner.ts';
import { FogBoard } from './fogBoard.ts';
import { Board } from './board.ts';
import { GameMessage } from '../network/webRTCConnection.js';

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
    console.log(chalk.blue('Setting up the game...'));

    if (!this.webrtc) throw new Error('WebRTC instance not initialized.');

    if (this.webrtc instanceof Initiator) {
      console.log(chalk.blue('Generating offer...'));
      const offerCode = await this.webrtc.start();
      console.log(chalk.blueBright('Share this offer code with the joiner:'));
      console.log(chalk.yellow(offerCode));
      await promptCopyToClipboard(offerCode);

      console.log(chalk.green('Waiting for answer from the joiner...'));
      const { joinCode: answerCode } = await promptJoinCode();
      this.webrtc.accept(answerCode);

      console.log(chalk.green('Joiner connected!'));
    } else if (this.webrtc instanceof Joiner) {
      console.log(chalk.yellow('Enter the offer code from the initiator:'));
      const { joinCode: offerCode } = await promptJoinCode();

      console.log(
        chalk.yellow('Connecting to initiator and generating answer...')
      );
      const answerCode = await this.webrtc.start(offerCode);
      console.log(
        chalk.blueBright('Share this answer code with the initiator:')
      );
      console.log(chalk.yellow(answerCode));
      await promptCopyToClipboard(answerCode);

      console.log(chalk.green('Waiting to connect to the initiator...'));
      await this.webrtc.awaitConnection();
      console.log(chalk.green('Initiator connected!'));
    }

    const { playerName } = await promptForName();
    console.log(chalk.green(`Your name: ${playerName}`));

    this.hostPlayer = new Player(playerName);
    this.joinPlayer = new Player('');

    const opponentNamePromise = new Promise<void>((resolve) => {
      this.webrtc?.onMessage((message) => {
        if (message.type === 'playerInfo') {
          console.log(chalk.blueBright(`Opponent's name: ${message.name}`));
          this.joinPlayer = new Player(message.name);
          resolve();
        }
      });
    });
    // Send your name AFTER setting up the listener
    this.webrtc.sendMessage({ type: 'playerInfo', name: playerName });
    await opponentNamePromise;

    console.log(chalk.green('Setup complete. Starting the game!'));
    this.state = GameState.GAME;
  }

  private async handleGameLoop() {
    if (!this.webrtc) throw new Error('Game: WebRTC not initialized.');

    console.clear();
    console.log(chalk.green('Starting the game...'));

    this.Board = new Board();
    this.FogBoard = new FogBoard();

    // TODO: Game loop logic
    // 1. Ship placement
    // Example of how sending messages now works
    // this.webrtc.sendMessage({ type: 'gameStart', message: 'Game has begun!' });

    // 2. Turn-based gameplay

    // 3. End the game
    this.state = GameState.END;
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
        console.log(chalk.blueBright(`Opponent's name: ${message.name}`));
        this.joinPlayer = new Player(message.name);
        break;

      case 'attack':
        console.log(
          chalk.red(`Opponent attacked: (${message.x}, ${message.y})`)
        );
        // TODO: Handle attack logic
        break;

      case 'attackResult':
        console.log(
          message.hit
            ? chalk.green(
                `Your attack at (${message.x}, ${message.y}) was a HIT!`
              )
            : chalk.red(`Your attack at (${message.x}, ${message.y}) missed.`)
        );
        break;

      case 'gameOver':
        console.log(chalk.magenta(`Game Over! ${message.winner} wins.`));
        this.state = GameState.END;
        break;

      default:
        console.log(chalk.yellow('Received unknown message type:'), message);
    }
  }
}
