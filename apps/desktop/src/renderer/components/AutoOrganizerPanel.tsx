import { useState } from 'react'
import { useStore } from '../store/useStore'

type PlanItem = {
  from: string
  to: string
  title: string | null
  episode: number | null
  matchedAnimeTitle?: string
  season: number | null
  status: 'ready' | 'unmatched' | 'conflict'
}

const AutoOrganizerPanel = () => {
  const {
    isPro,
    library,
    organizerSourceDir,
    organizerTargetRoot,
    setOrganizerSourceDir,
    setOrganizerTargetRoot,
  } = useStore((state) => ({
    isPro: state.isPro,
    library: state.library,
    organizerSourceDir: state.organizerSourceDir,
    organizerTargetRoot: state.organizerTargetRoot,
    setOrganizerSourceDir: state.setOrganizerSourceDir,
    setOrganizerTargetRoot: state.setOrganizerTargetRoot,
  }))

  const [plan, setPlan] = useState<PlanItem[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [isScanning, setIsScanning] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isPro) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/40 p-4 text-sm text-muted-foreground">
        Upgrade to AniVault Pro to automatically organize your local anime files.
      </div>
    )
  }

  const handleScan = async () => {
    if (!window.electron?.organizer) {
      setError('Organizer bridge not available. Please restart the app.')
      return
    }
    if (!organizerSourceDir || !organizerTargetRoot) {
      setError('Please set both source and target folders.')
      return
    }
    setError(null)
    setIsScanning(true)
    try {
      const result = await window.electron.organizer.scan(organizerSourceDir, organizerTargetRoot, library || [])
      setPlan(result)
      const sel: Record<string, boolean> = {}
      for (const item of result) {
        sel[item.from] = item.status === 'ready'
      }
      setSelected(sel)
    } catch (err: any) {
      console.error('Organizer scan failed', err)
      setError(err?.message ?? 'Failed to scan folder.')
    } finally {
      setIsScanning(false)
    }
  }

  const handleApply = async () => {
    if (!window.electron?.organizer) return
    const selectedItems = plan.filter((item) => selected[item.from] && item.status === 'ready')
    if (selectedItems.length === 0) {
      setError('No ready files selected.')
      return
    }

    setIsApplying(true)
    setError(null)
    try {
      const logPath = `${organizerTargetRoot}/anivault-organizer-log-${new Date().toISOString().slice(0, 10)}.json`
      await window.electron.organizer.apply(selectedItems, logPath)
      setPlan([])
    } catch (err: any) {
      console.error('Organizer apply failed', err)
      setError(err?.message ?? 'Failed to organize files.')
    } finally {
      setIsApplying(false)
    }
  }

  const readyCount = plan.filter((p) => p.status === 'ready' && selected[p.from]).length

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Source folder (messy downloads)</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="w-full rounded-lg bg-card px-3 py-2 text-sm text-foreground outline-none ring-0 border border-border/60"
              value={organizerSourceDir ?? ''}
              onChange={(e) => setOrganizerSourceDir(e.target.value || null)}
              placeholder="D:\\Downloads\\Anime"
            />
            <button
              type="button"
              className="shrink-0 rounded-lg border border-border/60 bg-card px-3 py-2 text-xs text-muted-foreground hover:bg-white/5"
              onClick={async () => {
                if (!window.electron?.dialog) {
                  setError('Folder picker unavailable. Please restart the app.')
                  return
                }
                const dir = await window.electron.dialog.selectFolder()
                if (dir) {
                  setOrganizerSourceDir(dir)
                }
              }}
            >
              Browse
            </button>
          </div>
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Target root (organized library)</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="w-full rounded-lg bg-card px-3 py-2 text-sm text-foreground outline-none ring-0 border border-border/60"
              value={organizerTargetRoot ?? ''}
              onChange={(e) => setOrganizerTargetRoot(e.target.value || null)}
              placeholder="D:\\Anime"
            />
            <button
              type="button"
              className="shrink-0 rounded-lg border border-border/60 bg-card px-3 py-2 text-xs text-muted-foreground hover:bg-white/5"
              onClick={async () => {
                if (!window.electron?.dialog) {
                  setError('Folder picker unavailable. Please restart the app.')
                  return
                }
                const dir = await window.electron.dialog.selectFolder()
                if (dir) {
                  setOrganizerTargetRoot(dir)
                }
              }}
            >
              Browse
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleScan}
          disabled={isScanning}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow shadow-primary/40 disabled:opacity-60"
        >
          {isScanning ? 'Scanning…' : 'Scan'}
        </button>
        <button
          onClick={handleApply}
          disabled={isApplying || readyCount === 0}
          className="rounded-lg bg-emerald-500/80 px-4 py-2 text-sm font-medium text-white shadow disabled:opacity-50"
        >
          {isApplying ? 'Organizing…' : `Organize ${readyCount} file${readyCount === 1 ? '' : 's'}`}
        </button>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      <div className="max-h-80 overflow-auto rounded-xl border border-border/60 bg-card/40">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-background/40">
            <tr>
              <th className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={plan.length > 0 && plan.every((p) => selected[p.from])}
                  onChange={(e) => {
                    const value = e.target.checked
                    const sel: Record<string, boolean> = {}
                    for (const item of plan) {
                      sel[item.from] = value && item.status === 'ready'
                    }
                    setSelected(sel)
                  }}
                />
              </th>
              <th className="px-3 py-2">File</th>
              <th className="px-3 py-2">Detected</th>
              <th className="px-3 py-2">Episode</th>
              <th className="px-3 py-2">Season</th>
              <th className="px-3 py-2">Destination</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {plan.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  No files scanned yet.
                </td>
              </tr>
            )}
            {plan.map((item) => (
              <tr key={item.from} className="border-t border-border/40">
                <td className="px-3 py-2 align-top">
                  <input
                    type="checkbox"
                    disabled={item.status !== 'ready'}
                    checked={!!selected[item.from]}
                    onChange={(e) => setSelected((prev) => ({ ...prev, [item.from]: e.target.checked }))}
                  />
                </td>
                <td className="px-3 py-2 align-top text-[11px] text-muted-foreground">{item.from}</td>
                <td className="px-3 py-2 align-top text-[11px]">
                  {item.matchedAnimeTitle ?? item.title ?? <span className="text-muted-foreground">Unknown</span>}
                </td>
                <td className="px-3 py-2 align-top text-[11px]">{item.episode ?? '-'}</td>
                <td className="px-3 py-2 align-top text-[11px]">{item.season ?? '-'}</td>
                <td className="px-3 py-2 align-top text-[11px] text-muted-foreground">{item.to}</td>
                <td className="px-3 py-2 align-top text-[11px]">
                  {item.status === 'ready' && (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-400">
                      Ready
                    </span>
                  )}
                  {item.status === 'unmatched' && (
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">
                      Unmatched
                    </span>
                  )}
                  {item.status === 'conflict' && (
                    <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400">Conflict</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AutoOrganizerPanel

