import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchNflWeekSchedule, type ESPNEvent } from '@/lib/espn';
import Layout from '@/components/layout/Layout';

function getWeekParam(sp: URLSearchParams): number {
  const n = Number(sp.get('week'));
  return Number.isFinite(n) && n >= 1 && n <= 18 ? n : 1; // default to week 1
}

function groupByDate(events: ESPNEvent[]): [string, ESPNEvent[]][] {
  const map = new Map<string, ESPNEvent[]>();
  for (const e of events) {
    const d = new Date(e.date);
    const key = d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.entries()).sort((a, b) => {
    const dateA = new Date(a[1][0].date);
    const dateB = new Date(b[1][0].date);
    return dateA.getTime() - dateB.getTime();
  });
}

export default function SchedulePage() {
  const [search, setSearch] = useSearchParams();
  const week = getWeekParam(search);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['schedule', week],
    queryFn: () => fetchNflWeekSchedule(week),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    refetch();
  }, [week, refetch]);

  const onWeekChange = (w: number) => {
    const next = Math.min(18, Math.max(1, w));
    setSearch(prev => {
      prev.set('week', String(next));
      return prev;
    }, { replace: false });
  };

  return (
    <Layout>
      <div className="space-y-4">
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">NFL Schedule</h1>
          <WeekPicker value={week} onChange={onWeekChange} />
        </header>

        {isLoading && <p className="text-center py-8 text-gray-500">Loading schedule…</p>}
        {isError && <p className="text-red-600 text-center py-8">Could not load schedule. Try another week.</p>}

        {data && data.length === 0 && <p className="text-center py-8 text-gray-500">No games found for week {week}.</p>}

        {data && groupByDate(data).map(([dateLabel, events]) => (
          <section key={dateLabel}>
            <h2 className="text-lg font-medium mt-6 mb-2">{dateLabel}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {events.map(ev => <GameCard key={ev.id} ev={ev} />)}
            </div>
          </section>
        ))}
      </div>
    </Layout>
  );
}

function WeekPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="week-select" className="text-sm font-medium">Week</label>
      <select
        id="week-select"
        className="border rounded-md px-3 py-1.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {Array.from({ length: 18 }, (_, i) => i + 1).map(w => (
          <option key={w} value={w}>Week {w}</option>
        ))}
      </select>
    </div>
  );
}

function GameCard({ ev }: { ev: ESPNEvent }) {
  const comp = ev.competitions?.[0];
  const home = comp?.competitors?.find(c => c.homeAway === 'home');
  const away = comp?.competitors?.find(c => c.homeAway === 'away');
  const kickoff = new Date(ev.date);
  const time = kickoff.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const venue = comp?.venue?.fullName;
  const city = comp?.venue?.address?.city;
  const network = comp?.broadcasts?.[0]?.shortName || comp?.broadcasts?.[0]?.names?.[0];
  const statusText = ev.status?.type?.detail ?? ev.status?.type?.name ?? 'Scheduled';

  const isLive = ev.status?.type?.name === 'STATUS_IN_PROGRESS';
  const isFinal = ev.status?.type?.name === 'STATUS_FINAL';

  return (
    <div className="rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow bg-white">
      {/* Time and Network */}
      <div className="text-sm text-gray-600 flex items-center gap-2">
        <span>{time}</span>
        {network && (
          <>
            <span className="text-gray-400">•</span>
            <span className="font-medium">{network}</span>
          </>
        )}
        {isLive && (
          <span className="ml-auto text-red-600 font-semibold animate-pulse">LIVE</span>
        )}
      </div>

      {/* Teams */}
      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {away?.team.logo && (
              <img src={away.team.logo} alt={away.team.displayName} className="w-6 h-6" />
            )}
            <span className="font-medium">{away?.team.displayName || 'TBD'}</span>
          </div>
          {(isFinal || isLive) && away?.score && (
            <span className="font-bold text-lg">{away.score}</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {home?.team.logo && (
              <img src={home.team.logo} alt={home.team.displayName} className="w-6 h-6" />
            )}
            <span className="font-medium">{home?.team.displayName || 'TBD'}</span>
          </div>
          {(isFinal || isLive) && home?.score && (
            <span className="font-bold text-lg">{home.score}</span>
          )}
        </div>
      </div>

      {/* Venue */}
      {(venue || city) && (
        <div className="text-xs text-gray-500 mt-2">
          {venue}{venue && city ? ' — ' : ''}{city}
        </div>
      )}

      {/* Status */}
      <div className={`text-xs mt-2 font-medium ${isLive ? 'text-red-600' : isFinal ? 'text-gray-500' : 'text-blue-600'}`}>
        {statusText}
      </div>
    </div>
  );
}
