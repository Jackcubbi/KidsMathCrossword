/**
 * Seed script to populate database with multiple puzzles
 * Run with: npx tsx server/seed-puzzles.ts
 */

import 'dotenv/config';
import { storage } from './storage';
import { isDatabaseAvailable } from './db';

async function seedPuzzles() {
  console.log('Starting puzzle seeding...\n');

  if (!isDatabaseAvailable()) {
    console.error('❌ Database not available. Please check your DATABASE_URL.');
    process.exit(1);
  }

  const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];
  const puzzlesPerDifficulty = 10; // Create 10 puzzles for each difficulty

  try {
    for (const difficulty of difficulties) {
      console.log(`\n🎯 Generating ${difficulty.toUpperCase()} puzzles...`);

      for (let i = 1; i <= puzzlesPerDifficulty; i++) {
        try {
          // Generate a unique puzzle
          const puzzleData = await storage.generatePuzzle(difficulty);

          // Save to database
          const puzzle = await storage.createPuzzle({
            difficulty,
            grid: puzzleData.grid,
            solution: puzzleData.solution,
          });

          console.log(`  ✓ Created ${difficulty} puzzle ${i}/${puzzlesPerDifficulty} (ID: ${puzzle.id})`);
        } catch (error) {
          console.error(`  ✗ Failed to create ${difficulty} puzzle ${i}:`, error);
        }
      }
    }

    console.log('\nPuzzle seeding complete!');
    console.log(`\nTotal puzzles created: ${difficulties.length * puzzlesPerDifficulty}`);

    // Show statistics
    console.log('\n📊 Database Statistics:');
    for (const difficulty of difficulties) {
      const puzzles = await storage.getPuzzlesByDifficulty(difficulty);
      console.log(`  ${difficulty.padEnd(6)}: ${puzzles.length} puzzles`);
    }

  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    process.exit(1);
  }

  process.exit(0);
}

seedPuzzles();
