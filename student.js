class LessonPlayer {
  constructor() {
    this.lesson = null;
    this.currentBlockIndex = 0;
    this.score = 0;
    this.loadLesson();
  }

  loadLesson() {
    fetch('get_lesson.php')
      .then(response => response.json())
      .then(data => {
        if (data.lesson) {
          this.lesson = data.lesson;
          this.initialize();
        } else {
          document.getElementById('lessonInfo').innerHTML = '<div class="alert alert-warning">No lesson available. Please create a lesson in the Teacher View first.</div>';
        }
      })
      .catch(error => {
        console.error('Error loading lesson:', error);
        document.getElementById('lessonInfo').innerHTML = '<div class="alert alert-danger">Error loading lesson. Please try again later.</div>';
      });
  }

  initialize() {
    if (!this.lesson) {
      document.getElementById('lessonInfo').innerHTML = '<div class="alert alert-warning">No lesson available. Please create a lesson in the Teacher View first.</div>';
      return;
    }

    document.getElementById('lessonInfo').innerHTML = `
      <h2>${this.lesson.name}</h2>
      <p>Date: ${this.lesson.date}</p>
      <p>Total Score: <span id="totalScore">0</span></p>
    `;

    this.playCurrentBlock();
  }

  playCurrentBlock() {
    const block = this.lesson.blocks[this.currentBlockIndex];
    if (!block) {
      document.getElementById('exerciseContainer').innerHTML = `
        <div class="alert alert-success">
          <h4>Lesson completed!</h4>
          <p>Your final score: ${this.score} points</p>
        </div>`;
      return;
    }

    if (block.type === 'flashcard') {
      this.renderFlashcardExercise(block);
    } else if (block.type === 'translation') {
      this.renderTranslationExercise(block);
    } else if (block.type === 'hotspot') {
      this.renderHotspotExercise(block);
    } else if (block.type === 'highlightwords') {
      this.renderHighlightWordsExercise(block);
    } else if (block.type === 'imageclick') {
      this.renderImageClickExercise(block);
    } else if (block.type === 'dialogue') {
      this.renderDialogueExercise(block);
    } else if (block.type === 'accent') {
      this.renderAccentExercise(block);
    } else if (block.type === 'pickpicture') {
      this.renderPickPictureExercise(block);
    } else if (block.type === 'sentencematching') {
      this.renderSentenceMatchingExercise(block);
    } else if (block.type === 'speakinglistening') {
      this.renderSpeakingListeningExercise(block);
    } else if (block.type === 'spellingquiz') {
      this.renderSpellingQuizExercise(block);
    } else if (block.type === 'conversation') {
      this.renderConversationExercise(block);
    }
  }

  renderFlashcardExercise(block) {
    const container = document.getElementById('exerciseContainer');
    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">${block.config.instructions}</h5>
          <p>Time Remaining: <span id="timeRemaining"></span></p>
          <p>Card <span id="cardCounter">1</span> of ${block.config.cards.length}</p>
          <div class="card-container" id="cardContainer">
            <div class="card" id="flashcard">
              <div class="card-side card-front" id="cardFront"></div>
              <div class="card-side card-back" id="cardBack"></div>
            </div>
          </div>
          <div class="mt-3">
            <button class="btn btn-primary" onclick="lessonPlayer.flipCard()">Flip Card</button>
            <button class="btn btn-success" onclick="lessonPlayer.showFlashcardInput()">I Know It</button>
          </div>
          <div id="answerInput" class="mt-3" style="display: none;">
            <input type="text" class="form-control" id="userAnswer" placeholder="Type your answer...">
            <button class="btn btn-primary mt-2" onclick="lessonPlayer.checkFlashcardAnswer()">Submit</button>
          </div>
        </div>
      </div>
    `;

    this.currentCard = 0;
    this.blockScore = 0;
    this.attemptsPerCard = new Array(block.config.cards.length).fill(false);
    this.displayFlashcard();
    this.startTimer(block.config.timeLimit);
  }

  renderTranslationExercise(block) {
    const container = document.getElementById('exerciseContainer');
    
    if (!Array.isArray(block.config.sentences)) {
      // Handle legacy format with single sentence
      block.config.sentences = [{
        sentence: block.config.sentence,
        correctAnswer: block.config.correctAnswer,
        vocabulary: block.config.vocabulary
      }];
    }
    
    this.currentQuestion = 0;
    this.blockScore = 0;
    this.attemptsPerQuestion = new Array(block.config.sentences.length).fill(false);
    this.displayTranslationQuestion(block);
  }

  displayTranslationQuestion(block) {
    if (this.currentQuestion >= block.config.sentences.length) {
      this.currentBlockIndex++;
      this.score += this.blockScore;
      document.getElementById('totalScore').textContent = this.score;
      this.playCurrentBlock();
      return;
    }

    const question = block.config.sentences[this.currentQuestion];
    const container = document.getElementById('exerciseContainer');
    
    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">${block.config.instructions}</h5>
          <p>Question ${this.currentQuestion + 1} of ${block.config.sentences.length}</p>
          <p>Sentence: ${question.sentence}</p>
          <div class="vocabulary mb-3">
            <h6>Vocabulary:</h6>
            ${question.vocabulary.map(word => `<span class="badge bg-secondary me-2">${word}</span>`).join('')}
          </div>
          <input type="text" class="form-control" id="translationAnswer" placeholder="Enter your translation">
          <button class="btn btn-primary mt-3" onclick="lessonPlayer.checkTranslationAnswer()">Submit</button>
        </div>
      </div>
    `;
  }

  flipCard() {
    document.getElementById('flashcard').classList.toggle('flipped');
  }

  displayFlashcard() {
    const block = this.lesson.blocks[this.currentBlockIndex];
    const card = block.config.cards[this.currentCard];
    document.getElementById('cardFront').textContent = card.english;
    document.getElementById('cardBack').textContent = card.spanish;
    document.getElementById('cardCounter').textContent = this.currentCard + 1;
    document.getElementById('flashcard').classList.remove('flipped');
  }

  showFlashcardInput() {
    document.getElementById('answerInput').style.display = 'block';
    document.getElementById('userAnswer').focus();
  }

  checkFlashcardAnswer() {
    const block = this.lesson.blocks[this.currentBlockIndex];
    const card = block.config.cards[this.currentCard];
    const userAnswer = document.getElementById('userAnswer').value.trim().toLowerCase();
    
    // Mark this card as attempted
    this.attemptsPerCard[this.currentCard] = true;
    
    if (userAnswer === card.spanish.toLowerCase()) {
      this.blockScore++;
    }

    this.currentCard++;
    if (this.currentCard < block.config.cards.length) {
      document.getElementById('answerInput').style.display = 'none';
      document.getElementById('userAnswer').value = '';
      this.displayFlashcard();
    } else {
      // Check if all cards have been attempted
      if (this.attemptsPerCard.every(attempt => attempt)) {
        // Update the total score only after completing all cards
        this.score += this.blockScore;
        document.getElementById('totalScore').textContent = this.score;
        this.currentBlockIndex++;
        this.playCurrentBlock();
      } else {
        // Go back to the first unattempted card
        this.currentCard = this.attemptsPerCard.findIndex(attempt => !attempt);
        document.getElementById('answerInput').style.display = 'none';
        document.getElementById('userAnswer').value = '';
        this.displayFlashcard();
        alert("You need to attempt all cards before moving to the next exercise.");
      }
    }
  }

  checkTranslationAnswer() {
    const block = this.lesson.blocks[this.currentBlockIndex];
    const question = block.config.sentences[this.currentQuestion];
    const userAnswer = document.getElementById('translationAnswer').value.trim().toLowerCase();
    
    // Mark this question as attempted
    this.attemptsPerQuestion[this.currentQuestion] = true;
    
    if (userAnswer === question.correctAnswer.toLowerCase()) {
      this.blockScore++;
    }

    this.currentQuestion++;
    if (this.currentQuestion < block.config.sentences.length) {
      this.displayTranslationQuestion(block);
    } else {
      // Check if all questions have been attempted
      if (this.attemptsPerQuestion.every(attempt => attempt)) {
        this.score += this.blockScore;
        document.getElementById('totalScore').textContent = this.score;
        this.currentBlockIndex++;
        this.playCurrentBlock();
      } else {
        // Go back to the first unattempted question
        this.currentQuestion = this.attemptsPerQuestion.findIndex(attempt => !attempt);
        this.displayTranslationQuestion(block);
        alert("You need to attempt all questions before moving to the next exercise.");
      }
    }
  }

  startTimer(duration) {
    let timeLeft = duration;
    const timerDisplay = document.getElementById('timeRemaining');
    
    const timer = setInterval(() => {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      if (--timeLeft < 0) {
        clearInterval(timer);
        
        // For flashcards, mark all remaining cards as attempted
        const block = this.lesson.blocks[this.currentBlockIndex];
        if (block.type === 'flashcard') {
          this.attemptsPerCard.fill(true);
        }
        
        this.currentBlockIndex++;
        this.playCurrentBlock();
      }
    }, 1000);
  }

  renderHotspotExercise(block) {
    const container = document.getElementById('exerciseContainer');
    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h3 class="title">${block.config.title}</h3>
          <p>${block.config.instructions}</p>
          <div class="body-image" style="position: relative; width: 600px; height: 400px; margin: 20px auto; background-image: url('${block.config.backgroundImage}'); background-size: contain; background-repeat: no-repeat; background-position: center;">
            ${block.config.hotspots.map(hotspot => `
              <div id="${hotspot.id}" class="hotspot" style="position: absolute; left: ${hotspot.left}%; top: ${hotspot.top}%; width: 30px; height: 30px; border-radius: 50%; background-color: #bef264; color: #000; display: flex; justify-content: center; align-items: center; cursor: pointer; font-weight: bold; transition: all 0.3s ease; z-index: 10;">?</div>
            `).join('')}
          </div>
          <div id="hotspotScore">Score: 0</div>
          <div id="hotspotMessage"></div>
        </div>
      </div>
      
      <div class="quiz-container" id="quizContainer" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: white; border: 2px solid #bef264; border-radius: 0.375rem; padding: 1rem; z-index: 100; display: none;">
        <h2>Choose the correct spelling:</h2>
        <div id="quizOptions"></div>
      </div>
    `;

    this.hotspotScore = 0;
    this.totalHotspots = block.config.hotspots.length;
    this.attemptedHotspots = new Array(this.totalHotspots).fill(false);
    
    // Set up event listeners for each hotspot
    block.config.hotspots.forEach((hotspot, index) => {
      const hotspotElement = document.getElementById(hotspot.id);
      let state = 'hidden';
      
      hotspotElement.addEventListener('click', () => {
        if (state === 'hidden') {
          // First click: display the label as a hint
          hotspotElement.textContent = hotspot.label;
          hotspotElement.classList.add('expanded');
          state = 'revealed';
        } else if (state === 'revealed') {
          // Second click: revert to circle with a check mark and show the quiz
          hotspotElement.classList.remove('expanded');
          hotspotElement.textContent = "✓";
          state = 'attempted';
          
          // Disable further clicks
          hotspotElement.style.pointerEvents = 'none';
          
          // Show the quiz
          this.showHotspotQuiz(hotspot, index);
        }
      });
    });
  }

  showHotspotQuiz(hotspot, index) {
    const quizContainer = document.getElementById('quizContainer');
    const quizOptions = document.getElementById('quizOptions');
    quizOptions.innerHTML = '';
    
    const questionElement = document.querySelector('.quiz-container h2');
    questionElement.textContent = `What's the correct term for "${hotspot.english}"?`;
    
    // Shuffle the options
    const shuffledOptions = [...hotspot.options].sort(() => Math.random() - 0.5);
    
    shuffledOptions.forEach(option => {
      const button = document.createElement('button');
      button.textContent = option;
      button.addEventListener('click', () => this.checkHotspotAnswer(hotspot, option, index));
      quizOptions.appendChild(button);
    });
    
    quizContainer.style.display = 'block';
  }

  checkHotspotAnswer(hotspot, selectedAnswer, index) {
    const hotspotElement = document.getElementById(hotspot.id);
    const messageElement = document.getElementById('hotspotMessage');
    const scoreElement = document.getElementById('hotspotScore');
    const quizContainer = document.getElementById('quizContainer');
    
    // Mark this hotspot as attempted
    this.attemptedHotspots[index] = true;
    
    const pointsPerHotspot = Math.floor(100 / this.totalHotspots);
    
    if (selectedAnswer === hotspot.correct) {
      this.hotspotScore += pointsPerHotspot;
      hotspotElement.classList.add('correct');
      messageElement.textContent = "Correct!";
      messageElement.style.color = "green";
    } else {
      hotspotElement.classList.add('incorrect');
      messageElement.textContent = `Incorrect. The correct answer is: ${hotspot.correct}`;
      messageElement.style.color = "red";
    }
    
    scoreElement.textContent = `Score: ${this.hotspotScore}`;
    quizContainer.style.display = 'none';
    
    // Check if all hotspots have been attempted
    if (this.attemptedHotspots.every(attempted => attempted)) {
      this.score += this.hotspotScore;
      document.getElementById('totalScore').textContent = this.score;
      
      // Add a "Continue" button
      const container = document.getElementById('exerciseContainer');
      const continueButton = document.createElement('button');
      continueButton.className = 'btn btn-primary mt-3';
      continueButton.textContent = 'Continue to Next Exercise';
      continueButton.addEventListener('click', () => {
        this.currentBlockIndex++;
        this.playCurrentBlock();
      });
      
      container.querySelector('.card-body').appendChild(continueButton);
      
      if (this.hotspotScore === 100) {
        messageElement.textContent = "Perfect score! You identified all hotspots correctly!";
        messageElement.style.color = "green";
      }
    }
  }

  renderHighlightWordsExercise(block) {
    const container = document.getElementById('exerciseContainer');
    
    this.currentExercise = 0;
    this.blockScore = 0;
    this.attemptsPerExercise = new Array(block.config.exercises.length).fill(false);
    
    this.displayHighlightExercise(block);
  }
  
  displayHighlightExercise(block) {
    if (this.currentExercise >= block.config.exercises.length) {
      this.currentBlockIndex++;
      this.score += this.blockScore;
      document.getElementById('totalScore').textContent = this.score;
      this.playCurrentBlock();
      return;
    }
    
    const exercise = block.config.exercises[this.currentExercise];
    const container = document.getElementById('exerciseContainer');
    
    // Create word spans to make them clickable
    const wordSpans = exercise.text.split(' ').map((word, index) => 
      `<span class="highlight-word" data-index="${index}" data-word="${word}">${word}</span>`
    ).join('');
    
    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">${block.config.instructions}</h5>
          <p>Exercise ${this.currentExercise + 1} of ${block.config.exercises.length}</p>
          
          <div class="highlight-text mb-3">
            ${wordSpans}
          </div>
          
          <div class="highlight-question mb-3">
            <strong>${exercise.question}</strong>
          </div>
          
          <div id="highlightFeedback" class="mb-3"></div>
          
          <button class="btn btn-primary" id="checkHighlightButton">Check Answer</button>
          <button class="btn btn-secondary" id="resetHighlightButton">Reset Selection</button>
        </div>
      </div>
    `;
    
    // Set up event listeners for word clicking
    document.querySelectorAll('.highlight-word').forEach(wordElement => {
      wordElement.addEventListener('click', () => {
        wordElement.classList.toggle('selected');
      });
    });
    
    // Set up event listener for the check button
    document.getElementById('checkHighlightButton').addEventListener('click', () => {
      this.checkHighlightAnswer(exercise);
    });
    
    // Set up event listener for the reset button
    document.getElementById('resetHighlightButton').addEventListener('click', () => {
      document.querySelectorAll('.highlight-word.selected').forEach(el => {
        el.classList.remove('selected');
      });
      document.getElementById('highlightFeedback').innerHTML = '';
    });
    
    // Add CSS for highlighting
    const style = document.createElement('style');
    style.textContent = `
      .highlight-word {
        cursor: pointer;
        padding: 2px 4px;
        margin: 2px;
        display: inline-block;
      }
      .highlight-word:hover {
        background-color: #f0f0f0;
      }
      .highlight-word.selected {
        background-color: #bef264;
        border-radius: 4px;
      }
      .highlight-text {
        line-height: 2;
        font-size: 1.1rem;
      }
    `;
    document.head.appendChild(style);
  }
  
  checkHighlightAnswer(exercise) {
    const selectedWords = Array.from(document.querySelectorAll('.highlight-word.selected')).map(el => el.dataset.word);
    const correctWords = exercise.correctWords;
    
    // Count how many correct words the user selected
    const correctCount = selectedWords.filter(word => correctWords.includes(word)).length;
    // Count incorrect selections
    const incorrectCount = selectedWords.filter(word => !correctWords.includes(word)).length;
    
    let feedbackHTML = '';
    let points = 0;
    
    // Mark this exercise as attempted
    this.attemptsPerExercise[this.currentExercise] = true;
    
    // Calculate score based on correctness
    if (correctCount === correctWords.length && incorrectCount === 0) {
      // All correct, no wrong selections
      points = 100;
      feedbackHTML = `<div class="alert alert-success">¡Perfecto! You selected all the correct words.</div>`;
    } else if (correctCount > 0 && incorrectCount === 0) {
      // Some correct, no wrong selections
      if (correctCount === 1 && correctWords.includes('diseñadora')) {
        // Special case: just "diseñadora" selected
        points = 50;
        feedbackHTML = `<div class="alert alert-warning">Partial credit: You selected the most important word, but there are others.</div>`;
      } else if (correctCount >= 2) {
        // At least 2 correct words
        points = 75;
        feedbackHTML = `<div class="alert alert-warning">Partial credit: You identified ${correctCount} of ${correctWords.length} correct words.</div>`;
      } else {
        // Other cases
        points = 25;
        feedbackHTML = `<div class="alert alert-warning">Partial credit: You identified ${correctCount} of ${correctWords.length} correct words.</div>`;
      }
    } else {
      // Wrong selections were made
      points = Math.max(0, 10 * (correctCount - incorrectCount));
      feedbackHTML = `<div class="alert alert-danger">You selected ${incorrectCount} incorrect word(s).</div>`;
    }
    
    // Add the score for this exercise (scale the points to the block's total value)
    const pointsPerExercise = Math.floor(100 / block.config.exercises.length);
    this.blockScore += Math.floor(points * pointsPerExercise / 100);
    
    feedbackHTML += `<div>Points earned: ${points}/100</div>`;
    
    // Show the correct answers
    feedbackHTML += `<div class="mt-2">Correct words: ${correctWords.join(', ')}</div>`;
    
    // Add a continue button
    feedbackHTML += `<button class="btn btn-primary mt-3" id="continueHighlightButton">Continue</button>`;
    
    document.getElementById('highlightFeedback').innerHTML = feedbackHTML;
    
    // Disable interaction with words
    document.querySelectorAll('.highlight-word').forEach(el => {
      el.style.pointerEvents = 'none';
    });
    
    document.getElementById('checkHighlightButton').style.display = 'none';
    document.getElementById('resetHighlightButton').style.display = 'none';
    
    // Set up event listener for the continue button
    document.getElementById('continueHighlightButton').addEventListener('click', () => {
      this.currentExercise++;
      this.displayHighlightExercise(block);
    });
  }

  renderImageClickExercise(block) {
    const container = document.getElementById('exerciseContainer');
    
    this.currentQuestion = 0;
    this.blockScore = 0;
    this.attemptsPerQuestion = new Array(block.config.questions.length).fill(false);
    this.boxContents = new Array(5).fill(null);
    
    this.displayImageClickQuestion(block);
  }
  
  displayImageClickQuestion(block) {
    if (this.currentQuestion >= block.config.questions.length) {
      this.currentBlockIndex++;
      this.score += this.blockScore;
      document.getElementById('totalScore').textContent = this.score;
      this.playCurrentBlock();
      return;
    }
    
    const question = block.config.questions[this.currentQuestion];
    const container = document.getElementById('exerciseContainer');
    
    // Prepare HTML for image gallery
    const imagesHTML = block.config.images.map((url, index) => `
      <div class="image-item" data-index="${index}">
        <img src="${url}" alt="Image ${index + 1}" width="161" height="257">
      </div>
    `).join('');
    
    // Prepare HTML for boxes
    const boxesHTML = Array(5).fill().map((_, index) => {
      const boxContent = this.boxContents[index] !== null 
        ? `<img src="${block.config.images[this.boxContents[index]]}" alt="Selected image" width="161" height="257">` 
        : '';
      
      return `
        <div class="target-box" data-index="${index}">
          ${boxContent}
        </div>
      `;
    }).join('');
    
    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">${block.config.instructions}</h5>
          <p>Question ${this.currentQuestion + 1} of ${block.config.questions.length}</p>
          
          <div class="images-gallery mb-4">
            ${imagesHTML}
          </div>
          
          <div class="question-text mb-3">
            <strong>${question.question}</strong>
          </div>
          
          <div class="target-boxes mb-4">
            ${boxesHTML}
          </div>
          
          <div id="imageClickFeedback" class="mb-3"></div>
          
          <div class="mb-3">
            <strong>Selected image: </strong><span id="selectedImage">None</span>
          </div>
          
          <button class="btn btn-primary" id="checkImageButton" disabled>Place Image</button>
        </div>
      </div>
    `;
    
    // Add CSS for the image click exercise
    const style = document.createElement('style');
    style.textContent = `
      .images-gallery {
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
      }
      
      .image-item {
        border: 2px solid transparent;
        cursor: pointer;
        margin-bottom: 10px;
      }
      
      .image-item.selected {
        border-color: #bef264;
      }
      
      .target-boxes {
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
      }
      
      .target-box {
        width: 161px;
        height: 257px;
        border: 2px dashed #ccc;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        margin-bottom: 10px;
      }
      
      .target-box.highlight {
        border-color: #bef264;
        background-color: rgba(190, 242, 100, 0.1);
      }
    `;
    document.head.appendChild(style);
    
    // Set up event listeners for image selection
    let selectedImageIndex = null;
    
    document.querySelectorAll('.image-item').forEach(imageElement => {
      imageElement.addEventListener('click', () => {
        // Remove selection from all images
        document.querySelectorAll('.image-item').forEach(el => el.classList.remove('selected'));
        
        // Select this image
        imageElement.classList.add('selected');
        selectedImageIndex = parseInt(imageElement.dataset.index);
        
        // Update UI
        document.getElementById('selectedImage').textContent = `Image ${selectedImageIndex + 1}`;
        document.getElementById('checkImageButton').disabled = false;
      });
    });
    
    // Set up event listener for the place button
    document.getElementById('checkImageButton').addEventListener('click', () => {
      if (selectedImageIndex === null) return;
      
      // Place the image in the correct box
      const targetBoxIndex = question.boxIndex;
      const targetBox = document.querySelector(`.target-box[data-index="${targetBoxIndex}"]`);
      
      // Update the box content
      this.boxContents[targetBoxIndex] = selectedImageIndex;
      targetBox.innerHTML = `<img src="${block.config.images[selectedImageIndex]}" alt="Selected image" width="161" height="257">`;
      
      // Check if answer is correct
      const isCorrect = selectedImageIndex === question.correctImage;
      
      // Mark this question as attempted
      this.attemptsPerQuestion[this.currentQuestion] = true;
      
      // Calculate score for this question
      const pointsPerQuestion = Math.floor(100 / block.config.questions.length);
      
      if (isCorrect) {
        this.blockScore += pointsPerQuestion;
        document.getElementById('imageClickFeedback').innerHTML = `
          <div class="alert alert-success">¡Correcto! You selected the right image.</div>
        `;
      } else {
        document.getElementById('imageClickFeedback').innerHTML = `
          <div class="alert alert-danger">Incorrect. The right image was image ${question.correctImage + 1}.</div>
        `;
      }
      
      // Add a continue button
      document.getElementById('imageClickFeedback').innerHTML += `
        <button class="btn btn-primary mt-2" id="continueImageButton">Continue</button>
      `;
      
      // Disable interactions
      document.querySelectorAll('.image-item').forEach(el => {
        el.style.pointerEvents = 'none';
      });
      document.getElementById('checkImageButton').style.display = 'none';
      
      // Set up event listener for the continue button
      document.getElementById('continueImageButton').addEventListener('click', () => {
        this.currentQuestion++;
        this.displayImageClickQuestion(block);
      });
    });
  }

  renderDialogueExercise(block) {
    const container = document.getElementById('exerciseContainer');
    
    this.currentDialogue = 0;
    this.blockScore = 0;
    this.attemptsPerDialogue = new Array(block.config.dialogues.length).fill(false);
    
    this.displayDialogueExercise(block);
  }
  
  displayDialogueExercise(block) {
    if (this.currentDialogue >= block.config.dialogues.length) {
      this.currentBlockIndex++;
      this.score += this.blockScore;
      document.getElementById('totalScore').textContent = this.score;
      this.playCurrentBlock();
      return;
    }
    
    const dialogue = block.config.dialogues[this.currentDialogue];
    const container = document.getElementById('exerciseContainer');
    
    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">${block.config.instructions}</h5>
          <p>Dialogue ${this.currentDialogue + 1} of ${block.config.dialogues.length}</p>
          
          <div class="dialogue-instructions mb-4">
            <p><strong>Speaker A says:</strong> ${dialogue.speakerA.english}</p>
            <p><strong>Speaker B says:</strong> ${dialogue.speakerB.english}</p>
          </div>
          
          <div class="d-flex justify-content-between mb-4">
            <div class="speaker-box" id="speakerABox">
              <button class="btn btn-primary speak-btn" id="speakerABtn">
                <i class="fas fa-microphone"></i> Speaker A
              </button>
              <p class="mt-2">Your answer: <span id="speakerAResponse">Not recorded yet</span></p>
              <button class="btn btn-secondary submit-btn" id="submitA">Submit</button>
            </div>
            
            <div class="speaker-box" id="speakerBBox">
              <button class="btn btn-primary speak-btn" id="speakerBBtn">
                <i class="fas fa-microphone"></i> Speaker B
              </button>
              <p class="mt-2">Your answer: <span id="speakerBResponse">Not recorded yet</span></p>
              <button class="btn btn-secondary submit-btn" id="submitB">Submit</button>
            </div>
          </div>
          
          <div id="dialogueFeedback" class="mb-3"></div>
          <button class="btn btn-primary" id="continueDialogueBtn" style="display: none;">Continue</button>
        </div>
      </div>
    `;
    
    // Load Font Awesome for microphone icon
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const fontAwesome = document.createElement('link');
      fontAwesome.rel = 'stylesheet';
      fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css';
      document.head.appendChild(fontAwesome);
    }
    
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      document.getElementById('dialogueFeedback').innerHTML = `
        <div class="alert alert-warning">
          Your browser doesn't support speech recognition. Please try using Chrome.
        </div>
      `;
      document.getElementById('speakerABtn').disabled = true;
      document.getElementById('speakerBBtn').disabled = true;
      return;
    }
    
    // Set up speech recognition for Speaker A
    document.getElementById('speakerABtn').addEventListener('click', () => {
      this.startSpeechRecognition('A', dialogue.speakerA.spanish);
    });
    
    // Set up speech recognition for Speaker B
    document.getElementById('speakerBBtn').addEventListener('click', () => {
      this.startSpeechRecognition('B', dialogue.speakerB.spanish);
    });
    
    // Set up submit buttons
    document.getElementById('submitA').addEventListener('click', () => {
      this.checkDialogueAnswer('A', dialogue.speakerA.spanish);
    });
    
    document.getElementById('submitB').addEventListener('click', () => {
      this.checkDialogueAnswer('B', dialogue.speakerB.spanish);
    });
    
    // Set up continue button
    document.getElementById('continueDialogueBtn').addEventListener('click', () => {
      this.currentDialogue++;
      this.displayDialogueExercise(block);
    });
  }
  
  startSpeechRecognition(speaker, correctAnswer) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    const speakerBtn = document.getElementById(`speaker${speaker}Btn`);
    const responseSpan = document.getElementById(`speaker${speaker}Response`);
    
    // Show that recording is in progress
    speakerBtn.classList.add('btn-danger');
    speakerBtn.innerHTML = '<i class="fas fa-microphone"></i> Recording...';
    
    recognition.start();
    
    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript.toLowerCase().trim();
      responseSpan.textContent = speechResult;
      
      // Reset button appearance
      speakerBtn.classList.remove('btn-danger');
      speakerBtn.innerHTML = '<i class="fas fa-microphone"></i> Speaker ' + speaker;
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      responseSpan.textContent = 'Error: ' + event.error;
      
      // Reset button appearance
      speakerBtn.classList.remove('btn-danger');
      speakerBtn.innerHTML = '<i class="fas fa-microphone"></i> Speaker ' + speaker;
    };
    
    recognition.onend = () => {
      // Reset button appearance if it wasn't done in onresult or onerror
      if (speakerBtn.classList.contains('btn-danger')) {
        speakerBtn.classList.remove('btn-danger');
        speakerBtn.innerHTML = '<i class="fas fa-microphone"></i> Speaker ' + speaker;
      }
    };
  }
  
  checkDialogueAnswer(speaker, correctAnswer) {
    const speakerBox = document.getElementById(`speaker${speaker}Box`);
    const speakerBtn = document.getElementById(`speaker${speaker}Btn`);
    const submitBtn = document.getElementById(`submit${speaker}`);
    const responseSpan = document.getElementById(`speaker${speaker}Response`);
    const dialogueFeedback = document.getElementById('dialogueFeedback');
    
    const userSpeech = responseSpan.textContent.toLowerCase().trim();
    
    // Remove punctuation from both strings for comparison
    const normalizedCorrect = this.normalizeString(correctAnswer);
    const normalizedUser = this.normalizeString(userSpeech);
    
    const isCorrect = normalizedUser === normalizedCorrect;
    
    // Update UI based on correctness
    if (isCorrect) {
      speakerBox.style.backgroundColor = 'rgba(134, 239, 172, 0.3)';  // Light green
      speakerBox.style.borderColor = '#86efac';
    } else {
      speakerBox.style.backgroundColor = 'rgba(252, 165, 165, 0.3)';  // Light red
      speakerBox.style.borderColor = '#fca5a5';
    }
    
    // Disable the buttons
    speakerBtn.disabled = true;
    submitBtn.disabled = true;
    
    // Check if both speakers have been submitted
    if (document.getElementById('speakerABtn').disabled && 
        document.getElementById('speakerBBtn').disabled) {
      
      // Calculate score
      const speakerACorrect = document.getElementById('speakerABox').style.backgroundColor.includes('rgba(134, 239, 172');
      const speakerBCorrect = document.getElementById('speakerBBox').style.backgroundColor.includes('rgba(134, 239, 172');
      
      const pointsPerDialogue = Math.floor(100 / block.config.dialogues.length);
      let dialogueScore = 0;
      
      if (speakerACorrect && speakerBCorrect) {
        dialogueScore = pointsPerDialogue;
        dialogueFeedback.innerHTML = `
          <div class="alert alert-success">
            ¡Perfecto! Both responses are correct.
          </div>
        `;
      } else if (speakerACorrect || speakerBCorrect) {
        dialogueScore = Math.floor(pointsPerDialogue / 2);
        dialogueFeedback.innerHTML = `
          <div class="alert alert-warning">
            Partial credit. One response is correct.
          </div>
        `;
      } else {
        dialogueFeedback.innerHTML = `
          <div class="alert alert-danger">
            Both responses need improvement.
          </div>
        `;
      }
      
      // Show correct answers
      dialogueFeedback.innerHTML += `
        <div class="mt-2">
          <p><strong>Correct answers:</strong></p>
          <p>Speaker A: ${block.config.dialogues[this.currentDialogue].speakerA.spanish}</p>
          <p>Speaker B: ${block.config.dialogues[this.currentDialogue].speakerB.spanish}</p>
        </div>
      `;
      
      // Add score to this block
      this.blockScore += dialogueScore;
      
      // Mark this dialogue as attempted
      this.attemptsPerDialogue[this.currentDialogue] = true;
      
      // Show continue button
      document.getElementById('continueDialogueBtn').style.display = 'block';
    }
  }
  
  normalizeString(str) {
    // Remove punctuation, multiple spaces, and trim
    return str.toLowerCase()
      .replace(/[.,\/#!¡?¿;:{}=\-_`~()]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  renderAccentExercise(block) {
    const container = document.getElementById('exerciseContainer');
    
    this.currentSentence = 0;
    this.blockScore = 0;
    this.attemptsPerSentence = new Array(block.config.sentences.length).fill(false);
    
    this.displayAccentSentence(block);
  }
  
  displayAccentSentence(block) {
    if (this.currentSentence >= block.config.sentences.length) {
      this.currentBlockIndex++;
      this.score += this.blockScore;
      document.getElementById('totalScore').textContent = this.score;
      this.playCurrentBlock();
      return;
    }
    
    const sentence = block.config.sentences[this.currentSentence];
    const container = document.getElementById('exerciseContainer');
    
    // Add CSS for accent exercise
    if (!document.getElementById('accent-exercise-styles')) {
      const style = document.createElement('style');
      style.id = 'accent-exercise-styles';
      style.textContent = `
        .title {
          background-color: #bef264;
          color: #000;
          font-size: 1.5rem;
          font-weight: bold;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          text-align: center;
        }
        #sentence-container {
          font-size: 24px;
          margin-bottom: 20px;
          padding: 20px;
          border: 2px solid #bef264;
          border-radius: 0.75rem;
          background-color: rgba(190, 242, 100, 0.1);
        }
        .letter {
          cursor: pointer;
          padding: 0;
          margin: 0;
          transition: background-color 0.2s;
          display: inline-block;
        }
        .letter:hover {
          background-color: rgba(190, 242, 100, 0.3);
        }
        .selected {
          background-color: #bef264;
        }
        .correct {
          color: #166534;
          font-weight: bold;
        }
        .wrong {
          color: #dc2626;
        }
      `;
      document.head.appendChild(style);
    }
    
    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h3 class="title">${block.config.title}</h3>
          <p>${block.config.instructions}</p>
          <p>Sentence ${this.currentSentence + 1} of ${block.config.sentences.length}</p>
          
          <div id="sentence-container"></div>
          
          <div id="accentFeedback" class="mb-3"></div>
          
          <button class="btn btn-primary" id="checkAccentButton">Submit Answer</button>
          <button class="btn btn-secondary" id="nextSentenceButton" style="display:none;">Next Sentence</button>
        </div>
      </div>
    `;
    
    // Render the sentence with clickable letters
    const sentenceContainer = document.getElementById('sentence-container');
    const text = sentence.text;
    this.selectedIndices = new Set();
    
    const words = text.split(' ');
    words.forEach((word, wordIndex) => {
      for (let i = 0; i < word.length; i++) {
        const span = document.createElement('span');
        span.textContent = word[i];
        span.classList.add('letter');
        
        // Calculate the index in the original string
        const globalIndex = text.indexOf(word) + i;
        span.dataset.index = globalIndex;
        
        span.addEventListener('click', () => {
          if (span.classList.contains('selected')) {
            span.classList.remove('selected');
            this.selectedIndices.delete(globalIndex);
          } else {
            span.classList.add('selected');
            this.selectedIndices.add(globalIndex);
          }
        });
        
        sentenceContainer.appendChild(span);
      }
      
      // Add space between words, but not after the last word
      if (wordIndex < words.length - 1) {
        const space = document.createTextNode(' ');
        sentenceContainer.appendChild(space);
      }
    });
    
    // Set up event listeners for buttons
    document.getElementById('checkAccentButton').addEventListener('click', () => {
      this.checkAccentAnswer(sentence);
    });
    
    document.getElementById('nextSentenceButton').addEventListener('click', () => {
      this.currentSentence++;
      this.displayAccentSentence(block);
    });
  }
  
  checkAccentAnswer(sentence) {
    const correctIndices = new Set(sentence.corrections.map(c => c.index));
    let isCorrect = true;
    
    if (this.selectedIndices.size !== correctIndices.size) {
      isCorrect = false;
    } else {
      for (let idx of this.selectedIndices) {
        if (!correctIndices.has(Number(idx))) {
          isCorrect = false;
          break;
        }
      }
    }
    
    // Mark this sentence as attempted
    this.attemptsPerSentence[this.currentSentence] = true;
    
    // Update letters to show correctness
    const letters = document.querySelectorAll('#sentence-container .letter');
    letters.forEach(letter => {
      const idx = Number(letter.dataset.index);
      if (correctIndices.has(idx)) {
        if (letter.classList.contains('selected')) {
          const correction = sentence.corrections.find(c => c.index === idx);
          letter.textContent = correction.accent;
          letter.classList.add('correct');
          letter.classList.remove('selected');
        } else {
          letter.classList.add('wrong');
        }
      } else {
        if (letter.classList.contains('selected')) {
          letter.classList.add('wrong');
        }
      }
      letter.style.pointerEvents = 'none';
    });
    
    // Calculate points for this sentence
    const pointsPerSentence = Math.floor(100 / block.config.sentences.length);
    
    if (isCorrect) {
      this.blockScore += pointsPerSentence;
      document.getElementById('accentFeedback').innerHTML = `
        <div class="alert alert-success">¡Perfecto! You identified all the accent marks correctly.</div>
      `;
    } else {
      document.getElementById('accentFeedback').innerHTML = `
        <div class="alert alert-danger">Some accents were missed or incorrectly identified.</div>
      `;
    }
    
    // Update UI for next steps
    document.getElementById('checkAccentButton').style.display = 'none';
    document.getElementById('nextSentenceButton').style.display = 'inline-block';
    
    // Move to the next sentence
    document.getElementById('nextSentenceButton').addEventListener('click', () => {
      this.currentSentence++;
      if (this.currentSentence < block.config.sentences.length) {
        this.displayAccentSentence(block);
      } else {
        this.currentBlockIndex++;
        this.playCurrentBlock();
      }
    });
  }

  renderPickPictureExercise(block) {
    const container = document.getElementById('exerciseContainer');
    
    this.currentExercise = 0;
    this.blockScore = 0;
    this.attemptsPerExercise = new Array(block.config.exercises.length).fill(false);
    
    this.displayPickPictureExercise(block);
  }
  
  displayPickPictureExercise(block) {
    if (this.currentExercise >= block.config.exercises.length) {
      this.currentBlockIndex++;
      this.score += this.blockScore;
      document.getElementById('totalScore').textContent = this.score;
      this.playCurrentBlock();
      return;
    }
    
    const exercise = block.config.exercises[this.currentExercise];
    const container = document.getElementById('exerciseContainer');
    
    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h3 class="title">${block.config.title}</h3>
          <p>${block.config.instructions}</p>
          <p>Exercise ${this.currentExercise + 1} of ${block.config.exercises.length}</p>
          
          <div class="verb-display mt-3 mb-4">
            <strong>${exercise.verb}</strong>
          </div>
          
          <div class="images-container mb-4">
            ${exercise.images.map((imgUrl, index) => `
              <div class="image-wrapper">
                <img src="${imgUrl}" data-index="${index}" class="pick-image" alt="Image ${index + 1}">
              </div>
            `).join('')}
          </div>
          
          <div id="pickPictureFeedback" class="mb-3"></div>
          
          <button class="btn btn-primary" id="checkPickButton">Submit Answer</button>
        </div>
      </div>
    `;
    
    // Add CSS
    if (!document.getElementById('pickpicture-styles')) {
      const style = document.createElement('style');
      style.id = 'pickpicture-styles';
      style.textContent = `
        .verb-display {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .images-container {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin: 0 auto;
          max-width: 600px;
          place-items: center;
        }
        .image-wrapper {
          cursor: pointer;
        }
        .pick-image {
          width: 180px;
          height: 180px;
          object-fit: cover;
          border-radius: 8px;
          border: 4px solid transparent;
          transition: border-color 0.3s;
        }
        .pick-image.selected {
          border-color: #bef264;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Set up event listeners for image selection
    document.querySelectorAll('.pick-image').forEach(img => {
      img.addEventListener('click', () => {
        img.classList.toggle('selected');
      });
    });
    
    // Set up event listener for the check button
    document.getElementById('checkPickButton').addEventListener('click', () => {
      this.checkPickPictureAnswer(exercise);
    });
  }
  
  checkPickPictureAnswer(exercise) {
    const selectedImages = document.querySelectorAll('.pick-image.selected');
    const selectedIndices = Array.from(selectedImages).map(img => parseInt(img.dataset.index));
    const correctIndices = exercise.correctAnswers;
    
    // Sort both arrays for comparison
    const sortedSelected = [...selectedIndices].sort((a, b) => a - b);
    const sortedCorrect = [...correctIndices].sort((a, b) => a - b);
    
    // Mark this exercise as attempted
    this.attemptsPerExercise[this.currentExercise] = true;
    
    // Calculate points
    const pointsPerExercise = Math.floor(100 / block.config.exercises.length);
    let earned = 0;
    
    // Check if answers are correct
    const isExactMatch = JSON.stringify(sortedSelected) === JSON.stringify(sortedCorrect);
    
    if (isExactMatch) {
      earned = pointsPerExercise;
      document.getElementById('pickPictureFeedback').innerHTML = `
        <div class="alert alert-success">¡Correcto! You selected all the right images.</div>
      `;
    } else {
      // Calculate partial credit based on how many correct images they got
      let correctSelections = 0;
      for (let index of selectedIndices) {
        if (correctIndices.includes(index)) {
          correctSelections++;
        }
      }
      
      // Calculate incorrect selections
      const incorrectSelections = selectedIndices.length - correctSelections;
      
      // Award partial credit: each correct selection is worth some points
      // but subtract for incorrect selections
      const maxPoints = correctIndices.length;
      const partialScore = Math.max(0, (correctSelections / maxPoints) - (incorrectSelections * 0.25));
      earned = Math.floor(pointsPerExercise * partialScore);
      
      document.getElementById('pickPictureFeedback').innerHTML = `
        <div class="alert alert-warning">
          Partial credit: You got ${correctSelections} out of ${maxPoints} correct images, 
          with ${incorrectSelections} incorrect selections.
        </div>
      `;
    }
    
    this.blockScore += earned;
    
    document.getElementById('pickPictureFeedback').innerHTML += `
      <div class="mt-2">Correct images: ${correctIndices.map(i => `Image ${i+1}`).join(', ')}</div>
      <button class="btn btn-primary mt-3" id="continuePickButton">Continue</button>
    `;
    
    // Highlight correct and incorrect selections
    document.querySelectorAll('.pick-image').forEach(img => {
      const index = parseInt(img.dataset.index);
      const isSelected = img.classList.contains('selected');
      const isCorrect = correctIndices.includes(index);
      
      if (isSelected) {
        if (isCorrect) {
          img.style.borderColor = '#86efac'; // Green for correct selections
        } else {
          img.style.borderColor = '#fca5a5'; // Red for incorrect selections
        }
      } else if (isCorrect) {
        // Highlight the correct ones that weren't selected
        img.style.borderColor = '#86efac';
        img.style.opacity = '0.7';
      }
      
      img.style.pointerEvents = 'none'; // Disable further interaction
    });
    
    // Disable check button
    document.getElementById('checkPickButton').style.display = 'none';
    
    // Set up continue button
    document.getElementById('continuePickButton').addEventListener('click', () => {
      this.currentExercise++;
      this.displayPickPictureExercise(block);
    });
  }

  renderSentenceMatchingExercise(block) {
    const container = document.getElementById('exerciseContainer');
    
    this.currentExercise = 0;
    this.blockScore = 0;
    this.attemptsPerExercise = new Array(block.config.exercises.length).fill(false);
    
    this.displaySentenceMatchingExercise(block);
  }
  
  displaySentenceMatchingExercise(block) {
    if (this.currentExercise >= block.config.exercises.length) {
      this.currentBlockIndex++;
      this.score += this.blockScore;
      document.getElementById('totalScore').textContent = this.score;
      this.playCurrentBlock();
      return;
    }
    
    const exercise = block.config.exercises[this.currentExercise];
    const container = document.getElementById('exerciseContainer');
    
    // Add CSS for sentence matching exercise
    if (!document.getElementById('sentence-matching-styles')) {
      const style = document.createElement('style');
      style.id = 'sentence-matching-styles';
      style.textContent = `
        #cards-container {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          justify-content: center;
          align-items: stretch;
          max-width: 1200px;
          margin: 20px auto;
        }
        .card {
          flex: 1 1 140px;
          min-height: 100px;
          max-width: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-size: 19px;
          border: 2px solid #bef264;
          position: relative;
          cursor: pointer;
          padding: 15px;
          box-sizing: border-box;
          word-wrap: break-word;
          border-radius: 8px;
          transition: transform 0.2s;
        }
        .card:hover {
          transform: scale(1.02);
        }
        .blue-card {
          background-color: #bef264;
          color: #000;
          font-weight: bold;
        }
        .white-card {
          background-color: white;
          color: #000;
          border: 2px solid #bef264;
        }
        .correct {
          border-color: #bef264;
        }
        .white-card.correct {
          background-color: rgba(190, 242, 100, 0.1);
        }
        .blue-card.correct {
          border-color: #bef264;
          background-color: #bef264;
        }
        .incorrect {
          border-color: #ff4444;
          background-color: rgba(255, 68, 68, 0.1);
        }
        .icon {
          position: absolute;
          top: 5px;
          right: 5px;
          font-size: 20px;
        }
        .correct .icon {
          color: #4caf50;
        }
        .incorrect .icon {
          color: #ff4444;
        }
      `;
      document.head.appendChild(style);
    }
    
    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h3 class="title">${block.config.title || 'Sentence Matches'}</h3>
          <p>${block.config.instructions || 'Click on a green card and then click on a white card that completes a sentence'}</p>
          <p>Exercise ${this.currentExercise + 1} of ${block.config.exercises.length}</p>
          
          <div id="cards-container"></div>
          
          <div id="matchingFeedback" class="mb-3 mt-3"></div>
        </div>
      </div>
    `;
    
    // Load the Font Awesome for icons if not already loaded
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const fontAwesome = document.createElement('link');
      fontAwesome.rel = 'stylesheet';
      fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
      document.head.appendChild(fontAwesome);
    }
    
    const cardsContainer = document.getElementById('cards-container');
    let selectedBlueCard = null;
    let matchCount = 0;
    let exerciseScore = 0;
    
    // Calculate total possible matches for this exercise
    const totalPossibleMatches = Object.values(exercise.matches).reduce((sum, ids) => sum + ids.length, 0);
    
    // Function to create card elements
    const createCard = (card, isBlue) => {
      const cardElement = document.createElement('div');
      cardElement.classList.add('card');
      cardElement.classList.add(isBlue ? 'blue-card' : 'white-card');
      cardElement.textContent = card.text;
      cardElement.dataset.id = card.id;
      
      cardElement.addEventListener('click', () => {
        if (isBlue) {
          selectedBlueCard = card;
        } else if (selectedBlueCard) {
          const currentMatches = exercise.matches[selectedBlueCard.id] || [];
          
          if (currentMatches.includes(card.id)) {
            // Correct match
            matchCount++;
            
            // Calculate points for this match
            const pointsPerMatch = 100 / totalPossibleMatches;
            exerciseScore += pointsPerMatch;
            
            // Mark both cards as correct
            markCard(selectedBlueCard.id, true);
            markCard(card.id, true);
            
            // Check if all matches are found
            if (matchCount === totalPossibleMatches) {
              // Mark this exercise as attempted
              this.attemptsPerExercise[this.currentExercise] = true;
              
              // Add score to this block
              this.blockScore += Math.round(exerciseScore);
              
              // Display feedback and continue button
              document.getElementById('matchingFeedback').innerHTML = `
                <div class="alert alert-success">
                  ¡Perfecto! You've completed all the matches.
                </div>
                <button class="btn btn-primary" id="continueMatchingBtn">Continue</button>
              `;
              
              document.getElementById('continueMatchingBtn').addEventListener('click', () => {
                this.currentExercise++;
                this.displaySentenceMatchingExercise(block);
              });
            }
          } else {
            // Incorrect match
            exerciseScore = Math.max(0, exerciseScore - 3); // Penalty for wrong match
            
            // Mark both cards as incorrect temporarily
            markCard(selectedBlueCard.id, false);
            markCard(card.id, false);
            
            // Remove incorrect marking after a short delay
            setTimeout(() => {
              const blueCardEl = document.querySelector(`.card[data-id="${selectedBlueCard.id}"]`);
              const whiteCardEl = document.querySelector(`.card[data-id="${card.id}"]`);
              
              if (blueCardEl) {
                blueCardEl.classList.remove('incorrect');
                const icon = blueCardEl.querySelector('.icon');
                if (icon) icon.remove();
              }
              
              if (whiteCardEl) {
                whiteCardEl.classList.remove('incorrect');
                const icon = whiteCardEl.querySelector('.icon');
                if (icon) icon.remove();
              }
            }, 1000);
          }
          
          // Reset selected blue card
          selectedBlueCard = null;
        }
      });
      
      cardsContainer.appendChild(cardElement);
    };
    
    // Function to mark cards as correct or incorrect
    const markCard = (cardId, isCorrect) => {
      const cardElement = document.querySelector(`.card[data-id="${cardId}"]`);
      if (!cardElement) return;
      
      cardElement.classList.remove('correct', 'incorrect');
      cardElement.classList.add(isCorrect ? 'correct' : 'incorrect');
      
      // Remove existing icon if any
      const existingIcon = cardElement.querySelector('.icon');
      if (existingIcon) {
        existingIcon.remove();
      }
      
      // Add appropriate icon
      const icon = document.createElement('i');
      icon.classList.add('icon', 'fas', isCorrect ? 'fa-check' : 'fa-times');
      cardElement.appendChild(icon);
    };
    
    // Create all cards for this exercise
    exercise.blueCards.forEach(card => createCard(card, true));
    exercise.whiteCards.forEach(card => createCard(card, false));
  }

  renderSpeakingListeningExercise(block) {
    const container = document.getElementById('exerciseContainer');
    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h3 class="title">${block.config.title || 'Spanish Speaking and Listening Practice'}</h3>
          <p>${block.config.instructions || 'Practice Spanish conversations by speaking and listening'}</p>
          <div id="score-container">Score: <span id="exercise-score">0</span></div>
          <div id="exercise-progress" class="progress-container">Exercise: <span id="current-exercise">1</span>/${block.config.exercises.length}</div>

          <div id="exercise-container"></div>

          <div id="completion-message" style="display:none;">
            ¡Felicidades! You've completed all exercises!
            <p>Exercise Score: <span id="final-score">0</span></p>
          </div>
        </div>
      </div>
    `;

    // Load Font Awesome for icons if not already loaded
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const fontAwesome = document.createElement('link');
      fontAwesome.rel = 'stylesheet';
      fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
      document.head.appendChild(fontAwesome);
    }

    // Add CSS specific to speaking-listening exercises
    if (!document.getElementById('speaking-listening-styles')) {
      const style = document.createElement('style');
      style.id = 'speaking-listening-styles';
      style.textContent = `
        .exercise-container {
          background-color: #fff;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
          display: none;
        }
        .active {
          display: block;
        }
        .exercise-image {
          width: 160px;
          height: 160px;
          object-fit: cover;
          border-radius: 8px;
          border: 2px solid #e2e8f0;
          margin: 10px 0;
        }
        .button-container {
          margin: 15px 0;
        }
        .speaking-btn {
          background-color: #bef264;
          margin-right: 10px;
          transition: background-color 0.3s;
        }
        .speaking-btn:hover {
          background-color: #a8e04d;
        }
        .textarea-container {
          margin-top: 15px;
        }
        textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #e2e8f0;
          border-radius: 5px;
          height: 80px;
          margin-bottom: 10px;
        }
        .feedback {
          margin-top: 10px;
          padding: 10px;
          border-radius: 5px;
        }
        .correct {
          background-color: #c6f6d5;
          color: #276749;
        }
        .incorrect {
          background-color: #fed7d7;
          color: #9b2c2c;
        }
        .hidden {
          display: none;
        }
        .speech-instructions {
          font-style: italic;
          color: #718096;
          margin-bottom: 10px;
        }
        .highlighted {
          background-color: #bef264;
          color: #000;
          font-weight: bold;
          padding: 0.2rem 0.4rem;
          border-radius: 0.375rem;
        }
      `;
      document.head.appendChild(style);
    }

    this.currentExercise = 1;
    this.blockScore = 0;
    this.attemptsPerExercise = new Array(block.config.exercises.length).fill(false);
    this.pointsPerExercise = 100 / block.config.exercises.length;
    
    this.initializeSpeakingListeningExercises(block);
  }

  initializeSpeakingListeningExercises(block) {
    // Check if the browser supports the Web Speech API
    if (!('webkitSpeechRecognition' in window) || !('speechSynthesis' in window)) {
      alert('Your browser does not support the Web Speech API. Please try using Chrome, Edge, or Safari.');
      return;
    }

    // Generate exercise HTML
    const exerciseContainer = document.getElementById('exercise-container');
    exerciseContainer.innerHTML = '';
    
    block.config.exercises.forEach((exercise, index) => {
      const isActive = index === 0 ? 'active' : '';
      
      const exerciseHTML = `
        <div id="exercise-${index + 1}" class="exercise-container ${isActive}">
          <h2 class="exercise-title">${exercise.title || `Exercise ${index + 1}`}</h2>
          <img src="${exercise.imageSrc || '/api/placeholder/160/160'}" alt="${exercise.imageAlt || 'Exercise image'}" class="exercise-image">
          <div class="speech-instructions">Click the microphone button and ask: <span class="highlighted">"${exercise.askQuestion || '¿Cómo estás?'}"</span></div>
          <div class="button-container">
            <button id="btn-${exerciseNum - 1}-1" class="speaking-btn"><i class="fas fa-microphone"></i> Ask Question</button>
            <button id="btn-${exerciseNum - 1}-2" disabled><i class="fas fa-volume-up"></i> Listen to Answer</button>
            <button id="btn-${exerciseNum - 1}-3" class="speaking-btn" disabled><i class="fas fa-microphone"></i> Ask Follow-up</button>
            <button id="btn-${exerciseNum - 1}-4" disabled><i class="fas fa-volume-up"></i> Listen to Answer</button>
          </div>
          <div id="textarea-container-${index + 1}" class="textarea-container hidden">
            <p>Write a note in Spanish that includes: <span class="highlighted">"${(exercise.expectedText || []).join('", "')}"</span></p>
            <textarea id="text-${index + 1}" rows="4" placeholder="Write your Spanish note here..."></textarea>
            <button id="submit-${index + 1}"><i class="fas fa-check"></i> Submit</button>
            <div id="feedback-${index + 1}" class="feedback hidden"></div>
          </div>
        </div>
      `;
      
      exerciseContainer.innerHTML += exerciseHTML;
    });

    // Setup event handlers for all exercises
    block.config.exercises.forEach((exercise, index) => {
      const exerciseNum = index + 1;
      
      // First button: Ask question
      this.setupSpeechRecognition(`btn-${exerciseNum}-1`, exercise.askQuestion || '¿Cómo estás?', function() {
        document.getElementById(`btn-${exerciseNum}-2`).disabled = false;
      });
      
      // Second button: Listen to first answer
      this.setupSpeechSynthesis(`btn-${exerciseNum}-2`, exercise.firstAnswer || 'Estoy bien');
      
      // Third button: Ask follow-up
      this.setupSpeechRecognition(`btn-${exerciseNum}-3`, exercise.askFollowup || '¿De dónde eres?', function() {
        document.getElementById(`btn-${exerciseNum}-4`).disabled = false;
      });
      
      // Fourth button: Listen to second answer
      this.setupSpeechSynthesis(`btn-${exerciseNum}-4`, exercise.secondAnswer || 'Soy de España');
      
      // Setup text submission
      this.setupTextSubmission(exerciseNum, block);
    });
  }

  setupSpeechRecognition(buttonId, expectedPhrase, onSuccess) {
    const button = document.getElementById(buttonId);
    
    button.addEventListener('click', () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      
      // Visual feedback that recognition is active
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Listening...';
      button.style.backgroundColor = '#FC8181';
      
      recognition.start();
      
      recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript.toLowerCase();
        console.log('Speech recognized:', speechResult);
        
        // Check if the speech contains the expected phrase
        if (speechResult.includes(expectedPhrase.toLowerCase())) {
          button.innerHTML = '<i class="fas fa-check"></i> Correct!';
          button.style.backgroundColor = '#bef264';
          if (typeof onSuccess === 'function') onSuccess();
        } else {
          button.innerHTML = '<i class="fas fa-times"></i> Try Again';
          button.style.backgroundColor = '#FC8181';
          setTimeout(() => {
            button.innerHTML = '<i class="fas fa-microphone"></i> Ask Question';
            button.style.backgroundColor = '#bef264';
          }, 2000);
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        button.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error. Try Again';
        button.style.backgroundColor = '#FC8181';
        setTimeout(() => {
          button.innerHTML = '<i class="fas fa-microphone"></i> Ask Question';
          button.style.backgroundColor = '#bef264';
        }, 2000);
      };
      
      recognition.onend = () => {
        if (button.textContent.includes('Listening')) {
          button.innerHTML = '<i class="fas fa-microphone"></i> Ask Question';
          button.style.backgroundColor = '#bef264';
        }
      };
    });
  }

  setupSpeechSynthesis(buttonId, textToSpeak) {
    const button = document.getElementById(buttonId);
    
    button.addEventListener('click', () => {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9; // Slightly slower than default
      
      button.disabled = true;
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Speaking...';
      
      utterance.onend = () => {
        button.innerHTML = '<i class="fas fa-check"></i> Played';
        
        // Enable the next button if it exists
        const nextButtonId = buttonId.replace(/\d$/, function(n) {
          return parseInt(n) + 1;
        });
        const nextButton = document.getElementById(nextButtonId);
        if (nextButton) {
          nextButton.disabled = false;
        } else {
          // This is the last button, show the text area
          const exerciseNum = buttonId.split('-')[1];
          const textareaContainer = document.getElementById('textarea-container-' + exerciseNum);
          textareaContainer.classList.remove('hidden');
        }
      };
      
      speechSynthesis.speak(utterance);
    });
  }

  setupTextSubmission(exerciseNum, block) {
    const submitButton = document.getElementById('submit-' + exerciseNum);
    const textarea = document.getElementById('text-' + exerciseNum);
    const feedback = document.getElementById('feedback-' + exerciseNum);
    
    if (!submitButton || !textarea || !feedback) return;
    
    submitButton.addEventListener('click', () => {
      const userText = textarea.value.toLowerCase();
      const exercise = block.config.exercises[exerciseNum - 1]; // Arrays are 0-indexed
      const expectedTextParts = exercise.expectedText || [];
      
      // Check if the text contains all expected parts
      const allPartsIncluded = expectedTextParts.every(part => 
        userText.includes(part.toLowerCase())
      );
      
      // Mark this exercise as attempted
      this.attemptsPerExercise[exerciseNum - 1] = true;
      
      if (allPartsIncluded) {
        // Correct answer
        feedback.innerHTML = '<i class="fas fa-check-circle"></i> ¡Correcto! Good job!';
        feedback.className = 'feedback correct';
        submitButton.disabled = true;
        textarea.disabled = true;
        
        // Add points to the score
        this.blockScore += this.pointsPerExercise;
        document.getElementById('exercise-score').textContent = Math.round(this.blockScore);
        
        // Prepare to move to the next exercise after a delay
        setTimeout(() => {
          if (this.currentExercise < block.config.exercises.length) {
            this.moveToNextSpeakingExercise(block);
          } else {
            this.completeSpeakingExercises();
          }
        }, 2000);
      } else {
        // Incorrect answer
        feedback.innerHTML = '<i class="fas fa-exclamation-circle"></i> Please include all the required phrases in your response.';
        feedback.className = 'feedback incorrect';
      }
      
      feedback.classList.remove('hidden');
    });
  }

  moveToNextSpeakingExercise(block) {
    // Hide current exercise
    document.getElementById('exercise-' + this.currentExercise).classList.remove('active');
    
    // Show next exercise
    this.currentExercise++;
    document.getElementById('exercise-' + this.currentExercise).classList.add('active');
    document.getElementById('current-exercise').textContent = this.currentExercise;
  }

  completeSpeakingExercises() {
    // Hide the last exercise
    document.getElementById('exercise-' + this.currentExercise).classList.remove('active');
    
    // Hide the progress indicator
    document.getElementById('exercise-progress').style.display = 'none';
    
    // Show completion message
    const completionMessage = document.getElementById('completion-message');
    completionMessage.style.display = 'block';
    document.getElementById('final-score').textContent = Math.round(this.blockScore);

    // Update total score and move to next block
    this.score += this.blockScore;
    document.getElementById('totalScore').textContent = this.score;
    
    // Wait a moment before moving to the next block
    setTimeout(() => {
      this.currentBlockIndex++;
      this.playCurrentBlock();
    }, 3000);
  }

  renderSpellingQuizExercise(block) {
    const container = document.getElementById('exerciseContainer');
    
    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h3 class="title">${block.config.title || 'Spelling Pop Quiz'}</h3>
          <p>${block.config.instructions || 'Look at the incomplete Spanish word. Click on the missing letter(s) in correct order to complete it.'}</p>
          
          <div class="container">
            <div class="word" id="spellingWord">${block.config.spellingWord}</div>
            <div id="missingLetters"></div>
          </div>
          
          <button class="btn btn-primary" id="checkSpellingButton">Check Answer</button>
          <div id="spellingFeedback" class="mb-3"></div>
        </div>
      </div>
    `;

    // Add CSS for Spelling Quiz
    if (!document.getElementById('spelling-quiz-styles')) {
      const style = document.createElement('style');
      style.id = 'spelling-quiz-styles';
      style.textContent = `
        .word {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 20px;
        }
        #checkSpellingButton {
          margin-top: 20px;
        }
      `;
      document.head.appendChild(style);
    }

    document.getElementById('checkSpellingButton').addEventListener('click', () => {
      this.checkSpellingAnswer(prompt("Please enter your answer for the spelling quiz:"));
    });
  }

  checkSpellingAnswer(answer) {
    const correctAnswer = this.lesson.blocks[this.currentBlockIndex].config.spellingAnswer.toLowerCase();
    const feedbackElement = document.getElementById('spellingFeedback');
    
    if (answer.toLowerCase() === correctAnswer) {
      feedbackElement.textContent = "Correct! You spelled the word correctly.";
      feedbackElement.className = "alert alert-success";
    } else {
      feedbackElement.textContent = `Incorrect! The correct spelling is: ${correctAnswer}.`;
      feedbackElement.className = "alert alert-danger";
    }
  }

  renderConversationExercise(block) {
    // Code for rendering conversation exercises
  }
}