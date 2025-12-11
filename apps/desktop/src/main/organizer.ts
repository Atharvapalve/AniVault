import type { Anime } from '@anivault/shared'
import { promises as fs } from 'fs'
import path from 'path'
import { parseAnimeFilename } from './watcher'

export type OrganizeStatus = 'ready' | 'unmatched' | 'conflict'

export interface OrganizePlanItem {
  from: string
  to: string
  title: string | null
  episode: number | null
  matchedAnimeId?: string
  matchedAnimeTitle?: string
  season: number | null
  status: OrganizeStatus
}

const VIDEO_EXTENSIONS = new Set(['.mkv', '.mp4', '.avi', '.mov', '.flv', '.webm'])

export function sanitizeName(name: string): string {
  return name.replace(/[<>:"/\\|?*]+/g, '').trim()
}

function inferSeasonFromFilename(filename: string, episode: number | null): number {
  const lower = filename.toLowerCase()

  // Match S02, S2, [S02], etc.
  const sMatch = lower.match(/(?:^|[\s._\-])(s)(\d{1,2})(?:[^0-9]|$)/i)
  if (sMatch && sMatch[2]) {
    const n = parseInt(sMatch[2], 10)
    if (!Number.isNaN(n)) return n
  }

  // Match "season 20"
  const seasonMatch = lower.match(/season\s*(\d{1,2})/i)
  if (seasonMatch && seasonMatch[1]) {
    const n = parseInt(seasonMatch[1], 10)
    if (!Number.isNaN(n)) return n
  }

  // Default to Season 1 when no explicit hint
  return 1
}

async function collectVideoFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const nested = await collectVideoFiles(full)
      files.push(...nested)
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase()
      if (VIDEO_EXTENSIONS.has(ext)) {
        files.push(full)
      }
    }
  }

  return files
}

function findMatchingAnime(parsedTitle: string | null, fileName: string, library: Anime[]): Anime | null {
  if (!parsedTitle) return null
  const normalizedParsed = parsedTitle.toLowerCase()

  const bestMatch = library.find((anime) => {
    const t = anime.title.toLowerCase()
    return t.includes(normalizedParsed) || normalizedParsed.includes(t)
  })

  return bestMatch ?? null
}

export async function buildOrganizePlan(
  sourceDir: string,
  targetRoot: string,
  library: Anime[]
): Promise<OrganizePlanItem[]> {
  const files = await collectVideoFiles(sourceDir)
  const plan: OrganizePlanItem[] = []

  for (const from of files) {
    const base = path.basename(from)
    const ext = path.extname(base)
    const nameWithoutExt = base.slice(0, -ext.length)

    const { title: parsedTitle, episode } = parseAnimeFilename(nameWithoutExt)

    const matchedAnime = parsedTitle ? findMatchingAnime(parsedTitle, nameWithoutExt, library) : null

    if (!matchedAnime || episode == null) {
      plan.push({
        from,
        to: from,
        title: parsedTitle,
        episode: episode ?? null,
        matchedAnimeId: matchedAnime?.id ?? undefined,
        matchedAnimeTitle: matchedAnime?.title ?? undefined,
        season: null,
        status: 'unmatched',
      })
      continue
    }

    const season = inferSeasonFromFilename(nameWithoutExt, episode)
    const safeTitle = sanitizeName(matchedAnime.title)
    const seasonFolder = `Season ${season}`

    const fileName = `${safeTitle} - Episode ${episode.toString().padStart(3, '0')}${ext}`
    const targetDir = path.join(targetRoot, safeTitle, seasonFolder)
    const to = path.join(targetDir, fileName)

    const status: OrganizeStatus = from.toLowerCase() === to.toLowerCase() ? 'unmatched' : 'ready'

    plan.push({
      from,
      to,
      title: parsedTitle,
      episode,
      matchedAnimeId: matchedAnime.id,
      matchedAnimeTitle: matchedAnime.title,
      season,
      status,
    })
  }

  const byTarget = new Map<string, number>()
  for (const item of plan) {
    if (!item.to) continue
    const key = item.to.toLowerCase()
    byTarget.set(key, (byTarget.get(key) ?? 0) + 1)
  }
  for (const item of plan) {
    const key = item.to.toLowerCase()
    if (byTarget.get(key)! > 1 && item.status === 'ready') {
      item.status = 'conflict'
    }
  }

  return plan
}

export async function applyOrganizePlan(plan: OrganizePlanItem[], logPath: string): Promise<void> {
  const operations = plan.filter((p) => p.status === 'ready' && p.from !== p.to)

  for (const op of operations) {
    const dir = path.dirname(op.to)
    await fs.mkdir(dir, { recursive: true })
  }

  for (const op of operations) {
    await fs.rename(op.from, op.to)
  }

  const log = {
    createdAt: new Date().toISOString(),
    operations: operations.map((op) => ({
      from: op.from,
      to: op.to,
      title: op.title,
      episode: op.episode,
      matchedAnimeId: op.matchedAnimeId,
      season: op.season,
    })),
  }

  try {
    const logDir = path.dirname(logPath)
    await fs.mkdir(logDir, { recursive: true })
    await fs.writeFile(logPath, JSON.stringify(log, null, 2), 'utf-8')
  } catch (error) {
    console.error('Failed to write organizer log file:', error)
  }
}

