/**
 * Helper to parse a quiz generated markdown content and return standard Apps Script to create it.
 */

function parseQuizMarkdown(content) {
  const questions = [];
  if (!content) return questions;
  
  // Split by question indicators, e.g. "Q1.", "Q2.", or "1.", "2."
  const qBlocks = content.split(/(?:^|\n)\s*(?:Q?\d+[\.\)]|###+\s*Q?\d+[\.\)])/gi);
  
  for (const block of qBlocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    
    const lines = trimmed.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 3) continue;
    
    // First line is the question text
    const questionText = lines[0].replace(/^[\s\-\*\+]+/, '').trim();
    const options = {};
    let correctLetter = '';
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Match option values like "a) Option text" or "a. Option text" or "- [ ] a) Option text"
      const optMatch = line.match(/(?:^|[\s\-]+)([a-d])[\)\.]\s*(.+)/i);
      if (optMatch) {
        const letter = optMatch[1].toLowerCase();
        options[letter] = optMatch[2].trim();
      }
      
      // Match correct answer indicator like "Correct: b" or "Correct Answer: b" or "[x] b)" or "✅"
      const correctMatch = line.match(/(?:Correct|Answer|Key):\s*([a-d])/i) || line.match(/\[x\]\s*([a-d])/i);
      if (correctMatch) {
        correctLetter = correctMatch[1].toLowerCase();
      } else if (line.includes('✅') || line.toLowerCase().includes('(correct)')) {
        // Fallback: If option text has green checkmark or (correct), find option letter in that line
        const lineLetterMatch = line.match(/^([a-d])[\)\.]/i);
        if (lineLetterMatch) {
          correctLetter = lineLetterMatch[1].toLowerCase();
        }
      }
    }
    
    // If we didn't parse a correct letter, default to 'a' or search for any parsed choice that had correct signifier
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
    
    if (questionText && Object.keys(options).length >= 2) {
      questions.push({
        question: questionText,
        options: options,
        correct: correctLetter || 'a' // Fallback to 'a' if not parsed
      });
    }
  }
  
  return questions;
}

function generateGoogleAppsScript(subjectCode, subjectName, content) {
  const questions = parseQuizMarkdown(content);
  
  let scriptContent = `/**
 * Google Apps Script to automatically generate a high-fidelity Google Form Quiz.
 * 
 * Instructions:
 * 1. Open Google Drive (drive.google.com).
 * 2. Click "+ New" > "More" > "Google Apps Script" (or go to script.google.com).
 * 3. Delete any default code in the editor and paste this entire script.
 * 4. Click the "Save" icon, then click the "Run" button at the top.
 * 5. Grant the necessary permissions when prompted (it will ask to view and manage your Forms).
 * 6. The form will be created in your Google Drive. Check the execution log at the bottom for the link!
 */

function createGoogleFormQuiz() {
  var formTitle = "${subjectCode} - ${subjectName} Quiz";
  var form = FormApp.create(formTitle);
  form.setIsQuiz(true);
  form.setConfirmationMessage("Your response has been recorded successfully. Thank you!");
  form.setPublishingSummary(true);
  
  // Section 1: Student Metadata
  var nameItem = form.addTextItem();
  nameItem.setTitle("Enter your name")
          .setRequired(true);
          
  var sinItem = form.addTextItem();
  sinItem.setTitle("Enter your SIN")
        .setRequired(true);
        
  // Section 2: Multiple Choice Questions
`;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const choicesStr = Object.keys(q.options).map(opt => {
      const isCorrect = opt.toLowerCase() === q.correct.toLowerCase();
      const escapedText = q.options[opt].replace(/"/g, '\\"');
      return `      qItem${i}.createChoice("${opt.toUpperCase()}) ${escapedText}", ${isCorrect})`;
    }).join(',\n');
    
    const escapedQuestion = q.question.replace(/"/g, '\\"');
    
    scriptContent += `
  // Question ${i + 1}
  var qItem${i} = form.addMultipleChoiceItem();
  qItem${i}.setTitle("${escapedQuestion}")
         .setChoices([
${choicesStr}
         ])
         .setPoints(2)
         .setRequired(true);
`;
  }
  
  scriptContent += `
  Logger.log("\\n========================================================");
  Logger.log("🎉 SUCCESS! YOUR GOOGLE FORM QUIZ HAS BEEN CREATED.");
  Logger.log("Form Title: " + formTitle);
  Logger.log("Edit URL (to modify questions): " + form.getEditUrl());
  Logger.log("Published URL (to send to students): " + form.getPublishedUrl());
  Logger.log("========================================================\\n");
}
`;

  return scriptContent;
}

module.exports = {
  generateGoogleAppsScript,
  parseQuizMarkdown
};
