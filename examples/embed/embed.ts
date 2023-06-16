import { gpt, GptModel } from "../../src/gpt/Gpt";
import * as process from "process";
import { Configuration, OpenAIApi } from "openai";
import { GptFunctionResult } from "../../src/gpt/Function";

const data = require("./the-cow.json");

function similarity(A: number[], B: number[]) {
  let dotproduct = 0;
  let mA = 0;
  let mB = 0;

  for (let i = 0; i < A.length; i++) {
    dotproduct += A[i] * B[i];
    mA += A[i] * A[i];
    mB += B[i] * B[i];
  }

  mA = Math.sqrt(mA);
  mB = Math.sqrt(mB);
  return dotproduct / (mA * mB);
}

async function getRevelantData(text: string | string[]) {
  const api = new OpenAIApi(
    new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    })
  );
  const res = await api.createEmbedding({
    model: "text-embedding-ada-002",
    input: text,
  });
  const embeddings = res.data.data;
  const distanceData = [];

  for (const embedding of embeddings) {
    for (const verse of data.verses) {
      distanceData.push({
        verse,
        distance: similarity(embedding.embedding, verse.translation_embedding.embedding),
      });
    }
  }
  return distanceData.sort((a, b) => b.distance - a.distance).slice(0, 2);
}

(async function () {
  const chat = gpt(
    new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    }),
    GptModel["gpt-4-0613"]
  )
    .prompts((builder) => {
      return builder.system(
        "You are a helpful assistant that help user answer questions based on the quran embedding function. " +
          "You may split the user queries into a proper text that might be " +
          "useful for embedded search function"
      );
    })
    .functions((builder) => {
      return builder.define(
        {
          name: "getQuranEmbedding",
          description: "Get the embedding of a quran verse",
          parameters: {
            type: "object",
            properties: {
              text: {
                type: "array",
                description:
                  "The user query as an array of string that are better for embedded search",
                items: {
                  type: "string",
                },
              },
            },
          },
        },
        async ({ text }: { text: string[] }) => {
          const relevants = await getRevelantData(text);
          return {
            result: relevants.map((n) => ({
              verseId: n.verse.id,
              verse: n.verse.translation,
            })),
          } as GptFunctionResult;
        }
      );
    });

  await chat.run("what does it says about debt and usury?");
})();
