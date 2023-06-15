import {ChatCompletionFunctions} from "openai/api";
import {ChatCompletionRequestMessage, CreateCompletionRequestPrompt} from "openai";

/**
 * Schema to describe a property of a parameter.
 */
export interface PropertySchema {
    type: "string" | "number" | "boolean" | "object" | "array" | "null";
    description?: string;
}

/**
 * Schema to describe a parameter.
 */
export interface ParameterSchema {
    type: "object"
    properties: Record<string, PropertySchema>
}

/**
 * Schema to describe a function.
 */
export interface GptFunctionDefinition extends ChatCompletionFunctions {
    parameters: ParameterSchema
}

/**
 * The result of a function. Adding additional prompts allows you to slightly adjust how GPT
 * will use the result.
 */
export interface GptFunctionResult<T = any> {
    result: T;
    additionalPrompts?: ChatCompletionRequestMessage[];
}

/**
 * A builder for creating a function for GPT. You won't need to initialize this manually.
 */
export class GptFunctionBuilder {
    private definitions: GptFunctionDefinition[] = [];
    private handlers: Record<string, Function> = {}

    /**
     * Defines a function for GPT.
     * @param definition the definition of the function
     * @param handler the handler of the function
     */
    define(definition: GptFunctionDefinition, handler: () => Promise<GptFunctionResult>) {
        this.definitions.push(definition);
        this.handlers[definition.name] = handler;
        return this;
    }

    /**
     * Builds the function, called internally by the Gpt class.
     */
    build() {
        return this.definitions;
    }

    /**
     * Handles a function call, called internally by the Gpt class.
     * @param name
     * @param args
     */
    handle(name: string, ...args: any[]): Promise<GptFunctionResult> {
        return this.handlers[name](...args);
    }
}
