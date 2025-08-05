import { db } from './server/db';
import { crosswords } from './shared/schema';

async function checkDatabase() {
  try {
    const allCrosswords = await db.select().from(crosswords);
    console.log(`Database contains ${allCrosswords.length} crosswords:`);
    allCrosswords.forEach((crossword, index) => {
      console.log(`${index + 1}. ${crossword.title} (${crossword.gridSize}x${crossword.gridSize})`);
    });
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

checkDatabase();
