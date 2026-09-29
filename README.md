# 🏴‍☠️ op-chapter-bot

Every week, the r/OnePiece Discord server posts a chapter release announcement in its #announcements channel. Since me and my friends aren't on Discord much, I follow that channel from my own Discord server so every announcement lands in one of mine — and then built this app to take it a step further.

It monitors my Discord channel for those copied chapter announcements and forwards them to a Slack channel where me and my friends actually hang out. Now we get notified the moment a new chapter drops and can discuss it right there. It also throws in a random hype message in Spanish because that's how we roll.

## How it works

```
r/OnePiece Discord #announcements
  "Chapter 1XXX release @everyone"
        │
        ▼
My Discord server (followed channel)
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

A GitHub Actions cron job runs every hour on Mondays (JST), when new chapters come out. It logs into Discord, grabs new messages from my channel, and checks if any match the chapter release pattern. When one does, it picks a random hype message, tacks on the chapter number, any "break next week" notice, and the official MangaPlus link, and posts it to our Slack. A Supabase table keeps track of the last processed message ID so nothing gets double-posted.

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

- **`script.yml`** — Scheduled cron that runs hourly on Mondays JST
- **`test.yml`** — Manual trigger for testing
- **`keepalive.yml`** — Monthly job that re-enables the scheduled workflows, so GitHub's 60-day inactivity rule doesn't pause the bot

### 4. Run locally

```bash
node discord_bot.mjs
```

## Project structure

```
├── .github/workflows/
│   ├── script.yml
│   ├── test.yml
│   └── keepalive.yml
├── discord_bot.mjs
├── script_requests.js
├── package.json
└── README.md
```

## Tech

Discord.js · @slack/web-api · Supabase · GitHub Actions

---

*Oda volvió a cocinar gourmet.* 🗿