import chalk from "chalk";
import { promptMainMenu } from "./utils/prompts.ts";

async function main() {
  console.clear();
  console.log(chalk.blueBright("JattleShips!"));

  const choice = await promptMainMenu();
  if (choice === "host") {
    console.log(chalk.green("You chose to host a game."));
    // TODO
  } else if (choice === "join") {
    console.log(chalk.green("You chose to join a game."));
    // TODO
  } else {
    console.log(chalk.red("Exiting game. Goodbye!"));
  }
}

main().catch((err) => {
  console.error(chalk.red("An error occurred:"), err);
});
