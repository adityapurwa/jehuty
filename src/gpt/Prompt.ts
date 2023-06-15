import {ChatCompletionRequestMessage, ChatCompletionResponseMessage} from "openai";

/**
 * A builder for creating a prompt for GPT. You won't need to use this directly.
 */
export class GptPromptBuilder {
    private chatPrompts: ChatCompletionResponseMessage[] = [];

    /**
     * Adds a system prompt to the chat. This should be the first prompt.
     * @param prompt
     */
    system(prompt: string) {
        if (this.chatPrompts.length > 0) {
            throw new Error("System prompt must be first prompt");
        }
        this.add({
            role: "system",
            content: prompt
        });
        return this;
    }

    /**
     * Adds a user prompt to the chat. Typically, you want to pass the last user prompt using the `run` method
     * of the Gpt class.
     * @param prompt
     */
    user(prompt: string) {
        this.add({
            role: "user",
            content: prompt
        });
        return this;
    }

    /**
     * Adds an assistant prompt to the chat. You might want to use this to provide few-shots example.
     * @param prompt
     */
    assistant(prompt: string) {
        this.add({
            role: "assistant",
            content: prompt
        });
        return this;
    }

    /**
     * Adds a prompt to the chat.
     * @param prompt
     */
    add(prompt: ChatCompletionRequestMessage | ChatCompletionRequestMessage[]) {
        if (Array.isArray(prompt)) {
            this.chatPrompts.push(...prompt);
        } else {
            this.chatPrompts.push(prompt);
        }
        return this;
    }

    /**
     * Clears all the prompts
     */
    clear() {
        this.chatPrompts = [];
        return this;
    }

    /**
     * Restarts the chat. This will clear all the prompt except the first system prompt.
     * @param additionalSystemPrompt An additional system prompt to add to the chat. This will be appended
     * as a single system prompt instead of multiple system prompts.
     */
    restart(additionalSystemPrompt?: string) {
        const system = this.chatPrompts[0];
        this.chatPrompts = [];
        if (additionalSystemPrompt) {
            this.system(`${system.content}\r\n${additionalSystemPrompt}`);
        }
        return this;
    }

    /**
     * Builds the prompt. Used internally by the Gpt class.
     */
    build() {
        return this.chatPrompts;
    }
}

