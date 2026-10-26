# ClipRoom

A responsive room-based clipboard sharing web app. Create a room, share its six-character code or invite link, and move text/code/commands between devices.

## Features
- Create or join a room with a six-character code
- Shareable invite link
- Share text, code, notes, and terminal commands
- Auto-refreshing room views, copy and delete snippets
- Responsive mobile-friendly interface
- No login required

## Run locally
Requires Node.js 18+.

```bash
npm install
npm start
```

Open http://localhost:3000.

## Deploy on Render
- Runtime: Node
- Build command: `npm install`
- Start command: `npm start`
- Health check: `/api/health`

## Important limitations
This starter currently stores rooms in server memory. A Render restart or redeploy clears active rooms, and it is not suitable for multiple instances until shared persistent storage is added. Rooms expire after 12 hours of inactivity. Anyone with a room code/link can read, add, and delete snippets. Do not share passwords, tokens, private keys, or sensitive information. Before broad public use, add rate limiting and abuse protection.
