import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser, getBets } from '@/lib/queries';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatShortDate } from '@/lib/utils';
import type { Bet } from '@/lib/schemas';
import Layout from '@/components/layout/Layout';

export default function BetsList() {
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    getCurrentUser().then(user => {
      if (user) setUserId(user.id);
    });
  }, []);

  const { data: bets, isLoading } = useQuery({
    queryKey: ['bets', userId],
    queryFn: () => getBets(userId),
    enabled: !!userId,
  });

  return (
    <Layout>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>All Bets</CardTitle>
            <Link to="/bets/new">
              <Button>Add Bet</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-gray-500 py-8">Loading...</p>
            ) : bets && bets.length > 0 ? (
              <div className="space-y-4">
                {bets.map((bet: Bet) => (
                  <Link
                    key={bet.id}
                    to={`/bets/${bet.id}`}
                    className="block border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium">{bet.bet_name}</h3>
                        <p className="text-sm text-gray-600">
                          {bet.sport} • {bet.market_type} • {formatShortDate(bet.placed_at)}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Stake: {formatCurrency(bet.stake)} • Odds: {bet.odds_american > 0 ? '+' : ''}{bet.odds_american}
                        </p>
                      </div>
                      <div className="text-right ml-4">
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
