# 🏴‍☠️ op-chapter-bot

A Discord → Slack bridge that watches for **One Piece** chapter releases and blasts hype notifications to your Slack channel — complete with random Spanish/Spanglish hype messages and GODA-tier energy.

## How it works

```
Discord #releases channel
        │
        ▼
   ┌──────────┐    chapter detected?    ┌───────────┐
   │  GitHub   │───────────────────────▶│   Slack    │
   │  Actions  │   🔥 random hype msg   │  #channel  │
   │  (cron)   │   + release details     └───────────┘
   └──────────┘
        │
        ▼
   Supabase (last message ID tracking)
```

1. A **GitHub Actions cron job** runs every hour during the typical release window (Fri–Sat JST).
2. The bot logs into Discord, fetches new messages from a target channel, and checks for chapter release announcements.
3. When a new chapter drops, it picks a random hype message, appends the release details, and posts to Slack.
4. Supabase stores the last processed message ID so nothing gets posted twice.

## Sample output

> 🚬 ¡Se prendió esta chingadera con el nuevo capítulo!
>
> Chapter 1XXX Release — ...

## Setup

### 1. Clone & install

```bash
git clone https://github.com/luisrrv/op-chapter-bot.git
cd op-chapter-bot
npm install
```

### 2. Environment variables

Create a `.env` file (or add these as GitHub repo secrets):

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `DISCORD_BOT_TOKEN` | Discord bot token with read access |
| `CHANNEL_ID` | Discord channel ID to monitor |
| `SLACK_OAUTH_TOKEN` | Slack Bot OAuth token |
| `SLACK_CHANNEL_ID` | Slack channel to post in |

### 3. Supabase table

Create an `op_messages` table:

```sql
create table op_messages (
  id bigint generated always as identity primary key,
  message_id text not null,
  created_at timestamptz default now()
);
```

### 4. GitHub Actions

The bot runs automatically via two workflows:

- **`script.yml`** — Scheduled cron (Fri–Sat JST window)
- **`test.yml`** — Manual trigger (`workflow_dispatch`) for testing

Add all env variables as **repository secrets** in GitHub → Settings → Secrets and variables → Actions.

### 5. Run locally (optional)

```bash
node discord_bot.mjs
```

## Project structure

```
.
├── .github/workflows/
│   ├── script.yml        # Scheduled workflow
│   └── test.yml          # Manual test workflow
├── discord_bot.mjs          # Main bot logic
├── script_requests.js       # Supabase helpers
├── package.json
└── README.md
```

## Tech stack

- **Discord.js** — Discord API client
- **@slack/web-api** — Slack messaging
- **Supabase** — Message ID persistence
- **GitHub Actions** — Serverless cron execution

## License

Private project. Not for redistribution.

---

*Oda está jugando ajedrez 5D otra vez.* 🗿