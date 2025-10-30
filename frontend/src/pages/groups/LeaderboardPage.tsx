import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getLeaderboard, getGroup, getCurrentUser } from '@/lib/queries';

export default function LeaderboardPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser
  });

  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => getGroup(groupId!),
    enabled: !!groupId
  });

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard', groupId, month],
    queryFn: () => getLeaderboard(groupId!, month),
    enabled: !!groupId
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link to="/groups" className="hover:text-gray-700">Groups</Link>
              <span>/</span>
              <span>Leaderboard</span>
            </div>
            <h1 className="text-3xl font-bold">{group?.name || 'Leaderboard'}</h1>
            {group?.description && (
              <p className="text-gray-600 mt-1">{group.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="month" className="text-sm font-medium">
              Month:
            </label>
            <input
              id="month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Group Info Card */}
        {group && (
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Members:</span>
                <span className="font-semibold">{group.member_count}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Invite Code:</span>
                <code className="font-mono bg-white px-2 py-1 rounded border">
                  {group.invite_code}
                </code>
              </div>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading leaderboard...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && leaderboard && leaderboard.leaderboard.length === 0 && (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">No Data Yet</h3>
            <p className="text-gray-600">
              No bets have been placed by group members in {month}.
            </p>
          </Card>
        )}

        {/* Leaderboard Table */}
        {!isLoading && leaderboard && leaderboard.leaderboard.length > 0 && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      User
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                      ROI%
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                      Units
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                      Win Rate
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                      Record
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {leaderboard.leaderboard.map((entry: any) => (
                    <LeaderboardRow
                      key={entry.user_id}
                      entry={entry}
                      isCurrentUser={entry.user_id === currentUser?.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}

function LeaderboardRow({ entry, isCurrentUser }: { entry: any; isCurrentUser: boolean }) {
  const getRankDisplay = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  const rowClasses = isCurrentUser
    ? 'bg-blue-50 hover:bg-blue-100'
    : 'hover:bg-gray-50';

  return (
    <tr className={rowClasses}>
      <td className="px-6 py-4">
        <span className="text-2xl font-semibold">
          {getRankDisplay(entry.rank)}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {entry.email}
          </span>
          {isCurrentUser && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
              You
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <span className={`font-bold text-lg ${
          entry.roi > 0 ? 'text-green-600' :
          entry.roi < 0 ? 'text-red-600' :
          'text-gray-600'
        }`}>
          {entry.roi > 0 ? '+' : ''}{entry.roi.toFixed(1)}%
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <span className={`font-semibold ${
          entry.units > 0 ? 'text-green-600' :
          entry.units < 0 ? 'text-red-600' :
          'text-gray-600'
        }`}>
          {entry.units > 0 ? '+' : ''}{entry.units.toFixed(2)}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <span className="font-medium">
          {entry.win_rate.toFixed(1)}%
        </span>
      </td>
      <td className="px-6 py-4 text-right text-sm text-gray-600">
        {entry.wins}-{entry.losses}
        {entry.total_bets > entry.wins + entry.losses && (
          <span className="text-gray-400"> ({entry.total_bets})</span>
        )}
      </td>
    </tr>
  );
}
