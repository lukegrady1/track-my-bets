import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function Bankroll() {
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
              <Link to="/bankroll" className="text-primary font-medium">
                Bankroll
              </Link>
              <Link to="/settings" className="text-gray-600 hover:text-gray-900">
                Settings
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Bankroll Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Bankroll tracking coming soon. This page will display your bankroll history
              and allow you to add manual snapshots.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
