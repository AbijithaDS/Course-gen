const { GoogleGenAI } = require('@google/genai');
const db = require('../data/db');

// Safe imports since we might fall back to standard fetch for Groq
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

exports.generateContent = async (req, res) => {
  try {
    const { department, semester, subject, type, regulation, generatedBy } = req.body;

    if (!department || !semester || !subject || !type || !regulation) {
      return res.status(400).json({ error: 'Missing required fields: department, semester, subject, type, and regulation are required' });
    }

    // Check if at least one API key is set
    if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'Neither GEMINI_API_KEY nor GROQ_API_KEY is configured on the server' });
    }

    const sCode = subject.code || 'N/A';
    const sName = typeof subject === 'object' ? subject.name : subject;

    console.log(`AI Request: Type=${type} for ${sName} (${department}, Sem ${semester}, Reg ${regulation})`);

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
    
    Subject: ${sCode} - ${sName}
    Department: ${department} Engineering
    Semester: ${semester}
    Academic Regulation: ${regulation}
    
    Task: ${promptInstruction}
    
    Format the output cleanly in Markdown format. Do not use generic introductions, just provide the content directly.
    `;

    let generatedText = '';
    let usedModel = '';

    // --- Dual Model Execution Logic ---

    // 1. Attempt Primary Model: Gemini
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log('Attempting primary generation via Gemini 2.5 Flash...');
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        if (response && response.text) {
          generatedText = response.text;
          usedModel = 'gemini-2.5-flash';
          console.log('Gemini generation successful!');
        }
      } catch (geminiError) {
        console.warn('Gemini primary generation failed. Error:', geminiError.message);
      }
    }

    // 2. Fallback to Secondary Model: Groq (Llama 3.3 70B)
    if (!generatedText && process.env.GROQ_API_KEY) {
      try {
        console.log('Attempting secondary fallback generation via Groq (llama-3.3-70b-versatile)...');
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'user', content: prompt }
            ],
            temperature: 0.7
          })
        });

        if (groqResponse.ok) {
          const groqData = await groqResponse.json();
          if (groqData.choices && groqData.choices[0] && groqData.choices[0].message) {
            generatedText = groqData.choices[0].message.content;
            usedModel = 'groq/llama-3.3-70b-versatile';
            console.log('Groq fallback generation successful!');
          }
        } else {
          const errData = await groqResponse.json();
          console.error('Groq API error response:', errData);
        }
      } catch (groqError) {
        console.error('Groq secondary fallback generation failed. Error:', groqError.message);
      }
    }

    // Handle case where both providers failed
    if (!generatedText) {
      return res.status(502).json({
        success: false,
        error: 'Failed to generate content',
        details: 'Both primary model (Gemini) and secondary model (Groq) failed or returned empty results.'
      });
    }

    // Estimate word count
    const wordCount = generatedText.trim().split(/\s+/).length;

    // Save transaction logs
    try {
      const generations = db.readData('generatedContent');
      const newGeneration = {
        id: 'GEN' + Date.now(),
        subjectCode: sCode,
        subjectName: sName,
        departmentId: department,
        semester: parseInt(semester, 10),
        regulation: regulation,
        type: type,
        content: generatedText,
        generatedBy: generatedBy || 'anonymous',
        timestamp: new Date().toISOString(),
        wordCount: wordCount,
        model: usedModel
      };
      generations.push(newGeneration);
      db.writeData('generatedContent', generations);
    } catch (saveError) {
      console.error('Failed to log generated content to database:', saveError);
    }

    res.status(200).json({
      success: true,
      generatedText,
      model: usedModel
    });
    
  } catch (error) {
    console.error('General server error in generateContent:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate content', 
      details: error.message 
    });
  }
};
