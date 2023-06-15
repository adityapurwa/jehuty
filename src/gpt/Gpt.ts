import { Configuration, CreateChatCompletionRequest, CreateChatCompletionResponse, OpenAIApi } from "openai";
import { GptPromptBuilder } from "./Prompt";
import { GptMiddleware } from "./middlewares/Middleware";
import { GptFunctionBuilder } from "./Function";

/**
 * List of available GPT models. Subject to change.
 */
export enum GptModel {
  "gpt-4" = "gpt-4",
  "gpt-4-0613" = "gpt-4-0613",
  "gpt-4-32k" = "gpt-4-32k",
  "gpt-4-32k-0613" = "gpt-4-32k-0613",
  "gpt-3.5-turbo" = "gpt-3.5-turbo",
  "gpt-3.5-turbo-16k" = "gpt-3.5-turbo-16k",
  "gpt-3.5-turbo-0613" = "gpt-3.5-turbo-0613",
  "gpt-3.5-turbo-16k-0613" = "gpt-3.5-turbo-16k-0613",
}

/**
 * GPT is the main class that you will use to interact with the OpenAI API.
 */
export class Gpt {
  private oai: OpenAIApi;
  private promptBuilder: GptPromptBuilder = new GptPromptBuilder();
  private functionBuilder: GptFunctionBuilder = new GptFunctionBuilder();
  private responses: CreateChatCompletionResponse[] = [];

  private middlewares = new Array<GptMiddleware>();

  /**
   * Create a new GPT instance. It is recommended to use the gpt() function instead.
   * @param config
   * @param model
   */
  constructor(private config: Configuration, private model: GptModel | string) {
    this.oai = new OpenAIApi(config);
  }

  /**
   * Create a new GPT instance using the same configuration as the current instance. Useful for branching.
   */
  public clone() {
    return gpt(this.config, this.model);
  }

  /**
   * Add middleware to the GPT instance.
   * @param middleware
   */
  middleware(middleware: GptMiddleware) {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Initialize the base prompt for the model.
   * @param fn
   */
  prompts(fn: (builder: GptPromptBuilder) => GptPromptBuilder) {
    fn(this.promptBuilder);
    return this;
  }

  /**
   * Prepare functions that can be used by the model.
   * @param fn
   */
  functions(fn: (builder: GptFunctionBuilder) => GptFunctionBuilder) {
    fn(this.functionBuilder);
    return this;
  }

  /**
   * Run the GPT model with the given user prompt.
   * @param userPrompt The prompt to send to the model.
   * @param config Additional configuration for the request.
   */
  async run(userPrompt?: string, config?: Omit<CreateChatCompletionRequest, "model" | "messages">) {
    for (const middleware of this.middlewares) {
      if (middleware.preRun) {
        await middleware.preRun(this, userPrompt);
      }
    }
    for (const middleware of this.middlewares) {
      if (middleware.prompt) {
        await middleware.prompt(this.promptBuilder);
      }
    }
    try {
      const request: CreateChatCompletionRequest = {
        ...config,
        model: this.model,
        messages: [
          ...this.promptBuilder.build(),
          {
            role: "user",
            content: userPrompt,
          },
        ],
      };
      // Check to prevent sending functions params on a GPT model that doesn't support it
      const functionDefinitions = this.functionBuilder.build();
      if (functionDefinitions.length > 0) {
        request.functions = functionDefinitions;
      }
      for (const middleware of this.middlewares) {
        if (middleware.preRequest) {
          await middleware.preRequest(this, request);
        }
      }
      const response = await this.oai.createChatCompletion(request);
      for (const middleware of this.middlewares) {
        if (middleware.postRequest) {
          await middleware.postRequest(this, response.data);
        }
      }

      this.responses.push(response.data);

      if (response.data.choices[0].finish_reason === "function_call") {
        const fnName = response.data.choices[0]?.message?.function_call?.name;
        // Note that GPT always require a params argument, even if it's empty
        const fnArgs = response.data.choices[0]?.message?.function_call?.arguments;
        if (fnName && fnArgs) {
          const fnArgsAsObject = JSON.parse(fnArgs);

          const { result, additionalPrompts } = await this.functionBuilder.handle(fnName, fnArgsAsObject);

          if (result) {
            const fnRequest: CreateChatCompletionRequest = {
              ...config,
              model: this.model,
              messages: [
                ...this.promptBuilder.build(),
                {
                  role: "user",
                  content: userPrompt,
                },
                {
                  role: response.data.choices[0]!.message!.role,
                  content: response.data.choices[0]!.message!.role,
                  function_call: response.data.choices[0]!.message!.function_call,
                },
                {
                  role: "function",
                  content: JSON.stringify({
                    result: result,
                  }),
                  name: fnName,
                },
                ...(additionalPrompts ?? []),
              ],
              functions: this.functionBuilder.build(),
            };
            for (const middleware of this.middlewares) {
              if (middleware.preRequest) {
                await middleware.preRequest(this, fnRequest);
              }
            }
            const fnResponse = await this.oai.createChatCompletion(fnRequest);
            for (const middleware of this.middlewares) {
              if (middleware.postRequest) {
                await middleware.postRequest(this, fnResponse.data);
              }
            }
            this.responses.push(fnResponse.data);
          }
        }
      }

      for (const middleware of this.middlewares) {
        if (middleware.postRun) {
          await middleware.postRun(this, this.responses);
        }
      }
    } catch (e: any) {
      // TODO: Add a better error handling
      throw e;
    }

    return this;
  }

  /**
   * Get the last response from the model.
   */
  lastResponse() {
    if (this.responses.length === 0) {
      return null;
    }
    return this.responses[this.responses.length - 1];
  }

  /**
   * Get all responses from the model.
   */
  allResponses() {
    return [...this.responses];
  }

  /**
   * Get all prompts that will be sent to the model.
   */
  allPrompts() {
    return this.promptBuilder.build();
  }
}

/**
 * Create a new GPT instance.
 * @param config
 * @param model
 */
export function gpt(config: Configuration, model: GptModel | string) {
  return new Gpt(config, model);
}
