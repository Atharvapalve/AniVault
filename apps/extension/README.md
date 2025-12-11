# AniVault Chrome Extension

Auto-track anime episodes on streaming sites and sync with AniVault Desktop.

## Supported Sites

### First-Class Support
- **Crunchyroll** - Official streaming platform
- **Netflix** - Official streaming platform
- **Zoro / AniWatch / HiAnime / ZoroX / AniWave** - Popular anime streaming clones
- **9anime / AniWave** - 9anime and reskins

### Generic Fallback
The extension includes a generic adapter that works on **any anime streaming site** that:
- Has a `<video>` element
- Shows episode information in the page title or headings

This means the extension will work on most anime sites out of the box, even if they're not explicitly listed!

## Development

### Prerequisites

- Node.js 18+
- pnpm 8+

### Running in Development

```bash
# From repo root
pnpm dev:extension
```

This will:
1. Build the extension with Vite + crxjs
2. Watch for changes and rebuild automatically
3. Output to `apps/extension/dist/`

### Loading in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `apps/extension/dist/` directory

The extension will reload automatically when you rebuild.

## Features

- **Auto-detection**: Automatically detects anime episodes on Crunchyroll and Netflix
- **Video tracking**: Tracks video playback and sends completion events at 80% watched
- **Desktop sync**: Sends events to AniVault Desktop app via localhost HTTP endpoint
- **Offline queue**: Queues events if desktop app is not running, syncs when available
- **Beautiful popup**: Shows current status, recent activity, and settings

## Architecture

- **Site Adapters** (`src/content/adapters.ts`): Modular system for detecting episodes on different sites
  - Each adapter handles URL matching, episode detection, and video element finding
  - Adapters are prioritized: specific ones (Crunchyroll, Netflix) come first, generic fallback last
- **Content Scripts** (`src/content/`): Run on streaming sites, use adapters to detect episodes, track video playback
- **Background Service Worker** (`src/background/`): Handles events, stores history, syncs with desktop
- **Popup UI** (`src/popup/`): React-based UI showing status and recent activity

### Site Adapter System

The extension uses a modular adapter system that makes it easy to support new sites:

```typescript
interface SiteAdapter {
  id: Platform
  match: (url: string) => boolean
  detectEpisode: () => EpisodeDetection | null
  findVideoElement: () => HTMLVideoElement | null
}
```

This allows one adapter to cover multiple clones (e.g., Zoro adapter works on zoro.to, zoro.sx, aniwatch.to, etc.)

## Configuration

The extension stores settings in `chrome.storage.local`:
- `settings.autoTrack`: Enable/disable auto-tracking (default: true)
- `lastWatched`: Array of recently tracked episodes (last 20)
- `pendingSync`: Events queued for sync when desktop app is offline

## Desktop Integration

The extension communicates with AniVault Desktop via HTTP:
- Endpoint: `http://127.0.0.1:4156/extension/episode-complete`
- Method: POST
- Body: JSON with episode completion data

The desktop app must be running for events to sync in real-time. Events are queued if the desktop app is offline.

