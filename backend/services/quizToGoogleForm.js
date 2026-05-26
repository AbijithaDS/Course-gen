const quizParser = require('./quizParser');
const googleFormService = require('./googleFormService');

async function createFormFromQuiz(accessToken, subjectCode, subjectName, content) {
  console.log(`Starting Google Form Quiz creation workflow for ${subjectCode}...`);
  
  // 1. Parse markdown content to structured JSON
  const quizData = quizParser.parseQuizMarkdownToJSON(subjectCode, subjectName, content);
  console.log(`Successfully parsed ${quizData.questions.length} structured quiz questions.`);
  
  if (quizData.questions.length === 0) {
    throw new Error('No valid questions parsed from the quiz content. Please make sure the generated quiz contains MCQs in standard Q1. a) b) c) d) Correct: format.');
  }
  
  // 2. Create Google Form
  const formInfo = await googleFormService.createGoogleForm(accessToken, quizData.title);
  
  // 3. Populate Google Form Quiz items
  await googleFormService.populateGoogleFormQuiz(accessToken, formInfo.formId, quizData.questions);
  
  // 4. Formulate response links
  const editUrl = `https://docs.google.com/forms/d/${formInfo.formId}/edit`;
  const responderUri = formInfo.responderUri; // Published Link
  
  return {
    success: true,
    formId: formInfo.formId,
    editUrl: editUrl,
    responderUri: responderUri
  };
}

module.exports = {
  createFormFromQuiz
};
