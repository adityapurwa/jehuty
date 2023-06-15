import { GptMiddlewareBuilder } from "./Middleware";

/**
 * Options for the SummarizeMiddleware.
 *
 * @property limit The number of prompts to summarize.
 * @property summarizeSystemPrompt The prompt to use when summarizing the conversation.
 * @property summarizeUserPrompt The prompt to use when asking the user to summarize the conversation.
 * @property summarizeRestartPrompt The prompt to use when asking the user to continue the conversation.
 */
export interface SummarizeMiddlewareOptions {
  limit?: number;
  summarizeSystemPrompt?: string;
  summarizeUserPrompt?: string;
  summarizeRestartPrompt?: (summary: string) => string;
}

/**
 * This middleware will summarize the conversation so far and rewrites the prompt so that it uses
 * summary instead of the full conversation. You might want to use this with the `MemorizeMiddleware`.
 *
 * By default, the summarizer will summarize the conversation every 20 prompts. You can change this
 * by passing the `limit` option.
 *
 * @constructor
 * @param opts SummarizeMiddlewareOptions
 */
const SummarizeMiddleware: GptMiddlewareBuilder<SummarizeMiddlewareOptions> = (
  opts = {
    limit: 20,
    summarizeSystemPrompt:
      "You are a helpful assistant that summarize the conversation so far. Keep track of important information in the summary!",
    summarizeUserPrompt: "Summarize the conversation in third-person!",
    summarizeRestartPrompt: (summary) => {
      return `Last Summary: ${summary}\r\n\Given the summary, above please continue the conversation with the user`;
    },
  }
) => ({
  async preRun(gpt, userPrompt?) {
    if (gpt.allPrompts().length > opts.limit) {
      console.log("Summarizing conversation so far");
      const clone = await gpt
        .clone()
        .prompts((builder) => {
          return builder.system(opts.summarizeSystemPrompt).add(gpt.allPrompts());
        })
        .run(opts.summarizeUserPrompt);
      const summary = clone.lastResponse()?.choices[0].message?.content ?? "";
      if (summary.length > 0) {
        gpt.prompts((builder) => {
          return builder.restart().user(opts.summarizeRestartPrompt(summary));
        });
      }
    }
    return Promise.resolve();
  },
});
