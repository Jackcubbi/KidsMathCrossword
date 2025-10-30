# Math Crossword for Kids 🧮✨

An interactive educational game that combines math practice with crossword puzzles, helping children improve their arithmetic skills through engaging gameplay.

## Features

- **Dual-Equation System**: Each row and column contains TWO mini-equations for enhanced learning
- **9x9 Grid Puzzles**: Appropriately sized challenges for young learners
- **Real-time Validation**: Immediate feedback on correct/incorrect answers
- **Timer & Tracking**: Monitor progress and solve time
- **Difficulty Settings**: Adjustable challenge levels
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Library**: shadcn/ui components + Tailwind CSS
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL (Neon) + Drizzle ORM
- **State Management**: TanStack Query

## Quick Start

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (Neon account recommended)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Jackcubbi/KidsMathCrossword.git
cd MathCross
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

```bash
cp .env.example .env
```

Edit `.env` and add your database credentials:

```env
DATABASE_URL=postgresql://user:password@host:5432 or create neon_postgres database
```

4. Initialize the database:

```bash
npm run db:push
npm run db:seed
```

5. Start development server:

```bash
npm run dev
```

Visit `http://localhost:5000` to play!

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Run production server
- `npm run check` - Type check with TypeScript
- `npm run db:push` - Push database schema
- `npm run db:seed` - Seed puzzles
- `npm run db:studio` - Open Drizzle Studio

## Project Structure

```
MathCross/
├── client/              # React frontend
│   └── src/
│       ├── components/  # UI components
│       ├── hooks/       # Custom React hooks
│       └── pages/       # Page components
├── server/              # Express backend
│   ├── puzzleGenerator.ts  # Core puzzle logic
│   ├── routes.ts           # API endpoints
│   └── storage.ts          # Database operations
├── shared/              # Shared types and schemas
└── dist/                # Production build
```

## Game Mechanics

The game generates puzzles where:

- Each **row** contains 2 horizontal equations
- Each **column** contains 2 vertical equations
- Players fill in missing numbers to complete all equations
- Equations use basic arithmetic: +, -, ×, ÷
- All equations follow proper order of operations

## Development Status

**Current Version**: MVP - Fully functional

- ✅ Dual-equation puzzle generation
- ✅ Interactive grid interface
- ✅ Real-time validation
- ✅ Database persistence
- ✅ Settings modal
- ✅ Success celebration

**Planned Features**:

- User authentication
- Progress tracking
- Leaderboards
- Multiple difficulty levels
- Daily challenges
- Sound effects
- Hint system

## Contributing

This is an educational project. Contributions, issues, and feature requests are welcome!

## License

MIT License - See LICENSE file for details

## Author

**Rostsin Dev**

- GitHub: [@Jackcubbi](https://github.com/Jackcubbi)

---

Made with ❤️ for kids who love math and puzzles!
