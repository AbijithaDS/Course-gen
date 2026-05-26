/**
 * Communicates with the Google Forms REST API using the provided Access Token.
 */

async function createGoogleForm(accessToken, title) {
  console.log(`Creating new Google Form titled "${title}"...`);
  
  const response = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      info: {
        title: title
      }
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Forms Create API failed:', errorText);
    throw new Error(`Google Forms API failed to create form: ${response.statusText} (${errorText})`);
  }
  
  const data = await response.json();
  console.log('Google Form created successfully! Form ID:', data.formId);
  return data; // { formId, responderUri, ... }
}

async function populateGoogleFormQuiz(accessToken, formId, questions) {
  console.log(`Populating Google Form Quiz ${formId} with ${questions.length} questions...`);
  
  const requests = [];
  
  // 1. Enable Quiz Mode
  requests.push({
    updateSettings: {
      settings: {
        quizSettings: {
          isQuiz: true
        }
      },
      updateMask: 'quizSettings.isQuiz'
    }
  });
  
  // 2. Add Name Field
  requests.push({
    createItem: {
      item: {
        title: 'Enter your name',
        questionItem: {
          question: {
            required: true,
            textQuestion: {}
          }
        }
      },
      location: {
        index: 0
      }
    }
  });
  
  // 3. Add SIN/Register Number Field
  requests.push({
    createItem: {
      item: {
        title: 'Enter your SIN',
        questionItem: {
          question: {
            required: true,
            textQuestion: {}
          }
        }
      },
      location: {
        index: 1
      }
    }
  });
  
  // 4. Add MCQ Questions
  const optionLetters = ['A', 'B', 'C', 'D'];
  
  questions.forEach((q, idx) => {
    // Format options with letters, e.g. "A) Option"
    const formattedOptions = q.options.map((opt, oIdx) => {
      const letter = optionLetters[oIdx] || '';
      if (/^[a-d][\)\.]/i.test(opt)) {
        return opt;
      }
      return `${letter}) ${opt}`;
    });
    
    // Find correct answer text
    let formattedCorrectAnswer = q.correctAnswer;
    const correctIdx = q.options.indexOf(q.correctAnswer);
    if (correctIdx !== -1) {
      formattedCorrectAnswer = formattedOptions[correctIdx];
    } else if (formattedOptions.length > 0) {
      formattedCorrectAnswer = formattedOptions[0];
    }
    
    requests.push({
      createItem: {
        item: {
          title: q.question,
          questionItem: {
            question: {
              required: true,
              grading: {
                pointValue: 2,
                correctAnswers: {
                  answers: [
                    { value: formattedCorrectAnswer }
                  ]
                }
              },
              choiceQuestion: {
                type: 'RADIO',
                options: formattedOptions.map(opt => ({ value: opt }))
              }
            }
          }
        },
        location: {
          index: 2 + idx
        }
      }
    });
  });
  
  const response = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: requests
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Forms BatchUpdate API failed:', errorText);
    throw new Error(`Google Forms API failed to populate quiz: ${response.statusText} (${errorText})`);
  }
  
  const data = await response.json();
  console.log(`Google Form Quiz ${formId} populated successfully!`);
  return data;
}

module.exports = {
  createGoogleForm,
  populateGoogleFormQuiz
};
