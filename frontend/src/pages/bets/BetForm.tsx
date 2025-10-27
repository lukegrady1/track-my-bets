import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCurrentUser, createBet, getSportsbooks, getUserSettings } from '@/lib/queries';
import { americanToDecimal, calculateUnits, impliedProbFromAmerican, formatAmericanOdds, formatImpliedProb } from '@/lib/odds';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { Sportsbook } from '@/lib/schemas';

export default function BetForm() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [baseUnit, setBaseUnit] = useState(50);
  const [sportsbooks, setSportsbooks] = useState<Sportsbook[]>([]);

  // Form state
  const [betName, setBetName] = useState('');
  const [sport, setSport] = useState('NFL');
  const [league, setLeague] = useState('');
  const [marketType, setMarketType] = useState('ML');
  const [teamOrPlayer, setTeamOrPlayer] = useState('');
  const [oddsAmerican, setOddsAmerican] = useState('');
  const [stake, setStake] = useState('');
  const [bookId, setBookId] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const user = await getCurrentUser();
        if (user) {
          setUserId(user.id);
          const settings = await getUserSettings(user.id);
          if (settings) {
            setBaseUnit(settings.base_unit);
            if (settings.default_book_id) {
              setBookId(settings.default_book_id);
            }
          }
          const books = await getSportsbooks(user.id);
          setSportsbooks(books);
          if (books.length > 0 && !bookId) {
            setBookId(books[0].id || '');
          }
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    }
    loadData();
  }, []);

  const odds = parseInt(oddsAmerican) || 0;
  const stakeAmount = parseFloat(stake) || 0;
  const units = calculateUnits(stakeAmount, baseUnit);
  const impliedProb = odds !== 0 ? impliedProbFromAmerican(odds) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!betName || !sport || !marketType || !oddsAmerican || !stake || !bookId) {
      setError('Please fill in all required fields');
      return;
    }

    if (odds === 0) {
      setError('Odds cannot be zero');
      return;
    }

    if (stakeAmount <= 0) {
      setError('Stake must be positive');
      return;
    }

    setLoading(true);

    try {
      await createBet({
        user_id: userId,
        bet_name: betName,
        sport,
        league: league || null,
        market_type: marketType,
        team_or_player: teamOrPlayer || null,
        odds_american: odds,
        stake: stakeAmount,
        units,
        status: 'Pending',
        book_id: bookId,
        event_date: eventDate || null,
        notes: notes || null,
        placed_at: new Date().toISOString(),
      });

      navigate('/bets');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold">Add New Bet</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Bet Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="betName" className="block text-sm font-medium mb-1">
                  Bet Name *
                </label>
                <Input
                  id="betName"
                  value={betName}
                  onChange={(e) => setBetName(e.target.value)}
                  placeholder="e.g., Chiefs ML vs Bills"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sport" className="block text-sm font-medium mb-1">
                    Sport *
                  </label>
                  <select
                    id="sport"
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="NFL">NFL</option>
                    <option value="NBA">NBA</option>
                    <option value="MLB">MLB</option>
                    <option value="NHL">NHL</option>
                    <option value="NCAAF">NCAAF</option>
                    <option value="NCAAB">NCAAB</option>
                    <option value="Soccer">Soccer</option>
                    <option value="MMA">MMA</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="marketType" className="block text-sm font-medium mb-1">
                    Market Type *
                  </label>
                  <select
                    id="marketType"
                    value={marketType}
                    onChange={(e) => setMarketType(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="ML">Moneyline</option>
                    <option value="Spread">Spread</option>
                    <option value="Total">Total</option>
                    <option value="Prop">Prop</option>
                    <option value="Parlay">Parlay</option>
                    <option value="Future">Future</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="bookId" className="block text-sm font-medium mb-1">
                  Sportsbook *
                </label>
                <select
                  id="bookId"
                  value={bookId}
                  onChange={(e) => setBookId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="">Select a sportsbook</option>
                  {sportsbooks.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="oddsAmerican" className="block text-sm font-medium mb-1">
                    American Odds *
                  </label>
                  <Input
                    id="oddsAmerican"
                    type="number"
                    value={oddsAmerican}
                    onChange={(e) => setOddsAmerican(e.target.value)}
                    placeholder="-110"
                    required
                  />
                  {odds !== 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Implied: {formatImpliedProb(impliedProb)}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="stake" className="block text-sm font-medium mb-1">
                    Stake ($) *
                  </label>
                  <Input
                    id="stake"
                    type="number"
                    step="0.01"
                    value={stake}
                    onChange={(e) => setStake(e.target.value)}
                    placeholder="100.00"
                    required
                  />
                  {stakeAmount > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Units: {units.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes about this bet..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Creating...' : 'Create Bet'}
                </Button>
                <Link to="/bets" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
