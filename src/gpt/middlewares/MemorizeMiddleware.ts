import { GptMiddlewareBuilder } from "./Middleware";
import {
  ChatCompletionRequestMessage,
  ChatCompletionResponseMessage,
} from "openai";

/**
 * Options for the MemorizeMiddleware.
 */
export interface MemorizeMiddlewareOptions {
  store: (prompts: ChatCompletionRequestMessage[]) => Promise<void>;
  load: () => Promise<ChatCompletionRequestMessage[]>;
}

/**
 * This middleware will memorize the previous user prompt and GPT response and append it to
 * subsequent prompts.
 *
 * THIS MIDDLEWARE OVERWRITES THE PROMPT, SO IT SHOULD BE THE FIRST MIDDLEWARE IN THE PIPELINE.
 */
export const MemorizeMiddleware: GptMiddlewareBuilder<
  MemorizeMiddlewareOptions
> = (opts) => {
  const memories: ChatCompletionRequestMessage[] = [];
  return {
    prompt: async (builder) => {
      const prompts = await opts.load();
      if (prompts.length > 0) {
        builder.clear().add(prompts);
      } else {
        builder.build().forEach((prompt) => memories.push(prompt));
      }
    },
    preRequest: async (gpt, request) => {
      memories.push(request.messages[request.messages.length - 1]);
    },
    postRequest: async (gpt, response) => {
      for (const choice of response.choices) {
        if (choice.message?.role) {
          memories.push({
            role: choice.message.role,
            content: choice.message.content,
            function_call: choice.message.function_call,
          });
        }
      }
    },
    postRun: async (gpt, response) => {
      await opts.store(memories);
    },
  };
};
