# Math Crossword App

An interactive educational application that helps kids learn math through engaging crossword puzzles. Built with React, TypeScript, and Express.

## 🎯 Features

- **Interactive Math Crosswords**: Generate custom crossword puzzles with math problems
- **Adaptive Difficulty**: Choose from different difficulty levels and math operations
- **Progress Tracking**: Monitor learning progress with detailed statistics
- **Timer System**: Track solving time for each puzzle
- **PDF Export**: Export puzzles for offline use
- **User Profiles**: Save progress and settings
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for development and building
- **TailwindCSS** for styling
- **Radix UI** for accessible components
- **React Query** for data fetching and caching
- **Wouter** for client-side routing

### Backend

- **Express.js** with TypeScript
- **SQLite** database with better-sqlite3
- **Drizzle ORM** for database operations
- **Session-based authentication** (development mode)
- **Replit OAuth** (production mode)

### Development Tools

- **TypeScript** for type safety
- **ESBuild** for fast compilation
- **Cross-env** for cross-platform environment variables
- **Drizzle Kit** for database migrations

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone ...
   cd KidsMathCrossword
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up the database**

   ```bash
   npm run db:setup
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5000`

## 🚀 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run db:generate` - Generate database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run data migrations
- `npm run db:setup` - Complete database setup (generate + push + migrate)

## 🗂️ Project Structure

```
KidsMathApp/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── ui/         # Radix UI components
│   │   │   ├── CrosswordGrid.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── Timer.tsx
│   │   ├── hooks/          # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   └── use-toast.ts
│   │   ├── lib/            # Utility libraries
│   │   │   ├── crosswordGenerator.ts
│   │   │   ├── pdfExport.ts
│   │   │   └── queryClient.ts
│   │   ├── pages/          # Page components
│   │   │   ├── home.tsx    # Main dashboard
│   │   │   ├── landing.tsx # Landing/login page
│   │   │   └── not-found.tsx
│   │   └── types/          # TypeScript type definitions
│   └── index.html
├── server/                  # Express backend
│   ├── db.ts               # Database connection
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API routes
│   ├── appAuth.ts          # Authentication setup
│   ├── storage.ts          # Database operations
│   └── vite.ts             # Vite integration
├── shared/                  # Shared types and schemas
│   └── schema.ts           # Database schema & TypeScript types
├── database.sqlite         # SQLite database file
├── crosswords.json         # Sample crossword data
└── package.json
```

## 🎮 How to Use

### For Students

1. **Start**: Open the app and click "Get Started"
2. **Generate Puzzle**: Choose difficulty level and math operations
3. **Solve**: Fill in the crossword with correct answers
4. **Track Progress**: View your statistics and improvement over time

### For Teachers/Parents

1. **Customize Settings**: Adjust difficulty and operations based on learning level
2. **Export PDFs**: Print puzzles for offline practice
3. **Monitor Progress**: Track student performance and areas for improvement

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

````env
# Development
NODE_ENV=development

# Database
DATABASE_URL=./database.sqlite

# Session (for production)
SESSION_SECRET=your-secret-key-change-in-production

### Development Mode
- Automatic authentication with mock user
- SQLite database for easy setup
- Hot reload for fast development

## 🎯 Math Operations Supported

- **Addition** (+)
- **Subtraction** (-)
- **Multiplication** (×)
- **Division** (÷)

## 📊 Database Schema

The app uses SQLite with the following main tables:

- **users** - User profiles and information
- **crosswords** - Generated crossword puzzles
- **userCrosswordHistory** - Completion records and scores
- **userSettings** - User preferences and difficulty settings

## 🔐 Authentication

### Development Mode
- Automatic authentication with a mock user
- Session-based state management
- No external dependencies

### Production Mode
- OAuth integration
- Secure token-based authentication
- Session persistence

## 🚀 Deployment

### Building for Production
```bash
npm run build
npm run start
````

### Environment Setup

1. Set up production environment variables
2. Configure Replit OAuth credentials
3. Set secure session secret
4. Deploy to your hosting platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎉 Acknowledgments

- Built with modern web technologies for optimal performance
- Designed with accessibility and usability in mind
- Educational focus on making math fun and engaging

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) section
2. Review the configuration steps
3. Ensure all dependencies are properly installed

---

**Happy Learning! 🧮✨**
