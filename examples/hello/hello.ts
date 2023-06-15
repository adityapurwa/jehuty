import {gpt, GptModel} from "../../src/gpt/Gpt";
import * as process from "process";
import {Configuration} from "openai";

(async function () {

    const chat = gpt(
        new Configuration({
            apiKey: process.env.OPENAI_API_KEY
        }), GptModel["gpt-3.5-turbo"])
        .prompts(builder => {
            return builder
                .system("You are a helpful assistant that always greet the user with 'Hello'")
        });

    await chat.run("Hi!")
    console.log(chat.lastResponse()?.choices[0].message)
}())