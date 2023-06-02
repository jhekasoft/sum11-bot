import 'dotenv/config';
import { Bot, Context, SessionFlavor, session } from "grammy";
import { Configuration, OpenAIApi } from "openai";
import { getArticle } from './ukrdict-parser';

interface SessionData {
  lastCommand: string;
}

type MyContext = Context & SessionFlavor<SessionData>;

// TODO: make separated service
async function getSumLink(keyword: string) {
  const articleText = await getArticle(keyword);
  return `${articleText}\nhttp://sum.in.ua/?swrd=${keyword}`;
}

// Init Telegram bot
const bot = new Bot<MyContext>(process.env.TELEGRAM_BOT_TOKEN);

// Install session middleware, and define the initial session value.
function initial(): SessionData {
  return { lastCommand: null };
}
bot.use(session({ initial }));

// Init OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

bot.api.setMyCommands([
  // { command: "start", description: "Start the bot" },
  { command: "sum", description: "Посилання на СУМ-11" },
  { command: "cancel", description: "Скинути останню команду і продовжити спілкуватися з ботом." },
]);

bot.command("sum", async (ctx) => {
  if (!ctx.match) {
    ctx.session.lastCommand = "sum"
    return await ctx.reply("Напишіть українське слово")
  }
  await ctx.reply(await getSumLink(ctx.match))
});

bot.command("cancel", async (ctx) => {
  ctx.session.lastCommand = null
});

// Reply to any message with OpenAI message
bot.on("message:text", async (ctx) => {
  switch (ctx.session.lastCommand) {
    case "sum":
      return await ctx.reply(await getSumLink(ctx.msg.text))
  }

  // Without command
  // TODO: add error checking
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{role: "user", content: ctx.msg.text}],
  });
  const replyMessage = completion.data.choices[0].message.content;
  await ctx.reply(replyMessage)
});

bot.start();
