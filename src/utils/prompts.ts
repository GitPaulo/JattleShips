import prompts from "prompts";

export async function promptMainMenu(): Promise<string> {
  const response = await prompts({
    type: "select",
    name: "action",
    message: "What would you like to do?",
    choices: [
      { title: "Host a Game", value: "host" },
      { title: "Join a Game", value: "join" },
      { title: "Exit", value: "exit" },
    ],
  });

  return response.action;
}
