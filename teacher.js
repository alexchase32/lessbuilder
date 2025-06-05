class LessonBuilder {
  constructor() {
    this.currentLesson = {
      name: '',
      date: '',
      blocks: []
    };
    this.currentConfigBlock = null; // Track which block is being configured
    this.loadLesson();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Form submission
    document.getElementById('lessonForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.currentLesson.name = document.getElementById('lessonName').value;
      this.currentLesson.date = document.getElementById('lessonDate').value;
      this.saveLesson();
    });

    // Drag and drop
    const draggables = document.querySelectorAll('.draggable');
    const dropZone = document.getElementById('dropZone');

    draggables.forEach(draggable => {
      draggable.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', e.target.dataset.type);
      });
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const blockType = e.dataTransfer.getData('text/plain');
      this.addBlock(blockType);
    });
  }

  addBlock(type) {
    const block = {
      id: Date.now(),
      type,
      config: {}
    };

    this.currentLesson.blocks.push(block);
    this.renderBlock(block);
  }

  renderBlock(block) {
    const container = document.getElementById('blockContainer');
    const blockElement = document.createElement('div');
    blockElement.className = 'learning-block';
    blockElement.innerHTML = `
      <h5>${block.type.charAt(0).toUpperCase() + block.type.slice(1)} Exercise</h5>
      <p>Click to configure</p>
    `;
    
    blockElement.addEventListener('click', () => this.showConfig(block));
    container.appendChild(blockElement);
  }

  showConfig(block) {
    const modal = new bootstrap.Modal(document.getElementById('configModal'));
    const configForm = document.getElementById('configForm');
    
    this.currentConfigBlock = block; // Store reference to current block being configured
    configForm.innerHTML = this.getConfigForm(block);
    
    configForm.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveBlockConfig(block, e.target);
      modal.hide();
    });
    
    modal.show();
  }

  getConfigForm(block) {
    if (block.type === 'flashcard') {
      return `
        <form>
          <div class="mb-3">
            <label class="form-label">Instructions</label>
            <input type="text" class="form-control" name="instructions" value="${block.config.instructions || 'Translate the English words to Spanish'}" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Time Limit (seconds)</label>
            <input type="number" class="form-control" name="timeLimit" value="${block.config.timeLimit || 300}" required>
          </div>
          <div id="cardPairs">
            <h6>Card Pairs</h6>
            ${this.getCardPairInputs(block.config.cards || [])}
          </div>
          <button type="button" class="btn btn-secondary" onclick="lessonBuilder.addCardPair()">Add Card Pair</button>
          <button type="submit" class="btn btn-primary mt-3">Save Configuration</button>
        </form>
      `;
    } else if (block.type === 'translation') {
      return `
        <form>
          <div class="mb-3">
            <label class="form-label">Instructions</label>
            <input type="text" class="form-control" name="instructions" value="${block.config.instructions || 'Translate the following sentences'}" required>
          </div>
          
          <div id="translationQuestions">
            <h6>Translation Questions</h6>
            ${this.getTranslationQuestionInputs(block.config.sentences || [])}
          </div>
          <button type="button" class="btn btn-secondary" onclick="lessonBuilder.addTranslationQuestion()">Add Question</button>
          <button type="submit" class="btn btn-primary mt-3">Save Configuration</button>
        </form>
      `;
    } else if (block.type === 'hotspot') {
      return `
        <form>
          <div class="mb-3">
            <label class="form-label">Title</label>
            <input type="text" class="form-control" name="title" value="${block.config.title || 'Learn Body Parts'}" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Instructions</label>
            <input type="text" class="form-control" name="instructions" value="${block.config.instructions || 'Click on the hotspots to learn'}" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Background Image URL</label>
            <input type="text" class="form-control" name="backgroundImage" value="${block.config.backgroundImage || ''}" required>
          </div>
          <div class="mb-3">
            <p>Preview and Add Hotspots:</p>
            <div id="hotspotEditor" style="position: relative; width: 600px; height: 400px; border: 1px solid #ccc; background-size: contain; background-repeat: no-repeat; background-position: center; margin-bottom: 15px;"></div>
            <button type="button" class="btn btn-secondary" onclick="lessonBuilder.addHotspot()">Add Hotspot</button>
          </div>
          <div id="hotspotsContainer">
            <h6>Hotspot Configuration</h6>
            ${this.getHotspotInputs(block.config.hotspots || [])}
          </div>
          <button type="submit" class="btn btn-primary mt-3">Save Configuration</button>
        </form>
      `;
    } else if (block.type === 'highlightwords') {
      return `
        <form>
          <div class="mb-3">
            <label class="form-label">Instructions</label>
            <input type="text" class="form-control" name="instructions" value="${block.config.instructions || 'Highlight the words that answer the question'}" required>
          </div>
          
          <div id="highlightExercises">
            <h6>Highlight Exercises</h6>
            ${this.getHighlightExerciseInputs(block.config.exercises || [])}
          </div>
          <button type="button" class="btn btn-secondary" onclick="lessonBuilder.addHighlightExercise()">Add Exercise</button>
          <button type="submit" class="btn btn-primary mt-3">Save Configuration</button>
        </form>
      `;
    } else if (block.type === 'imageclick') {
      return `
        <form>
          <div class="mb-3">
            <label class="form-label">Instructions</label>
            <input type="text" class="form-control" name="instructions" value="${block.config.instructions || 'Click on the correct image and place it in the corresponding box'}" required>
          </div>
          
          <div class="mb-3">
            <h6>Images (URLs, comma-separated)</h6>
            <input type="text" class="form-control" name="images" value="${block.config.images ? block.config.images.join(', ') : ''}" required>
            <small class="form-text text-muted">Enter 5 image URLs separated by commas</small>
          </div>
          
          <div id="imageClickQuestions">
            <h6>Image Click Questions</h6>
            ${this.getImageClickQuestionInputs(block.config.questions || [])}
          </div>
          <button type="button" class="btn btn-secondary" onclick="lessonBuilder.addImageClickQuestion()">Add Question</button>
          <button type="submit" class="btn btn-primary mt-3">Save Configuration</button>
        </form>
      `;
    } else if (block.type === 'dialogue') {
      return `
        <form>
          <div class="mb-3">
            <label class="form-label">Instructions</label>
            <input type="text" class="form-control" name="instructions" value="${block.config.instructions || 'Practice the following dialogues in Spanish'}" required>
          </div>
          
          <div id="dialogueExercises">
            <h6>Dialogue Exercises</h6>
            ${this.getDialogueExerciseInputs(block.config.dialogues || [])}
          </div>
          <button type="button" class="btn btn-secondary" onclick="lessonBuilder.addDialogueExercise()">Add Dialogue</button>
          <button type="submit" class="btn btn-primary mt-3">Save Configuration</button>
        </form>
      `;
    } else if (block.type === 'accent') {
      return `
        <form>
          <div class="mb-3">
            <label class="form-label">Title</label>
            <input type="text" class="form-control" name="title" value="${block.config.title || 'Spanish Accent Practice'}" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Instructions</label>
            <input type="text" class="form-control" name="instructions" value="${block.config.instructions || 'Click on the letters that need accents'}" required>
          </div>
          
          <div id="accentSentences">
            <h6>Sentences</h6>
            ${this.getAccentSentenceInputs(block.config.sentences || [])}
          </div>
          <button type="button" class="btn btn-secondary" onclick="lessonBuilder.addAccentSentence()">Add Sentence</button>
          <button type="submit" class="btn btn-primary mt-3">Save Configuration</button>
        </form>
      `;
    } else if (block.type === 'pickpicture') {
      return `
        <form>
          <div class="mb-3">
            <label class="form-label">Title</label>
            <input type="text" class="form-control" name="title" value="${block.config.title || 'Pick the Picture'}" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Instructions</label>
            <input type="text" class="form-control" name="instructions" value="${block.config.instructions || 'Click on the image(s) that visually represent the verb'}" required>
          </div>
          
          <div id="pickPictureExercises">
            <h6>Exercises</h6>
            ${this.getPickPictureExerciseInputs(block.config.exercises || [])}
          </div>
          <button type="button" class="btn btn-secondary" onclick="lessonBuilder.addPickPictureExercise()">Add Exercise</button>
          <button type="submit" class="btn btn-primary mt-3">Save Configuration</button>
        </form>
      `;
    } else if (block.type === 'sentencematching') {
      return `
        <form>
          <div class="mb-3">
            <label class="form-label">Title</label>
            <input type="text" class="form-control" name="title" value="${block.config.title || 'Sentence Matches'}" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Instructions</label>
            <input type="text" class="form-control" name="instructions" value="${block.config.instructions || 'Click on a green card and then click on a white card that completes a sentence'}" required>
          </div>
          
          <div id="sentenceMatchingExercises">
            <h6>Exercises</h6>
            ${this.getSentenceMatchingExerciseInputs(block.config.exercises || [])}
          </div>
          <button type="button" class="btn btn-secondary" onclick="lessonBuilder.addSentenceMatchingExercise()">Add Exercise</button>
          <button type="submit" class="btn btn-primary mt-3">Save Configuration</button>
        </form>
      `;
    } else if (block.type === 'speakinglistening') {
      return `
        <form>
          <div class="mb-3">
            <label class="form-label">Title</label>
            <input type="text" class="form-control" name="title" value="${block.config.title || 'Spanish Speaking and Listening Practice'}" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Instructions</label>
            <input type="text" class="form-control" name="instructions" value="${block.config.instructions || 'Practice Spanish conversations by speaking and listening'}" required>
          </div>
          
          <div id="speakingListeningExercises">
            <h6>Exercises</h6>
            ${this.getSpeakingListeningExerciseInputs(block.config.exercises || [])}
          </div>
          <button type="button" class="btn btn-secondary" onclick="lessonBuilder.addSpeakingListeningExercise()">Add Exercise</button>
          <button type="submit" class="btn btn-primary mt-3">Save Configuration</button>
        </form>
      `;
    } else if (block.type === 'spellingquiz') {
      return `
        <form>
          <div class="mb-3">
            <label class="form-label">Title</label>
            <input type="text" class="form-control" name="title" value="${block.config.title || 'Spelling Pop Quiz'}" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Instructions</label>
            <input type="text" class="form-control" name="instructions" value="${block.config.instructions || 'Look at the incomplete Spanish word. Click on the missing letter(s) in correct order to complete it.'}" required>
          </div>
          
          <div id="spellingQuizExercises">
            <h6>Words to Spell</h6>
            ${this.getSpellingQuizExerciseInputs(block.config.exercises || [])}
          </div>
          <button type="button" class="btn btn-secondary" onclick="lessonBuilder.addSpellingQuizExercise()">Add Word</button>
          <button type="submit" class="btn btn-primary mt-3">Save Configuration</button>
        </form>
      `;
    } else if (block.type === 'conversation') {
      return `
        <form>
          <div class="mb-3">
            <label class="form-label">Title</label>
            <input type="text" class="form-control" name="title" value="${block.config.title || 'Learning Activity - Conversation'}" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Instructions</label>
            <input type="text" class="form-control" name="instructions" value="${block.config.instructions || 'Click on each picture to read the conversation'}" required>
          </div>
          
          <div class="mb-3">
            <h6>Characters</h6>
            <div class="row mb-2">
              <div class="col">
                <label class="form-label">Character 1 Name</label>
                <input type="text" class="form-control" name="char1Name" value="${block.config.characters?.[0]?.name || 'Ana'}" required>
              </div>
              <div class="col">
                <label class="form-label">Character 1 Image URL</label>
                <input type="text" class="form-control" name="char1Image" value="${block.config.characters?.[0]?.image || 'https://spanishg.com/images/59.png'}" required>
              </div>
            </div>
            <div class="row mb-2">
              <div class="col">
                <label class="form-label">Character 2 Name</label>
                <input type="text" class="form-control" name="char2Name" value="${block.config.characters?.[1]?.name || 'Susana'}" required>
              </div>
              <div class="col">
                <label class="form-label">Character 2 Image URL</label>
                <input type="text" class="form-control" name="char2Image" value="${block.config.characters?.[1]?.image || 'https://spanishg.com/images/58.png'}" required>
              </div>
            </div>
          </div>
          
          <div id="dialogueLines">
            <h6>Dialogue Lines</h6>
            ${this.getDialogueLinesInputs(block.config.dialogue || [])}
          </div>
          <button type="button" class="btn btn-secondary" onclick="lessonBuilder.addDialogueLine()">Add Dialogue Line</button>
          
          <div id="conversationQuestions">
            <h6 class="mt-3">Comprehension Questions</h6>
            ${this.getConversationQuestionsInputs(block.config.questions || [])}
          </div>
          <button type="button" class="btn btn-secondary" onclick="lessonBuilder.addConversationQuestion()">Add Question</button>
          
          <button type="submit" class="btn btn-primary mt-3">Save Configuration</button>
        </form>
      `;
    }
  }
  
  getCardPairInputs(cards = []) {
    if (cards.length === 0) {
      // Add an empty card pair if none exist
      return this.getCardPairInputs([{}]);
    }
    return cards.map((card, index) => `
      <div class="row mb-2">
        <div class="col">
          <input type="text" class="form-control" name="english${index}" placeholder="English" value="${card.english || ''}" required>
        </div>
        <div class="col">
          <input type="text" class="form-control" name="spanish${index}" placeholder="Spanish" value="${card.spanish || ''}" required>
        </div>
        <div class="col-auto">
          <button type="button" class="btn btn-danger" onclick="lessonBuilder.removeCardPair(${index})">Remove</button>
        </div>
      </div>
    `).join('');
  }

  addCardPair() {
    const cardPairs = document.getElementById('cardPairs');
    const newPair = document.createElement('div');
    newPair.className = 'row mb-2';
    const index = document.querySelectorAll('#cardPairs .row').length;
    newPair.innerHTML = `
      <div class="col">
        <input type="text" class="form-control" name="english${index}" placeholder="English" required>
      </div>
      <div class="col">
        <input type="text" class="form-control" name="spanish${index}" placeholder="Spanish" required>
      </div>
      <div class="col-auto">
        <button type="button" class="btn btn-danger" onclick="lessonBuilder.removeCardPair(${index})">Remove</button>
      </div>
    `;
    cardPairs.appendChild(newPair);
  }

  removeCardPair(index) {
    const rows = document.querySelectorAll('#cardPairs .row');
    if (rows.length > 1) { // Always keep at least one card pair
      rows[index].remove();
      // Update indices for the remove buttons
      document.querySelectorAll('#cardPairs .row').forEach((row, i) => {
        const removeBtn = row.querySelector('.btn-danger');
        removeBtn.setAttribute('onclick', `lessonBuilder.removeCardPair(${i})`);
      });
    } else {
      alert("At least one card pair is required.");
    }
  }

  getTranslationQuestionInputs(sentences = []) {
    if (sentences.length === 0) {
      // Handle legacy format or empty sentences
      if (typeof this.currentLesson.blocks.find(b => b.id === this.currentConfigBlock?.id)?.config.sentence === 'string') {
        const block = this.currentLesson.blocks.find(b => b.id === this.currentConfigBlock?.id);
        sentences = [{
          sentence: block.config.sentence || '',
          correctAnswer: block.config.correctAnswer || '',
          vocabulary: block.config.vocabulary || []
        }];
      } else {
        // Add an empty question if none exist
        sentences = [{ sentence: '', correctAnswer: '', vocabulary: [] }];
      }
    }
    
    return sentences.map((question, index) => `
      <div class="translation-question card p-3 mb-3">
        <h6>Question ${index + 1}</h6>
        <div class="mb-3">
          <label class="form-label">Sentence to Translate</label>
          <input type="text" class="form-control" name="sentence${index}" value="${question.sentence || ''}" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Correct Translation</label>
          <input type="text" class="form-control" name="correctAnswer${index}" value="${question.correctAnswer || ''}" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Vocabulary Hints (comma-separated)</label>
          <input type="text" class="form-control" name="vocabulary${index}" value="${(question.vocabulary || []).join(', ')}" required>
        </div>
        <button type="button" class="btn btn-danger" onclick="lessonBuilder.removeTranslationQuestion(${index})">Remove Question</button>
      </div>
    `).join('');
  }

  addTranslationQuestion() {
    const questionsContainer = document.getElementById('translationQuestions');
    const newQuestion = document.createElement('div');
    newQuestion.className = 'translation-question card p-3 mb-3';
    const index = document.querySelectorAll('#translationQuestions .translation-question').length;
    
    newQuestion.innerHTML = `
      <h6>Question ${index + 1}</h6>
      <div class="mb-3">
        <label class="form-label">Sentence to Translate</label>
        <input type="text" class="form-control" name="sentence${index}" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Correct Translation</label>
        <input type="text" class="form-control" name="correctAnswer${index}" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Vocabulary Hints (comma-separated)</label>
        <input type="text" class="form-control" name="vocabulary${index}" required>
      </div>
      <button type="button" class="btn btn-danger" onclick="lessonBuilder.removeTranslationQuestion(${index})">Remove Question</button>
    `;
    
    questionsContainer.appendChild(newQuestion);
  }

  removeTranslationQuestion(index) {
    const questions = document.querySelectorAll('#translationQuestions .translation-question');
    if (questions.length > 1) { // Always keep at least one question
      questions[index].remove();
      // Update question numbers and indices
      document.querySelectorAll('#translationQuestions .translation-question').forEach((q, i) => {
        q.querySelector('h6').textContent = `Question ${i + 1}`;
        q.querySelector('.btn-danger').setAttribute('onclick', `lessonBuilder.removeTranslationQuestion(${i})`);
      });
    } else {
      alert("At least one translation question is required.");
    }
  }

  saveBlockConfig(block, form) {
    if (block.type === 'flashcard') {
      const cards = [];
      const formData = new FormData(form);
      let index = 0;
      
      while (formData.get(`english${index}`) !== null) {
        cards.push({
          english: formData.get(`english${index}`),
          spanish: formData.get(`spanish${index}`)
        });
        index++;
      }

      block.config = {
        instructions: formData.get('instructions'),
        timeLimit: parseInt(formData.get('timeLimit')),
        cards
      };
    } else if (block.type === 'translation') {
      const formData = new FormData(form);
      const sentences = [];
      let index = 0;
      
      while (formData.get(`sentence${index}`) !== null) {
        sentences.push({
          sentence: formData.get(`sentence${index}`),
          correctAnswer: formData.get(`correctAnswer${index}`),
          vocabulary: formData.get(`vocabulary${index}`).split(',').map(word => word.trim())
        });
        index++;
      }
      
      block.config = {
        instructions: formData.get('instructions'),
        sentences
      };
    } else if (block.type === 'hotspot') {
      const formData = new FormData(form);
      const hotspots = [];
      let index = 0;
      
      while (formData.get(`hotspotId${index}`) !== null) {
        const options = [];
        const optionsCount = parseInt(formData.get(`optionsCount${index}`));
        
        for (let i = 0; i < optionsCount; i++) {
          options.push(formData.get(`option${index}_${i}`));
        }
        
        hotspots.push({
          id: formData.get(`hotspotId${index}`),
          label: formData.get(`label${index}`),
          english: formData.get(`english${index}`),
          correct: formData.get(`correct${index}`),
          options: options,
          left: formData.get(`left${index}`),
          top: formData.get(`top${index}`)
        });
        index++;
      }
      
      block.config = {
        title: formData.get('title'),
        instructions: formData.get('instructions'),
        backgroundImage: formData.get('backgroundImage'),
        hotspots
      };
    } else if (block.type === 'highlightwords') {
      const formData = new FormData(form);
      const exercises = [];
      let index = 0;
      
      while (formData.get(`text${index}`) !== null) {
        exercises.push({
          text: formData.get(`text${index}`),
          question: formData.get(`question${index}`),
          correctWords: formData.get(`correctWords${index}`).split(',').map(word => word.trim())
        });
        index++;
      }
      
      block.config = {
        instructions: formData.get('instructions'),
        exercises
      };
    } else if (block.type === 'imageclick') {
      const formData = new FormData(form);
      const questions = [];
      let index = 0;
      
      const images = formData.get('images').split(',').map(url => url.trim());
      
      while (formData.get(`question${index}`) !== null) {
        questions.push({
          question: formData.get(`question${index}`),
          correctImage: parseInt(formData.get(`correctImage${index}`)),
          boxIndex: parseInt(formData.get(`boxIndex${index}`))
        });
        index++;
      }
      
      block.config = {
        instructions: formData.get('instructions'),
        images,
        questions
      };
    } else if (block.type === 'dialogue') {
      const formData = new FormData(form);
      const dialogues = [];
      let index = 0;
      
      while (formData.get(`speakerAEnglish${index}`) !== null) {
        dialogues.push({
          speakerA: {
            english: formData.get(`speakerAEnglish${index}`),
            spanish: formData.get(`speakerASpanish${index}`)
          },
          speakerB: {
            english: formData.get(`speakerBEnglish${index}`),
            spanish: formData.get(`speakerBSpanish${index}`)
          }
        });
        index++;
      }
      
      block.config = {
        instructions: formData.get('instructions'),
        dialogues
      };
    } else if (block.type === 'accent') {
      const formData = new FormData(form);
      const sentences = [];
      let index = 0;
      
      while (formData.get(`text${index}`) !== null) {
        sentences.push({
          text: formData.get(`text${index}`),
          corrections: JSON.parse(formData.get(`corrections${index}`) || '[]')
        });
        index++;
      }
      
      block.config = {
        title: formData.get('title'),
        instructions: formData.get('instructions'),
        sentences
      };
    } else if (block.type === 'pickpicture') {
      const formData = new FormData(form);
      const exercises = [];
      let index = 0;
      
      while (formData.get(`verb${index}`) !== null) {
        const correctAnswers = formData.get(`correctAnswers${index}`).split(',').map(num => parseInt(num.trim()));
        const images = formData.get(`images${index}`).split(',').map(url => url.trim());
        
        exercises.push({
          verb: formData.get(`verb${index}`),
          correctAnswers,
          images
        });
        index++;
      }
      
      block.config = {
        title: formData.get('title'),
        instructions: formData.get('instructions'),
        exercises
      };
    } else if (block.type === 'sentencematching') {
      const formData = new FormData(form);
      const exercises = [];
      
      // Find all sentence matching exercises by looking for the exercise divs
      const exerciseDivs = document.querySelectorAll('.sentencematching-exercise');
      
      exerciseDivs.forEach((exerciseDiv, exerciseIndex) => {
        const blueCards = [];
        const whiteCards = [];
        const matches = {};
        
        // Collect blue cards
        const blueCardInputs = exerciseDiv.querySelectorAll(`.blue-card-group input[type="text"]`);
        blueCardInputs.forEach((input, cardIndex) => {
          const idInput = exerciseDiv.querySelector(`input[name="blueCardId${exerciseIndex}_${cardIndex}"]`);
          const id = parseInt(idInput.value) || Date.now() + cardIndex;
          
          blueCards.push({
            id: id,
            text: input.value
          });
          
          // Initialize matches for this blue card
          matches[id] = [];
        });
        
        // Collect white cards
        const whiteCardInputs = exerciseDiv.querySelectorAll(`.white-card-group input[type="text"]`);
        whiteCardInputs.forEach((input, cardIndex) => {
          const idInput = exerciseDiv.querySelector(`input[name="whiteCardId${exerciseIndex}_${cardIndex}"]`);
          const id = parseInt(idInput.value) || Date.now() + 1000 + cardIndex;
          
          whiteCards.push({
            id: id,
            text: input.value
          });
        });
        
        // Collect matches
        blueCards.forEach((blueCard, blueIdx) => {
          whiteCards.forEach((whiteCard, whiteIdx) => {
            const matchCheckbox = exerciseDiv.querySelector(`input[name="match${exerciseIndex}_${blueIdx}_${whiteIdx}"]`);
            if (matchCheckbox && matchCheckbox.checked) {
              matches[blueCard.id].push(whiteCard.id);
            }
          });
        });
        
        exercises.push({
          blueCards,
          whiteCards,
          matches
        });
      });
      
      block.config = {
        title: formData.get('title'),
        instructions: formData.get('instructions'),
        exercises
      };
    } else if (block.type === 'speakinglistening') {
      const formData = new FormData(form);
      const exercises = [];
      let index = 0;
      
      while (formData.get(`title${index}`) !== null) {
        exercises.push({
          title: formData.get(`title${index}`),
          imageSrc: formData.get(`imageSrc${index}`),
          imageAlt: formData.get(`imageAlt${index}`),
          askQuestion: formData.get(`askQuestion${index}`),
          firstAnswer: formData.get(`firstAnswer${index}`),
          askFollowup: formData.get(`askFollowup${index}`),
          secondAnswer: formData.get(`secondAnswer${index}`),
          expectedText: formData.get(`expectedText${index}`).split(',').map(text => text.trim())
        });
        index++;
      }
      
      block.config = {
        title: formData.get('title'),
        instructions: formData.get('instructions'),
        exercises
      };
    } else if (block.type === 'spellingquiz') {
      const formData = new FormData(form);
      const exercises = [];
      let index = 0;
      
      while (formData.get(`word${index}`) !== null) {
        const word = formData.get(`word${index}`);
        const hint = formData.get(`hint${index}`);
        const options = formData.get(`options${index}`).split(',').map(option => option.trim());
        
        // Calculate the answer based on the differences between word and hint
        const answer = [];
        for (let i = 0; i < word.length; i++) {
          if (i >= hint.length || hint[i] === '_') {
            answer.push(word[i]);
          }
        }
        
        exercises.push({
          word,
          hint,
          options,
          answer
        });
        index++;
      }
      
      block.config = {
        title: formData.get('title'),
        instructions: formData.get('instructions'),
        exercises
      };
    } else if (block.type === 'conversation') {
      const formData = new FormData(form);
      
      // Process characters
      const characters = [
        {
          name: formData.get('char1Name'),
          image: formData.get('char1Image')
        },
        {
          name: formData.get('char2Name'),
          image: formData.get('char2Image')
        }
      ];
      
      // Process dialogue lines
      const dialogue = [];
      let index = 0;
      
      while (formData.get(`dialogueSpeaker${index}`) !== null) {
        dialogue.push({
          speaker: formData.get(`dialogueSpeaker${index}`),
          text: formData.get(`dialogueText${index}`)
        });
        index++;
      }
      
      // Process questions
      const questions = [];
      index = 0;
      
      while (formData.get(`questionText${index}`) !== null) {
        questions.push({
          text: formData.get(`questionText${index}`),
          options: formData.get(`questionOptions${index}`).split(',').map(option => option.trim()),
          correct: parseInt(formData.get(`questionCorrect${index}`))
        });
        index++;
      }
      
      block.config = {
        title: formData.get('title'),
        instructions: formData.get('instructions'),
        characters,
        dialogue,
        questions
      };
    }
    
    this.saveLesson();
  }
  
  getHotspotInputs(hotspots = []) {
    if (hotspots.length === 0) {
      return '<p>No hotspots added yet. Click on the preview to add hotspots.</p>';
    }
    
    return hotspots.map((hotspot, index) => `
      <div class="card p-3 mb-3 hotspot-item">
        <input type="hidden" name="hotspotId${index}" value="${hotspot.id}">
        <input type="hidden" name="left${index}" value="${hotspot.left}">
        <input type="hidden" name="top${index}" value="${hotspot.top}">
        <h6>Hotspot ${index + 1}</h6>
        <div class="mb-3">
          <label class="form-label">Label</label>
          <input type="text" class="form-control" name="label${index}" value="${hotspot.label}" required>
        </div>
        <div class="mb-3">
          <label class="form-label">English Term</label>
          <input type="text" class="form-control" name="english${index}" value="${hotspot.english}" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Correct Answer</label>
          <input type="text" class="form-control" name="correct${index}" value="${hotspot.correct}" required>
        </div>
        <div class="mb-3 options-container">
          <label class="form-label">Options (first one should be the correct answer)</label>
          <input type="hidden" name="optionsCount${index}" value="${hotspot.options.length}">
          ${hotspot.options.map((option, i) => `
            <div class="input-group mb-2">
              <input type="text" class="form-control" name="option${index}_${i}" value="${option}" required>
              <button type="button" class="btn btn-outline-secondary" onclick="lessonBuilder.removeOption(${index}, ${i})">Remove</button>
            </div>
          `).join('')}
          <button type="button" class="btn btn-outline-primary" onclick="lessonBuilder.addOption(${index})">Add Option</button>
        </div>
        <button type="button" class="btn btn-danger" onclick="lessonBuilder.removeHotspot(${index})">Remove Hotspot</button>
      </div>
    `).join('');
  }

  addHotspot() {
    const editor = document.getElementById('hotspotEditor');
    const backgroundImage = document.querySelector('input[name="backgroundImage"]').value;
    
    if (!backgroundImage) {
      alert('Please enter a background image URL first');
      return;
    }
    
    editor.style.backgroundImage = `url(${backgroundImage})`;
    editor.innerHTML = '<p style="text-align: center; padding-top: 20px;">Click on the image to add hotspots</p>';
    
    const clickHandler = (e) => {
      const rect = editor.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Calculate the percentage position
      const left = (x / editor.offsetWidth * 100).toFixed(2);
      const top = (y / editor.offsetHeight * 100).toFixed(2);
      
      const hotspotsContainer = document.getElementById('hotspotsContainer');
      const hotspotItems = document.querySelectorAll('.hotspot-item');
      const index = hotspotItems.length;
      
      const newHotspot = document.createElement('div');
      newHotspot.className = 'card p-3 mb-3 hotspot-item';
      
      const hotspotId = 'hotspot_' + Date.now();
      
      newHotspot.innerHTML = `
        <input type="hidden" name="hotspotId${index}" value="${hotspotId}">
        <input type="hidden" name="left${index}" value="${left}">
        <input type="hidden" name="top${index}" value="${top}">
        <h6>Hotspot ${index + 1}</h6>
        <div class="mb-3">
          <label class="form-label">Label</label>
          <input type="text" class="form-control" name="label${index}" required>
        </div>
        <div class="mb-3">
          <label class="form-label">English Term</label>
          <input type="text" class="form-control" name="english${index}" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Correct Answer</label>
          <input type="text" class="form-control" name="correct${index}" required>
        </div>
        <div class="mb-3 options-container">
          <label class="form-label">Options (first one should be the correct answer)</label>
          <input type="hidden" name="optionsCount${index}" value="4">
          <div class="input-group mb-2">
            <input type="text" class="form-control" name="option${index}_0" required>
            <button type="button" class="btn btn-outline-secondary" onclick="lessonBuilder.removeOption(${index}, 0)">Remove</button>
          </div>
          <div class="input-group mb-2">
            <input type="text" class="form-control" name="option${index}_1" required>
            <button type="button" class="btn btn-outline-secondary" onclick="lessonBuilder.removeOption(${index}, 1)">Remove</button>
          </div>
          <div class="input-group mb-2">
            <input type="text" class="form-control" name="option${index}_2" required>
            <button type="button" class="btn btn-outline-secondary" onclick="lessonBuilder.removeOption(${index}, 2)">Remove</button>
          </div>
          <div class="input-group mb-2">
            <input type="text" class="form-control" name="option${index}_3" required>
            <button type="button" class="btn btn-outline-secondary" onclick="lessonBuilder.removeOption(${index}, 3)">Remove</button>
          </div>
          <button type="button" class="btn btn-outline-primary" onclick="lessonBuilder.addOption(${index})">Add Option</button>
        </div>
        <button type="button" class="btn btn-danger" onclick="lessonBuilder.removeHotspot(${index})">Remove Hotspot</button>
      `;
      
      if (hotspotsContainer.querySelector('p')) {
        hotspotsContainer.innerHTML = '';
      }
      
      hotspotsContainer.appendChild(newHotspot);
      
      // Add visual marker for the hotspot
      const marker = document.createElement('div');
      marker.style.position = 'absolute';
      marker.style.left = `${x - 15}px`;
      marker.style.top = `${y - 15}px`;
      marker.style.width = '30px';
      marker.style.height = '30px';
      marker.style.borderRadius = '50%';
      marker.style.backgroundColor = 'rgba(190, 242, 100, 0.7)';
      marker.style.display = 'flex';
      marker.style.justifyContent = 'center';
      marker.style.alignItems = 'center';
      marker.style.fontWeight = 'bold';
      marker.innerHTML = '?';
      
      editor.appendChild(marker);
    };
    
    editor.onclick = clickHandler;
  }

  addOption(hotspotIndex) {
    const optionsContainer = document.querySelector(`.hotspot-item:nth-child(${hotspotIndex + 1}) .options-container`);
    const optionsCountInput = document.querySelector(`input[name="optionsCount${hotspotIndex}"]`);
    const optionsCount = parseInt(optionsCountInput.value);
    
    const newOption = document.createElement('div');
    newOption.className = 'input-group mb-2';
    newOption.innerHTML = `
      <input type="text" class="form-control" name="option${hotspotIndex}_${optionsCount}" required>
      <button type="button" class="btn btn-outline-secondary" onclick="lessonBuilder.removeOption(${hotspotIndex}, ${optionsCount})">Remove</button>
    `;
    
    optionsContainer.insertBefore(newOption, optionsContainer.querySelector('button:last-child'));
    optionsCountInput.value = optionsCount + 1;
  }

  removeOption(hotspotIndex, optionIndex) {
    const optionsContainer = document.querySelector(`.hotspot-item:nth-child(${hotspotIndex + 1}) .options-container`);
    const optionsCountInput = document.querySelector(`input[name="optionsCount${hotspotIndex}"]`);
    const optionsCount = parseInt(optionsCountInput.value);
    
    if (optionsCount <= 2) {
      alert('At least 2 options are required');
      return;
    }
    
    const optionToRemove = document.querySelector(`input[name="option${hotspotIndex}_${optionIndex}"]`).parentNode;
    optionToRemove.remove();
    
    // Update the indices for the remaining options
    for (let i = optionIndex + 1; i < optionsCount; i++) {
      const option = document.querySelector(`input[name="option${hotspotIndex}_${i}"]`);
      if (option) {
        option.name = `option${hotspotIndex}_${i - 1}`;
        option.parentNode.querySelector('button').setAttribute('onclick', `lessonBuilder.removeOption(${hotspotIndex}, ${i - 1})`);
      }
    }
    
    optionsCountInput.value = optionsCount - 1;
  }

  removeHotspot(index) {
    const hotspotItems = document.querySelectorAll('.hotspot-item');
    if (hotspotItems.length > 0) {
      hotspotItems[index].remove();
      
      // Update indices for the remaining hotspots
      document.querySelectorAll('.hotspot-item').forEach((item, i) => {
        item.querySelector('h6').textContent = `Hotspot ${i + 1}`;
        
        // Update hidden inputs
        const oldId = item.querySelector(`input[name^="hotspotId"]`).name;
        const oldLeft = item.querySelector(`input[name^="left"]`).name;
        const oldTop = item.querySelector(`input[name^="top"]`).name;
        
        item.querySelector(`input[name="${oldId}"]`).name = `hotspotId${i}`;
        item.querySelector(`input[name="${oldLeft}"]`).name = `left${i}`;
        item.querySelector(`input[name="${oldTop}"]`).name = `top${i}`;
        
        // Update visible inputs
        const oldLabel = item.querySelector(`input[name^="label"]`).name;
        const oldEnglish = item.querySelector(`input[name^="english"]`).name;
        const oldCorrect = item.querySelector(`input[name^="correct"]`).name;
        const oldOptionsCount = item.querySelector(`input[name^="optionsCount"]`).name;
        
        item.querySelector(`input[name="${oldLabel}"]`).name = `label${i}`;
        item.querySelector(`input[name="${oldEnglish}"]`).name = `english${i}`;
        item.querySelector(`input[name="${oldCorrect}"]`).name = `correct${i}`;
        item.querySelector(`input[name="${oldOptionsCount}"]`).name = `optionsCount${i}`;
        
        // Update options
        const optionsCount = parseInt(item.querySelector(`input[name="optionsCount${i}"]`).value);
        for (let j = 0; j < optionsCount; j++) {
          const oldOption = item.querySelector(`input[name^="option${i-1}_${j}"]`);
          if (oldOption) {
            oldOption.name = `option${i}_${j}`;
            oldOption.parentNode.querySelector('button').setAttribute('onclick', `lessonBuilder.removeOption(${i}, ${j})`);
          }
        }
        
        // Update remove button
        item.querySelector('.btn-danger').setAttribute('onclick', `lessonBuilder.removeHotspot(${i})`);
      });
    }
    
    // If no hotspots remain, show the placeholder
    const hotspotsContainer = document.getElementById('hotspotsContainer');
    if (document.querySelectorAll('.hotspot-item').length === 0) {
      hotspotsContainer.innerHTML = '<p>No hotspots added yet. Click on the preview to add hotspots.</p>';
    }
  }

  getHighlightExerciseInputs(exercises = []) {
    if (exercises.length === 0) {
      return this.getHighlightExerciseInputs([{ text: '', question: '', correctWords: [] }]);
    }
    
    return exercises.map((exercise, index) => `
      <div class="card p-3 mb-3 highlight-exercise">
        <h6>Exercise ${index + 1}</h6>
        <div class="mb-3">
          <label class="form-label">Text (Spanish sentence)</label>
          <input type="text" class="form-control" name="text${index}" value="${exercise.text || ''}" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Question</label>
          <input type="text" class="form-control" name="question${index}" value="${exercise.question || ''}" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Correct Words (comma-separated)</label>
          <input type="text" class="form-control" name="correctWords${index}" value="${(exercise.correctWords || []).join(', ')}" required>
          <small class="form-text text-muted">List the words that should be highlighted, exactly as they appear in the text</small>
        </div>
        <button type="button" class="btn btn-danger" onclick="lessonBuilder.removeHighlightExercise(${index})">Remove Exercise</button>
      </div>
    `).join('');
  }

  addHighlightExercise() {
    const exercisesContainer = document.getElementById('highlightExercises');
    const newExercise = document.createElement('div');
    newExercise.className = 'card p-3 mb-3 highlight-exercise';
    const index = document.querySelectorAll('#highlightExercises .highlight-exercise').length;
    
    newExercise.innerHTML = `
      <h6>Exercise ${index + 1}</h6>
      <div class="mb-3">
        <label class="form-label">Text (Spanish sentence)</label>
        <input type="text" class="form-control" name="text${index}" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Question</label>
        <input type="text" class="form-control" name="question${index}" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Correct Words (comma-separated)</label>
        <input type="text" class="form-control" name="correctWords${index}" required>
        <small class="form-text text-muted">List the words that should be highlighted, exactly as they appear in the text</small>
      </div>
      <button type="button" class="btn btn-danger" onclick="lessonBuilder.removeHighlightExercise(${index})">Remove Exercise</button>
    `;
    
    exercisesContainer.appendChild(newExercise);
  }

  removeHighlightExercise(index) {
    const exercises = document.querySelectorAll('#highlightExercises .highlight-exercise');
    if (exercises.length > 1) {
      exercises[index].remove();
      
      document.querySelectorAll('#highlightExercises .highlight-exercise').forEach((item, i) => {
        item.querySelector('h6').textContent = `Exercise ${i + 1}`;
        item.querySelector('.btn-danger').setAttribute('onclick', `lessonBuilder.removeHighlightExercise(${i})`);
      });
    } else {
      alert("At least one exercise is required.");
    }
  }

  getImageClickQuestionInputs(questions = []) {
    if (questions.length === 0) {
      return this.getImageClickQuestionInputs([{ 
        question: '', 
        correctImage: 0, 
        boxIndex: 0 
      }]);
    }
    
    return questions.map((question, index) => `
      <div class="card p-3 mb-3 imageclick-question">
        <h6>Question ${index + 1}</h6>
        <div class="mb-3">
          <label class="form-label">Question (Spanish)</label>
          <input type="text" class="form-control" name="question${index}" value="${question.question || ''}" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Correct Image Index (0-4)</label>
          <input type="number" class="form-control" name="correctImage${index}" value="${question.correctImage || 0}" min="0" max="4" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Target Box Index (0-4)</label>
          <input type="number" class="form-control" name="boxIndex${index}" value="${question.boxIndex || 0}" min="0" max="4" required>
        </div>
        <button type="button" class="btn btn-danger" onclick="lessonBuilder.removeImageClickQuestion(${index})">Remove Question</button>
      </div>
    `).join('');
  }

  addImageClickQuestion() {
    const questionsContainer = document.getElementById('imageClickQuestions');
    const newQuestion = document.createElement('div');
    newQuestion.className = 'card p-3 mb-3 imageclick-question';
    const index = document.querySelectorAll('#imageClickQuestions .imageclick-question').length;
    
    newQuestion.innerHTML = `
      <h6>Question ${index + 1}</h6>
      <div class="mb-3">
        <label class="form-label">Question (Spanish)</label>
        <input type="text" class="form-control" name="question${index}" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Correct Image Index (0-4)</label>
        <input type="number" class="form-control" name="correctImage${index}" value="0" min="0" max="4" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Target Box Index (0-4)</label>
        <input type="number" class="form-control" name="boxIndex${index}" value="${index}" min="0" max="4" required>
      </div>
      <button type="button" class="btn btn-danger" onclick="lessonBuilder.removeImageClickQuestion(${index})">Remove Question</button>
    `;
    
    questionsContainer.appendChild(newQuestion);
  }

  removeImageClickQuestion(index) {
    const questions = document.querySelectorAll('#imageClickQuestions .imageclick-question');
    if (questions.length > 1) {
      questions[index].remove();
      
      document.querySelectorAll('#imageClickQuestions .imageclick-question').forEach((item, i) => {
        item.querySelector('h6').textContent = `Question ${i + 1}`;
        item.querySelector('.btn-danger').setAttribute('onclick', `lessonBuilder.removeImageClickQuestion(${i})`);
      });
    } else {
      alert("At least one question is required.");
    }
  }

  getDialogueExerciseInputs(dialogues = []) {
    if (dialogues.length === 0) {
      return this.getDialogueExerciseInputs([{
        speakerA: { english: '', spanish: '' },
        speakerB: { english: '', spanish: '' }
      }]);
    }
    
    return dialogues.map((dialogue, index) => `
      <div class="card p-3 mb-3 dialogue-exercise">
        <h6>Dialogue ${index + 1}</h6>
        <div class="mb-3">
          <label class="form-label">Speaker A (English)</label>
          <input type="text" class="form-control" name="speakerAEnglish${index}" value="${dialogue.speakerA.english || ''}" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Speaker A (Spanish)</label>
          <input type="text" class="form-control" name="speakerASpanish${index}" value="${dialogue.speakerA.spanish || ''}" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Speaker B (English)</label>
          <input type="text" class="form-control" name="speakerBEnglish${index}" value="${dialogue.speakerB.english || ''}" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Speaker B (Spanish)</label>
          <input type="text" class="form-control" name="speakerBSpanish${index}" value="${dialogue.speakerB.spanish || ''}" required>
        </div>
        <button type="button" class="btn btn-danger" onclick="lessonBuilder.removeDialogueExercise(${index})">Remove Dialogue</button>
      </div>
    `).join('');
  }

  addDialogueExercise() {
    const dialoguesContainer = document.getElementById('dialogueExercises');
    const newDialogue = document.createElement('div');
    newDialogue.className = 'card p-3 mb-3 dialogue-exercise';
    const index = document.querySelectorAll('#dialogueExercises .dialogue-exercise').length;
    
    newDialogue.innerHTML = `
      <h6>Dialogue ${index + 1}</h6>
      <div class="mb-3">
        <label class="form-label">Speaker A (English)</label>
        <input type="text" class="form-control" name="speakerAEnglish${index}" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Speaker A (Spanish)</label>
        <input type="text" class="form-control" name="speakerASpanish${index}" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Speaker B (English)</label>
        <input type="text" class="form-control" name="speakerBEnglish${index}" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Speaker B (Spanish)</label>
        <input type="text" class="form-control" name="speakerBSpanish${index}" required>
      </div>
      <button type="button" class="btn btn-danger" onclick="lessonBuilder.removeDialogueExercise(${index})">Remove Dialogue</button>
    `;
    
    dialoguesContainer.appendChild(newDialogue);
  }

  removeDialogueExercise(index) {
    const dialogues = document.querySelectorAll('#dialogueExercises .dialogue-exercise');
    if (dialogues.length > 1) {
      dialogues[index].remove();
      
      document.querySelectorAll('#dialogueExercises .dialogue-exercise').forEach((item, i) => {
        item.querySelector('h6').textContent = `Dialogue ${i + 1}`;
        item.querySelector('.btn-danger').setAttribute('onclick', `lessonBuilder.removeDialogueExercise(${i})`);
      });
    } else {
      alert("At least one dialogue is required.");
    }
  }

  getAccentSentenceInputs(sentences = []) {
    if (sentences.length === 0) {
      return this.getAccentSentenceInputs([{ text: '', corrections: [] }]);
    }
    
    return sentences.map((sentence, index) => `
      <div class="card p-3 mb-3 accent-sentence">
        <h6>Sentence ${index + 1}</h6>
        <div class="mb-3">
          <label class="form-label">Sentence (without accents)</label>
          <div class="input-group">
            <input type="text" class="form-control sentence-text" name="text${index}" value="${sentence.text || ''}" required>
            <button type="button" class="btn btn-outline-primary preview-btn" onclick="lessonBuilder.previewSentence(${index})">Preview</button>
          </div>
        </div>
        <div class="preview-area mb-3" id="preview${index}">
          ${this.renderPreviewSentence(sentence.text, sentence.corrections)}
        </div>
        <input type="hidden" class="corrections-data" name="corrections${index}" value="${JSON.stringify(sentence.corrections || [])}">
        <button type="button" class="btn btn-danger" onclick="lessonBuilder.removeAccentSentence(${index})">Remove Sentence</button>
      </div>
    `).join('');
  }

  renderPreviewSentence(text, corrections = []) {
    if (!text) return '<p>Enter a sentence and click Preview</p>';
    
    let html = '<p class="sentence-preview">';
    const correctionsMap = {};
    
    corrections.forEach(correction => {
      correctionsMap[correction.index] = correction.accent;
    });
    
    for (let i = 0; i < text.length; i++) {
      const letter = text[i];
      const classes = correctionsMap[i] ? 'letter marked' : 'letter';
      html += `<span class="${classes}" data-index="${i}" onclick="lessonBuilder.toggleAccent(this, ${i})">${letter}</span>`;
    }
    
    html += '</p>';
    return html;
  }

  previewSentence(index) {
    const sentenceCard = document.querySelectorAll('.accent-sentence')[index];
    const textInput = sentenceCard.querySelector('.sentence-text');
    const previewArea = sentenceCard.querySelector('.preview-area');
    const correctionsInput = sentenceCard.querySelector('.corrections-data');
    
    const text = textInput.value;
    const corrections = JSON.parse(correctionsInput.value || '[]');
    
    previewArea.innerHTML = this.renderPreviewSentence(text, corrections);
  }

  toggleAccent(element, index) {
    const sentenceCard = element.closest('.accent-sentence');
    const sentenceIndex = Array.from(document.querySelectorAll('.accent-sentence')).indexOf(sentenceCard);
    const correctionsInput = sentenceCard.querySelector('.corrections-data');
    let corrections = JSON.parse(correctionsInput.value || '[]');
    
    const existingCorrectionIndex = corrections.findIndex(c => c.index === index);
    
    if (existingCorrectionIndex !== -1) {
      // Remove existing correction
      corrections.splice(existingCorrectionIndex, 1);
      element.classList.remove('marked');
    } else {
      // Add new correction
      const letter = element.textContent;
      let accentedLetter;
      
      switch(letter.toLowerCase()) {
        case 'a': accentedLetter = 'á'; break;
        case 'e': accentedLetter = 'é'; break;
        case 'i': accentedLetter = 'í'; break;
        case 'o': accentedLetter = 'ó'; break;
        case 'u': accentedLetter = 'ú'; break;
        default: accentedLetter = letter; // No accent for this letter
      }
      
      if (accentedLetter !== letter) {
        corrections.push({ index, accent: accentedLetter });
        element.classList.add('marked');
      }
    }
    
    correctionsInput.value = JSON.stringify(corrections);
  }

  addAccentSentence() {
    const sentencesContainer = document.getElementById('accentSentences');
    const newSentence = document.createElement('div');
    newSentence.className = 'card p-3 mb-3 accent-sentence';
    const index = document.querySelectorAll('#accentSentences .accent-sentence').length;
    
    newSentence.innerHTML = `
      <h6>Sentence ${index + 1}</h6>
      <div class="mb-3">
        <label class="form-label">Sentence (without accents)</label>
        <div class="input-group">
          <input type="text" class="form-control sentence-text" name="text${index}" required>
          <button type="button" class="btn btn-outline-primary preview-btn" onclick="lessonBuilder.previewSentence(${index})">Preview</button>
        </div>
      </div>
      <div class="preview-area mb-3" id="preview${index}">
        <p>Enter a sentence and click Preview</p>
      </div>
      <input type="hidden" class="corrections-data" name="corrections${index}" value="[]">
      <button type="button" class="btn btn-danger" onclick="lessonBuilder.removeAccentSentence(${index})">Remove Sentence</button>
    `;
    
    sentencesContainer.appendChild(newSentence);
  }

  removeAccentSentence(index) {
    const sentences = document.querySelectorAll('#accentSentences .accent-sentence');
    if (sentences.length > 1) {
      sentences[index].remove();
      
      document.querySelectorAll('#accentSentences .accent-sentence').forEach((item, i) => {
        item.querySelector('h6').textContent = `Sentence ${i + 1}`;
        const previewBtn = item.querySelector('.preview-btn');
        previewBtn.setAttribute('onclick', `lessonBuilder.previewSentence(${i})`);
        item.querySelector('.btn-danger').setAttribute('onclick', `lessonBuilder.removeAccentSentence(${i})`);
      });
    } else {
      alert("At least one sentence is required.");
    }
  }

  getPickPictureExerciseInputs(exercises = []) {
    if (exercises.length === 0) {
      return this.getPickPictureExerciseInputs([{
        verb: '',
        correctAnswers: [0],
        images: ['', '', '', '']
      }]);
    }
    
    return exercises.map((exercise, index) => `
      <div class="card p-3 mb-3 pickpicture-exercise">
        <h6>Exercise ${index + 1}</h6>
        <div class="mb-3">
          <label class="form-label">Verb</label>
          <input type="text" class="form-control" name="verb${index}" value="${exercise.verb || ''}" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Correct Image Indexes (comma-separated, 0-3)</label>
          <input type="text" class="form-control" name="correctAnswers${index}" value="${(exercise.correctAnswers || [0]).join(', ')}" required>
          <small class="form-text text-muted">Enter the indexes of correct images (0-3) separated by commas</small>
        </div>
        <div class="mb-3">
          <label class="form-label">Image URLs (4 comma-separated URLs)</label>
          <input type="text" class="form-control" name="images${index}" value="${(exercise.images || ['', '', '', '']).join(', ')}" required>
          <small class="form-text text-muted">Enter exactly 4 image URLs separated by commas</small>
        </div>
        <button type="button" class="btn btn-danger" onclick="lessonBuilder.removePickPictureExercise(${index})">Remove Exercise</button>
      </div>
    `).join('');
  }

  addPickPictureExercise() {
    const exercisesContainer = document.getElementById('pickPictureExercises');
    const newExercise = document.createElement('div');
    newExercise.className = 'card p-3 mb-3 pickpicture-exercise';
    const index = document.querySelectorAll('#pickPictureExercises .pickpicture-exercise').length;
    
    newExercise.innerHTML = `
      <h6>Exercise ${index + 1}</h6>
      <div class="mb-3">
        <label class="form-label">Verb</label>
        <input type="text" class="form-control" name="verb${index}" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Correct Image Indexes (comma-separated, 0-3)</label>
        <input type="text" class="form-control" name="correctAnswers${index}" value="0" required>
        <small class="form-text text-muted">Enter the indexes of correct images (0-3) separated by commas</small>
      </div>
      <div class="mb-3">
        <label class="form-label">Image URLs (4 comma-separated URLs)</label>
        <input type="text" class="form-control" name="images${index}" required>
        <small class="form-text text-muted">Enter exactly 4 image URLs separated by commas</small>
      </div>
      <button type="button" class="btn btn-danger" onclick="lessonBuilder.removePickPictureExercise(${index})">Remove Exercise</button>
    `;
    
    exercisesContainer.appendChild(newExercise);
  }

  removePickPictureExercise(index) {
    const exercises = document.querySelectorAll('#pickPictureExercises .pickpicture-exercise');
    if (exercises.length > 1) {
      exercises[index].remove();
      
      document.querySelectorAll('#pickPictureExercises .pickpicture-exercise').forEach((item, i) => {
        item.querySelector('h6').textContent = `Exercise ${i + 1}`;
        item.querySelector('.btn-danger').setAttribute('onclick', `lessonBuilder.removePickPictureExercise(${i})`);
      });
    } else {
      alert("At least one exercise is required.");
    }
  }

  addSentenceMatchingExercise() {
    const exercisesContainer = document.getElementById('sentenceMatchingExercises');
    const newExercise = document.createElement('div');
    newExercise.className = 'card p-3 mb-3 sentencematching-exercise';
    const index = document.querySelectorAll('#sentenceMatchingExercises .sentencematching-exercise').length;
    
    const blueCardId1 = Date.now();
    const blueCardId2 = Date.now() + 1;
    const whiteCardId1 = Date.now() + 1000;
    const whiteCardId2 = Date.now() + 1001;
    const whiteCardId3 = Date.now() + 1002;
    
    newExercise.innerHTML = `
      <h6>Exercise ${index + 1}</h6>
      
      <div class="mb-3">
        <h6>Green Cards (Incomplete Sentences)</h6>
        <div id="blueCards${index}" class="blue-cards-container">
          <div class="input-group mb-2 blue-card-group">
            <input type="text" class="form-control" name="blueCard${index}_0" placeholder="Incomplete sentence..." required>
            <input type="hidden" name="blueCardId${index}_0" value="${blueCardId1}">
            <button type="button" class="btn btn-outline-secondary" 
              onclick="lessonBuilder.removeBlueCard(${index}, 0)">Remove</button>
          </div>
          <div class="input-group mb-2 blue-card-group">
            <input type="text" class="form-control" name="blueCard${index}_1" placeholder="Incomplete sentence..." required>
            <input type="hidden" name="blueCardId${index}_1" value="${blueCardId2}">
            <button type="button" class="btn btn-outline-secondary" 
              onclick="lessonBuilder.removeBlueCard(${index}, 1)">Remove</button>
          </div>
        </div>
        <button type="button" class="btn btn-outline-primary" 
          onclick="lessonBuilder.addBlueCard(${index})">Add Green Card</button>
      </div>
      
      <div class="mb-3">
        <h6>White Cards (Completing Words/Phrases)</h6>
        <div id="whiteCards${index}" class="white-cards-container">
          <div class="input-group mb-2 white-card-group">
            <input type="text" class="form-control" name="whiteCard${index}_0" placeholder="Completing word/phrase..." required>
            <input type="hidden" name="whiteCardId${index}_0" value="${whiteCardId1}">
            <button type="button" class="btn btn-outline-secondary" 
              onclick="lessonBuilder.removeWhiteCard(${index}, 0)">Remove</button>
          </div>
          <div class="input-group mb-2 white-card-group">
            <input type="text" class="form-control" name="whiteCard${index}_1" placeholder="Completing word/phrase..." required>
            <input type="hidden" name="whiteCardId${index}_1" value="${whiteCardId2}">
            <button type="button" class="btn btn-outline-secondary" 
              onclick="lessonBuilder.removeWhiteCard(${index}, 1)">Remove</button>
          </div>
          <div class="input-group mb-2 white-card-group">
            <input type="text" class="form-control" name="whiteCard${index}_2" placeholder="Completing word/phrase..." required>
            <input type="hidden" name="whiteCardId${index}_2" value="${whiteCardId3}">
            <button type="button" class="btn btn-outline-secondary" 
              onclick="lessonBuilder.removeWhiteCard(${index}, 2)">Remove</button>
          </div>
        </div>
        <button type="button" class="btn btn-outline-primary" 
          onclick="lessonBuilder.addWhiteCard(${index})">Add White Card</button>
      </div>
      
      <div class="mb-3">
        <h6>Match Configuration</h6>
        <p class="text-muted">Please complete the green and white cards first, then save and reopen to configure matches.</p>
      </div>
      
      <button type="button" class="btn btn-danger" 
        onclick="lessonBuilder.removeSentenceMatchingExercise(${index})">Remove Exercise</button>
    `;
    
    exercisesContainer.appendChild(newExercise);
  }
  
  removeSentenceMatchingExercise(index) {
    const exercises = document.querySelectorAll('#sentenceMatchingExercises .sentencematching-exercise');
    if (exercises.length > 1) {
      exercises[index].remove();
      
      document.querySelectorAll('#sentenceMatchingExercises .sentencematching-exercise').forEach((item, i) => {
        item.querySelector('h6').textContent = `Exercise ${i + 1}`;
        item.querySelector('.btn-danger').setAttribute('onclick', `lessonBuilder.removeSentenceMatchingExercise(${i})`);
      });
    } else {
      alert("At least one exercise is required.");
    }
  }
  
  addBlueCard(exerciseIndex) {
    const blueCardsContainer = document.getElementById(`blueCards${exerciseIndex}`);
    const blueCardGroups = blueCardsContainer.querySelectorAll('.blue-card-group');
    const newIndex = blueCardGroups.length;
    
    const newBlueCard = document.createElement('div');
    newBlueCard.className = 'input-group mb-2 blue-card-group';
    newBlueCard.innerHTML = `
      <input type="text" class="form-control" name="blueCard${exerciseIndex}_${newIndex}" placeholder="Incomplete sentence..." required>
      <input type="hidden" name="blueCardId${exerciseIndex}_${newIndex}" value="${Date.now()}">
      <button type="button" class="btn btn-outline-secondary" 
        onclick="lessonBuilder.removeBlueCard(${exerciseIndex}, ${newIndex})">Remove</button>
    `;
    
    blueCardsContainer.appendChild(newBlueCard);
  }
  
  removeBlueCard(exerciseIndex, cardIndex) {
    const blueCardsContainer = document.getElementById(`blueCards${exerciseIndex}`);
    const blueCardGroups = blueCardsContainer.querySelectorAll('.blue-card-group');
    
    if (blueCardGroups.length > 1) {
      blueCardGroups[cardIndex].remove();
      
      // Update indices for remaining blue cards
      blueCardsContainer.querySelectorAll('.blue-card-group').forEach((group, i) => {
        const input = group.querySelector('input[type="text"]');
        const hiddenInput = group.querySelector('input[type="hidden"]');
        const button = group.querySelector('button');
        
        input.name = `blueCard${exerciseIndex}_${i}`;
        hiddenInput.name = `blueCardId${exerciseIndex}_${i}`;
        button.setAttribute('onclick', `lessonBuilder.removeBlueCard(${exerciseIndex}, ${i})`);
      });
    } else {
      alert("At least one green card is required.");
    }
  }
  
  addWhiteCard(exerciseIndex) {
    const whiteCardsContainer = document.getElementById(`whiteCards${exerciseIndex}`);
    const whiteCardGroups = whiteCardsContainer.querySelectorAll('.white-card-group');
    const newIndex = whiteCardGroups.length;
    
    const newWhiteCard = document.createElement('div');
    newWhiteCard.className = 'input-group mb-2 white-card-group';
    newWhiteCard.innerHTML = `
      <input type="text" class="form-control" name="whiteCard${exerciseIndex}_${newIndex}" placeholder="Completing word/phrase..." required>
      <input type="hidden" name="whiteCardId${exerciseIndex}_${newIndex}" value="${Date.now() + 1000}">
      <button type="button" class="btn btn-outline-secondary" 
        onclick="lessonBuilder.removeWhiteCard(${exerciseIndex}, ${newIndex})">Remove</button>
    `;
    
    whiteCardsContainer.appendChild(newWhiteCard);
  }
  
  removeWhiteCard(exerciseIndex, cardIndex) {
    const whiteCardsContainer = document.getElementById(`whiteCards${exerciseIndex}`);
    const whiteCardGroups = whiteCardsContainer.querySelectorAll('.white-card-group');
    
    if (whiteCardGroups.length > 1) {
      whiteCardGroups[cardIndex].remove();
      
      // Update indices for remaining white cards
      whiteCardsContainer.querySelectorAll('.white-card-group').forEach((group, i) => {
        const input = group.querySelector('input[type="text"]');
        const hiddenInput = group.querySelector('input[type="hidden"]');
        const button = group.querySelector('button');
        
        input.name = `whiteCard${exerciseIndex}_${i}`;
        hiddenInput.name = `whiteCardId${exerciseIndex}_${i}`;
        button.setAttribute('onclick', `lessonBuilder.removeWhiteCard(${exerciseIndex}, ${i})`);
      });
    } else {
      alert("At least one white card is required.");
    }
  }

  getSpeakingListeningExerciseInputs(exercises = []) {
    if (exercises.length === 0) {
      return this.getSpeakingListeningExerciseInputs([{
        title: '',
        imageSrc: '',
        imageAlt: '',
        askQuestion: '',
        firstAnswer: '',
        askFollowup: '',
        secondAnswer: '',
        expectedText: []
      }]);
    }
    
    return exercises.map((exercise, index) => `
      <div class="card p-3 mb-3 speaking-exercise">
        <h6>Exercise ${index + 1}</h6>
        <div class="mb-3">
          <label class="form-label">Exercise Title</label>
          <input type="text" class="form-control" name="title${index}" value="${exercise.title || ''}" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Image URL</label>
          <input type="text" class="form-control" name="imageSrc${index}" value="${exercise.imageSrc || ''}" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Image Description</label>
          <input type="text" class="form-control" name="imageAlt${index}" value="${exercise.imageAlt || ''}" required>
        </div>
        <div class="mb-3">
          <label class="form-label">First Question (for student to ask)</label>
          <input type="text" class="form-control" name="askQuestion${index}" value="${exercise.askQuestion || '¿Cómo estás?'}" required>
        </div>
        <div class="mb-3">
          <label class="form-label">First Answer (computer response)</label>
          <input type="text" class="form-control" name="firstAnswer${index}" value="${exercise.firstAnswer || 'Estoy bien'}" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Follow-up Question (for student to ask)</label>
          <input type="text" class="form-control" name="askFollowup${index}" value="${exercise.askFollowup || '¿De dónde eres?'}" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Second Answer (computer response)</label>
          <input type="text" class="form-control" name="secondAnswer${index}" value="${exercise.secondAnswer || 'Soy de España'}" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Expected Text in Final Note (comma-separated)</label>
          <input type="text" class="form-control" name="expectedText${index}" value="${(exercise.expectedText || []).join(', ')}" required>
          <small class="form-text text-muted">List phrases that must appear in the student's final written note, separated by commas</small>
        </div>
        <button type="button" class="btn btn-danger" onclick="lessonBuilder.removeSpeakingListeningExercise(${index})">Remove Exercise</button>
      </div>
    `).join('');
  }

  addSpeakingListeningExercise() {
    const exercisesContainer = document.getElementById('speakingListeningExercises');
    const newExercise = document.createElement('div');
    newExercise.className = 'card p-3 mb-3 speaking-exercise';
    const index = document.querySelectorAll('#speakingListeningExercises .speaking-exercise').length;
    
    newExercise.innerHTML = `
      <h6>Exercise ${index + 1}</h6>
      <div class="mb-3">
        <label class="form-label">Exercise Title</label>
        <input type="text" class="form-control" name="title${index}" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Image URL</label>
        <input type="text" class="form-control" name="imageSrc${index}" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Image Description</label>
        <input type="text" class="form-control" name="imageAlt${index}" required>
      </div>
      <div class="mb-3">
        <label class="form-label">First Question (for student to ask)</label>
        <input type="text" class="form-control" name="askQuestion${index}" value="¿Cómo estás?" required>
      </div>
      <div class="mb-3">
        <label class="form-label">First Answer (computer response)</label>
        <input type="text" class="form-control" name="firstAnswer${index}" value="Estoy bien" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Follow-up Question (for student to ask)</label>
        <input type="text" class="form-control" name="askFollowup${index}" value="¿De dónde eres?" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Second Answer (computer response)</label>
        <input type="text" class="form-control" name="secondAnswer${index}" value="Soy de España" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Expected Text in Final Note (comma-separated)</label>
        <input type="text" class="form-control" name="expectedText${index}" value="estoy bien, soy de España" required>
        <small class="form-text text-muted">List phrases that must appear in the student's final written note, separated by commas</small>
      </div>
      <button type="button" class="btn btn-danger" onclick="lessonBuilder.removeSpeakingListeningExercise(${index})">Remove Exercise</button>
    `;
    
    exercisesContainer.appendChild(newExercise);
  }

  removeSpeakingListeningExercise(index) {
    const exercises = document.querySelectorAll('#speakingListeningExercises .speaking-exercise');
    if (exercises.length > 1) {
      exercises[index].remove();
      
      document.querySelectorAll('#speakingListeningExercises .speaking-exercise').forEach((item, i) => {
        item.querySelector('h6').textContent = `Exercise ${i + 1}`;
        item.querySelector('.btn-danger').setAttribute('onclick', `lessonBuilder.removeSpeakingListeningExercise(${i})`);
      });
    } else {
      alert("At least one exercise is required.");
    }
  }
  
  getSentenceMatchingExerciseInputs(exercises = []) {
    if (exercises.length === 0) {
      return this.getSentenceMatchingExerciseInputs([{
        blueCards: [{ id: 1, text: '' }, { id: 2, text: '' }],
        whiteCards: [{ id: 3, text: '' }, { id: 4, text: '' }, { id: 5, text: '' }],
        matches: { 1: [3], 2: [4, 5] }
      }]);
    }
    
    return exercises.map((exercise, exerciseIndex) => `
      <div class="card p-3 mb-3 sentencematching-exercise">
        <h6>Exercise ${exerciseIndex + 1}</h6>
        
        <div class="mb-3">
          <h6>Green Cards (Incomplete Sentences)</h6>
          <div id="blueCards${exerciseIndex}" class="blue-cards-container">
            ${exercise.blueCards.map((card, cardIndex) => `
              <div class="input-group mb-2 blue-card-group">
                <input type="text" class="form-control" name="blueCard${exerciseIndex}_${cardIndex}" 
                  value="${card.text}" placeholder="Incomplete sentence..." required>
                <input type="hidden" name="blueCardId${exerciseIndex}_${cardIndex}" value="${card.id || Date.now() + cardIndex}">
                <button type="button" class="btn btn-outline-secondary" 
                  onclick="lessonBuilder.removeBlueCard(${exerciseIndex}, ${cardIndex})">Remove</button>
              </div>
            `).join('')}
          </div>
          <button type="button" class="btn btn-outline-primary" 
            onclick="lessonBuilder.addBlueCard(${exerciseIndex})">Add Green Card</button>
        </div>
        
        <div class="mb-3">
          <h6>White Cards (Completing Words/Phrases)</h6>
          <div id="whiteCards${exerciseIndex}" class="white-cards-container">
            ${exercise.whiteCards.map((card, cardIndex) => `
              <div class="input-group mb-2 white-card-group">
                <input type="text" class="form-control" name="whiteCard${exerciseIndex}_${cardIndex}" 
                  value="${card.text}" placeholder="Completing word/phrase..." required>
                <input type="hidden" name="whiteCardId${exerciseIndex}_${cardIndex}" value="${card.id || Date.now() + 1000 + cardIndex}">
                <button type="button" class="btn btn-outline-secondary" 
                  onclick="lessonBuilder.removeWhiteCard(${exerciseIndex}, ${cardIndex})">Remove</button>
              </div>
            `).join('')}
          </div>
          <button type="button" class="btn btn-outline-primary" 
            onclick="lessonBuilder.addWhiteCard(${exerciseIndex})">Add White Card</button>
        </div>
        
        <div class="mb-3">
          <h6>Match Configuration</h6>
          ${exercise.blueCards.map((blueCard, blueIdx) => `
            <div class="card p-2 mb-2">
              <p><strong>Green Card ${blueIdx + 1}:</strong> ${blueCard.text || '[Empty]'}</p>
              <label>Select matching white cards:</label>
              <div class="matches-container">
                ${exercise.whiteCards.map((whiteCard, whiteIdx) => {
                  const isMatched = exercise.matches[blueCard.id] && 
                                    exercise.matches[blueCard.id].includes(whiteCard.id);
                  return `
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" 
                        name="match${exerciseIndex}_${blueIdx}_${whiteIdx}" 
                        id="match${exerciseIndex}_${blueIdx}_${whiteIdx}"
                        ${isMatched ? 'checked' : ''}>
                      <label class="form-check-label" for="match${exerciseIndex}_${blueIdx}_${whiteIdx}">
                        ${whiteCard.text || '[Empty]'}
                      </label>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
        
        <button type="button" class="btn btn-danger" 
          onclick="lessonBuilder.removeSentenceMatchingExercise(${exerciseIndex})">Remove Exercise</button>
      </div>
    `).join('');
  }

  saveLesson() {
    fetch('save_lesson.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.currentLesson)
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('Lesson saved successfully');
      } else {
        console.error('Error saving lesson:', data.error);
      }
    })
    .catch(error => {
      console.error('Error saving lesson:', error);
    });
  }
  
  loadLesson() {
    fetch('get_lesson.php')
      .then(response => response.json())
      .then(data => {
        if (data.lesson) {
          this.currentLesson = data.lesson;
          
          // Update form fields
          document.getElementById('lessonName').value = this.currentLesson.name;
          document.getElementById('lessonDate').value = this.currentLesson.date;
          
          // Render existing blocks
          this.currentLesson.blocks.forEach(block => {
            this.renderBlock(block);
          });
        }
      })
      .catch(error => {
        console.error('Error loading lesson:', error);
      });
  }

  getSpellingQuizExerciseInputs(exercises = []) {
    if (exercises.length === 0) {
      return this.getSpellingQuizExerciseInputs([{
        word: '',
        hint: '',
        options: [],
        answer: []
      }]);
    }
    
    return exercises.map((exercise, index) => `
      <div class="card p-3 mb-3 spelling-exercise">
        <h6>Word ${index + 1}</h6>
        <div class="mb-3">
          <label class="form-label">Complete Word</label>
          <input type="text" class="form-control" name="word${index}" value="${exercise.word || ''}" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Word with Blanks</label>
          <div class="input-group">
            <input type="text" class="form-control" name="hint${index}" value="${exercise.hint || ''}" required>
            <button type="button" class="btn btn-outline-primary preview-btn" onclick="lessonBuilder.previewSpellingWord(${index})">Generate</button>
          </div>
          <small class="form-text text-muted">Use underscore (_) for each missing letter, or click Generate to select letters to hide</small>
        </div>
        <div class="preview-area mb-3" id="spellingPreview${index}">
          ${this.renderSpellingWordPreview(exercise.word, exercise.hint)}
        </div>
        <div class="mb-3">
          <label class="form-label">Options (comma-separated)</label>
          <input type="text" class="form-control" name="options${index}" value="${(exercise.options || []).join(', ')}" required>
          <small class="form-text text-muted">Letters to show as options, including the correct ones and distractors</small>
        </div>
        <button type="button" class="btn btn-danger" onclick="lessonBuilder.removeSpellingQuizExercise(${index})">Remove Word</button>
      </div>
    `).join('');
  }

  addSpellingQuizExercise() {
    const exercisesContainer = document.getElementById('spellingQuizExercises');
    const newExercise = document.createElement('div');
    newExercise.className = 'card p-3 mb-3 spelling-exercise';
    const index = document.querySelectorAll('#spellingQuizExercises .spelling-exercise').length;
    
    newExercise.innerHTML = `
      <h6>Word ${index + 1}</h6>
      <div class="mb-3">
        <label class="form-label">Complete Word</label>
        <input type="text" class="form-control" name="word${index}" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Word with Blanks</label>
        <div class="input-group">
          <input type="text" class="form-control" name="hint${index}" required>
          <button type="button" class="btn btn-outline-primary preview-btn" onclick="lessonBuilder.previewSpellingWord(${index})">Generate</button>
        </div>
        <small class="form-text text-muted">Use underscore (_) for each missing letter, or click Generate to select letters to hide</small>
      </div>
      <div class="preview-area mb-3" id="spellingPreview${index}">
        <p>Enter a word and click Generate</p>
      </div>
      <div class="mb-3">
        <label class="form-label">Options (comma-separated)</label>
        <input type="text" class="form-control" name="options${index}" required>
        <small class="form-text text-muted">Letters to show as options, including the correct ones and distractors</small>
      </div>
      <button type="button" class="btn btn-danger" onclick="lessonBuilder.removeSpellingQuizExercise(${index})">Remove Word</button>
    `;
    
    exercisesContainer.appendChild(newExercise);
  }

  removeSpellingQuizExercise(index) {
    const exercises = document.querySelectorAll('#spellingQuizExercises .spelling-exercise');
    if (exercises.length > 1) {
      exercises[index].remove();
      
      document.querySelectorAll('#spellingQuizExercises .spelling-exercise').forEach((item, i) => {
        item.querySelector('h6').textContent = `Word ${i + 1}`;
        item.querySelector('.btn-danger').setAttribute('onclick', `lessonBuilder.removeSpellingQuizExercise(${i})`);
        const previewBtn = item.querySelector('.preview-btn');
        if (previewBtn) {
          previewBtn.setAttribute('onclick', `lessonBuilder.previewSpellingWord(${i})`);
        }
      });
    } else {
      alert("At least one word is required.");
    }
  }

  renderSpellingWordPreview(word, hint) {
    if (!word) return '<p>Enter a word and click Generate</p>';
    
    if (hint) {
      return `<p class="spelling-preview">${hint}</p>`;
    } else {
      let html = '<p class="spelling-preview">';
      for (let i = 0; i < word.length; i++) {
        const letter = word[i];
        html += `<span class="letter" data-index="${i}" onclick="lessonBuilder.toggleSpellingLetter(this, ${i})">${letter}</span>`;
      }
      html += '</p>';
      return html;
    }
  }

  previewSpellingWord(index) {
    const wordCard = document.querySelectorAll('.spelling-exercise')[index];
    const wordInput = wordCard.querySelector(`input[name="word${index}"]`);
    const hintInput = wordCard.querySelector(`input[name="hint${index}"]`);
    const previewArea = wordCard.querySelector(`#spellingPreview${index}`);
    const optionsInput = wordCard.querySelector(`input[name="options${index}"]`);
    
    const word = wordInput.value.toUpperCase();
    
    if (!word) {
      previewArea.innerHTML = '<p>Please enter a word first</p>';
      return;
    }
    
    // Clear hint input to start fresh
    hintInput.value = '';
    
    // Add CSS for letter styling if it doesn't exist
    if (!document.getElementById('spelling-preview-styles')) {
      const style = document.createElement('style');
      style.id = 'spelling-preview-styles';
      style.textContent = `
        .spelling-preview {
          font-size: 24px;
          letter-spacing: 2px;
        }
        .spelling-preview .letter {
          cursor: pointer;
          padding: 2px 4px;
          margin: 0 2px;
          border-radius: 4px;
        }
        .spelling-preview .letter:hover {
          background-color: rgba(190, 242, 100, 0.3);
        }
        .spelling-preview .letter.hidden {
          background-color: #bef264;
          color: transparent;
          user-select: none;
        }
      `;
      document.head.appendChild(style);
    }
    
    previewArea.innerHTML = this.renderSpellingWordPreview(word, '');
    
    // Set default options if empty
    if (!optionsInput.value) {
      const uniqueLetters = [...new Set(word.split(''))];
      // Add a few random letters as distractors
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const distractors = [];
      for (let i = 0; i < 3; i++) {
        const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
        if (!uniqueLetters.includes(randomLetter)) {
          distractors.push(randomLetter);
        }
      }
      optionsInput.value = [...uniqueLetters, ...distractors].sort().join(', ');
    }
  }

  toggleSpellingLetter(element, letterIndex) {
    element.classList.toggle('hidden');
    
    // Update the hint input field
    const exerciseCard = element.closest('.spelling-exercise');
    const index = Array.from(document.querySelectorAll('.spelling-exercise')).indexOf(exerciseCard);
    
    const wordInput = exerciseCard.querySelector(`input[name="word${index}"]`);
    const hintInput = exerciseCard.querySelector(`input[name="hint${index}"]`);
    
    const word = wordInput.value.toUpperCase();
    let hint = '';
    
    const letterElements = exerciseCard.querySelectorAll('.spelling-preview .letter');
    for (let i = 0; i < word.length; i++) {
      if (letterElements[i].classList.contains('hidden')) {
        hint += '_';
      } else {
        hint += word[i];
      }
    }
    
    hintInput.value = hint;
  }

  getDialogueLinesInputs(dialogue = []) {
    if (dialogue.length === 0) {
      return this.getDialogueLinesInputs([
        { speaker: "Ana", text: "¡Hola Susana! ¿Cómo estás?" },
        { speaker: "Susana", text: "Estoy bien, ¡gracias! ¿Y tú?" },
        { speaker: "Ana", text: "Muy bien, gracias." },
        { speaker: "Susana", text: "¿Qué haces hoy?" }
      ]);
    }
    
    return dialogue.map((line, index) => `
      <div class="card p-3 mb-3 dialogue-line">
        <div class="mb-3">
          <label class="form-label">Speaker</label>
          <select class="form-control" name="dialogueSpeaker${index}">
            <option value="char1" ${line.speaker === "char1" || line.speaker === "Ana" ? 'selected' : ''}>Character 1</option>
            <option value="char2" ${line.speaker === "char2" || line.speaker === "Susana" ? 'selected' : ''}>Character 2</option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Text</label>
          <input type="text" class="form-control" name="dialogueText${index}" value="${line.text}" required>
        </div>
        <button type="button" class="btn btn-danger" onclick="lessonBuilder.removeDialogueLine(${index})">Remove Line</button>
      </div>
    `).join('');
  }

  addDialogueLine() {
    const dialogueContainer = document.getElementById('dialogueLines');
    const newLine = document.createElement('div');
    newLine.className = 'card p-3 mb-3 dialogue-line';
    const index = document.querySelectorAll('#dialogueLines .dialogue-line').length;
    
    newLine.innerHTML = `
      <div class="mb-3">
        <label class="form-label">Speaker</label>
        <select class="form-control" name="dialogueSpeaker${index}">
          <option value="char1">Character 1</option>
          <option value="char2">Character 2</option>
        </select>
      </div>
      <div class="mb-3">
        <label class="form-label">Text</label>
        <input type="text" class="form-control" name="dialogueText${index}" required>
      </div>
      <button type="button" class="btn btn-danger" onclick="lessonBuilder.removeDialogueLine(${index})">Remove Line</button>
    `;
    
    dialogueContainer.appendChild(newLine);
  }

  removeDialogueLine(index) {
    const lines = document.querySelectorAll('#dialogueLines .dialogue-line');
    if (lines.length > 1) {
      lines[index].remove();
      
      document.querySelectorAll('#dialogueLines .dialogue-line').forEach((item, i) => {
        const select = item.querySelector('select');
        const input = item.querySelector('input[type="text"]');
        const button = item.querySelector('.btn-danger');
        
        select.name = `dialogueSpeaker${i}`;
        input.name = `dialogueText${i}`;
        button.setAttribute('onclick', `lessonBuilder.removeDialogueLine(${i})`);
      });
    } else {
      alert("At least one dialogue line is required.");
    }
  }

  getConversationQuestionsInputs(questions = []) {
    if (questions.length === 0) {
      return this.getConversationQuestionsInputs([
        { 
          text: "¿Qué le dijo Ana a Susana?", 
          options: ["Hola", "Adiós", "Buenos días", "Buenas noches"], 
          correct: 0 
        }
      ]);
    }
    
    return questions.map((question, index) => `
      <div class="card p-3 mb-3 conversation-question">
        <div class="mb-3">
          <label class="form-label">Question</label>
          <input type="text" class="form-control" name="questionText${index}" value="${question.text}" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Options (comma-separated)</label>
          <input type="text" class="form-control" name="questionOptions${index}" value="${question.options.join(', ')}" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Correct Option Index (0-based)</label>
          <input type="number" class="form-control" name="questionCorrect${index}" value="${question.correct}" min="0" required>
        </div>
        <button type="button" class="btn btn-danger" onclick="lessonBuilder.removeConversationQuestion(${index})">Remove Question</button>
      </div>
    `).join('');
  }

  addConversationQuestion() {
    const questionsContainer = document.getElementById('conversationQuestions');
    const newQuestion = document.createElement('div');
    newQuestion.className = 'card p-3 mb-3 conversation-question';
    const index = document.querySelectorAll('#conversationQuestions .conversation-question').length;
    
    newQuestion.innerHTML = `
      <div class="mb-3">
        <label class="form-label">Question</label>
        <input type="text" class="form-control" name="questionText${index}" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Options (comma-separated)</label>
        <input type="text" class="form-control" name="questionOptions${index}" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Correct Option Index (0-based)</label>
        <input type="number" class="form-control" name="questionCorrect${index}" value="0" min="0" required>
      </div>
      <button type="button" class="btn btn-danger" onclick="lessonBuilder.removeConversationQuestion(${index})">Remove Question</button>
    `;
    
    questionsContainer.appendChild(newQuestion);
  }

  removeConversationQuestion(index) {
    const questions = document.querySelectorAll('#conversationQuestions .conversation-question');
    if (questions.length > 1) {
      questions[index].remove();
      
      document.querySelectorAll('#conversationQuestions .conversation-question').forEach((item, i) => {
        const inputs = item.querySelectorAll('input');
        const button = item.querySelector('.btn-danger');
        
        inputs[0].name = `questionText${i}`;
        inputs[1].name = `questionOptions${i}`;
        inputs[2].name = `questionCorrect${i}`;
        button.setAttribute('onclick', `lessonBuilder.removeConversationQuestion(${i})`);
      });
    } else {
      alert("At least one question is required.");
    }
  }
}

const lessonBuilder = new LessonBuilder();