import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, getUserSettings, upsertUserSettings, signOut } from '@/lib/queries';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Settings() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [baseUnit, setBaseUnit] = useState('50');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const user = await getCurrentUser();
        if (user) {
          setUserId(user.id);
          const settings = await getUserSettings(user.id);
          if (settings) {
            setBaseUnit(settings.base_unit.toString());
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const unitValue = parseFloat(baseUnit);
    if (isNaN(unitValue) || unitValue <= 0) {
      setError('Please enter a valid base unit amount');
      return;
    }

    setLoading(true);

    try {
      await upsertUserSettings({
        user_id: userId,
        base_unit: unitValue,
        default_book_id: null,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth/signin');
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Track My Bets</h1>
            <nav className="flex gap-4">
              <Link to="/" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link to="/bets" className="text-gray-600 hover:text-gray-900">
                Bets
              </Link>
              <Link to="/bankroll" className="text-gray-600 hover:text-gray-900">
                Bankroll
              </Link>
              <Link to="/settings" className="text-primary font-medium">
                Settings
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-md text-sm">
                  Settings saved successfully!
                </div>
              )}

              <div>
                <label htmlFor="baseUnit" className="block text-sm font-medium mb-1">
                  Base Unit ($)
                </label>
                <Input
                  id="baseUnit"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={baseUnit}
                  onChange={(e) => setBaseUnit(e.target.value)}
                  required
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your standard betting unit. Used to calculate units for each bet.
                </p>
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Settings'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Sign out of your account
              </p>
              <Button onClick={handleSignOut} variant="outline">
                Sign Out
              </Button>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-2">
                For personal record-keeping only. Not financial advice.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
