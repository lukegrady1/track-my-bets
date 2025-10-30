import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getBetById, settleBet, deleteBet } from '@/lib/queries';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import AddToCalendarButton from '@/components/calendar/AddToCalendarButton';

export default function BetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [settling, setSettling] = useState(false);

  const { data: bet, isLoading, refetch } = useQuery({
    queryKey: ['bet', id],
    queryFn: () => getBetById(id!),
    enabled: !!id,
  });

  const handleSettle = async (status: 'Won' | 'Lost' | 'Push' | 'Void') => {
    if (!id) return;
    setSettling(true);
    try {
      await settleBet(id, status);
      refetch();
    } catch (err) {
      console.error('Failed to settle bet:', err);
    } finally {
      setSettling(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this bet?')) return;
    try {
      await deleteBet(id);
      navigate('/bets');
    } catch (err) {
      console.error('Failed to delete bet:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!bet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Bet not found</p>
          <Link to="/bets">
            <Button>Back to Bets</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link to="/bets">
              <Button variant="outline" size="sm">← Back</Button>
            </Link>
            <h1 className="text-2xl font-bold">{bet.bet_name}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle>Bet Details</CardTitle>
              <span
                className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                  bet.status === 'Won'
                    ? 'bg-green-100 text-green-700'
                    : bet.status === 'Lost'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {bet.status}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Sport</p>
                <p className="font-medium">{bet.sport}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Market Type</p>
                <p className="font-medium">{bet.market_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Odds</p>
                <p className="font-medium">
                  {bet.odds_american > 0 ? '+' : ''}{bet.odds_american}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Stake</p>
                <p className="font-medium">{formatCurrency(bet.stake)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Units</p>
                <p className="font-medium">{bet.units.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Placed</p>
                <p className="font-medium">{formatDate(bet.placed_at)}</p>
              </div>
            </div>

            {bet.result_profit !== null && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600">Result</p>
                <p
                  className={`text-2xl font-bold ${
                    bet.result_profit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(bet.result_profit)}
                </p>
              </div>
            )}

            {bet.notes && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">Notes</p>
                <p className="text-sm">{bet.notes}</p>
              </div>
            )}

            {bet.status === 'Pending' && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-3">Settle Bet</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSettle('Won')}
                    disabled={settling}
                    variant="default"
                    size="sm"
                  >
                    Won
                  </Button>
                  <Button
                    onClick={() => handleSettle('Lost')}
                    disabled={settling}
                    variant="destructive"
                    size="sm"
                  >
                    Lost
                  </Button>
                  <Button
                    onClick={() => handleSettle('Push')}
                    disabled={settling}
                    variant="outline"
                    size="sm"
                  >
                    Push
                  </Button>
                  <Button
                    onClick={() => handleSettle('Void')}
                    disabled={settling}
                    variant="outline"
                    size="sm"
                  >
                    Void
                  </Button>
                </div>
              </div>
            )}

            <div className="border-t pt-4 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-3">Calendar</p>
                <AddToCalendarButton bet={bet} onSuccess={refetch} />
              </div>

              <div>
                <Button
                  onClick={handleDelete}
                  variant="destructive"
                  size="sm"
                >
                  Delete Bet
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
