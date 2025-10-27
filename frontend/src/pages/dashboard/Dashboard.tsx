import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser, getKPIs, getBets } from '@/lib/queries';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatPercent } from '@/lib/utils';
import type { Bet } from '@/lib/schemas';
import Layout from '@/components/layout/Layout';

export default function Dashboard() {
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    getCurrentUser().then(user => {
      if (user) setUserId(user.id);
    });
  }, []);

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['kpis', userId],
    queryFn: () => getKPIs(userId),
    enabled: !!userId,
  });

  const { data: recentBets, isLoading: betsLoading } = useQuery({
    queryKey: ['recentBets', userId],
    queryFn: async () => {
      const allBets = await getBets(userId);
      return allBets.slice(0, 5);
    },
    enabled: !!userId,
  });

  if (!userId || kpisLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Layout>
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Total P&L
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-bold ${
                  (kpis?.totalPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(kpis?.totalPnL || 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                ROI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-bold ${
                  (kpis?.roi || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatPercent(kpis?.roi || 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Hit Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatPercent(kpis?.hitRate || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {kpis?.wonBets || 0}W - {kpis?.lostBets || 0}L
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Bets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpis?.totalBets || 0}</p>
              <p className="text-sm text-gray-500 mt-1">
                {kpis?.pendingBets || 0} pending
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Bets</CardTitle>
            <Link to="/bets/new">
              <Button>Add Bet</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {betsLoading ? (
              <p className="text-center text-gray-500 py-8">Loading...</p>
            ) : recentBets && recentBets.length > 0 ? (
              <div className="space-y-4">
                {recentBets.map((bet: Bet) => (
                  <Link
                    key={bet.id}
                    to={`/bets/${bet.id}`}
                    className="block border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{bet.bet_name}</h3>
                        <p className="text-sm text-gray-600">
                          {bet.sport} • {bet.market_type}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            bet.status === 'Won'
                              ? 'bg-green-100 text-green-700'
                              : bet.status === 'Lost'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {bet.status}
                        </span>
                        {bet.result_profit !== null && (
                          <p
                            className={`text-sm font-medium mt-1 ${
                              bet.result_profit >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {formatCurrency(bet.result_profit)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No bets yet. Add your first bet or import a CSV.</p>
                <Link to="/bets/new">
                  <Button>Add First Bet</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
    </Layout>
  );
}
