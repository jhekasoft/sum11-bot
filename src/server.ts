import 'dotenv/config';
import { Bot } from "grammy";
import { Configuration, OpenAIApi } from "openai";

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Reply to any message with OpenAI message
bot.on("message", async (ctx) => {
  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: ctx.update.message.text,
    temperature: 1,
    max_tokens: 1000,
  });
  const replyMessage = completion.data.choices[0].text;
  ctx.reply(replyMessage)
});

bot.start();
