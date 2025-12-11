import { useMemo } from 'react'
import { Card } from '@anivault/ui'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, TooltipProps } from 'recharts'
import { Lock } from 'lucide-react'
import { useStore } from '../store/useStore'
import { buildStatsSnapshot, type StatsSnapshot, type WatchEvent } from '../services/stats.service'
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent'

const StatCard = ({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) => (
  <Card className="bg-card text-foreground border border-border/60 shadow-lg shadow-primary/10">
    <div className="p-4 space-y-1">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  </Card>
)

const ThemedTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/15 px-3 py-2 shadow-lg shadow-primary/20 backdrop-blur">
        <p className="text-xs text-foreground/80 mb-1">{label}</p>
        {payload.map((entry, idx) => (
          <p key={idx} className="text-sm font-semibold text-foreground">
            {entry.name ?? 'Value'}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

const ArchetypeBadge = ({ archetype }: { archetype: string }) => {
  const config: Record<string, { label: string; emoji: string }> = {
    'night-owl': { label: 'Night Owl Binger', emoji: '🦉' },
    'weekend-marathoner': { label: 'Weekend Marathoner', emoji: '🎮' },
    'daily-sipper': { label: 'Daily Sipper', emoji: '☕' },
    'casual': { label: 'Casual Watcher', emoji: '📺' },
    'unknown': { label: 'Getting Started', emoji: '🌟' },
  }

  const { label, emoji } = config[archetype] || { label: archetype, emoji: '📊' }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-sm font-medium text-foreground">
      <span>{emoji}</span>
      <span>{label}</span>
    </span>
  )
}

const StatsDashboard = () => {
  const { isPro, library, watchEvents } = useStore((state) => ({
    isPro: state.isPro,
    library: state.library,
    watchEvents: state.watchEvents,
  }))

  const snapshot = useMemo<StatsSnapshot>(() => {
    return buildStatsSnapshot(library || [], watchEvents || [])
  }, [library, watchEvents])

  const stats = snapshot.libraryStats

  // Compute completed and watching counts
  const completedCount = useMemo(() => library.filter((a) => a.status === 'completed').length, [library])
  const watchingCount = useMemo(() => library.filter((a) => a.status === 'watching').length, [library])

  // Format hours nicely
  const formattedHours = useMemo(() => {
    const hours = Math.round(stats.totalHours * 10) / 10
    return hours.toLocaleString(undefined, { maximumFractionDigits: 1 })
  }, [stats.totalHours])

  // Chart data with fallbacks
  const genreData = stats.genreBreakdown.length > 0 ? stats.genreBreakdown : [{ name: 'N/A', count: 0 }]
  const scoreData = stats.scoreDistribution.length > 0 ? stats.scoreDistribution : [{ score: 0, count: 0 }]
  const hasGenreData = stats.genreBreakdown.some((g) => g.count > 0)
  const hasScoreData = stats.scoreDistribution.some((s) => s.count > 0)

  // Heatmap data - last 30 days
  const recentHeatmapCells = snapshot.heatmap.cells.slice(-30)
  const hasHeatmapData = snapshot.heatmap.cells.length > 0

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="relative space-y-6 w-full">
      {!isPro && (
        <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-md bg-background/70 rounded-2xl border border-border/60">
          <div className="text-center space-y-3 px-6 py-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Lock size={20} />
            </div>
            <p className="text-lg font-semibold text-foreground">Upgrade to Pro to see your stats</p>
            <p className="text-sm text-muted-foreground">Unlock detailed watch history and insights.</p>
            <button className="px-4 py-2 rounded-lg bg-primary text-white font-medium shadow-lg shadow-primary/30 hover:bg-primary/90 transition">
              Upgrade to Pro
            </button>
          </div>
        </div>
      )}

      {/* Hero Section - Lifetime Overview */}
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Anime Insights</h2>
          <p className="text-sm text-muted-foreground mt-1">Your anime life at a glance</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Hours Watched" value={formattedHours} subtitle="Assuming ~24 min per episode" />
          <StatCard title="Total Episodes Watched" value={stats.totalEpisodes.toLocaleString()} />
          <StatCard title="Anime Completed" value={completedCount.toLocaleString()} />
          <StatCard title="Currently Watching" value={watchingCount.toLocaleString()} />
        </div>
      </div>

      {/* Activity & Binge Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Heatmap */}
        <Card className="bg-card text-foreground border border-border/60 shadow-lg shadow-primary/10">
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Activity Heatmap</h3>
              <p className="text-xs text-muted-foreground">Last 30 days of watch activity</p>
            </div>
            {hasHeatmapData ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {recentHeatmapCells.map((cell, idx) => {
                    const intensity = snapshot.heatmap.maxCount > 0 ? cell.count / snapshot.heatmap.maxCount : 0
                    return (
                      <div
                        key={idx}
                        className="w-3 h-3 rounded-sm border border-border/30"
                        style={{
                          backgroundColor: `var(--primary)`,
                          opacity: Math.max(0.2, intensity),
                        }}
                        title={`${cell.date}: ${cell.count} episode${cell.count !== 1 ? 's' : ''}`}
                      />
                    )
                  })}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                  <span>Less</span>
                  <div className="flex gap-1">
                    {[0.2, 0.4, 0.6, 0.8, 1.0].map((opacity) => (
                      <div
                        key={opacity}
                        className="w-3 h-3 rounded-sm border border-border/30"
                        style={{
                          backgroundColor: `var(--primary)`,
                          opacity,
                        }}
                      />
                    ))}
                  </div>
                  <span>More</span>
                </div>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
                No watch activity logged yet
              </div>
            )}
          </div>
        </Card>

        {/* Binge Profile */}
        <Card className="bg-card text-foreground border border-border/60 shadow-lg shadow-primary/10">
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Binge Profile</h3>
              <p className="text-xs text-muted-foreground">Your watching patterns</p>
            </div>
            {snapshot.bingeProfile.totalSessions > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total sessions</span>
                  <span className="text-lg font-semibold text-foreground">{snapshot.bingeProfile.totalSessions}</span>
                </div>
                {snapshot.bingeProfile.longestSession && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Longest session</span>
                    <span className="text-lg font-semibold text-foreground">
                      {snapshot.bingeProfile.longestSession.episodes} episodes
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Average per session</span>
                  <span className="text-lg font-semibold text-foreground">
                    {Math.round(snapshot.bingeProfile.averageEpisodesPerSession * 10) / 10} episodes
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Most in a day</span>
                  <span className="text-lg font-semibold text-foreground">
                    {snapshot.bingeProfile.mostEpisodesInADay} episodes
                  </span>
                </div>
                <div className="pt-2 border-t border-border/30">
                  <ArchetypeBadge archetype={snapshot.bingeProfile.archetype} />
                </div>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
                Start watching with AniVault to see your binge profile!
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Tastes Row */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">Your Taste</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Genres */}
          <Card className="bg-card text-foreground border border-border/60 shadow-lg shadow-primary/10">
            <div className="p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">Top Genres</p>
              <div className="relative h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={genreData}>
                    <defs>
                      <linearGradient id="genreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.35} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.35} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={<ThemedTooltip />}
                      cursor={{ fill: 'var(--primary)', fillOpacity: 0.08 }}
                    />
                    <Bar dataKey="count" fill="url(#genreGradient)" radius={[8, 8, 4, 4]} isAnimationActive={hasGenreData} />
                  </BarChart>
                </ResponsiveContainer>
                {!hasGenreData && (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                    No genre data yet
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Score Distribution */}
          <Card className="bg-card text-foreground border border-border/60 shadow-lg shadow-primary/10">
            <div className="p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">Score Distribution</p>
              <div className="relative h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={scoreData}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.35} />
                    <XAxis dataKey="score" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={<ThemedTooltip />}
                      cursor={{ stroke: 'var(--primary)', strokeOpacity: 0.15, strokeWidth: 1 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="var(--primary)"
                      fill="url(#scoreGradient)"
                      strokeWidth={2}
                      isAnimationActive={hasScoreData}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                {!hasScoreData && (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                    No score data yet
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Milestones Row */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">Milestones</h3>
        {snapshot.milestones.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {snapshot.milestones.map((milestone) => {
              const progress = (milestone.current / milestone.target) * 100
              const isAchieved = milestone.achievedAt !== undefined || milestone.current >= milestone.target

              return (
                <Card
                  key={milestone.id}
                  className={`bg-card text-foreground border shadow-lg transition-all ${
                    isAchieved
                      ? 'border-primary/60 shadow-primary/20'
                      : 'border-border/60 shadow-primary/10'
                  }`}
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-foreground">{milestone.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{milestone.description}</p>
                      </div>
                      {isAchieved && (
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                          Achieved
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-foreground font-medium">
                          {milestone.current} / {milestone.target}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-border/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300 rounded-full"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>
                    {milestone.achievedAt && (
                      <p className="text-xs text-muted-foreground">
                        Achieved {formatDate(milestone.achievedAt)}
                      </p>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="bg-card text-foreground border border-border/60 shadow-lg shadow-primary/10">
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Milestones will appear as you watch more anime with AniVault.
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Yearly Summary */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">
          {snapshot.yearlySummary ? `Anime Wrapped ${snapshot.yearlySummary.year}` : 'This Year So Far'}
        </h3>
        {snapshot.yearlySummary ? (
          <Card className="bg-card text-foreground border border-border/60 shadow-lg shadow-primary/10">
            <div className="p-6 space-y-6">
              {/* Highlight Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{snapshot.yearlySummary.totalEpisodes}</p>
                  <p className="text-xs text-muted-foreground mt-1">Episodes watched</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {Math.round(snapshot.yearlySummary.totalHours * 10) / 10}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Hours watched</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{snapshot.yearlySummary.animeStarted}</p>
                  <p className="text-xs text-muted-foreground mt-1">New anime started</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{snapshot.yearlySummary.animeCompleted}</p>
                  <p className="text-xs text-muted-foreground mt-1">Anime completed</p>
                </div>
              </div>

              {/* Top Genres */}
              {snapshot.yearlySummary.topGenres.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Top Genres</p>
                  <div className="flex flex-wrap gap-2">
                    {snapshot.yearlySummary.topGenres.map((genre, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-sm text-foreground"
                      >
                        {genre.genre} ({genre.count})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Anime */}
              {snapshot.yearlySummary.topAnime.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Top Anime</p>
                  <div className="space-y-2">
                    {snapshot.yearlySummary.topAnime.map((anime, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-background/40">
                        <span className="text-sm text-foreground font-medium">{anime.title}</span>
                        <span className="text-xs text-muted-foreground">{anime.episodes} episodes watched</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card className="bg-card text-foreground border border-border/60 shadow-lg shadow-primary/10">
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No watch activity for this year yet.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

export default StatsDashboard
