import {
  CreateChatCompletionRequest,
  CreateChatCompletionResponse,
} from "openai";
import { Gpt } from "../Gpt";
import { GptPromptBuilder } from "../Prompt";

/**
 * Middleware allows you to hook into the GPT pipeline and modify the context when needed.
 *
 * You can hook into the following events:
 * - preRun: Called before the GPT is run. You can use this to modify the prompt.
 * - postRun: Called after the GPT is run. You can use this to modify the response.
 * - prompt: Called when the prompt is being built. You can use this to modify the prompt, note that
 * it is called after preRun, and it can override any prompt that you wrote.
 * - preRequest: Called before the request is sent to OpenAI. You can use this to modify the request.
 * - postRequest: Called after the request is sent to OpenAI. You can use this to modify the response.
 *
 * It is recommended to implement the GptMiddlewareBuilder interface to make it easier to create
 * middleware that allows you to pass in options.
 */
export interface GptMiddleware {
  /**
   * Called before the GPT is run. You can use this to modify the prompt.
   * @param gpt
   * @param userPrompt
   */
  preRun?: (gpt: Gpt, userPrompt?: string) => Promise<any>;

  /**
   * Called after the GPT is run. You can use this to modify the response.
   * @param gpt
   * @param response
   */
  postRun?: (
    gpt: Gpt,
    response: CreateChatCompletionResponse[]
  ) => Promise<any>;

  /**
   * Called when the prompt is being built. You can use this to modify the prompt
   * @param builder
   */
  prompt?: (builder: GptPromptBuilder) => Promise<any>;

  /**
   * Called before the request is sent to OpenAI. You can use this to modify the request.
   * @param gpt
   * @param request
   */
  preRequest?: (gpt: Gpt, request: CreateChatCompletionRequest) => Promise<any>;

  /**
   * Called after the request is sent to OpenAI. You can use this to modify the response.
   * @param gpt
   * @param response
   */
  postRequest?: (
    gpt: Gpt,
    response: CreateChatCompletionResponse
  ) => Promise<any>;
}

export type GptMiddlewareBuilder<T> = (options: T) => GptMiddleware;
