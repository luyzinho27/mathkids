// script.js

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDummyKeyForDemoOnly123456789",
    authDomain: "mathkids-demo.firebaseapp.com",
    projectId: "mathkids-demo",
    storageBucket: "mathkids-demo.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890abcdef"
};

// Inicializar Firebase
let app, db, auth;
let user = null;
let userData = {};

// Tentar inicializar o Firebase (em produção, substituir com suas credenciais)
try {
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    
    // Verificar se há um usuário logado
    auth.onAuthStateChanged((firebaseUser) => {
        if (firebaseUser) {
            user = firebaseUser;
            loadUserData();
            updateUIForLoggedInUser();
        }
    });
} catch (error) {
    console.log("Firebase não configurado. Usando modo offline.");
}

// Dados do aplicativo
let currentOperation = null;
let currentExercise = null;
let currentDifficulty = 'easy';
let currentGame = null;
let gameActive = false;
let gameTimer = null;
let gameTimeLeft = 60;
let gameScore = 0;
let gameHighScore = 0;

// Dados de progresso local
let progressData = {
    exercisesCompleted: 0,
    correctAnswers: 0,
    totalAnswers: 0,
    practiceTime: 0,
    addition: { correct: 0, total: 0 },
    subtraction: { correct: 0, total: 0 },
    multiplication: { correct: 0, total: 0 },
    division: { correct: 0, total: 0 }
};

// Elementos DOM
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const closeModal = document.querySelector('.close-modal');
const confirmLogin = document.getElementById('confirmLogin');
const loginStatus = document.getElementById('loginStatus');
const progressLoginBtn = document.getElementById('progressLoginBtn');
const startLearningBtn = document.getElementById('startLearning');
const exploreGamesBtn = document.getElementById('exploreGames');
const operationCards = document.querySelectorAll('.operation-card');
const practiceTitle = document.getElementById('practiceTitle');
const explanation = document.getElementById('explanation');
const numbersDisplay = document.getElementById('numbersDisplay');
const numbersDisplay2 = document.getElementById('numbersDisplay2');
const operationSymbol = document.getElementById('operationSymbol');
const answerInput = document.getElementById('answerInput');
const newExerciseBtn = document.getElementById('newExercise');
const checkAnswerBtn = document.getElementById('checkAnswer');
const showHintBtn = document.getElementById('showHint');
const feedback = document.getElementById('feedback');
const difficultyButtons = document.querySelectorAll('.btn-difficulty');
const gameCards = document.querySelectorAll('.game-card');
const gameTitle = document.getElementById('gameTitle');
const gameContent = document.getElementById('gameContent');
const gameExercise = document.getElementById('gameExercise');
const startGameBtn = document.getElementById('startGame');
const endGameBtn = document.getElementById('endGame');
const nextGameBtn = document.getElementById('nextGame');
const gameFeedback = document.getElementById('gameFeedback');
const timerElement = document.getElementById('timer').querySelector('span');
const scoreElement = document.getElementById('score').querySelector('span');
const highScoreElement = document.getElementById('highScore').querySelector('span');
const exercisesCompletedElement = document.getElementById('exercisesCompleted');
const correctAnswersElement = document.getElementById('correctAnswers');
const practiceTimeElement = document.getElementById('practiceTime');
const userLevelElement = document.getElementById('userLevel');
const progressContent = document.getElementById('progressContent');
const progressLogin = document.getElementById('progressLogin');
let progressChart = null;

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Carregar progresso do localStorage
    loadLocalProgress();
    
    // Atualizar UI com dados locais
    updateProgressUI();
    
    // Configurar eventos
    setupEventListeners();
    
    // Inicializar gráfico de progresso
    initializeProgressChart();
    
    // Verificar se há parâmetros na URL para redirecionamento
    checkUrlParams();
});

// Configurar todos os event listeners
function setupEventListeners() {
    // Navegação suave
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            // Atualizar navegação ativa
            document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
            this.classList.add('active');
            
            // Rolar para a seção
            targetSection.scrollIntoView({ behavior: 'smooth' });
        });
    });
    
    // Botões de login
    loginBtn.addEventListener('click', openLoginModal);
    progressLoginBtn.addEventListener('click', openLoginModal);
    closeModal.addEventListener('click', closeLoginModal);
    confirmLogin.addEventListener('click', handleLogin);
    
    // Fechar modal ao clicar fora
    loginModal.addEventListener('click', function(e) {
        if (e.target === loginModal) {
            closeLoginModal();
        }
    });
    
    // Botões da hero section
    startLearningBtn.addEventListener('click', function() {
        document.querySelector('#operations').scrollIntoView({ behavior: 'smooth' });
    });
    
    exploreGamesBtn.addEventListener('click', function() {
        document.querySelector('#games').scrollIntoView({ behavior: 'smooth' });
    });
    
    // Cartões de operação
    operationCards.forEach(card => {
        card.addEventListener('click', function() {
            const operation = this.getAttribute('data-operation');
            selectOperation(operation);
            
            // Atualizar navegação
            document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
            document.querySelector('nav a[href="#operations"]').classList.add('active');
            
            // Rolar para a área de prática
            document.querySelector('#practiceArea').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
    
    // Botões de dificuldade
    difficultyButtons.forEach(button => {
        button.addEventListener('click', function() {
            difficultyButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentDifficulty = this.getAttribute('data-level');
            
            // Gerar novo exercício se uma operação estiver selecionada
            if (currentOperation) {
                generateExercise();
            }
        });
    });
    
    // Controles de exercício
    newExerciseBtn.addEventListener('click', generateExercise);
    checkAnswerBtn.addEventListener('click', checkAnswer);
    showHintBtn.addEventListener('click', showHint);
    
    // Entrada de resposta
    answerInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    });
    
    // Cartões de jogo
    gameCards.forEach(card => {
        card.addEventListener('click', function() {
            const gameId = this.id;
            selectGame(gameId);
            
            // Atualizar navegação
            document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
            document.querySelector('nav a[href="#games"]').classList.add('active');
            
            // Rolar para o container do jogo
            document.querySelector('#gameContainer').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
    
    // Controles do jogo
    startGameBtn.addEventListener('click', startGame);
    endGameBtn.addEventListener('click', endGame);
    nextGameBtn.addEventListener('click', generateGameExercise);
}

// Abrir modal de login
function openLoginModal() {
    loginModal.style.display = 'flex';
}

// Fechar modal de login
function closeLoginModal() {
    loginModal.style.display = 'none';
    loginStatus.textContent = '';
    loginStatus.className = 'login-status';
}

// Manipular login
function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    
    if (!username) {
        loginStatus.textContent = 'Por favor, digite um nome de usuário!';
        loginStatus.style.color = 'var(--danger-color)';
        return;
    }
    
    // Tentar autenticação anônima no Firebase
    if (auth) {
        auth.signInAnonymously()
            .then(() => {
                // Criar ou atualizar dados do usuário
                userData = {
                    username: username,
                    email: email || '',
                    lastLogin: new Date().toISOString(),
                    ...progressData
                };
                
                // Atualizar UI
                updateUIForLoggedInUser();
                loginStatus.textContent = 'Login realizado com sucesso!';
                loginStatus.style.color = 'var(--success-color)';
                
                // Salvar dados no Firebase
                saveUserData();
                
                // Fechar modal após 1.5 segundos
                setTimeout(closeLoginModal, 1500);
            })
            .catch(error => {
                console.error('Erro no login:', error);
                // Fallback para modo offline
                handleOfflineLogin(username, email);
            });
    } else {
        // Modo offline
        handleOfflineLogin(username, email);
    }
}

// Login offline
function handleOfflineLogin(username, email) {
    userData = {
        username: username,
        email: email || '',
        lastLogin: new Date().toISOString(),
        ...progressData
    };
    
    // Salvar localmente
    localStorage.setItem('mathkids_user', JSON.stringify(userData));
    
    // Atualizar UI
    updateUIForLoggedInUser();
    loginStatus.textContent = 'Modo offline ativado. Seu progresso será salvo localmente.';
    loginStatus.style.color = 'var(--warning-color)';
    
    // Fechar modal após 2 segundos
    setTimeout(closeLoginModal, 2000);
}

// Atualizar UI para usuário logado
function updateUIForLoggedInUser() {
    const username = userData.username || 'Usuário';
    loginBtn.innerHTML = `<i class="fas fa-user"></i> ${username}`;
    
    // Mostrar seção de progresso completa
    progressLogin.style.display = 'none';
    progressContent.style.display = 'block';
    
    // Atualizar dados de progresso na UI
    updateProgressUI();
}

// Carregar dados do usuário
function loadUserData() {
    if (user && db) {
        db.collection('users').doc(user.uid).get()
            .then(doc => {
                if (doc.exists) {
                    userData = doc.data();
                    progressData = { ...progressData, ...userData };
                    updateProgressUI();
                }
            })
            .catch(error => {
                console.error('Erro ao carregar dados:', error);
            });
    }
}

// Salvar dados do usuário
function saveUserData() {
    if (user && db) {
        db.collection('users').doc(user.uid).set(userData, { merge: true })
            .then(() => {
                console.log('Dados salvos no Firebase');
            })
            .catch(error => {
                console.error('Erro ao salvar dados:', error);
                // Fallback para localStorage
                localStorage.setItem('mathkids_user', JSON.stringify(userData));
            });
    } else {
        // Salvar localmente
        localStorage.setItem('mathkids_user', JSON.stringify(userData));
    }
}

// Carregar progresso local
function loadLocalProgress() {
    const savedProgress = localStorage.getItem('mathkids_progress');
    const savedUser = localStorage.getItem('mathkids_user');
    
    if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        progressData = { ...progressData, ...parsed };
    }
    
    if (savedUser) {
        userData = JSON.parse(savedUser);
        // Restaurar dados de progresso do usuário
        Object.keys(progressData).forEach(key => {
            if (userData[key] !== undefined) {
                progressData[key] = userData[key];
            }
        });
        
        // Atualizar UI se o usuário estiver "logado"
        if (userData.username) {
            updateUIForLoggedInUser();
        }
    }
}

// Salvar progresso local
function saveLocalProgress() {
    localStorage.setItem('mathkids_progress', JSON.stringify(progressData));
}

// Selecionar operação
function selectOperation(operation) {
    currentOperation = operation;
    
    // Atualizar título
    const operationNames = {
        'addition': 'Adição',
        'subtraction': 'Subtração',
        'multiplication': 'Multiplicação',
        'division': 'Divisão'
    };
    
    practiceTitle.textContent = `Praticando ${operationNames[operation]}`;
    
    // Atualizar explicação
    const explanations = {
        'addition': '<p>A <strong>adição</strong> é a operação matemática que representa a combinação de dois ou mais números para obter um total.</p><p><strong>Exemplo:</strong> 3 + 5 = 8</p><p><strong>Dica:</strong> Imagine que você tem 3 maçãs e ganha mais 5. Quantas maçãs você tem agora?</p>',
        'subtraction': '<p>A <strong>subtração</strong> é a operação matemática que representa a remoção de uma quantidade de outra.</p><p><strong>Exemplo:</strong> 10 - 4 = 6</p><p><strong>Dica:</strong> Se você tinha 10 balas e comeu 4, quantas balas sobraram?</p>',
        'multiplication': '<p>A <strong>multiplicação</strong> é uma adição repetida. É uma forma rápida de somar o mesmo número várias vezes.</p><p><strong>Exemplo:</strong> 4 × 3 = 4 + 4 + 4 = 12</p><p><strong>Dica:</strong> Se você tem 4 pacotes com 3 bolinhas cada, quantas bolinhas você tem no total?</p>',
        'division': '<p>A <strong>divisão</strong> é a operação inversa da multiplicação. Representa a distribuição igualitária de uma quantidade.</p><p><strong>Exemplo:</strong> 12 ÷ 4 = 3</p><p><strong>Dica:</strong> Se você tem 12 chocolates para dividir igualmente entre 4 amigos, quantos chocolates cada um recebe?</p>'
    };
    
    explanation.innerHTML = explanations[operation];
    
    // Ativar controles
    newExerciseBtn.disabled = false;
    checkAnswerBtn.disabled = false;
    showHintBtn.disabled = false;
    answerInput.disabled = false;
    
    // Gerar primeiro exercício
    generateExercise();
}

// Gerar exercício
function generateExercise() {
    let num1, num2, answer;
    
    // Definir faixa de números baseada na dificuldade
    const ranges = {
        'easy': { min: 1, max: 20 },
        'medium': { min: 10, max: 100 },
        'hard': { min: 50, max: 500 }
    };
    
    const range = ranges[currentDifficulty];
    
    // Gerar números baseados na operação
    switch(currentOperation) {
        case 'addition':
            num1 = getRandomInt(range.min, range.max);
            num2 = getRandomInt(range.min, range.max);
            answer = num1 + num2;
            operationSymbol.textContent = '+';
            break;
            
        case 'subtraction':
            num1 = getRandomInt(range.min, range.max);
            num2 = getRandomInt(range.min, num1); // Garantir que num2 <= num1 para não ter números negativos
            answer = num1 - num2;
            operationSymbol.textContent = '-';
            break;
            
        case 'multiplication':
            // Para multiplicação, usar números menores
            const multRange = {
                'easy': { min: 1, max: 10 },
                'medium': { min: 5, max: 15 },
                'hard': { min: 10, max: 20 }
            };
            const multR = multRange[currentDifficulty];
            num1 = getRandomInt(multR.min, multR.max);
            num2 = getRandomInt(multR.min, multR.max);
            answer = num1 * num2;
            operationSymbol.textContent = '×';
            break;
            
        case 'division':
            // Para divisão, garantir que a divisão seja exata
            num2 = getRandomInt(1, 12); // Divisor
            const quotient = getRandomInt(range.min, range.max);
            num1 = num2 * quotient; // Dividendo
            answer = quotient;
            operationSymbol.textContent = '÷';
            break;
    }
    
    currentExercise = {
        num1: num1,
        num2: num2,
        answer: answer,
        operation: currentOperation
    };
    
    // Atualizar display
    numbersDisplay.textContent = num1;
    numbersDisplay2.textContent = num2;
    answerInput.value = '';
    answerInput.focus();
    
    // Limpar feedback
    feedback.textContent = '';
    feedback.className = 'feedback';
}

// Verificar resposta
function checkAnswer() {
    const userAnswer = parseInt(answerInput.value);
    
    if (isNaN(userAnswer)) {
        feedback.textContent = 'Digite um número válido!';
        feedback.className = 'feedback incorrect';
        return;
    }
    
    // Atualizar estatísticas
    progressData.exercisesCompleted++;
    progressData.totalAnswers++;
    
    if (userAnswer === currentExercise.answer) {
        // Resposta correta
        feedback.textContent = `Correto! ${currentExercise.num1} ${operationSymbol.textContent} ${currentExercise.num2} = ${currentExercise.answer}`;
        feedback.className = 'feedback correct';
        progressData.correctAnswers++;
        
        // Atualizar estatísticas da operação específica
        progressData[currentExercise.operation].correct++;
        progressData[currentExercise.operation].total++;
        
        // Gerar novo exercício após 1.5 segundos
        setTimeout(generateExercise, 1500);
    } else {
        // Resposta incorreta
        feedback.textContent = `Ops! Tente novamente. Dica: ${getHint()}`;
        feedback.className = 'feedback incorrect';
        
        // Atualizar estatísticas da operação específica
        progressData[currentExercise.operation].total++;
    }
    
    // Atualizar progresso
    updateProgress();
    updateProgressUI();
}

// Mostrar dica
function showHint() {
    feedback.textContent = `Dica: ${getHint()}`;
    feedback.className = 'feedback';
}

// Obter dica
function getHint() {
    const { num1, num2, operation, answer } = currentExercise;
    
    switch(operation) {
        case 'addition':
            return `Pense em ${num1} + ${num2}. Você pode contar a partir de ${num1} mais ${num2} unidades.`;
        case 'subtraction':
            return `Pense em ${num1} - ${num2}. Quantos você precisa tirar de ${num1} para chegar ao resultado?`;
        case 'multiplication':
            return `Pense em ${num1} × ${num2} como ${num1} repetido ${num2} vezes.`;
        case 'division':
            return `Pense em ${num1} ÷ ${num2}. Quantos grupos de ${num2} cabem em ${num1}?`;
        default:
            return 'Tente pensar passo a passo na operação.';
    }
}

// Selecionar jogo
function selectGame(gameId) {
    currentGame = gameId;
    
    const gameTitles = {
        'multiplicationGame': 'Desafio Relâmpago de Multiplicação',
        'divisionGame': 'Quebra-cabeça da Divisão',
        'mixedGame': 'Campeonato MathKids'
    };
    
    gameTitle.textContent = gameTitles[gameId];
    
    // Ativar botão de iniciar
    startGameBtn.disabled = false;
    endGameBtn.disabled = true;
    nextGameBtn.disabled = true;
    
    // Limpar conteúdo anterior
    gameExercise.innerHTML = '';
    gameFeedback.textContent = '';
    
    // Mostrar instruções do jogo
    const gameInstructions = {
        'multiplicationGame': '<p><strong>Instruções:</strong> Resolva o máximo de multiplicações em 60 segundos! Cada resposta correta vale 10 pontos.</p><p>Clique em "Iniciar Jogo" para começar!</p>',
        'divisionGame': '<p><strong>Instruções:</strong> Complete o quebra-cabeça resolvendo problemas de divisão. Arraste as peças para os lugares corretos.</p><p>Clique em "Iniciar Jogo" para começar!</p>',
        'mixedGame': '<p><strong>Instruções:</strong> Enfrente operações matemáticas mistas. Cada nível fica mais difícil! Suba no ranking de pontuação.</p><p>Clique em "Iniciar Jogo" para começar!</p>'
    };
    
    gameExercise.innerHTML = `<div class="game-welcome">${gameInstructions[gameId]}</div>`;
    
    // Carregar recorde
    loadHighScore();
}

// Iniciar jogo
function startGame() {
    gameActive = true;
    gameScore = 0;
    gameTimeLeft = 60;
    
    // Atualizar UI
    startGameBtn.disabled = true;
    endGameBtn.disabled = false;
    nextGameBtn.disabled = false;
    
    // Iniciar temporizador
    updateTimer();
    gameTimer = setInterval(updateTimer, 1000);
    
    // Gerar primeiro exercício
    generateGameExercise();
}

// Atualizar temporizador
function updateTimer() {
    gameTimeLeft--;
    timerElement.textContent = gameTimeLeft;
    
    if (gameTimeLeft <= 0) {
        endGame();
    }
}

// Gerar exercício do jogo
function generateGameExercise() {
    if (!gameActive) return;
    
    let num1, num2, answer, operation, symbol;
    
    // Gerar exercício baseado no jogo selecionado
    switch(currentGame) {
        case 'multiplicationGame':
            operation = 'multiplication';
            num1 = getRandomInt(1, 12);
            num2 = getRandomInt(1, 12);
            answer = num1 * num2;
            symbol = '×';
            break;
            
        case 'divisionGame':
            operation = 'division';
            num2 = getRandomInt(1, 12);
            answer = getRandomInt(1, 12);
            num1 = num2 * answer;
            symbol = '÷';
            break;
            
        case 'mixedGame':
            const operations = ['addition', 'subtraction', 'multiplication', 'division'];
            operation = operations[getRandomInt(0, 3)];
            
            switch(operation) {
                case 'addition':
                    num1 = getRandomInt(10, 100);
                    num2 = getRandomInt(10, 100);
                    answer = num1 + num2;
                    symbol = '+';
                    break;
                    
                case 'subtraction':
                    num1 = getRandomInt(50, 100);
                    num2 = getRandomInt(10, 50);
                    answer = num1 - num2;
                    symbol = '-';
                    break;
                    
                case 'multiplication':
                    num1 = getRandomInt(2, 12);
                    num2 = getRandomInt(2, 12);
                    answer = num1 * num2;
                    symbol = '×';
                    break;
                    
                case 'division':
                    num2 = getRandomInt(2, 10);
                    answer = getRandomInt(2, 10);
                    num1 = num2 * answer;
                    symbol = '÷';
                    break;
            }
            break;
    }
    
    // Salvar exercício atual
    currentExercise = {
        num1: num1,
        num2: num2,
        answer: answer,
        operation: operation,
        symbol: symbol
    };
    
    // Criar interface do exercício
    gameExercise.innerHTML = `
        <div class="game-exercise-content">
            <div class="exercise-display">
                <div class="numbers">${num1}</div>
                <div class="operation-symbol">${symbol}</div>
                <div class="numbers">${num2}</div>
                <div class="equals">=</div>
                <input type="number" id="gameAnswerInput" placeholder="?" class="game-answer-input">
            </div>
            <button id="submitGameAnswer" class="btn-control">Responder</button>
        </div>
    `;
    
    // Adicionar evento ao botão de resposta
    document.getElementById('submitGameAnswer').addEventListener('click', checkGameAnswer);
    
    // Permitir resposta com Enter
    document.getElementById('gameAnswerInput').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            checkGameAnswer();
        }
        // Focar no input
        this.focus();
    });
    
    // Focar no input
    setTimeout(() => {
        document.getElementById('gameAnswerInput').focus();
    }, 100);
}

// Verificar resposta no jogo
function checkGameAnswer() {
    const input = document.getElementById('gameAnswerInput');
    const userAnswer = parseInt(input.value);
    
    if (isNaN(userAnswer)) {
        gameFeedback.textContent = 'Digite um número válido!';
        gameFeedback.style.color = 'var(--danger-color)';
        return;
    }
    
    if (userAnswer === currentExercise.answer) {
        // Resposta correta
        gameScore += 10;
        scoreElement.textContent = gameScore;
        gameFeedback.textContent = `Correto! +10 pontos`;
        gameFeedback.style.color = 'var(--success-color)';
        
        // Atualizar estatísticas
        progressData[currentExercise.operation].correct++;
        progressData[currentExercise.operation].total++;
        progressData.exercisesCompleted++;
        progressData.correctAnswers++;
        progressData.totalAnswers++;
        
        // Atualizar progresso
        updateProgress();
    } else {
        // Resposta incorreta
        gameFeedback.textContent = `Ops! A resposta correta é ${currentExercise.answer}`;
        gameFeedback.style.color = 'var(--danger-color)';
        
        // Atualizar estatísticas
        progressData[currentExercise.operation].total++;
        progressData.totalAnswers++;
    }
    
    // Gerar próximo exercício após 1 segundo
    setTimeout(generateGameExercise, 1000);
}

// Encerrar jogo
function endGame() {
    gameActive = false;
    clearInterval(gameTimer);
    
    // Atualizar UI
    startGameBtn.disabled = false;
    endGameBtn.disabled = true;
    nextGameBtn.disabled = true;
    
    // Mostrar resultado final
    gameExercise.innerHTML = `
        <div class="game-result">
            <h3>Fim do Jogo!</h3>
            <p>Sua pontuação: <strong>${gameScore}</strong> pontos</p>
            <p>Respostas corretas: <strong>${Math.floor(gameScore/10)}</strong></p>
            <p>Tempo restante: <strong>${gameTimeLeft}</strong> segundos</p>
        </div>
    `;
    
    gameFeedback.textContent = 'Clique em "Iniciar Jogo" para jogar novamente!';
    gameFeedback.style.color = 'var(--primary-color)';
    
    // Atualizar recorde se necessário
    if (gameScore > gameHighScore) {
        gameHighScore = gameScore;
        highScoreElement.textContent = gameHighScore;
        saveHighScore();
    }
    
    // Atualizar tempo de prática
    progressData.practiceTime += (60 - gameTimeLeft);
    updateProgressUI();
}

// Carregar recorde
function loadHighScore() {
    const savedHighScore = localStorage.getItem(`mathkids_highscore_${currentGame}`);
    if (savedHighScore) {
        gameHighScore = parseInt(savedHighScore);
        highScoreElement.textContent = gameHighScore;
    } else {
        gameHighScore = 0;
        highScoreElement.textContent = '0';
    }
}

// Salvar recorde
function saveHighScore() {
    localStorage.setItem(`mathkids_highscore_${currentGame}`, gameHighScore.toString());
}

// Atualizar progresso
function updateProgress() {
    // Salvar progresso localmente
    saveLocalProgress();
    
    // Salvar no Firebase se logado
    if (user) {
        userData = { ...userData, ...progressData };
        saveUserData();
    }
}

// Atualizar UI de progresso
function updateProgressUI() {
    // Atualizar estatísticas
    exercisesCompletedElement.textContent = progressData.exercisesCompleted;
    
    const accuracy = progressData.totalAnswers > 0 
        ? Math.round((progressData.correctAnswers / progressData.totalAnswers) * 100) 
        : 0;
    correctAnswersElement.textContent = `${accuracy}%`;
    
    practiceTimeElement.textContent = `${Math.floor(progressData.practiceTime / 60)} min`;
    
    // Determinar nível
    let level = 'Iniciante';
    if (progressData.exercisesCompleted >= 50) level = 'Intermediário';
    if (progressData.exercisesCompleted >= 100) level = 'Avançado';
    if (progressData.exercisesCompleted >= 200) level = 'Mestre da Matemática';
    userLevelElement.textContent = level;
    
    // Atualizar gráfico se existir
    if (progressChart) {
        updateProgressChart();
    }
}

// Inicializar gráfico de progresso
function initializeProgressChart() {
    const ctx = document.getElementById('progressChart').getContext('2d');
    
    progressChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Adição', 'Subtração', 'Multiplicação', 'Divisão'],
            datasets: [{
                label: 'Acertos',
                data: [
                    progressData.addition.correct,
                    progressData.subtraction.correct,
                    progressData.multiplication.correct,
                    progressData.division.correct
                ],
                backgroundColor: [
                    'rgba(76, 217, 100, 0.7)',
                    'rgba(255, 193, 7, 0.7)',
                    'rgba(67, 97, 238, 0.7)',
                    'rgba(248, 113, 113, 0.7)'
                ],
                borderColor: [
                    '#4ade80',
                    '#fbbf24',
                    '#4361ee',
                    '#f87171'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Atualizar gráfico de progresso
function updateProgressChart() {
    progressChart.data.datasets[0].data = [
        progressData.addition.correct,
        progressData.subtraction.correct,
        progressData.multiplication.correct,
        progressData.division.correct
    ];
    progressChart.update();
}

// Verificar parâmetros da URL
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const operation = urlParams.get('operation');
    const game = urlParams.get('game');
    
    if (operation && ['addition', 'subtraction', 'multiplication', 'division'].includes(operation)) {
        selectOperation(operation);
        document.querySelector('#operations').scrollIntoView();
    }
    
    if (game && ['multiplicationGame', 'divisionGame', 'mixedGame'].includes(game)) {
        selectGame(game);
        document.querySelector('#games').scrollIntoView();
    }
}

// Função auxiliar para número aleatório
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Adicionar efeito de confete para celebração
function celebrate() {
    // Esta função poderia ser expandida para adicionar efeitos visuais
    console.log("Celebrando conquista!");
}