import chalk from 'chalk';
import { promptJoinCode, promptMainMenu } from '../utils/prompts.ts';
import { Player } from './player.ts';
import { Initiator } from '../network/initiator.ts';
import { Joiner } from '../network/joiner.ts';

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
    console.clear();
    console.log(chalk.blueBright('Main Menu'));

    const choice = await promptMainMenu();
    if (choice === 'host') {
      console.log(chalk.green('You chose to host a game.'));
      this.webrtc = new Initiator(this.handleMessage.bind(this));
      this.state = GameState.SETUP;
    } else if (choice === 'join') {
      console.log(chalk.green('You chose to join a game.'));
      this.webrtc = new Joiner(this.handleMessage.bind(this));
      this.state = GameState.SETUP;
    } else {
      console.log(chalk.red('Exiting the game. Goodbye!'));
      process.exit(0);
    }
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

      console.log(chalk.green('Waiting to connect to the initiator...'));
      await this.webrtc.awaitConnection();
    }

    this.hostPlayer = new Player();
    this.joinPlayer = new Player();

    console.log(chalk.green('Setup complete. Starting the game!'));
    this.state = GameState.GAME;
  }

  private async handleGameLoop() {
    console.clear();
    console.log(chalk.green('Starting the game...'));

    // TODO: Game loop logic
    console.log(chalk.yellow('Gameplay logic not implemented yet.'));
    this.state = GameState.END;
  }

  private async handleEnd() {
    console.clear();
    console.log(chalk.green('Game Over!'));
    console.log(chalk.blueBright('Thank you for playing JattleShips.'));
    await new Promise((resolve) =>
      process.stdin.once('data', () => resolve(true))
    );
    this.state = GameState.MENU;
  }

  private handleMessage(message: any) {
    console.log(chalk.yellow('Received message:'), message);
    // TODO: Implement message handling
  }
}
