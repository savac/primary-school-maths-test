// State management
let selectedTables = [];
let currentQuestion = null;
let score = 0;
let totalQuestions = 0;
let maxProblems = 10;
let timerEnabled = false;
let timerSeconds = 6;
let autoSkip = false;
let timerInterval = null;
let currentTimeLeft = 0;

// DOM elements
const settingsScreen = document.getElementById('settingsScreen');
const quizScreen = document.getElementById('quizScreen');
const resultsScreen = document.getElementById('resultsScreen');
const startButton = document.getElementById('startButton');
const backButton = document.getElementById('backButton');
const numProblemsInput = document.getElementById('numProblems');
const enableTimerCheckbox = document.getElementById('enableTimer');
const timerSecondsInput = document.getElementById('timerSeconds');
const autoSkipCheckbox = document.getElementById('autoSkip');
const timerDisplay = document.getElementById('timerDisplay');
const timerValue = document.getElementById('timerValue');
const selectionError = document.getElementById('selectionError');
const tryAgainButton = document.getElementById('tryAgainButton');
const newSettingsButton = document.getElementById('newSettingsButton');
const answerInput = document.getElementById('answerInput');
const submitButton = document.getElementById('submitButton');
const feedback = document.getElementById('feedback');
const scoreElement = document.getElementById('score');
const totalElement = document.getElementById('total');
const factor1Element = document.getElementById('factor1');
const factor2Element = document.getElementById('factor2');

// Initialize event listeners
startButton.addEventListener('click', startQuiz);
backButton.addEventListener('click', goToSettings);
submitButton.addEventListener('click', checkAnswer);
tryAgainButton.addEventListener('click', restartQuiz);
newSettingsButton.addEventListener('click', goToSettings);
enableTimerCheckbox.addEventListener('change', (e) => {
    timerSecondsInput.disabled = !e.target.checked;
    autoSkipCheckbox.disabled = !e.target.checked;
});
answerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkAnswer();
    }
});

// Check/uncheck boxes on label click
document.querySelectorAll('.table-option').forEach(option => {
    const checkbox = option.querySelector('input[type="checkbox"]');
    const label = option.querySelector('label');

    label.addEventListener('click', (e) => {
        e.preventDefault();
        checkbox.checked = !checkbox.checked;
    });
});

function startQuiz() {
    // Get selected tables
    selectedTables = Array.from(document.querySelectorAll('.checkbox-wrapper input:checked'))
        .map(checkbox => parseInt(checkbox.value));

    // Validate selection
    if (selectedTables.length === 0) {
        selectionError.textContent = '⚠️ Please select at least one times table!';
        return;
    }

    // Get number of problems
    maxProblems = parseInt(numProblemsInput.value);
    if (isNaN(maxProblems) || maxProblems < 1) {
        maxProblems = 10;
        numProblemsInput.value = 10;
    }

    // Get timer settings
    timerEnabled = enableTimerCheckbox.checked;
    if (timerEnabled) {
        timerSeconds = parseInt(timerSecondsInput.value);
        if (isNaN(timerSeconds) || timerSeconds < 3) {
            timerSeconds = 6;
            timerSecondsInput.value = 6;
        }
        autoSkip = autoSkipCheckbox.checked;
        timerDisplay.classList.remove('hidden');
    } else {
        timerDisplay.classList.add('hidden');
    }

    selectionError.textContent = '';

    // Reset score
    score = 0;
    totalQuestions = 0;
    updateScore();

    // Show quiz screen
    settingsScreen.classList.remove('active');
    quizScreen.classList.add('active');

    // Generate first question
    generateQuestion();
    answerInput.focus();
}

function restartQuiz() {
    // Reset score
    score = 0;
    totalQuestions = 0;
    updateScore();

    // Show quiz screen
    resultsScreen.classList.remove('active');
    quizScreen.classList.add('active');

    // Generate first question
    generateQuestion();
    answerInput.focus();
}

function goToSettings() {
    clearTimer();
    quizScreen.classList.remove('active');
    resultsScreen.classList.remove('active');
    settingsScreen.classList.add('active');
    feedback.textContent = '';
    answerInput.value = '';
}

function generateQuestion() {
    // Clear previous feedback
    feedback.textContent = '';
    feedback.className = 'feedback';
    answerInput.value = '';
    submitButton.disabled = false;

    // Select random table from selected tables (this will be the first factor)
    const selectedTable = selectedTables[Math.floor(Math.random() * selectedTables.length)];

    // Generate random second factor (1-12)
    const randomFactor = Math.floor(Math.random() * 12) + 1;

    // Create question
    currentQuestion = {
        factor1: selectedTable,
        factor2: randomFactor,
        answer: selectedTable * randomFactor
    };

    // Display question
    factor1Element.textContent = currentQuestion.factor1;
    factor2Element.textContent = currentQuestion.factor2;

    // Start timer if enabled
    if (timerEnabled) {
        startTimer();
    }

    answerInput.focus();
}

function startTimer() {
    clearTimer();
    currentTimeLeft = timerSeconds;
    timerValue.textContent = currentTimeLeft;
    timerDisplay.classList.remove('timer-warning');

    timerInterval = setInterval(() => {
        currentTimeLeft--;
        timerValue.textContent = currentTimeLeft;

        // Add warning color when time is running out
        if (currentTimeLeft <= 3) {
            timerDisplay.classList.add('timer-warning');
        }

        // Time's up - skip to next question
        if (currentTimeLeft <= 0) {
            clearTimer();
            timeUp();
        }
    }, 1000);
}

function clearTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function timeUp() {
    // Show time's up message
    feedback.textContent = `⏰ Time's up!`;
    feedback.className = 'feedback incorrect';

    if (autoSkip) {
        // Disable input and button
        submitButton.disabled = true;
        answerInput.disabled = true;
        totalQuestions++;

        // Show the correct answer
        feedback.textContent = `⏰ Time's up! ${currentQuestion.factor1} × ${currentQuestion.factor2} = ${currentQuestion.answer}`;

        updateScore();

        // Check if quiz is complete
        if (totalQuestions >= maxProblems) {
            setTimeout(() => {
                answerInput.disabled = false;
                showResults();
            }, 2000);
        } else {
            // Generate next question after a delay
            setTimeout(() => {
                answerInput.disabled = false;
                generateQuestion();
            }, 2000);
        }
    }
    // If autoSkip is false, do nothing - let user submit their answer
}

function checkAnswer() {
    const userAnswer = parseInt(answerInput.value);

    // Validate input
    if (isNaN(userAnswer) || answerInput.value.trim() === '') {
        feedback.textContent = '❓ Please enter a number!';
        feedback.className = 'feedback incorrect';
        return;
    }

    // Clear timer
    clearTimer();

    // Disable submit button
    submitButton.disabled = true;
    totalQuestions++;

    // Check if answer is correct
    if (userAnswer === currentQuestion.answer) {
        score++;
        const celebrations = ['🎉 Fantastic!', '🌟 Amazing!', '🚀 Brilliant!', '⭐ Perfect!', '🏆 Excellent!', '💫 Superb!'];
        feedback.textContent = celebrations[Math.floor(Math.random() * celebrations.length)];
        feedback.className = 'feedback correct';
    } else {
        feedback.textContent = `❌ Not quite! ${currentQuestion.factor1} × ${currentQuestion.factor2} = ${currentQuestion.answer}`;
        feedback.className = 'feedback incorrect';
    }

    updateScore();

    // Check if quiz is complete
    if (totalQuestions >= maxProblems) {
        setTimeout(() => {
            showResults();
        }, 2000);
    } else {
        // Generate next question after a delay
        setTimeout(() => {
            generateQuestion();
        }, 2000);
    }
}

function showResults() {
    // Hide quiz screen
    quizScreen.classList.remove('active');

    // Calculate percentage
    const percentage = Math.round((score / totalQuestions) * 100);

    // Update results display
    document.getElementById('percentage').textContent = percentage + '%';
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalTotal').textContent = totalQuestions;

    // Show encouraging message based on percentage
    const resultsMessage = document.getElementById('resultsMessage');
    if (percentage === 100) {
        resultsMessage.textContent = '🏆 PERFECT SCORE! You\'re a times table champion! 🏆';
    } else if (percentage >= 90) {
        resultsMessage.textContent = '⭐ Outstanding! You\'re brilliant at this! ⭐';
    } else if (percentage >= 80) {
        resultsMessage.textContent = '🌟 Great job! You\'re doing really well! 🌟';
    } else if (percentage >= 70) {
        resultsMessage.textContent = '👍 Good effort! Keep practicing! 👍';
    } else if (percentage >= 60) {
        resultsMessage.textContent = '💪 Nice try! Practice makes perfect! 💪';
    } else {
        resultsMessage.textContent = '🌈 Keep going! You\'ll get better with practice! 🌈';
    }

    // Show results screen
    resultsScreen.classList.add('active');
}

function updateScore() {
    scoreElement.textContent = score;
    totalElement.textContent = totalQuestions;
}

// Focus on answer input when quiz screen is shown
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.target === quizScreen && quizScreen.classList.contains('active')) {
            answerInput.focus();
        }
    });
});

observer.observe(quizScreen, { attributes: true, attributeFilter: ['class'] });
