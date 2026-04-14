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

const CHAPTER_RELEASE_PATTERN =
  /(?=.*\bchapter\b)(?=.*\brelease\b)(?=.*\b1\d{3}\b)/i;

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

const discord = new Client({ intents: [GatewayIntentBits.Guilds] });

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

    if (CHAPTER_RELEASE_PATTERN.test(content)) {
      console.log("[discord] New chapter release detected.");
      const sanitized = msg.content.replace(/@everyone/g, "");
      await postToSlack(`<!channel> ${generateHype()}\n\n${sanitized}`);
    } else if (content.includes(TEST_TRIGGER)) {
      console.log("[discord] Test trigger detected.");
      await postToSlack("<!channel>\n\nSistema funcionando correctamente. 🗿");
    }
  }

  await storeMessageId(messages.first().id);
}

// --- Entry point ---

async function main() {
  discord.once("ready", async () => {
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
