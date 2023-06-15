import { gpt, GptModel } from "../../src/gpt/Gpt";
import * as process from "process";
import { Configuration } from "openai";
import { MemorizeMiddleware } from "../../src/gpt/middlewares/MemorizeMiddleware";

(async function () {
  // Typically, this will be a session id or user id
  const userId = "1";
  // and you might want to store this in a database
  const userDb: Record<string, any> = {
    [userId]: [],
  };
  const chat = gpt(
    new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    }),
    GptModel["gpt-3.5-turbo"]
  ).prompts((builder) => {
    return builder.system(
      "You are a helpful assistant remembers the user name and always mention it in the conversation."
    );
  });

  // Comment out the following line to see the difference
  chat.middleware(
    MemorizeMiddleware({
      store: async (prompts) => {
        userDb[userId] = prompts;
      },
      load: async () => {
        return userDb[userId];
      },
    })
  );

  await chat.run("Hi, my name is Marinaris!");
  console.log(chat.lastResponse()?.choices[0].message);
  await chat.run("Can you please tell me my name?");
  console.log(chat.lastResponse()?.choices[0].message);
})();
