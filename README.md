# Track My Bets

A modern, responsive React application for tracking sports bets with comprehensive analytics, bankroll management, and data visualization.

## Features

- **Authentication**: Secure email/password authentication with Supabase Auth
- **Bet Tracking**: Manual bet entry with full validation
- **Analytics Dashboard**: Real-time KPIs including P&L, ROI, hit rate, and more
- **Bankroll Management**: Track your bankroll over time
- **CSV Import/Export**: Import bets from sportsbooks or export your data
- **Mobile-First Design**: Fully responsive UI built with Tailwind CSS
- **Accessibility**: ARIA labels, keyboard navigation, and high contrast support

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query for server state
- **Validation**: Zod schemas
- **Backend**: Supabase (Auth + PostgreSQL + RLS)
- **Charts**: Recharts
- **Testing**: Vitest + React Testing Library

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd track-my-bets
```

2. Install dependencies:
```bash
npm install
```

3. Set up your Supabase project:
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Run the SQL script from `supabase/schema.sql` in the Supabase SQL Editor

4. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

5. Add your Supabase credentials to `.env`:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:5173](http://localhost:5173) in your browser

## Database Setup

The database schema includes:
- **user_settings**: User preferences and base unit configuration
- **sportsbooks**: Global and custom sportsbook listings
- **bets**: Complete bet records with calculated fields
- **bet_tags**: Custom tags for organizing bets
- **bankroll_snapshots**: Historical bankroll tracking

All tables include Row Level Security (RLS) policies to ensure data isolation.

## Project Structure

```
track-my-bets/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── kpis/         # KPI cards and metrics
│   │   ├── bets/         # Bet-related components
│   │   └── charts/       # Data visualization
│   ├── pages/            # Page components
│   │   ├── auth/         # Authentication pages
│   │   ├── dashboard/    # Dashboard and bankroll
│   │   ├── bets/         # Bet list, form, detail
│   │   └── settings/     # Settings page
│   ├── lib/              # Utilities and core logic
│   │   ├── supabase.ts   # Supabase client
│   │   ├── odds.ts       # Odds calculations
│   │   ├── queries.ts    # Database queries
│   │   ├── schemas.ts    # Zod validation schemas
│   │   └── utils.ts      # Helper functions
│   ├── features/         # Feature-specific code
│   │   ├── import/       # CSV import
│   │   └── bankroll/     # Bankroll management
│   ├── styles/           # Global styles
│   └── tests/            # Test files
├── supabase/
│   ├── schema.sql        # Database schema
│   └── functions/        # Edge functions
└── public/               # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Lint code

## Key Concepts

### Odds Calculations

The application uses American odds as the primary format and converts to decimal:
- Positive odds (e.g., +150): `decimal = 1 + (odds / 100)`
- Negative odds (e.g., -110): `decimal = 1 + (100 / |odds|)`

### Profit Calculation

- **Won**: `profit = stake * (decimal - 1)`
- **Lost**: `profit = -stake`
- **Push/Void**: `profit = 0`
- **Cashout**: `profit = cashout_amount - stake`

### Units

Units are calculated as: `units = stake / base_unit`

Your base unit is configured during onboarding and can be updated in settings.

### ROI

Return on Investment: `ROI = (Total P&L / Total Staked) * 100`

## Authentication Flow

1. Sign up with email/password
2. Complete onboarding (set base unit and default sportsbook)
3. Access protected routes with authenticated session
4. Session persists across page reloads

## Adding a Bet

1. Navigate to "Add Bet" from dashboard or bets page
2. Fill in required fields:
   - Bet name
   - Sport and market type
   - American odds
   - Stake amount
   - Sportsbook
3. View calculated fields (units, implied probability)
4. Submit to create the bet

## Settling Bets

1. Go to bet detail page
2. Click appropriate status button (Won, Lost, Push, Void)
3. Profit is automatically calculated and recorded

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import repository in Vercel
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

### Other Platforms

The app can be deployed to any static hosting platform that supports Vite:
- Netlify
- Cloudflare Pages
- AWS Amplify

## Security

- All user data is protected by Row Level Security (RLS)
- Authentication handled by Supabase Auth
- Input validation on both client and server
- No sensitive data in localStorage (sessions use httpOnly cookies)

## Disclaimer

**For personal record-keeping only. Not financial advice.**

This application is designed to help you track and analyze your sports betting activity. It does not provide betting recommendations, odds, or any form of gambling advice.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
- Open an issue on GitHub
- Check the documentation in `claude.md`

## Roadmap

- [ ] CSV import with provider detection
- [ ] Advanced filtering and search
- [ ] Bankroll chart visualization
- [ ] Performance breakdown by sport/book/market
- [ ] CLV tracking with closing odds
- [ ] Parlay bet wizard
- [ ] Mobile app with Capacitor
- [ ] Kelly criterion calculator
- [ ] Dark mode
- [ ] Email notifications

---

Built with React, TypeScript, and Supabase