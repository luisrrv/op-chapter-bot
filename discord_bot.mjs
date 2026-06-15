import dotenv from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
import { WebClient } from "@slack/web-api";
import { fetchLastMessageId, storeMessageId } from "./script_requests.js";

dotenv.config();

// --- Config ---

const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CHANNEL_ID = process.env.CHANNEL_ID;
const SLACK_TOKEN = process.env.SLACK_OAUTH_TOKEN;
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID;

const CHAPTER_RELEASE_PATTERN = // TBC server format
  /(?=[\s\S]*one piece\s*-\s*chapter\s+1\d{3})(?=[\s\S]*new one piece chapter released)/i;

const TEST_TRIGGER = "this is a test";

// --- Hype generator ---

const HYPE_MESSAGES = [
  "¡Nuevo capítulo, está bien cabrón!",
  "¡Se prendió esta chingadera con el nuevo capítulo!",
  "¡Nuevo capítulo triple hijuepuuuuta!",
  "¡Oda está intratable, nuevo capítulo malparidooo!",
  "¡Ya fue peee, nuevo capítulo causa!",
  "¡Nuevo capítulo y Oda está cocinando fino pe!",
  "¡Nuevo capítulo, me flipo en colores chaval!",
  "¡Estoy flipando fuerte con el nuevo capítulo!",
  "Nuevo capítulo. Silencio. GODA habló.",
  "Este nuevo capítulo es literalmente peak fiction.",
  "Estamos presenciando historia con este nuevo capítulo.",
  "Oda está jugando ajedrez 5D otra vez.",
  "Estamos viendo a GODA en su prime.",
  "Esto no es manga, es arte.",
  "Nuevo capítulo y el foreshadowing es absurdo.",
  "Oda volvió a cocinar gourmet.",
  "Este nuevo capítulo cambia todo.",
  "Nuevo capítulo… y ustedes dudaban.",
];

const HYPE_EMOJIS = ["🚬", "🔥", "🗿", "🤫"];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateHype() {
  return `${pickRandom(HYPE_MESSAGES)} ${pickRandom(HYPE_EMOJIS)}`;
}

// --- Slack ---

const slack = new WebClient(SLACK_TOKEN);

async function postToSlack(text) {
  try {
    const { ok } = await slack.chat.postMessage({
      channel: SLACK_CHANNEL_ID,
      text,
    });
    console.log(ok ? "[slack] Message sent." : "[slack] Message not sent.");
  } catch (error) {
    console.error("[slack] Error posting message:", error.message);
  }
}

// --- Discord ---

const discord = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

async function processNewMessages() {
  const channel = discord.channels.cache.get(DISCORD_CHANNEL_ID);
  if (!channel) {
    console.error("[discord] Channel not found:", DISCORD_CHANNEL_ID);
    return;
  }

  const lastMessageId = await fetchLastMessageId();

  const fetchOptions = lastMessageId ? { after: lastMessageId } : {};
  const messages = await channel.messages.fetch(fetchOptions);

  if (messages.size === 0) {
    console.log("[discord] No new messages.");
    return;
  }

  for (const msg of messages.values()) {
    const content = msg.content.toLowerCase();
	  const searchText = getMessageSearchText(msg);

    if (CHAPTER_RELEASE_PATTERN.test(searchText)) {
      console.log("[discord] New chapter release detected.");

      const title = getChapterTitle(searchText);
      const description = "New One Piece Chapter Released!";
      const chapterNumber = getChapterNumber(title);
      const breakMessage = getBreakMessage(searchText);
      const chapterUrl = chapterNumber
        ? `https://tcbscansonepiecechapter.com/one-piece-chapter-${chapterNumber}/`
        : null;

      const slackMessage = [
        `<!channel> ${generateHype()}`,
        "",
        "",
        `*${title}*`,
        "",
        breakMessage,
        "",
        "",
        chapterUrl ? `<${chapterUrl}|Read Chapter>` : null,
      ]
        .filter(Boolean)
        .join("\n");

      await postToSlack(slackMessage);
    } else if (content.includes(TEST_TRIGGER)) {
      console.log("[discord] Test trigger detected.");
      await postToSlack("<!channel>\n\nSistema funcionando correctamente. 🗿");
    }
  }

  await storeMessageId(messages.first().id);
}

function getChapterTitle(text) {
  const match = text.match(/one piece\s*-\s*chapter\s+1\d{3}/i);
  return match ? match[0] : "New One Piece Chapter Released";
}

function getChapterNumber(text) {
  const match = text.match(/chapter\s+(1\d{3})/i);
  return match?.[1] ?? null;
}

function getMessageSearchText(msg) {
  const content = msg.content ?? "";

  const embedText = msg.embeds
    .map((embed) =>
      [
        embed.title,
        embed.description,
        embed.author?.name,
        embed.footer?.text,
        ...(embed.fields?.flatMap((field) => [field.name, field.value]) ?? []),
      ]
        .filter(Boolean)
        .join(" ")
    )
    .join(" ");

  return `${content} ${embedText}`;
}

function getBreakMessage(text) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const breakLine = lines.find(
    (line) =>
      /break/i.test(line) &&
      !/no\s+break/i.test(line)
  );

  return breakLine ?? null;
}

function getButtonUrl(msg, label) {
  for (const row of msg.components ?? []) {
    for (const component of row.components ?? []) {
      if (
        component.label?.toLowerCase() === label.toLowerCase() &&
        component.url
      ) {
        return component.url;
      }
    }
  }

  return null;
}

// --- Entry point ---

async function main() {
    discord.once("clientReady", async () => {
    console.log(`[discord] Logged in as ${discord.user.tag}`);

    try {
      await processNewMessages();
    } catch (error) {
      console.error("[bot] Error processing messages:", error.message);
    } finally {
      discord.destroy();
      process.exit(0);
    }
  });

  await discord.login(DISCORD_TOKEN);
}

main().catch((error) => {
  console.error("[bot] Fatal error:", error.message);
  process.exit(1);
});
