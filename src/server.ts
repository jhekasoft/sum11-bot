import 'dotenv/config';
import { Bot, Context, InlineKeyboard, Keyboard, SessionFlavor, session } from "grammy";
import { getExplanation } from './ukr-dict-parser';

interface SessionData {
  lastCommand: string;
}

type MyContext = Context & SessionFlavor<SessionData>;

// TODO: make separated service
async function makeSumResponse(keyword: string, ctx: Context) {
  const article = await getExplanation(keyword);
  if (article && article.alternatives) {
    const keyboard = new Keyboard()
      .placeholder("Можливо, ви шукали:")
      .oneTime()
    for (const i in article.alternatives) {
      keyboard.text(article.alternatives[i]).row()
    }
    await ctx.reply("Слово не знайдено. Але є варіанти.", {
      reply_markup: keyboard
    });
  } else if (article.text) {
    if (article.title) {
      await ctx.reply(`*${article.title}*`, {
        parse_mode: "Markdown"
      });
    }

    let text = article.text
    if (article.text.length > 4096) {
      text = article.text.substring(0, 4096)
    }
    // const textTmp = "*СКРА́КЛІ* (скрАклі), ів, _мн._\n\n" +
    //   "1. Українська народна спортивна " +
    //   "гра, яка полягає в тому, що гравці вибивають палкою з " +
    //   "відведеного місця невеликі циліндричні цурпалки. _На одному з малюнків Суворова зображено під час гри " +
    //   "в скраклі з селянськими дітьми (Життя і творчість Т. Г. Шевченка, 1959, 40); Хлопчики, що полюбляють влучність, " +
    //   "грають у скраклі (Петро Панч, В дорозі, 1959, 270); Дуже " +
    //   "корисні легке веслування, гра у скраклі, крокет, теніс, " +
    //   "бадмінтон (Робітнича газета, 7.IV 1973, 4)_.\n\n" +
    //   "2. _заст._ Кріплення у дерев'яному плузі, в яке встромляють дишло. _Як дійшла екскурсія до дерев'яних плугів — тут учені туди-сюди — розгубилися.. Пастух " +
    //   "і дав відповідь професорові: — Оце, — каже, — " +
    //   "скраклі... (Костянтин Гордієнко, Дівчина.., 1954, 301)_.\n"
    // text = "СКРА́КЛІ";
    const keyboard = new InlineKeyboard()
      .url("Посилання", `http://sum.in.ua/?swrd=${keyword}`)
    await ctx.reply(text, {
      // parse_mode: "Markdown",
      reply_markup: keyboard
    });
    // await ctx.reply(`[Посилання](http://sum.in.ua/?swrd=${keyword})`, {
    //   disable_web_page_preview: true,
    //   parse_mode: "MarkdownV2"
    // });
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
