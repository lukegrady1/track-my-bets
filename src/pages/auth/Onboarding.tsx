import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, upsertUserSettings, getSportsbooks } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import type { Sportsbook } from '@/lib/schemas';

export default function Onboarding() {
  const navigate = useNavigate();
  const [baseUnit, setBaseUnit] = useState('50');
  const [defaultBookId, setDefaultBookId] = useState('');
  const [sportsbooks, setSportsbooks] = useState<Sportsbook[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadSportsbooks() {
      try {
        const user = await getCurrentUser();
        if (user) {
          const books = await getSportsbooks(user.id);
          setSportsbooks(books);
          if (books.length > 0) {
            setDefaultBookId(books[0].id || '');
          }
        }
      } catch (err) {
        console.error('Failed to load sportsbooks:', err);
      }
    }
    loadSportsbooks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const unitValue = parseFloat(baseUnit);
    if (isNaN(unitValue) || unitValue <= 0) {
      setError('Please enter a valid base unit amount');
      return;
    }

    setLoading(true);

    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      await upsertUserSettings({
        user_id: user.id,
        base_unit: unitValue,
        default_book_id: defaultBookId || null,
      });

      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Welcome to Track My Bets
          </CardTitle>
          <CardDescription className="text-center">
            Let's set up your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="baseUnit" className="text-sm font-medium">
                Base Unit ($)
              </label>
              <Input
                id="baseUnit"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="50.00"
                value={baseUnit}
                onChange={(e) => setBaseUnit(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Your standard betting unit. Used to calculate units for each bet.
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="defaultBook" className="text-sm font-medium">
                Default Sportsbook (Optional)
              </label>
              <select
                id="defaultBook"
                value={defaultBookId}
                onChange={(e) => setDefaultBookId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loading}
              >
                <option value="">Select a sportsbook</option>
                {sportsbooks.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Setting up...' : 'Get Started'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
