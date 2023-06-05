import 'dotenv/config';
import { Bot, CommandContext, Context, InlineKeyboard, Keyboard, SessionFlavor, session } from "grammy";
import { Configuration, OpenAIApi } from "openai";
import { getExplanation } from './ukrdict-parser';

interface SessionData {
  lastCommand: string;
}

type MyContext = Context & SessionFlavor<SessionData>;

// TODO: make separated service
async function makeSumResponse(keyword: string, ctx: Context) {
  const articleText = await getExplanation(keyword);
  if (articleText && Array.isArray(articleText)) {
    const keyboard = new Keyboard()
      .placeholder("Можливо, ви шукали:")
      .oneTime()
    for (const i in articleText) {
      keyboard.text(articleText[i]).row()
    }
    await ctx.reply("Слово не знайдено. Але є варіанти.", {
      reply_markup: keyboard
    });
  } else if (typeof articleText == "string") {
    await ctx.reply(articleText);
    await ctx.reply(`[Посилання](http://sum.in.ua/?swrd=${keyword})`, {
      disable_web_page_preview: true,
      parse_mode: "MarkdownV2"
    });
  }
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
  { command: "sum", description: "Тлумачення з СУМ-11" },
  { command: "cancel", description: "Скинути останню команду і продовжити спілкуватися з ботом." },
]);

bot.command("sum", async (ctx) => {
  if (!ctx.match) {
    ctx.session.lastCommand = "sum"
    return await ctx.reply("Напишіть українське слово")
  }
  await makeSumResponse(ctx.match, ctx)
});

bot.command("cancel", async (ctx) => {
  ctx.session.lastCommand = null
});

// Reply to any message with OpenAI message
bot.on("message:text", async (ctx) => {
  switch (ctx.session.lastCommand) {
    case "sum":
      return await makeSumResponse(ctx.msg.text, ctx)
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
