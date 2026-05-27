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

    let promptInstruction = '';
    switch (type) {
      case 'cia1':
        promptInstruction = `Generate a Continuous Internal Assessment 1 (CIA 1) question paper.
        Syllabus Coverage: First half of the syllabus (Unit 1 fully, Unit 2 fully, and the first half of Unit 3).
        
        Total Marks: 60 Marks
        Time Allowed: 2 Hours
        
        Format the question paper strictly as follows (ONLY Part A and Part B, NO Part C):
        
        ### Part A (10 x 2 = 20 Marks)
        ANSWER ALL THE QUESTIONS
        * 10 questions (Questions 1 to 10), each worth 2 marks.
        * Format each question as: "1. <question text>"
        * Questions 1-2 should map to CO3, Questions 3-6 to CO4, Questions 7-10 to CO5.
        * Provide brief, clear questions covering Units 1, 2, and the first half of Unit 3. Do not include answers.
        
        ### Part B (2 x 16 = 32 Marks & 1 x 8 = 8 Marks)
        ANSWER ALL THE QUESTIONS
        * This section has 3 questions (Q11, Q12, Q13), each with Either/Or options (a or b).
        * Question 11 (16 marks, CO4, K4):
          - 11a. Single comprehensive question for 16 marks.
          - OR
          - 11b. Single comprehensive question for 16 marks.
        * Question 12 (16 marks, CO5, K3):
          - 12a. Single comprehensive question for 16 marks.
          - OR
          - 12b. Single comprehensive question for 16 marks.
        * Question 13 (8 marks, CO3, K3):
          - 13a. Analytical/application question for 8 marks.
          - OR
          - 13b. Analytical/application question for 8 marks.
          
        IMPORTANT: Total marks must be exactly 60 (Part A: 20 + Part B: 32 + 8 = 40). There is NO Part C. Question 13 is inside Part B.
        Format the output cleanly in professional academic layout using Markdown.`;
        break;
      case 'cia2':
        promptInstruction = `Generate a Continuous Internal Assessment 2 (CIA 2) question paper.
        Syllabus Coverage: Second half of the syllabus (remaining topics of Unit 3 fully, Unit 4 fully, and Unit 5 fully).
        
        Total Marks: 60 Marks
        Time Allowed: 2 Hours
        
        Format the question paper strictly as follows (ONLY Part A and Part B, NO Part C):
        
        ### Part A (10 x 2 = 20 Marks)
        ANSWER ALL THE QUESTIONS
        * 10 questions (Questions 1 to 10), each worth 2 marks.
        * Format each question as: "1. <question text>"
        * Questions 1-2 should map to CO3, Questions 3-6 to CO4, Questions 7-10 to CO5.
        * Provide brief, clear questions covering the second half of Unit 3, Unit 4, and Unit 5. Do not include answers.
        
        ### Part B (2 x 16 = 32 Marks & 1 x 8 = 8 Marks)
        ANSWER ALL THE QUESTIONS
        * This section has 3 questions (Q11, Q12, Q13), each with Either/Or options (a or b).
        * Question 11 (16 marks, CO4, K4):
          - 11a. Single comprehensive question for 16 marks.
          - OR
          - 11b. Single comprehensive question for 16 marks.
        * Question 12 (16 marks, CO5, K3):
          - 12a. Single comprehensive question for 16 marks.
          - OR
          - 12b. Single comprehensive question for 16 marks.
        * Question 13 (8 marks, CO3, K3):
          - 13a. Analytical/application question for 8 marks.
          - OR
          - 13b. Analytical/application question for 8 marks.
          
        IMPORTANT: Total marks must be exactly 60 (Part A: 20 + Part B: 32 + 8 = 40). There is NO Part C. Question 13 is inside Part B.
        Format the output cleanly in professional academic layout using Markdown.`;
        break;
      case 'qbank':
        promptInstruction = `Generate a comprehensive Question Bank covering all 5 units of the syllabus.
        For each Unit (Unit I to Unit V), you must generate exactly:
        - 5 questions of 2 marks (Short Answer)
        - 4 questions of 16 marks (Long Answer)
        
        Strictly use the following format for each unit:
        
        ### Unit <Roman Numeral>: <Unit Title>
        
        **2-Mark Questions:**
        1. <Question Text>
        2. <Question Text>
        3. <Question Text>
        4. <Question Text>
        5. <Question Text>
        
        **16-Mark Questions:**
        1. <Question Text>
        2. <Question Text>
        3. <Question Text>
        4. <Question Text>
        
        Do not include answers. Ensure the questions cover the respective unit syllabus thoroughly.`;
        break;
      case 'quiz':
        promptInstruction = `Generate exactly 15 multiple-choice questions (MCQs) for a quiz.
        Each question must have exactly 4 choices (a, b, c, d) and specify the correct answer.
        
        Strictly use the following format for each question:
        
        Q1. <Question Text>
        a) <Option A>
        b) <Option B>
        c) <Option C>
        d) <Option D>
        Correct: <Option Letter (a, b, c, or d)>
        
        Ensure that the questions cover the subject syllabus comprehensively. Do not include any extra text outside of the questions.`;
        break;
      case 'hots':
        promptInstruction = `Generate exactly 10 Higher Order Thinking Skills (HOTS) questions for each of the 5 Units of the syllabus (a total of 50 questions).
        These questions must require critical analysis, design, evaluation, or application of concepts.
        
        Strictly format the output as follows (reset numbering to 1-10 for each Unit, do not include options, do not include answers):
        
        ### Unit I: <Unit Title>
        1. <Question Text>
        2. <Question Text>
        3. <Question Text>
        4. <Question Text>
        5. <Question Text>
        6. <Question Text>
        7. <Question Text>
        8. <Question Text>
        9. <Question Text>
        10. <Question Text>
        
        ### Unit II: <Unit Title>
        1. <Question Text>
        2. <Question Text>
        3. <Question Text>
        4. <Question Text>
        5. <Question Text>
        6. <Question Text>
        7. <Question Text>
        8. <Question Text>
        9. <Question Text>
        10. <Question Text>
        
        ### Unit III: <Unit Title>
        1. <Question Text>
        2. <Question Text>
        3. <Question Text>
        4. <Question Text>
        5. <Question Text>
        6. <Question Text>
        7. <Question Text>
        8. <Question Text>
        9. <Question Text>
        10. <Question Text>
        
        ### Unit IV: <Unit Title>
        1. <Question Text>
        2. <Question Text>
        3. <Question Text>
        4. <Question Text>
        5. <Question Text>
        6. <Question Text>
        7. <Question Text>
        8. <Question Text>
        9. <Question Text>
        10. <Question Text>
        
        ### Unit V: <Unit Title>
        1. <Question Text>
        2. <Question Text>
        3. <Question Text>
        4. <Question Text>
        5. <Question Text>
        6. <Question Text>
        7. <Question Text>
        8. <Question Text>
        9. <Question Text>
        10. <Question Text>
        
        Do not write any introductory or concluding text.`;
        break;
      case 'assignment':
        const assignmentCount = Math.max(1, Math.min(200, req.body.assignmentCount ? parseInt(req.body.assignmentCount, 10) : 5));
        promptInstruction = `Generate exactly ${assignmentCount} practical assignment questions/scenarios (maximum ${assignmentCount}) that require students to research, analyze, or build something related to this subject.
        
        Strictly format the output as a numbered list from 1 to ${assignmentCount}:
        1. <Question/Scenario Text>
        2. <Question/Scenario Text>
        ...
        ${assignmentCount}. <Question/Scenario Text>
        
        Do not write any introductory or concluding text.`;
        break;
      case 'beyond':
        promptInstruction = `Generate exactly 5 relevant "Beyond-the-Syllabus" topics for each of the 5 Units of the syllabus (a total of 25 topics).
        These topics must be highly relevant to current industry trends and modern technologies related to this subject.
        
        Strictly format the output as follows (do not skip any Unit, ensure all 5 units are generated, and numbering runs sequentially from 1 to 25 across the entire document):
        
        ### Unit I: <Unit Title>
        Beyond-the-Syllabus Topics:
        1. <Topic Name> – <Brief description of why it is important and its real-world application>
        2. <Topic Name> – <Brief description>
        3. <Topic Name> – <Brief description>
        4. <Topic Name> – <Brief description>
        5. <Topic Name> – <Brief description>
        
        ### Unit II: <Unit Title>
        Beyond-the-Syllabus Topics:
        6. <Topic Name> – <Brief description>
        7. <Topic Name> – <Brief description>
        8. <Topic Name> – <Brief description>
        9. <Topic Name> – <Brief description>
        10. <Topic Name> – <Brief description>
        
        ### Unit III: <Unit Title>
        Beyond-the-Syllabus Topics:
        11. <Topic Name> – <Brief description>
        12. <Topic Name> – <Brief description>
        13. <Topic Name> – <Brief description>
        14. <Topic Name> – <Brief description>
        15. <Topic Name> – <Brief description>
        
        ### Unit IV: <Unit Title>
        Beyond-the-Syllabus Topics:
        16. <Topic Name> – <Brief description>
        17. <Topic Name> – <Brief description>
        18. <Topic Name> – <Brief description>
        19. <Topic Name> – <Brief description>
        20. <Topic Name> – <Brief description>
        
        ### Unit V: <Unit Title>
        Beyond-the-Syllabus Topics:
        21. <Topic Name> – <Brief description>
        22. <Topic Name> – <Brief description>
        23. <Topic Name> – <Brief description>
        24. <Topic Name> – <Brief description>
        25. <Topic Name> – <Brief description>
        
        Do not write any introductory or concluding text. Write the content directly matching the requested structure.`;
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
    
    STRICT INSTRUCTIONS:
    - Generate only question text.
    - Do NOT append CO mappings.
    - Do NOT append Bloom's taxonomy levels.
    - Do NOT append (COx) or (Kx) inside question statements.
    - CO and K values will be handled separately by the application.
    
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
