/**
 * Clear all puzzles from database
 * Run with: npx tsx server/clear-puzzles.ts
 */

import 'dotenv/config';
import { db } from './db';
import { puzzles } from '../shared/schema';

async function clearPuzzles() {
  console.log('Clearing all puzzles from database...\n');

  try {
    const result = await db.delete(puzzles);
    console.log('✅ All puzzles cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing puzzles:', error);
    process.exit(1);
  }
}

clearPuzzles();
