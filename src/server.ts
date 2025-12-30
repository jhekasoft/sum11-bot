import 'dotenv/config'
import { Bot, Context, Keyboard, SessionFlavor, session } from "grammy"
import { getExplanation, setConfig, Config, ServiceType } from 'sum11'

interface SessionData {
  lastCommand: string
}

type MyContext = Context & SessionFlavor<SessionData>

// TODO: make separated service
async function makeSumResponse(keyword: string, ctx: Context) {
  setConfig({
    type: process.env.SUM_TYPE as ServiceType,
    baseUrl: process.env.SUM_BASE_URL || null
  })
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
      })
    }

    let text = article.text
    if (article.text.length > 4096) {
      text = article.text.substring(0, 4096)
    }

    const markdownReplace = /[_*[\]()~`>#\+\-=|{}.!]/g
    // TODO: fix > 4096 length
    // Expandable quote
    const formattedText = '**>' +
      text.replace(markdownReplace, '\\$&').replace(/\n/g,'\n>') +
      '||'
    await ctx.reply(formattedText, {
      parse_mode: "MarkdownV2",
      reply_markup: { remove_keyboard: true }
    })
  }
}

// Init Telegram bot
const bot = new Bot<MyContext>(process.env.TELEGRAM_BOT_TOKEN)

// Install session middleware, and define the initial session value.
function initial(): SessionData {
  return { lastCommand: null }
}
bot.use(session({ initial }))

bot.command("start", async (ctx) => {
  ctx.reply("Напишіть українське слово.")
})

bot.command("cancel", async (ctx) => {
  ctx.session.lastCommand = null
})

// Reply to any message from bot
bot.on("message:text", async (ctx) => {
  if (!ctx.msg) {
    console.warn("Empty message")
    return
  }

  // Log
  const fromStr = JSON.stringify(ctx.msg.from)
  const logMsg = `Request\n----------------\nFrom:${fromStr}\nText: ${ctx.msg.text}`
  console.log(logMsg)

  return await makeSumResponse(ctx.msg.text, ctx)
})

bot.start()
