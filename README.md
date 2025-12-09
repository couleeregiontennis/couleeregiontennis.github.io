# Coulee Region Tennis Association Website

## Overview
This is the official website for the Coulee Region Tennis Association (CRTA), providing a platform for managing match schedules, tracking standings, player rankings, team information, and authentication for users.

## Features
- **Match Scheduling & Results**: View and manage match schedules, results, and court locations.
- **Standings & Rankings**: Track real-time player rankings and team standings.
- **Player Profiles**: Detailed profiles for players with resources and rules information.
- **Team Management**: Access team details, captain dashboards, and scheduling tools.
- **Authentication System**: Secure login and access control for users.
- **Announcements**: Display important updates and announcements.

## Tech Stack
- **Frontend**: React.js with Vite build tool
- **Backend**: Supabase (PostgreSQL database with authentication)
- **Styling**: Custom CSS components

## Project Structure
```
ltta-app/
├── src/
│   ├── components/          # React components (Login, MatchSchedule, Standings, etc.)
│   ├── scripts/             # Utility scripts (Auth, Supabase client, ICS generator)
│   ├── styles/              # CSS files for styling components
│   └── hooks/               # Custom React hooks
├── supabase/                # Supabase database schema
└── vite.config.js           # Vite configuration file
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn package manager
- Supabase account (for backend services)

### Installation
1. Clone the repository:
```bash
git clone https://github.com/yourusername/couleeregiontennis.github.io.git
```

2. Install dependencies:
```bash
cd couleeregiontennis.github.io
npm install
```

3. Set up Supabase:
- Create a project on [Supabase](https://supabase.com/)
- Configure environment variables in `.env` file:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

4. Start the development server:
```bash
npm run dev
```

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact
For questions or feedback, please contact:
- Email: [brett@couleeregiontennis.org](mailto:contact@couleeregiontennis.org)
- Website: [www.couleeregiontennis.org](https://www.couleeregiontennis.org)