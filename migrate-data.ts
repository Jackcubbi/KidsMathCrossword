import { db } from './server/db';
import { crosswords } from './shared/schema';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

async function migrateCrosswordsFromJson() {
  try {
    console.log('Starting crossword data migration...');

    const jsonFilePath = path.resolve('./crosswords.json');

    // Check if the JSON file exists
    if (!existsSync(jsonFilePath)) {
      console.log('crosswords.json not found, skipping migration.');
      console.log('To add sample data, create a crosswords.json file in the project root.');
      return;
    }

    let jsonData;
    try {
      const fileContent = readFileSync(jsonFilePath, 'utf-8');
      jsonData = JSON.parse(fileContent);
    } catch (parseError) {
      console.error('Failed to parse crosswords.json:', parseError);
      console.log('Please ensure the file contains valid JSON data.');
      return;
    }

    if (!Array.isArray(jsonData)) {
      console.error('crosswords.json must contain an array of crosswords');
      return;
    }

    if (jsonData.length === 0) {
      console.log('crosswords.json is empty, no data to migrate.');
      return;
    }

    console.log(`Found ${jsonData.length} crosswords to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const crossword of jsonData) {
      try {
        // Validate required fields
        if (!crossword.id || !crossword.title || !crossword.content) {
          console.warn(`Skipping crossword with missing required fields:`, crossword.id || 'unknown');
          skippedCount++;
          continue;
        }

        await db.insert(crosswords).values({
          id: crossword.id,
          title: crossword.title,
          content: crossword.content,
          gridSize: crossword.grid_size || crossword.gridSize || 7,
          numberRange: crossword.number_range || crossword.numberRange || { min: 1, max: 20 },
          operations: crossword.operations || ['+', '-', '×'],
          createdAt: new Date(crossword.created_at || crossword.createdAt || Date.now()),
        }).onConflictDoNothing();

        migratedCount++;
      } catch (insertError) {
        console.warn(`Failed to insert crossword ${crossword.id}:`, insertError);
        skippedCount++;
      }
    }

    console.log(`Migration completed! Migrated: ${migratedCount}, Skipped: ${skippedCount}`);
  } catch (error) {
    console.error('Migration failed with unexpected error:', error);
    process.exit(1);
  }
}

// Run migration and handle process exit
migrateCrosswordsFromJson()
  .then(() => {
    console.log('Migration process completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal migration error:', error);
    process.exit(1);
  });
