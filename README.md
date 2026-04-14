# 🏴‍☠️ op-chapter-bot

Every week, the official One Piece Discord server posts a new chapter release announcement. Since me and my friends aren't on Discord much, I set up a bot in my own Discord server that copies every new chapter message from the official channel into one of mine — and then built this app to take it a step further.

It monitors my Discord channel for those copied chapter announcements and forwards them to a Slack channel where me and my friends actually hang out. Now we get notified the moment a new chapter drops and can discuss it right there. It also throws in a random hype message in Spanish because that's how we roll.

## How it works

```
Official OP Discord
  "Chapter 1XXX released!"
        │
        ▼
My Discord server (bot copies the message)
        │
        ▼
   ┌──────────┐    chapter detected?    ┌───────────┐
   │  GitHub   │───────────────────────▶│ Our Slack  │
   │  Actions  │   🔥 random hype msg   │  channel   │
   │  (cron)   │   + release details     └───────────┘
   └──────────┘
        │
        ▼
   Supabase (last message ID tracking)
```

A GitHub Actions cron job runs every hour during the typical release window. It logs into Discord, grabs new messages from my channel, and checks if any match the chapter release pattern. When one does, it picks a random hype message, tacks on the release details, and posts it to our Slack. A Supabase table keeps track of the last processed message ID so nothing gets double-posted.

## Setup

### 1. Clone & install

```bash
git clone https://github.com/luisrrv/op-chapter-bot.git
cd op-chapter-bot
npm install
```

### 2. Configuration

The app requires credentials for Discord, Slack, and Supabase. Add them as environment variables in a `.env` file for local development, or as repository secrets in GitHub → Settings → Secrets for the Actions workflows.

### 3. GitHub Actions

Two workflows:

- **`script.yml`** — Scheduled cron that runs during the Fri–Sat JST release window
- **`test.yml`** — Manual trigger for testing

### 4. Run locally

```bash
node discord_bot.mjs
```

## Project structure

```
├── .github/workflows/
│   ├── script.yml
│   └── test.yml
├── discord_bot.mjs
├── script_requests.js
├── package.json
└── README.md
```

## Tech

Discord.js · @slack/web-api · Supabase · GitHub Actions

---

*Oda volvió a cocinar gourmet.* 🗿