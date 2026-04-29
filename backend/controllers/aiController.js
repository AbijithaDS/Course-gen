const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.generateContent = async (req, res) => {
  try {
    const { department, semester, subject, type } = req.body;

    if (!department || !semester || !subject || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server' });
    }

    console.log(`Generating ${type} content for ${subject} (${department}, Sem ${semester})`);

    // Define prompts based on type
    let promptInstruction = '';
    switch (type) {
      case 'cia1':
        promptInstruction = 'Generate a Continuous Internal Assessment 1 (CIA 1) question paper. Include Part A (short answers) and Part B (long answers).';
        break;
      case 'cia2':
        promptInstruction = 'Generate a Continuous Internal Assessment 2 (CIA 2) question paper. Include Part A (short answers) and Part B (long answers).';
        break;
      case 'qbank':
        promptInstruction = 'Generate a comprehensive Question Bank with unit-wise categorization. Include 2-mark and 16-mark questions.';
        break;
      case 'quiz':
        promptInstruction = 'Generate 15 multiple-choice questions (MCQs) for a quiz, along with the correct answers.';
        break;
      case 'hots':
        promptInstruction = 'Generate 5 Higher Order Thinking Skills (HOTS) questions that require critical analysis and application of concepts.';
        break;
      case 'assignment':
        promptInstruction = 'Generate 3 practical assignment questions/scenarios that require students to research or build something.';
        break;
      case 'beyond':
        promptInstruction = 'List 3 topics that are beyond the standard syllabus for this subject but are highly relevant to current industry trends, and explain why they are important.';
        break;
      default:
        promptInstruction = 'Generate general academic content for this subject.';
    }

    const prompt = `
    You are an expert academic professor.
    
    Subject: ${subject}
    Department: ${department} Engineering
    Semester: ${semester}
    
    Task: ${promptInstruction}
    
    Format the output cleanly in Markdown format. Do not use generic introductions, just provide the content directly.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const generatedText = response.text;

    res.status(200).json({
      success: true,
      generatedText
    });
    
  } catch (error) {
    console.error('Error in generateContent:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate content', 
      details: error.message 
    });
  }
};
