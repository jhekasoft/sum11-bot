import 'dotenv/config';
import { Bot } from "grammy";
import { Configuration, OpenAIApi } from "openai";

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

bot.api.setMyCommands([
  // { command: "start", description: "Start the bot" },
  { command: "sum", description: "Посилання на СУМ-11" },
]);

bot.command("sum", (ctx) => {
  if (!ctx.match) {
    return ctx.reply("Додайте українське слово")
  }
  ctx.reply(`http://sum.in.ua/?swrd=${ctx.match}`)
});

// Reply to any message with OpenAI message
bot.on("message:text", async (ctx) => {
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{role: "user", content: ctx.msg.text}],
  });
  const replyMessage = completion.data.choices[0].message.content;
  ctx.reply(replyMessage)
});

bot.start();
