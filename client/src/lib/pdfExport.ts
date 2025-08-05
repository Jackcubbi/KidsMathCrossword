import jsPDF from 'jspdf';
import type { CrosswordData } from '@/types/crossword';

export function exportToPDF(crossword: CrosswordData, userName: string) {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Title
  pdf.setFontSize(20);
  pdf.text(crossword.title, pageWidth / 2, 30, { align: 'center' });
  
  // User info
  pdf.setFontSize(12);
  pdf.text(`Exported for: ${userName}`, 20, 50);
  pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 65);
  pdf.text(`Grid Size: ${crossword.gridSize}×${crossword.gridSize}`, 20, 80);
  pdf.text(`Operations: ${crossword.operations.join(', ')}`, 20, 95);
  pdf.text(`Number Range: ${crossword.numberRange.min}-${crossword.numberRange.max}`, 20, 110);
  
  // Grid
  const cellSize = 20;
  const startX = (pageWidth - (crossword.gridSize * cellSize)) / 2;
  const startY = 130;
  
  pdf.setFontSize(14);
  
  // Draw grid
  for (let row = 0; row < crossword.gridSize; row++) {
    for (let col = 0; col < crossword.gridSize; col++) {
      const x = startX + (col * cellSize);
      const y = startY + (row * cellSize);
      
      // Draw cell border
      pdf.rect(x, y, cellSize, cellSize);
      
      const cell = crossword.content.grid[row][col];
      
      if (!cell.editable && cell.value) {
        // Fill readonly cells with light gray
        pdf.setFillColor(240, 240, 240);
        pdf.rect(x, y, cellSize, cellSize, 'F');
        pdf.rect(x, y, cellSize, cellSize); // Redraw border
        
        // Add text
        pdf.text(cell.value, x + cellSize/2, y + cellSize/2 + 2, { align: 'center' });
      } else if (cell.editable) {
        // Leave editable cells empty for solving
        pdf.setFillColor(255, 255, 255);
        pdf.rect(x, y, cellSize, cellSize, 'F');
        pdf.rect(x, y, cellSize, cellSize); // Redraw border
      }
    }
  }
  
  // Instructions
  const instructionsY = startY + (crossword.gridSize * cellSize) + 30;
  pdf.setFontSize(12);
  pdf.text('Instructions:', 20, instructionsY);
  pdf.setFontSize(10);
  pdf.text('• Fill in the empty cells to complete the mathematical equations', 20, instructionsY + 15);
  pdf.text('• Each row and column should form a valid mathematical expression', 20, instructionsY + 25);
  pdf.text('• Use the operations shown to solve each equation', 20, instructionsY + 35);
  
  // Save the PDF
  pdf.save(`math-crossword-${crossword.gridSize}x${crossword.gridSize}-${Date.now()}.pdf`);
}
