import 'dotenv/config';
import { Bot, Context, Keyboard, SessionFlavor, session } from "grammy";
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

// bot.api.setMyCommands([
//   // { command: "start", description: "Start the bot" },
//   { command: "sum", description: "Тлумачення з СУМ-11" },
//   { command: "cancel", description: "Скинути останню команду і продовжити спілкуватися з ботом." },
// ]);

bot.command("start", async (ctx) => {
  ctx.reply("Напишіть українське слово.")
});

bot.command("cancel", async (ctx) => {
  ctx.session.lastCommand = null
});

// Reply to any message with OpenAI message
bot.on("message:text", async (ctx) => {
  return await makeSumResponse(ctx.msg.text, ctx)
});

bot.start();
