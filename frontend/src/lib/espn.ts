// ESPN API types and helpers for NFL schedule

export type ESPNEvent = {
  id: string;
  date: string;
  name?: string;
  competitions?: Array<{
    competitors: Array<{
      homeAway: 'home' | 'away';
      score?: string;
      team: { displayName: string; abbreviation: string; logo?: string };
    }>;
    venue?: { fullName?: string; address?: { city?: string } };
    broadcasts?: Array<{ names?: string[]; market?: string; type?: string; shortName?: string }>;
  }>;
  status?: { type?: { name?: string; detail?: string } };
};

/**
 * Fetch NFL schedule for a specific week from ESPN API
 * @param week Week number (1-18 for regular season)
 * @returns Array of game events
 */
export async function fetchNflWeekSchedule(week: number): Promise<ESPNEvent[]> {
  const url = `http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=${week}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`ESPN API error ${res.status}`);
  const json = await res.json();
  return (json.events ?? []) as ESPNEvent[];
}
