# AniVault Setup Guide

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

## Initial Setup

1. Install dependencies:
```bash
pnpm install
```

## Development

### Desktop App
```bash
pnpm dev:desktop
```
Runs the Electron app with hot reload.

### Chrome Extension
```bash
pnpm dev:extension
```
Builds the extension in watch mode. Load the `apps/extension/dist` folder in Chrome as an unpacked extension.

### Web Landing Page
```bash
pnpm dev:web
```
Starts the Astro dev server (usually on http://localhost:4321).

## Building

Build all projects:
```bash
pnpm build
```

Build individual projects:
```bash
pnpm build:desktop
pnpm build:extension
pnpm build:web
```

## Project Structure

```
AniVault/
├── apps/
│   ├── desktop/          # Electron desktop app
│   ├── extension/        # Chrome extension
│   └── web/              # Astro landing page
├── packages/
│   ├── shared/           # Shared TypeScript types
│   └── ui/               # Shared UI components
└── pnpm-workspace.yaml
```

## Notes

- The extension requires icon files in `apps/extension/icons/` (icon-16.png, icon-32.png, icon-48.png, icon-128.png)
- Desktop app uses frameless transparent windows with custom titlebar
- All projects share the same Tailwind config from `packages/ui`
- TypeScript types are shared via `packages/shared`

