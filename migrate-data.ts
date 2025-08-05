import { db } from './server/db';
import { crosswords } from './shared/schema';
import { readFileSync } from 'fs';

async function migrateCrosswordsFromJson() {
  try {
    console.log('Starting crossword data migration...');

    // Read existing crosswords from JSON file
    const jsonData = JSON.parse(readFileSync('./crosswords.json', 'utf-8'));

    console.log(`Found ${jsonData.length} crosswords to migrate`);

    for (const crossword of jsonData) {
      await db.insert(crosswords).values({
        id: crossword.id,
        title: crossword.title,
        content: crossword.content,
        gridSize: crossword.grid_size || crossword.gridSize || 7,
        numberRange: crossword.number_range || crossword.numberRange || { min: 1, max: 20 },
        operations: crossword.operations || ['+', '-', '×'],
        createdAt: new Date(crossword.created_at || crossword.createdAt || Date.now()),
      }).onConflictDoNothing();
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateCrosswordsFromJson();
