# Jehuty

> Fluent API for Chat Based GPT Model

![jehuty](https://github.com/adityapurwa/jehuty/assets/6219895/15ce8b91-bd3e-464e-90d2-fa3c62ea2e6b)


## Introduction

Jehuty is a fluent API for a chat based GPT model. It can only
be used with OpenAI Chat GPT model such as 3.5 or 4.

It supports function calling and middleware

> ⚠️ Jehuty API is still in development. It may change in the future.
> Highly experimental and not recommended for production use.
> Vendoring is recommended.

## Samples

Jehuty can be initialized with a single line of code.

```js
const chat = gpt(new Configuration({ apiKey: "..." }), GptModel["gpt-3.5-turbo"]);
```

You can interact fluently with the `chat` object.

```js
// Middleware allows you to hook into the chat process.
// Almost all of the chat process can be modified with middleware.
// For example, here we are using a middleware to memorize the
// conversation.

chat.middleware(MemorizeMiddleware());

// Preparing the prompt is as easy as calling the `prompts` method.
chat.prompts((builder) => {
  return builder
    .system("You are a helpful assistant")
    .user("Hello, I need help with my computer")
    .assistant("What seems to be the problem?");
});

// Function calls are supported. You can define them with the `functions` method.
chat.functions((builder) => {
  return builder.define(
    {
      name: "tellToRestart",
      description: "Just tell the user to restart the computer",
      parameters: {
        type: "object",
        properties: {},
      },
    },
    () => {
      return Promise.resolve({
        result: "Just restart the computer",
      });
    }
  );
});

// Then execute the chat pipeline with the `run` method
await chat.run("My computer got infected by a rogue AI!");
console.log(chat.lastResponse());
```

## Middleware

Middleware is the core of Jehuty. It allows you to hook into the chat process.
You can implement agent, preformatting, postformatting, and many more with
middleware.

We aim to implements a lot of functionality with middleware. For example,
MemorizeMiddleware is a middleware that memorizes the conversation. We can also
summarize the conversation with SummarizeMiddleware.

We will design the API so that it is easy to implement middleware and that
everything can be done with middleware.

## Contributing

Contributions are welcome. Any idea to make the API easier to use is welcome.
We focus on developer experience and to ensure that the model is safe and
stable enough to use.

Contribution to make it install and package-ready is also welcome. Currently,
you can not install it with `npm` or `yarn` and you have to vendor it manually.

## License

MIT ©️ Aditya Purwa


