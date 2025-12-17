# Math Crossword for Kids 🧮✨

An interactive educational game that combines math practice with crossword puzzles, helping children improve their arithmetic skills through engaging gameplay.
<img width="880" height="889" alt="image" src="https://github.com/user-attachments/assets/0478f4f5-d86e-472a-b0fc-9d50746357e5" />

## Features

### Core Gameplay

- **Multiple Grid Sizes**: 5x5 (Easy), 7x7 (Medium), 9x9 (Hard) puzzles with adaptive difficulty
- **Dual-Equation System**: Each row and column contains TWO mini-equations for enhanced learning
- **Real-time Validation**: Immediate feedback on correct/incorrect answers with equation status indicators
- **Smart Hint System**: Randomized hints to help when stuck
- **Timer & Tracking**: Monitor progress and solve time with accurate session tracking

### User Experience

- **Guest Mode**: Play without registration
- **User Authentication**: Create an account to save progress and track statistics
- **Difficulty Settings**: Three levels with varying grid sizes and complexity
- **Statistics Dashboard**: Track puzzles solved, completion times, and hints used
- **Responsive Design**: Optimized for desktop and mobile devices
- **Dark Mode Support**: Modern UI with shadcn/ui components

### Puzzle Generation

- **Random Given Numbers**: Each puzzle has a unique pattern of pre-filled cells (35-45% given)
- **Fresh Puzzles**: Every "New Game" generates a completely new puzzle
- **Order of Operations**: All equations follow proper mathematical rules
- **Validation System**: Separate horizontal and vertical equation checking

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

**Current Version**: v1.0 - Production Ready

### ✅ Completed Features

**Puzzle System**:

- Random given numbers positioning for all grid sizes
- Fresh puzzle generation on every New Game
- 5x5, 7x7, and 9x9 grid support
- Dual-equation validation (horizontal & vertical)

**Game Mechanics**:

- Interactive grid with input validation
- Smart hint system with randomized cell selection
- Timer with proper state management
- Game session tracking for guests and registered users
- Equation status visualization

**User Interface**:

- Responsive design with Tailwind CSS
- Modern UI components from shadcn/ui
- Success modal with statistics
- Settings panel with difficulty selection
- Statistics sidebar

**Backend**:

- User authentication (login/register)
- Guest user support
- PostgreSQL database with Drizzle ORM
- RESTful API endpoints
- Session management

### 🚀 Planned Features

- Advanced difficulty modes with more complex equations
- Daily challenges and puzzle of the day
- Leaderboards and competitive modes
- Achievement system
- Sound effects and animations
- Mobile app version
- Multiplayer mode
- Tutorial mode for beginners

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Anatoli Rostsin**

- GitHub: [@Jackcubbi](https://github.com/Jackcubbi)
- Project Link: [https://github.com/Jackcubbi/KidsMathCrossword](https://github.com/Jackcubbi/KidsMathCrossword)

## Acknowledgments

- Built with [React](https://reactjs.org/) and [TypeScript](https://www.typescriptlang.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database hosting on [Neon](https://neon.tech/)
- Icons from [Lucide](https://lucide.dev/)

---

Made with ❤️ for kids who love math and puzzles!
