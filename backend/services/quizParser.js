/**
 * Converts AI-generated quiz markdown content into a highly structured JSON format.
 */

function parseQuizMarkdownToJSON(subjectCode, subjectName, content) {
  const title = `${subjectCode} - ${subjectName} Quiz`;
  const questions = [];
  if (!content) return { title, questions };
  
  // Split by question indicators, e.g. "Q1.", "Q2.", or "1.", "2."
  const qBlocks = content.split(/(?:^|\n)\s*(?:Q?\d+[\.\)]|###+\s*Q?\d+[\.\)])/gi);
  
  for (const block of qBlocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    
    const lines = trimmed.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 3) continue;
    
    // First line is the question text
    const questionText = lines[0].replace(/^[\s\-\*\+]+/, '').trim();
    const optionsMap = {};
    let correctLetter = '';
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Match option values like "a) Option text" or "a. Option text"
      const optMatch = line.match(/(?:^|[\s\-]+)([a-d])[\)\.]\s*(.+)/i);
      if (optMatch) {
        const letter = optMatch[1].toLowerCase();
        optionsMap[letter] = optMatch[2].trim();
      }
      
      // Match correct answer indicator like "Correct: b" or "Correct Answer: b" or "[x] b)" or "✅"
      const correctMatch = line.match(/(?:Correct|Answer|Key):\s*([a-d])/i) || line.match(/\[x\]\s*([a-d])/i);
      if (correctMatch) {
        correctLetter = correctMatch[1].toLowerCase();
      } else if (line.includes('✅') || line.toLowerCase().includes('(correct)')) {
        const lineLetterMatch = line.match(/^([a-d])[\)\.]/i);
        if (lineLetterMatch) {
          correctLetter = lineLetterMatch[1].toLowerCase();
        }
      }
    }
    
    // If we didn't parse a correct letter, default search for any parsed choice that had correct signifier
    if (!correctLetter) {
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].includes('✅') || lines[i].toLowerCase().includes('correct')) {
          const letterMatch = lines[i].match(/^\s*([a-d])[\)\.]/i);
          if (letterMatch) {
            correctLetter = letterMatch[1].toLowerCase();
          }
        }
      }
    }
    
    // Default fallback letter if none was parsed
    if (!correctLetter) {
      correctLetter = 'a';
    }
    
    if (questionText && Object.keys(optionsMap).length >= 2) {
      const optionsArray = [];
      let correctAnswerText = '';
      
      // Ensure choices (A, B, C, D) are in order in the array
      const letters = ['a', 'b', 'c', 'd'];
      for (const letter of letters) {
        if (optionsMap[letter]) {
          const optText = optionsMap[letter];
          optionsArray.push(optText);
          if (letter === correctLetter) {
            correctAnswerText = optText;
          }
        }
      }
      
      // If we didn't find the correct answer text because of letter mismatch, default to the first choice
      if (!correctAnswerText && optionsArray.length > 0) {
        correctAnswerText = optionsArray[0];
      }
      
      questions.push({
        question: questionText,
        options: optionsArray,
        correctAnswer: correctAnswerText
      });
    }
  }
  
  return { title, questions };
}

module.exports = {
  parseQuizMarkdownToJSON
};
