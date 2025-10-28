import { db, isDatabaseAvailable } from './db';
import { storage } from './storage';

/**
 * Initialize database with default data
 */
export async function initializeDatabase() {
  if (!isDatabaseAvailable()) {
    console.log('Database not available. Skipping initialization.');
    return;
  }

  try {
    console.log('Initializing database...');

    // Check if puzzles already exist
    const existingPuzzles = await storage.getPuzzlesByDifficulty('medium');

    if (existingPuzzles.length === 0) {
      console.log('Creating default puzzle...');

      // Generate and save default puzzle
      const defaultPuzzle = await storage.generatePuzzle('medium');
      await storage.createPuzzle({
        difficulty: 'medium',
        grid: defaultPuzzle.grid,
        solution: defaultPuzzle.solution,
      });

      console.log('Default puzzle created successfully.');
    } else {
      console.log(`Found ${existingPuzzles.length} existing puzzle(s).`);
    }

    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

/**
 * Seed database with sample data (for development)
 */
export async function seedDatabase() {
  if (!isDatabaseAvailable()) {
    console.log('Database not available. Skipping seeding.');
    return;
  }

  try {
    console.log('Seeding database with sample data...');

    // Create sample puzzles for all difficulty levels
    const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];

    for (const difficulty of difficulties) {
      const existing = await storage.getPuzzlesByDifficulty(difficulty);
      if (existing.length === 0) {
        const puzzleData = await storage.generatePuzzle(difficulty);
        await storage.createPuzzle({
          difficulty,
          grid: puzzleData.grid,
          solution: puzzleData.solution,
        });
        console.log(`Created ${difficulty} puzzle.`);
      }
    }

    console.log('Database seeding complete.');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}
