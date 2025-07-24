// Game state variables
let gameState = {
    playerName: '',
    difficulty: 0,
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    totalPairs: 0,
    timer: null,
    timeLeft: 0,
    score: 0,
    gameActive: false,
    warningPlayed: false
};

// Space-themed card emojis
const cardEmojis = ['🚀', '🌍', '🌙', '⭐', '🛸', '☄️', '🌌', '🪐'];

// Audio elements
const flipSound = document.getElementById('flip-sound');
const winSound = document.getElementById('win-sound');
const loseSound = document.getElementById('lose-sound');
const warningSound = document.getElementById('warning-sound');

// DOM elements
const form = document.querySelector('form');
const playerNameInput = document.getElementById('player-name');
const difficultyButtons = document.querySelectorAll('form button[data-cards]');
const startButton = document.getElementById('start-game');
const gameBoard = document.getElementById('game-board');
const scoreboard = document.getElementById('scoreboard');
const playerDisplay = document.getElementById('player-display');
const scoreDisplay = document.getElementById('score-display');
const timer = document.getElementById('timer');
const timeDisplay = document.getElementById('time-display');
const resultModal = document.getElementById('result-modal');
const resultTitle = document.getElementById('result-title');
const resultMessage = document.getElementById('result-message');
const playAgainBtn = document.getElementById('play-again-btn');
const chooseLevelBtn = document.getElementById('choose-level-btn');

// Initialize game
function initGame() {
    // Hide game board and timer initially
    gameBoard.style.display = 'none';
    timer.style.display = 'none';
    
    loadScores();
    setupEventListeners();
    updateScoreboard();
}

// Setup event listeners
function setupEventListeners() {
    // Player name input
    playerNameInput.addEventListener('input', validateForm);
    
    // Difficulty buttons
    difficultyButtons.forEach(button => {
        button.addEventListener('click', () => selectDifficulty(button));
    });
    
    // Start game button
    startButton.addEventListener('click', startGame);
    
    // Play again button
    playAgainBtn.addEventListener('click', playAgain);
    
    // Choose level button
    chooseLevelBtn.addEventListener('click', chooseAnotherLevel);
}

// Validate form and enable/disable start button
function validateForm() {
    gameState.playerName = playerNameInput.value.trim();
    const hasName = gameState.playerName.length > 0;
    const hasDifficulty = gameState.difficulty > 0;
    startButton.disabled = !(hasName && hasDifficulty);
}

// Select difficulty level
function selectDifficulty(button) {
    // Remove active class from all buttons
    difficultyButtons.forEach(btn => btn.classList.remove('active'));
    
    // Add active class to clicked button
    button.classList.add('active');
    
    // Set difficulty
    gameState.difficulty = parseInt(button.dataset.cards);
    validateForm();
}

// Start the game
function startGame() {
    if (!gameState.playerName || !gameState.difficulty) return;
    
    gameState.gameActive = true;
    gameState.matchedPairs = 0;
    gameState.score = 0;
    gameState.warningPlayed = false;
    
    // Set timer based on difficulty
    switch(gameState.difficulty) {
        case 4: gameState.timeLeft = 30; break;
        case 8: gameState.timeLeft = 60; break;
        case 16: gameState.timeLeft = 90; break;
    }
    
    // Show game board
    gameBoard.style.display = 'grid';
    timer.style.display = 'block';
    
    // Generate and display cards
    generateCards();
    displayCards();
    
    // Start timer
    startTimer();
    
    // Update UI
    updateScoreboard();
    updateTimer();
    
    // Hide form
    form.style.display = 'none';
}

// Generate shuffled cards
function generateCards() {
    const numPairs = gameState.difficulty / 2;
    const selectedEmojis = cardEmojis.slice(0, numPairs);
    
    // Create pairs of cards
    gameState.cards = [];
    selectedEmojis.forEach(emoji => {
        gameState.cards.push({ emoji, id: Math.random(), matched: false });
        gameState.cards.push({ emoji, id: Math.random(), matched: false });
    });
    
    // Shuffle cards
    gameState.cards = shuffleArray(gameState.cards);
    gameState.totalPairs = numPairs;
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Display cards on the game board
function displayCards() {
    gameBoard.innerHTML = '';
    
    // Set grid columns based on difficulty
    const columns = gameState.difficulty === 4 ? 2 : gameState.difficulty === 8 ? 4 : 4;
    gameBoard.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    
    gameState.cards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.index = index;
        
        cardElement.innerHTML = `
            <div class="card-front">${card.emoji}</div>
            <div class="card-back"></div>
        `;
        
        cardElement.addEventListener('click', () => flipCard(index));
        gameBoard.appendChild(cardElement);
    });
}

// Flip a card
function flipCard(index) {
    if (!gameState.gameActive) return;
    
    const card = gameState.cards[index];
    const cardElement = document.querySelector(`[data-index="${index}"]`);
    
    // Don't flip if card is already flipped or matched
    if (cardElement.classList.contains('flipped') || card.matched) return;
    
    // Don't flip if already 2 cards are flipped
    if (gameState.flippedCards.length >= 2) return;
    
    // Play flip sound
    playSound(flipSound);
    
    // Flip the card
    cardElement.classList.add('flipped');
    gameState.flippedCards.push({ index, card });
    
    // Check for match if 2 cards are flipped
    if (gameState.flippedCards.length === 2) {
        setTimeout(checkMatch, 1000);
    }
}

// Check if flipped cards match
function checkMatch() {
    const [card1, card2] = gameState.flippedCards;
    
    if (card1.card.emoji === card2.card.emoji) {
        // Match found
        gameState.cards[card1.index].matched = true;
        gameState.cards[card2.index].matched = true;
        gameState.matchedPairs++;
        
        // Add matched class
        document.querySelector(`[data-index="${card1.index}"]`).classList.add('matched');
        document.querySelector(`[data-index="${card2.index}"]`).classList.add('matched');
        
        // Check for win
        if (gameState.matchedPairs === gameState.totalPairs) {
            winGame();
            return;
        }
    } else {
        // No match - flip cards back
        document.querySelector(`[data-index="${card1.index}"]`).classList.remove('flipped');
        document.querySelector(`[data-index="${card2.index}"]`).classList.remove('flipped');
    }
    
    // Clear flipped cards
    gameState.flippedCards = [];
    updateScoreboard();
}

// Start countdown timer
function startTimer() {
    gameState.timer = setInterval(() => {
        gameState.timeLeft--;
        updateTimer();
        
        // Check for warning (5 seconds left)
        if (gameState.timeLeft === 5 && !gameState.warningPlayed) {
            playSound(warningSound);
            gameState.warningPlayed = true;
        }
        
        // Check for game over
        if (gameState.timeLeft <= 0) {
            loseGame();
        }
    }, 1000);
}

// Update timer display
function updateTimer() {
    timeDisplay.textContent = gameState.timeLeft;
    
    // Change color when time is low
    if (gameState.timeLeft <= 10) {
        timeDisplay.style.color = '#ff6b6b';
    } else {
        timeDisplay.style.color = '#4a90e2';
    }
}

// Win game
function winGame() {
    gameState.gameActive = false;
    clearInterval(gameState.timer);
    playSound(winSound);
    
    // Calculate time taken
    let timeTaken;
    switch(gameState.difficulty) {
        case 4: timeTaken = 30 - gameState.timeLeft; break;
        case 8: timeTaken = 60 - gameState.timeLeft; break;
        case 16: timeTaken = 90 - gameState.timeLeft; break;
    }
    
    // Set score as time taken (lower is better)
    gameState.score = timeTaken;
    
    // Save score
    saveScore();
    
    // Show win modal
    resultTitle.textContent = '🎉 Congratulations!';
    resultMessage.textContent = `You matched all ${gameState.totalPairs} pairs in ${timeTaken} seconds!`;
    showModal();
}

// Lose game
function loseGame() {
    gameState.gameActive = false;
    clearInterval(gameState.timer);
    playSound(loseSound);
    
    // Save score
    saveScore();
    
    // Show lose modal
    resultTitle.textContent = '💫 Time\'s Up!';
    resultMessage.textContent = `You matched ${gameState.matchedPairs} out of ${gameState.totalPairs} pairs.`;
    showModal();
}

// Show result modal
function showModal() {
    resultModal.classList.add('show');
}

// Hide result modal
function hideModal() {
    resultModal.classList.remove('show');
}

// Play again
function playAgain() {
    hideModal();
    resetGame();
    startGame();
}

// Choose another level
function chooseAnotherLevel() {
    hideModal();
    resetGame();
    // Clear difficulty selection
    difficultyButtons.forEach(btn => btn.classList.remove('active'));
    gameState.difficulty = 0;
    validateForm();
}

// Reset game state
function resetGame() {
    gameState.cards = [];
    gameState.flippedCards = [];
    gameState.matchedPairs = 0;
    gameState.gameActive = false;
    gameState.warningPlayed = false;
    
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }
    
    // Clear and hide game board
    gameBoard.innerHTML = '';
    gameBoard.style.display = 'none';
    timer.style.display = 'none';
    
    // Show form again
    form.style.display = 'flex';
}

// Play sound
function playSound(audioElement) {
    if (audioElement) {
        audioElement.currentTime = 0;
        audioElement.play().catch(e => console.log('Audio play failed:', e));
    }
}

// Save score to localStorage
function saveScore() {
    const scores = JSON.parse(localStorage.getItem('memoryGameScores') || '[]');
    scores.push({
        name: gameState.playerName,
        score: gameState.score,
        difficulty: gameState.difficulty,
        timeLeft: gameState.timeLeft,
        date: new Date().toISOString()
    });
    
    // Sort by score (lowest first for time-based scoring), then by date (newest first for same scores)
    scores.sort((a, b) => {
        if (a.score !== b.score) {
            return a.score - b.score; // Lower time = better score
        }
        return new Date(b.date) - new Date(a.date);
    });
    
    // Keep only top 10 scores
    const topScores = scores.slice(0, 10);
    
    localStorage.setItem('memoryGameScores', JSON.stringify(topScores));
    loadScores();
}

// Load scores from localStorage
function loadScores() {
    const scores = JSON.parse(localStorage.getItem('memoryGameScores') || '[]');
    return scores;
}

// Update scoreboard display
function updateScoreboard() {
    if (gameState.gameActive) {
        playerDisplay.textContent = `Player: ${gameState.playerName}`;
        scoreDisplay.textContent = `Time: ${gameState.timeLeft}s`;
    } else {
        const scores = loadScores();
        if (scores.length > 0) {
            const bestScore = scores[0];
            playerDisplay.textContent = `Best: ${bestScore.name}`;
            scoreDisplay.textContent = `${bestScore.score}s`;
        } else {
            playerDisplay.textContent = 'No scores yet';
            scoreDisplay.textContent = '';
        }
    }
}

// Initialize the game when page loads
document.addEventListener('DOMContentLoaded', initGame); 