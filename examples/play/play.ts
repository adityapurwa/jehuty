import {gpt, GptModel} from "../../src/gpt/Gpt";
import * as process from "process";
import {Configuration} from "openai";
import axios from "axios";
import * as readline from "readline";
import {MemorizeMiddleware} from "../../src/gpt/middlewares/MemorizeMiddleware";

(async function () {

    const userId = "1";
    const userDb:Record<string, any> = {
        [userId]: []
    };
    const chat = gpt(
        new Configuration({
            apiKey: process.env.OPENAI_API_KEY
        }), GptModel["gpt-4-0613"])
        .middleware(
            MemorizeMiddleware({
                store: async (prompts) => {
                    userDb[userId] = prompts;
                },
                load: async () => {
                    return userDb[userId];
                }
            })
        )
        .prompts(builder => {
            return builder.system("You are a helpful assistant that tell the user the current time." +
                "If they don't provide a time, you can ask them their location. Do not call the function until you know their location.")
        })
        .functions(builder => {
            return builder.define({
                name: "getCurrentTime",
                description: "Get the current time",
                parameters: {
                    type: "object",
                    properties: {}
                }
            }, () => {
                return Promise.resolve({
                    result: {
                        hour: new Date().getUTCHours(),
                        minute: new Date().getUTCMinutes()
                    },
                    additionalPrompts: [{
                        role: "user",
                        content: "Convert the UTC time above into user local time"
                    }]
                })
            });
        })

    await chat.run("What time is it?")
    await chat.run("My location is in Berlin")

    console.log(chat.lastResponse()!.choices[0]!.message)



}())