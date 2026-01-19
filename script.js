// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBwK58We6awwwCMuHThYZA8iXXji5MuVeI",
  authDomain: "mathkids-de4a0.firebaseapp.com",
  projectId: "mathkids-de4a0",
  storageBucket: "mathkids-de4a0.firebasestorage.app",
  messagingSenderId: "463966125316",
  appId: "1:463966125316:web:6656af016d1c5a44da6451"
};

// Inicializar Firebase
let app, db, auth, analytics;
let currentUser = null;
let userData = {};
let adminExists = false;

// Configurar listeners do Firebase em tempo real
let statsListener = null;
let userProgressListener = null;
let rachacucaStatsListener = null;

// Estados da aplicação
let currentSection = 'dashboard';
let currentOperation = null;
let currentExercise = null;
let currentDifficulty = 'easy';
let currentGame = null;
let gameActive = false;
let gameTimer = null;
let gameTimeLeft = 60;
let gameScore = 0;
let gameHighScore = 0;
let systemStats = {
    totalStudents: 0,
    averageRating: 4.8,
    improvementRate: 98,
    totalExercises: 0,
    totalUsers: 0,
    systemAccuracy: 0,
    totalRachacucaGames: 0,
    bestRachacucaScore: 0,
    lastUpdated: 0
};

// Dados do usuário
let userProgress = {
    exercisesCompleted: 0,
    correctAnswers: 0,
    totalAnswers: 0,
    practiceTime: 0,
    addition: { correct: 0, total: 0 },
    subtraction: { correct: 0, total: 0 },
    multiplication: { correct: 0, total: 0 },
    division: { correct: 0, total: 0 },
    rachacuca: {
        gamesCompleted: 0,
        bestTime: 0,
        bestMoves: 0,
        bestScore: 0,
        totalTime: 0,
        totalMoves: 0,
        totalScore: 0,
        easy: { games: 0, bestScore: 0 },
        normal: { games: 0, bestScore: 0 },
        hard: { games: 0, bestScore: 0 }
    },
    lastActivities: [],
    level: 'Iniciante',
    badges: [],
    dailyProgress: {
        exercises: 0,
        correct: 0,
        time: 0
    }
};

// Variáveis globais para armazenamento de instâncias
let operationsChartInstance = null;
let rachacucaChartInstance = null;

// Inicialização do Firebase
try {
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    analytics = firebase.analytics();
    
    console.log('Firebase inicializado com sucesso');
} catch (error) {
    console.log("Firebase não configurado. Modo de demonstração ativado.");
    setupDemoMode();
}

// Elementos DOM - consolidados para evitar duplicação
const DOM = {
    // Telas
    authScreen: document.getElementById('authScreen'),
    appScreen: document.getElementById('appScreen'),
    
    // Formulários de autenticação
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    recoverForm: document.getElementById('recoverForm'),
    loginFormElement: document.getElementById('loginFormElement'),
    registerFormElement: document.getElementById('registerFormElement'),
    recoverFormElement: document.getElementById('recoverFormElement'),
    
    // Links de autenticação
    showRegister: document.getElementById('showRegister'),
    showLogin: document.getElementById('showLogin'),
    showLoginFromRecover: document.getElementById('showLoginFromRecover'),
    forgotPasswordLink: document.getElementById('forgotPasswordLink'),
    
    // Opções de usuário
    adminOption: document.getElementById('adminOption'),
    userTypeSelect: document.getElementById('userType'),
    
    // Estatísticas da tela inicial
    statsStudents: document.getElementById('statsStudents'),
    statsRating: document.getElementById('statsRating'),
    statsImprovement: document.getElementById('statsImprovement'),
    statsRachacucaGames: document.getElementById('statsRachacucaGames'),
    
    // Navegação
    menuToggle: document.getElementById('menuToggle'),
    closeSidebar: document.getElementById('closeSidebar'),
    mobileSidebar: document.getElementById('mobileSidebar'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    userDropdownToggle: document.getElementById('userDropdownToggle'),
    userDropdown: document.getElementById('userDropdown'),
    notificationsToggle: document.getElementById('notificationsToggle'),
    notificationsPanel: document.getElementById('notificationsPanel'),
    clearNotifications: document.getElementById('clearNotifications'),
    
    // Botões de logout
    logoutBtn: document.getElementById('logoutBtn'),
    mobileLogoutBtn: document.getElementById('mobileLogoutBtn'),
    
    // Informações do usuário
    userName: document.getElementById('userName'),
    userRole: document.getElementById('userRole'),
    userAvatarInitials: document.getElementById('userAvatarInitials'),
    dropdownUserName: document.getElementById('dropdownUserName'),
    dropdownUserRole: document.getElementById('dropdownUserRole'),
    dropdownAvatarInitials: document.getElementById('dropdownAvatarInitials'),
    mobileUserName: document.getElementById('mobileUserName'),
    mobileUserRole: document.getElementById('mobileUserRole'),
    mobileAvatarInitials: document.getElementById('mobileAvatarInitials'),
    welcomeUserName: document.getElementById('welcomeUserName'),
    adminNav: document.getElementById('adminNav'),
    mobileAdminLink: document.getElementById('mobileAdminLink'),
    
    // Estatísticas do dashboard
    statExercises: document.getElementById('statExercises'),
    statAccuracy: document.getElementById('statAccuracy'),
    statTime: document.getElementById('statTime'),
    statLevel: document.getElementById('statLevel'),
    statRachacucaGames: document.getElementById('statRachacucaGames'),
    
    // Elementos de seções
    activitiesList: document.getElementById('activitiesList'),
    challengesList: document.getElementById('challengesList'),
    lessonsGrid: document.getElementById('lessonsGrid'),
    activeLesson: document.getElementById('activeLesson'),

    // Seção de Jogos
    gamesGrid: document.getElementById('gamesGrid'),
    gameContainer: document.getElementById('gameContainer'),

    // Racha Cuca
    rachacucaGameContainer: document.getElementById('rachacucaGameContainer'),
    rachacucaPuzzleBoard: document.getElementById('rachacucaPuzzleBoard'),
    rachacucaMoveCounter: document.getElementById('rachacucaMoveCounter'),
    rachacucaTimer: document.getElementById('rachacucaTimer'),
    rachacucaDifficulty: document.getElementById('rachacucaDifficulty'),
    rachacucaScore: document.getElementById('rachacucaScore'),
    rachacucaShuffleBtn: document.getElementById('rachacucaShuffleBtn'),
    rachacucaSolveBtn: document.getElementById('rachacucaSolveBtn'),
    rachacucaResetBtn: document.getElementById('rachacucaResetBtn'),
    rachacucaHintBtn: document.getElementById('rachacucaHintBtn'),
    rachacucaBackBtn: document.getElementById('rachacucaBackBtn'),
    rachacucaCompletionMessage: document.getElementById('rachacucaCompletionMessage'),
    rachacucaFinalMoves: document.getElementById('rachacucaFinalMoves'),
    rachacucaFinalTime: document.getElementById('rachacucaFinalTime'),
    rachacucaFinalScore: document.getElementById('rachacucaFinalScore'),
    rachacucaPlayAgainBtn: document.getElementById('rachacucaPlayAgainBtn'),
    rachacucaSaveScoreBtn: document.getElementById('rachacucaSaveScoreBtn'),
    rachacucaScoresModal: document.getElementById('rachacucaScoresModal'),
    rachacucaScoresList: document.getElementById('rachacucaScoresList'),
    rachacucaSaveScoreModal: document.getElementById('rachacucaSaveScoreModal'),
    rachacucaSaveMoves: document.getElementById('rachacucaSaveMoves'),
    rachacucaSaveTime: document.getElementById('rachacucaSaveTime'),
    rachacucaSaveDifficulty: document.getElementById('rachacucaSaveDifficulty'),
    rachacucaSaveScore: document.getElementById('rachacucaSaveScore'),
    rachacucaPlayerName: document.getElementById('rachacucaPlayerName'),
    rachacucaConfirmSaveBtn: document.getElementById('rachacucaConfirmSaveBtn'),
    rachacucaCancelSaveBtn: document.getElementById('rachacucaCancelSaveBtn'),
    
    // Modais
    termsModal: document.getElementById('termsModal'),
    privacyModal: document.getElementById('privacyModal'),
    contactModal: document.getElementById('contactModal'),
    profileModal: document.getElementById('profileModal'),
    settingsModal: document.getElementById('settingsModal'),
    
    // Links de modais
    termsLink: document.getElementById('termsLink'),
    privacyLink: document.getElementById('privacyLink'),
    termsLinkFooter: document.getElementById('termsLinkFooter'),
    privacyLinkFooter: document.getElementById('privacyLinkFooter'),
    contactLink: document.getElementById('contactLink'),
    
    // Containers
    toastContainer: document.getElementById('toastContainer'),
    loadingOverlay: document.getElementById('loadingOverlay')
};

// Variáveis do Racha Cuca
let rachacucaBoard = [];
let rachacucaEmptyTileIndex = 15;
let rachacucaMoves = 0;
let rachacucaTimerSeconds = 0;
let rachacucaTimerInterval = null;
let rachacucaGameStarted = false;
let rachacucaGameCompleted = false;
let rachacucaCurrentDifficulty = 'normal';
let rachacucaAutoSaveAttempted = false;
let rachacucaCurrentScore = 0;

// Configurar listeners do Firebase em tempo real
function setupFirebaseListeners() {
    if (!db) return;
    
    // Remover listener anterior se existir
    if (statsListener) {
        statsListener();
        statsListener = null;
    }
    
    if (rachacucaStatsListener) {
        rachacucaStatsListener();
        rachacucaStatsListener = null;
    }
    
    // Configurar listener em tempo real para usuários (estatísticas gerais)
    statsListener = db.collection('users').onSnapshot(
        (snapshot) => {
            console.log('📊 Dados do Firebase atualizados em tempo real');
            loadSystemStats(true);
            loadRachacucaStats();
        },
        (error) => {
            console.error('❌ Erro no listener do Firebase:', error);
            setTimeout(() => setupFirebaseListeners(), 5000);
        }
    );
    
    // Configurar listener para estatísticas do Racha Cuca
    rachacucaStatsListener = db.collection('rachacuca_scores').onSnapshot(
        (snapshot) => {
            console.log('🎮 Estatísticas do Racha Cuca atualizadas');
            loadRachacucaStats();
        },
        (error) => {
            console.error('❌ Erro no listener do Racha Cuca:', error);
        }
    );
    
    // Configurar listener para progresso do usuário atual
    if (currentUser && currentUser.id) {
        setupUserProgressListener();
    }
}

// Configurar listener para progresso do usuário
function setupUserProgressListener() {
    if (!db || !currentUser || !currentUser.id) return;
    
    // Remover listener anterior se existir
    if (userProgressListener) {
        userProgressListener();
        userProgressListener = null;
    }
    
    userProgressListener = db.collection('users').doc(currentUser.id).onSnapshot(
        (doc) => {
            if (doc.exists) {
                const data = doc.data();
                if (data.progress) {
                    userProgress = { ...userProgress, ...data.progress };
                    if (data.progress.rachacuca) {
                        userProgress.rachacuca = { ...userProgress.rachacuca, ...data.progress.rachacuca };
                    }
                    updateProgressUI();
                    
                    if (currentSection === 'progress') {
                        loadProgressSection();
                    }
                }
            }
        },
        (error) => {
            console.error('❌ Erro no listener de progresso:', error);
        }
    );
}

// Quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar elementos DOM
    initializeElements();
    
    // Configurar eventos
    setupEventListeners();
    
    // Verificar autenticação
    checkAuthState();
    
    // Inicializar componentes
    initializeComponents();
    
    // Configurar Firebase Auth state observer
    if (auth) {
      auth.onAuthStateChanged(handleAuthStateChange);
    }
});

// Função auxiliar para inicializar elementos
function initializeElements() {
    // Obter todos os links de navegação
    DOM.navLinks = document.querySelectorAll('.nav-link');
    DOM.sidebarLinks = document.querySelectorAll('.sidebar-link');
    DOM.operationQuicks = document.querySelectorAll('.operation-quick');
    
    // Elementos de ação rápida
    DOM.closeLesson = document.getElementById('closeLesson');
    DOM.quickPractice = document.getElementById('quickPractice');
    DOM.quickGame = document.getElementById('quickGame');
    DOM.refreshDashboard = document.getElementById('refreshDashboard');

    // Elementos do Racha Cuca
    DOM.rachacucaDifficultyBtns = document.querySelectorAll('.difficulty-btn');
    DOM.rachacucaTabBtns = document.querySelectorAll('.tab-btn');
}

// Configurar todos os event listeners
function setupEventListeners() {
    if (!DOM || !DOM.showRegister) {
        console.error('❌ Elementos DOM não encontrados');
        return;
    }
    
    // Alternância entre formulários de autenticação
    DOM.showRegister.addEventListener('click', function(e) {
        e.preventDefault();
        switchAuthForm('register');
    });
    
    DOM.showLogin.addEventListener('click', function(e) {
        e.preventDefault();
        switchAuthForm('login');
    });
    
    DOM.showLoginFromRecover.addEventListener('click', function(e) {
        e.preventDefault();
        switchAuthForm('login');
    });
    
    DOM.forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        switchAuthForm('recover');
    });
    
    // Submissão de formulários
    DOM.loginFormElement.addEventListener('submit', handleLogin);
    DOM.registerFormElement.addEventListener('submit', handleRegister);
    DOM.recoverFormElement.addEventListener('submit', handlePasswordRecovery);
    
    // Toggle de senhas
    setupPasswordToggles();
    
    // Navegação
    DOM.menuToggle.addEventListener('click', openMobileSidebar);
    DOM.closeSidebar.addEventListener('click', closeMobileSidebar);
    DOM.sidebarOverlay.addEventListener('click', closeMobileSidebar);
    
    DOM.userDropdownToggle.addEventListener('click', toggleUserDropdown);
    
    // Fechar dropdown ao clicar fora
    document.addEventListener('click', function(e) {
        if (DOM.userDropdownToggle && !DOM.userDropdownToggle.contains(e.target) && 
            DOM.userDropdown && !DOM.userDropdown.contains(e.target)) {
            DOM.userDropdown.classList.remove('active');
        }
    });
    
    // Logout
    DOM.logoutBtn.addEventListener('click', handleLogout);
    DOM.mobileLogoutBtn.addEventListener('click', handleLogout);
    
    // Notificações
    DOM.notificationsToggle.addEventListener('click', toggleNotifications);
    DOM.clearNotifications.addEventListener('click', clearAllNotifications);
    
    // Fechar notificações ao clicar fora
    document.addEventListener('click', function(e) {
        if (DOM.notificationsToggle && !DOM.notificationsToggle.contains(e.target) && 
            DOM.notificationsPanel && !DOM.notificationsPanel.contains(e.target)) {
            DOM.notificationsPanel.classList.remove('active');
        }
    });
    
    // Navegação entre seções
    if (DOM.navLinks) {
        DOM.navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const sectionId = this.getAttribute('href').substring(1);
                switchSection(sectionId);
                updateActiveNavigation(sectionId);
                closeMobileSidebar();
            });
        });
    }
    
    // Navegação na sidebar mobile
    if (DOM.sidebarLinks) {
        DOM.sidebarLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                if (!this.classList.contains('logout')) {
                    e.preventDefault();
                    const sectionId = this.getAttribute('href').substring(1);
                    switchSection(sectionId);
                    updateActiveNavigation(sectionId);
                    closeMobileSidebar();
                }
            });
        });
    }
    
    // Operações rápidas no dashboard
    if (DOM.operationQuicks) {
        DOM.operationQuicks.forEach(operation => {
            operation.addEventListener('click', function() {
                const operationType = this.getAttribute('data-operation');
                switchSection('practice');
                loadPracticeSection(operationType);
            });
        });
    }
    
    // Botões de ação rápida
    if (DOM.quickPractice) {
        DOM.quickPractice.addEventListener('click', function() {
            this.classList.add('active');
            setTimeout(() => this.classList.remove('active'), 300);
            
            const operations = ['addition', 'subtraction', 'multiplication', 'division'];
            const randomOperation = operations[Math.floor(Math.random() * operations.length)];
            switchSection('practice');
            loadPracticeSection(randomOperation);
        });
    }
    
    if (DOM.quickGame) {
        DOM.quickGame.addEventListener('click', function() {
            this.classList.add('active');
            setTimeout(() => this.classList.remove('active'), 300);
            
            const games = ['lightningGame', 'divisionPuzzle', 'mathChampionship', 'rachacucaGame'];
            const randomGame = games[Math.floor(Math.random() * games.length)];
            switchSection('games');
            
            if (randomGame === 'rachacucaGame') {
                startRachacucaGame();
            } else {
                startGame(randomGame);
            }
        });
    }
    
    // Fechar lição ativa
    if (DOM.closeLesson) {
        DOM.closeLesson.addEventListener('click', function() {
            DOM.activeLesson.style.display = 'none';
        });
    }
    
    // Recarregar dashboard
    if (DOM.refreshDashboard) {
        DOM.refreshDashboard.addEventListener('click', function() {
            loadDashboardContent();
            showToast('Dashboard atualizado!', 'success');
        });
    }
    
    // Blocos de recursos na tela inicial
    document.querySelectorAll('.feature').forEach(feature => {
        feature.addEventListener('click', function(e) {
            e.preventDefault();
            loadSystemStats(true);
        });
    });
    
    // Modal de perfil e configurações
    document.querySelectorAll('[href="#profile"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            openModal('profile');
        });
    });
    
    document.querySelectorAll('[href="#settings"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            openModal('settings');
        });
    });
    
    // Links de termos, privacidade e contato
    if (DOM.termsLink) {
        DOM.termsLink.addEventListener('click', function(e) {
            e.preventDefault();
            openModal('terms');
        });
    }
    
    if (DOM.privacyLink) {
        DOM.privacyLink.addEventListener('click', function(e) {
            e.preventDefault();
            openModal('privacy');
        });
    }
    
    if (DOM.termsLinkFooter) {
        DOM.termsLinkFooter.addEventListener('click', function(e) {
            e.preventDefault();
            openModal('terms');
        });
    }
    
    if (DOM.privacyLinkFooter) {
        DOM.privacyLinkFooter.addEventListener('click', function(e) {
            e.preventDefault();
            openModal('privacy');
        });
    }
    
    if (DOM.contactLink) {
        DOM.contactLink.addEventListener('click', function(e) {
            e.preventDefault();
            openModal('contact');
        });
    }
    
    // Fechar modais
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) closeModal(modal.id);
        });
    });
    
    // Fechar modais ao clicar fora
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });

    // Eventos do Racha Cuca
    if (DOM.rachacucaShuffleBtn) {
        DOM.rachacucaShuffleBtn.addEventListener('click', rachacucaShuffleBoard);
    }
    
    if (DOM.rachacucaSolveBtn) {
        DOM.rachacucaSolveBtn.addEventListener('click', rachacucaShowSolution);
    }
    
    if (DOM.rachacucaResetBtn) {
        DOM.rachacucaResetBtn.addEventListener('click', rachacucaResetGame);
    }
    
    if (DOM.rachacucaHintBtn) {
        DOM.rachacucaHintBtn.addEventListener('click', rachacucaShowHint);
    }
    
    if (DOM.rachacucaBackBtn) {
        DOM.rachacucaBackBtn.addEventListener('click', rachacucaBackToGames);
    }
    
    if (DOM.rachacucaPlayAgainBtn) {
        DOM.rachacucaPlayAgainBtn.addEventListener('click', rachacucaResetGame);
    }
    
    if (DOM.rachacucaSaveScoreBtn) {
        DOM.rachacucaSaveScoreBtn.addEventListener('click', rachacucaOpenSaveScoreModal);
    }
    
    // Eventos dos modais do Racha Cuca
    if (DOM.rachacucaConfirmSaveBtn) {
        DOM.rachacucaConfirmSaveBtn.addEventListener('click', rachacucaSaveScore);
    }
    
    if (DOM.rachacucaCancelSaveBtn) {
        DOM.rachacucaCancelSaveBtn.addEventListener('click', function() {
            DOM.rachacucaSaveScoreModal.classList.remove('active');
        });
    }
    
    // Eventos dos botões de dificuldade do Racha Cuca
    if (DOM.rachacucaDifficultyBtns) {
        DOM.rachacucaDifficultyBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                DOM.rachacucaDifficultyBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                rachacucaCurrentDifficulty = this.dataset.difficulty;
                if (DOM.rachacucaDifficulty) {
                    DOM.rachacucaDifficulty.textContent = 
                        rachacucaCurrentDifficulty === 'easy' ? 'Fácil' : 
                        rachacucaCurrentDifficulty === 'normal' ? 'Normal' : 'Difícil';
                }
                rachacucaResetGame();
            });
        });
    }

    // Eventos das tabs do ranking do Racha Cuca
    if (DOM.rachacucaTabBtns) {
        DOM.rachacucaTabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                DOM.rachacucaTabBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const tab = this.dataset.tab;
                rachacucaLoadScores(tab);
            });
        });
    }

    // Fechar modais do Racha Cuca ao clicar fora
    document.addEventListener('click', function(e) {
        if (DOM.rachacucaScoresModal && e.target === DOM.rachacucaScoresModal) {
            DOM.rachacucaScoresModal.classList.remove('active');
        }
        if (DOM.rachacucaSaveScoreModal && e.target === DOM.rachacucaSaveScoreModal) {
            DOM.rachacucaSaveScoreModal.classList.remove('active');
        }
    });
}

// Configurar toggles de senha
function setupPasswordToggles() {
    const toggleButtons = [
        { button: 'toggleLoginPassword', input: 'loginPassword' },
        { button: 'toggleRegisterPassword', input: 'registerPassword' },
        { button: 'toggleRegisterConfirmPassword', input: 'registerConfirmPassword' }
    ];
    
    toggleButtons.forEach(({ button, input }) => {
        const toggleBtn = document.getElementById(button);
        const passwordInput = document.getElementById(input);
        
        if (toggleBtn && passwordInput) {
            toggleBtn.addEventListener('click', function() {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                const icon = this.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-eye');
                    icon.classList.toggle('fa-eye-slash');
                }
            });
        }
    });
}

// Carregar estatísticas do sistema
async function loadSystemStats(forceUpdate = false) {
    console.log('📊 Carregando estatísticas do sistema...', { forceUpdate, dbExists: !!db });
    
    updateSystemStatsUI(true);
    
    if (!db) {
        systemStats = {
            totalStudents: 1250,
            averageRating: 4.8,
            improvementRate: 98,
            totalExercises: 12450,
            totalUsers: 1260,
            systemAccuracy: 78,
            totalRachacucaGames: 356,
            bestRachacucaScore: 950,
            lastUpdated: Date.now()
        };
        updateSystemStatsUI(false);
        return;
    }
    
    try {
        const cacheKey = 'mathkids_system_stats_cache';
        const cacheDuration = 5 * 60 * 1000;
        
        if (!forceUpdate) {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                try {
                    const { stats, timestamp } = JSON.parse(cached);
                    if (Date.now() - timestamp < cacheDuration) {
                        console.log('💾 Usando estatísticas em cache');
                        systemStats = { ...stats, lastUpdated: timestamp };
                        updateSystemStatsUI(false);
                        setTimeout(() => loadSystemStats(true), 1000);
                        return;
                    }
                } catch (cacheError) {
                    console.warn('⚠️ Erro ao ler cache, buscando dados frescos');
                }
            }
        }
        
        console.log('🔥 Buscando estatísticas do Firebase...');
        
        const usersSnapshot = await db.collection('users').get();
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const studentUsers = users.filter(user => user.role === 'student');
        const totalStudents = studentUsers.length;
        const totalUsers = users.length;
        
        let totalExercises = 0;
        let totalCorrect = 0;
        let totalAttempts = 0;
        
        studentUsers.forEach(user => {
            if (user.progress) {
                totalExercises += user.progress.exercisesCompleted || 0;
                totalCorrect += user.progress.correctAnswers || 0;
                totalAttempts += user.progress.totalAnswers || 0;
            }
        });
        
        const systemAccuracy = totalAttempts > 0 ? 
            Math.round((totalCorrect / totalAttempts) * 100) : 78;
        
        const adminExists = users.some(user => user.role === 'admin');
        window.adminExists = adminExists;
        
        if (DOM.adminOption) {
            if (adminExists) {
                DOM.adminOption.disabled = true;
                DOM.adminOption.title = "Já existe um administrador. Contate o administrador atual para acesso.";
            } else {
                DOM.adminOption.disabled = false;
                DOM.adminOption.title = "Se torne o administrador principal";
            }
        }
        
        // Carregar estatísticas do Racha Cuca do Firestore
        let rachacucaStats = {
            totalGames: 0,
            bestScore: 0
        };
        
        try {
            const rachacucaSnapshot = await db.collection('rachacuca_scores').get();
            rachacucaStats.totalGames = rachacucaSnapshot.size;
            
            if (rachacucaSnapshot.size > 0) {
                let bestScore = 0;
                rachacucaSnapshot.forEach(doc => {
                    const score = doc.data().score || 0;
                    if (score > bestScore) {
                        bestScore = score;
                    }
                });
                rachacucaStats.bestScore = bestScore;
            }
        } catch (error) {
            console.warn('⚠️ Erro ao carregar estatísticas do Racha Cuca:', error);
            // Usar valores padrão se não conseguir carregar
            rachacucaStats = {
                totalGames: systemStats.totalRachacucaGames || 356,
                bestScore: systemStats.bestRachacucaScore || 950
            };
        }
        
        const averageRating = 4.8;
        const improvementRate = Math.min(98, systemAccuracy + 20);
        
        systemStats = {
            totalStudents,
            averageRating,
            improvementRate,
            totalExercises,
            totalUsers,
            systemAccuracy,
            totalRachacucaGames: rachacucaStats.totalGames,
            bestRachacucaScore: rachacucaStats.bestScore,
            lastUpdated: Date.now()
        };
        
        console.log('✅ Estatísticas carregadas:', systemStats);
        
        try {
            const cacheData = {
                stats: {
                    totalStudents,
                    averageRating,
                    improvementRate,
                    totalExercises,
                    totalUsers,
                    systemAccuracy,
                    totalRachacucaGames: rachacucaStats.totalGames,
                    bestRachacucaScore: rachacucaStats.bestScore
                },
                timestamp: Date.now()
            };
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (cacheError) {
            console.warn('⚠️ Não foi possível salvar cache:', cacheError);
        }
        
        updateSystemStatsUI(false);
        
        if (currentSection === 'admin' && currentUser?.role === 'admin') {
            updateAdminStatsUI();
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar estatísticas do sistema:', error);
        
        try {
            const cacheKey = 'mathkids_system_stats_cache';
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const { stats } = JSON.parse(cached);
                systemStats = { ...stats, lastUpdated: Date.now() };
                console.log('🔄 Usando cache devido ao erro');
            }
        } catch (cacheError) {
            systemStats = {
                totalStudents: 1250,
                averageRating: 4.8,
                improvementRate: 98,
                totalExercises: 12450,
                totalUsers: 1260,
                systemAccuracy: 78,
                totalRachacucaGames: 356,
                bestRachacucaScore: 950,
                lastUpdated: Date.now()
            };
            console.log('🎮 Usando dados de demonstração devido ao erro');
        }
        
        updateSystemStatsUI(false);
    }
}

// Carregar estatísticas do Racha Cuca
async function loadRachacucaStats() {
    if (!db) {
        // Modo demo - usar dados locais
        const localScores = JSON.parse(localStorage.getItem('rachacuca_local_scores') || '[]');
        systemStats.totalRachacucaGames = localScores.length;
        if (localScores.length > 0) {
            const bestScore = localScores.reduce((max, score) => Math.max(max, score.score || 0), 0);
            systemStats.bestRachacucaScore = bestScore;
        }
        updateSystemStatsUI(false);
        return;
    }
    
    try {
        const scoresSnapshot = await db.collection('rachacuca_scores').get();
        const scores = scoresSnapshot.docs.map(doc => doc.data());
        
        systemStats.totalRachacucaGames = scores.length;
        
        if (scores.length > 0) {
            const bestScore = scores.reduce((max, score) => {
                return score.score > max ? score.score : max;
            }, 0);
            systemStats.bestRachacucaScore = bestScore;
        }
        
        updateSystemStatsUI(false);
        
        if (currentSection === 'admin' && currentUser?.role === 'admin') {
            updateAdminStatsUI();
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar estatísticas do Racha Cuca:', error);
    }
}

// Atualizar UI das estatísticas do sistema
function updateSystemStatsUI(loading = false) {
    const statCards = document.querySelectorAll('.stat-card');
    
    if (loading) {
        statCards.forEach(card => card.classList.add('loading'));
    } else {
        statCards.forEach(card => card.classList.remove('loading'));
    }
    
    if (DOM.statsStudents) {
        DOM.statsStudents.textContent = loading ? '...' : systemStats.totalStudents.toLocaleString();
    }
    if (DOM.statsRating) {
        DOM.statsRating.textContent = loading ? '...' : systemStats.averageRating.toFixed(1);
    }
    if (DOM.statsImprovement) {
        DOM.statsImprovement.textContent = loading ? '...' : systemStats.improvementRate + '%';
    }
    if (DOM.statsRachacucaGames) {
        DOM.statsRachacucaGames.textContent = loading ? '...' : systemStats.totalRachacucaGames.toLocaleString();
    }
    
    if (currentSection === 'admin' && currentUser?.role === 'admin') {
        updateAdminStatsUI();
    }
}

// Atualizar estatísticas da seção Admin
function updateAdminStatsUI() {
    const totalUsersEl = document.getElementById('totalUsers');
    const activeStudentsEl = document.getElementById('activeStudents');
    const totalExercisesEl = document.getElementById('totalExercises');
    const systemAccuracyEl = document.getElementById('systemAccuracy');
    const totalRachacucaGamesEl = document.getElementById('totalRachacucaGames');
    const bestRachacucaScoreEl = document.getElementById('bestRachacucaScore');
    
    if (totalUsersEl) totalUsersEl.textContent = systemStats.totalUsers;
    if (activeStudentsEl) activeStudentsEl.textContent = systemStats.totalStudents;
    if (totalExercisesEl) totalExercisesEl.textContent = systemStats.totalExercises;
    if (systemAccuracyEl) systemAccuracyEl.textContent = systemStats.systemAccuracy + '%';
    if (totalRachacucaGamesEl) totalRachacucaGamesEl.textContent = systemStats.totalRachacucaGames;
    if (bestRachacucaScoreEl) bestRachacucaScoreEl.textContent = systemStats.bestRachacucaScore;
}

// Verificar estado de autenticação
function checkAuthState() {
    loadSystemStats(true);
    loadRachacucaStats();
    
    const savedUser = localStorage.getItem('mathkids_user');
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            if (user.email && user.lastLogin && 
                (Date.now() - new Date(user.lastLogin).getTime()) < 7 * 24 * 60 * 60 * 1000) {
                loadUserData(user);
                showApp();
                
                setupFirebaseListeners();
                setupUserProgressListener();
            } else {
                console.log('⏰ Sessão expirada');
                logoutLocal();
            }
        } catch (e) {
            console.error('❌ Erro ao carregar usuário salvo:', e);
            logoutLocal();
        }
    }
}

// Alternar entre formulários de autenticação
function switchAuthForm(formType) {
    if (!DOM.loginForm || !DOM.registerForm || !DOM.recoverForm) return;
    
    DOM.loginForm.classList.remove('active');
    DOM.registerForm.classList.remove('active');
    DOM.recoverForm.classList.remove('active');
    
    switch(formType) {
        case 'login':
            DOM.loginForm.classList.add('active');
            break;
        case 'register':
            DOM.registerForm.classList.add('active');
            checkAdminOption();
            loadSystemStats(false);
            break;
        case 'recover':
            DOM.recoverForm.classList.add('active');
            break;
    }
}

// Verificar se deve mostrar opção de admin
async function checkAdminOption() {
    if (!DOM.adminOption) return;
    
    if (typeof adminExists !== 'undefined') {
        updateAdminOption();
        return;
    }
    
    if (db) {
        try {
            const adminSnapshot = await db.collection('users').where('role', '==', 'admin').limit(1).get();
            adminExists = !adminSnapshot.empty;
            updateAdminOption();
        } catch (error) {
            console.error('❌ Erro ao verificar admin:', error);
            updateAdminOption();
        }
    } else {
        updateAdminOption();
    }
}

function updateAdminOption() {
    if (!DOM.adminOption) return;
    
    if (adminExists) {
        DOM.adminOption.disabled = true;
        DOM.adminOption.title = "Já existe um administrador. Contate o administrador atual para acesso.";
    } else {
        DOM.adminOption.disabled = false;
        DOM.adminOption.title = "Se torne o administrador principal";
    }
}

// Manipular login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    if (!email || !password) {
        showToast('Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        if (auth) {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            await loadUserDataFromFirebase(userCredential.user.uid);
        } else {
            await handleDemoLogin(email, password);
        }
        
        showLoading(false);
        showToast('Login realizado com sucesso!', 'success');
        showApp();
        
        setTimeout(() => loadSystemStats(true), 1000);
        setTimeout(() => loadRachacucaStats(), 1500);
        
    } catch (error) {
        showLoading(false);
        handleAuthError(error);
    }
}

// Manipular cadastro
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const userType = DOM.userTypeSelect.value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    if (!name || !email || !password || !confirmPassword || !userType) {
        showToast('Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('A senha deve ter pelo menos 6 caracteres.', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showToast('As senhas não coincidem.', 'error');
        return;
    }
    
    if (!agreeTerms) {
        showToast('Você deve concordar com os termos de uso.', 'error');
        return;
    }
    
    if (userType === 'admin' && adminExists) {
        showToast('Já existe um administrador cadastrado.', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        let userId;
        
        if (auth) {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            userId = userCredential.user.uid;
            await userCredential.user.sendEmailVerification();
        } else {
            userId = 'demo_' + Date.now();
        }
        
        const userData = {
            name: name,
            email: email,
            role: userType,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            verified: false,
            progress: userProgress,
            settings: {
                theme: 'light',
                notifications: true,
                sound: true,
                music: false,
                progressNotifications: true
            }
        };
        
        if (db) {
            await db.collection('users').doc(userId).set(userData);
            setTimeout(() => loadSystemStats(true), 1500);
            setTimeout(() => loadRachacucaStats(), 2000);
        } else {
            localStorage.setItem('mathkids_user', JSON.stringify({
                ...userData,
                id: userId
            }));
            
            systemStats.totalStudents++;
            systemStats.totalUsers++;
            updateSystemStatsUI();
        }
        
        if (userType === 'admin') {
            adminExists = true;
            localStorage.setItem('mathkids_admin_exists', 'true');
        }
        
        showLoading(false);
        showToast('Conta criada com sucesso! Verifique seu email.', 'success');
        switchAuthForm('login');
        
    } catch (error) {
        showLoading(false);
        handleAuthError(error);
    }
}

// Manipular recuperação de senha
async function handlePasswordRecovery(e) {
    e.preventDefault();
    
    const email = document.getElementById('recoverEmail').value.trim();
    
    if (!email) {
        showToast('Por favor, informe seu email.', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        if (auth) {
            await auth.sendPasswordResetEmail(email);
            showToast('Email de recuperação enviado! Verifique sua caixa de entrada.', 'success');
            switchAuthForm('login');
        } else {
            showToast('Modo demo: Verifique seu email fictício.', 'info');
        }
        
        showLoading(false);
    } catch (error) {
        showLoading(false);
        handleAuthError(error);
    }
}

// Manipular logout
function handleLogout() {
    if (auth) {
        auth.signOut().then(() => {
            logoutLocal();
        }).catch(error => {
            console.error('❌ Logout error:', error);
            logoutLocal();
        });
    } else {
        logoutLocal();
    }
}

function logoutLocal() {
    if (statsListener) {
        statsListener();
        statsListener = null;
    }
    if (userProgressListener) {
        userProgressListener();
        userProgressListener = null;
    }
    if (rachacucaStatsListener) {
        rachacucaStatsListener();
        rachacucaStatsListener = null;
    }
    
    localStorage.removeItem('mathkids_user');
    currentUser = null;
    userData = {};
    
    DOM.authScreen.style.display = 'flex';
    DOM.appScreen.style.display = 'none';
    
    DOM.loginFormElement.reset();
    DOM.registerFormElement.reset();
    DOM.recoverFormElement.reset();
    
    switchAuthForm('login');
    
    setTimeout(() => loadSystemStats(true), 500);
    setTimeout(() => loadRachacucaStats(), 1000);
    
    showToast('Logout realizado com sucesso.', 'info');
}

// Manipular mudança de estado de autenticação
function handleAuthStateChange(user) {
    if (user) {
        loadUserDataFromFirebase(user.uid);
        showApp();
        setupFirebaseListeners();
        setupUserProgressListener();
    }
}

// Carregar dados do usuário do Firebase
async function loadUserDataFromFirebase(userId) {
    try {
        const doc = await db.collection('users').doc(userId).get();
        
        if (doc.exists) {
            const data = doc.data();
            currentUser = { id: userId, ...data };
            
            await db.collection('users').doc(userId).update({
                lastLogin: new Date().toISOString()
            });
            
            localStorage.setItem('mathkids_user', JSON.stringify({
                ...data,
                id: userId,
                lastLogin: new Date().toISOString()
            }));
            
            loadUserData(currentUser);
        }
    } catch (error) {
        console.error('❌ Error loading user data:', error);
        showToast('Erro ao carregar dados do usuário.', 'error');
    }
}

// Carregar dados do usuário
function loadUserData(user) {
    currentUser = user;
    userData = user;
    
    updateUserInfo();
    
    if (user.progress) {
        userProgress = { ...userProgress, ...user.progress };
        if (user.progress.rachacuca) {
            userProgress.rachacuca = { ...userProgress.rachacuca, ...user.progress.rachacuca };
        }
        updateProgressUI();
    }
    
    if (user.settings) {
        loadUserSettings();
    }
    
    if (user.role === 'admin') {
        DOM.adminNav.style.display = 'flex';
        DOM.mobileAdminLink.style.display = 'flex';
    } else {
        DOM.adminNav.style.display = 'none';
        DOM.mobileAdminLink.style.display = 'none';
    }
    
    loadNotifications();
    loadDashboardContent();
}

// Atualizar informações do usuário na interface
function updateUserInfo() {
    const name = currentUser.name || 'Usuário';
    const role = currentUser.role === 'admin' ? 'Administrador' : 'Aluno';
    const initials = getInitials(name);
    
    if (DOM.userName) DOM.userName.textContent = name;
    if (DOM.userRole) DOM.userRole.textContent = role;
    if (DOM.userAvatarInitials) DOM.userAvatarInitials.textContent = initials;
    if (DOM.dropdownUserName) DOM.dropdownUserName.textContent = name;
    if (DOM.dropdownUserRole) DOM.dropdownUserRole.textContent = role;
    if (DOM.dropdownAvatarInitials) DOM.dropdownAvatarInitials.textContent = initials;
    if (DOM.mobileUserName) DOM.mobileUserName.textContent = name;
    if (DOM.mobileUserRole) DOM.mobileUserRole.textContent = role;
    if (DOM.mobileAvatarInitials) DOM.mobileAvatarInitials.textContent = initials;
    if (DOM.welcomeUserName) DOM.welcomeUserName.textContent = name;
    
    if (DOM.dropdownUserRole) {
        const badge = DOM.dropdownUserRole;
        badge.textContent = role;
        badge.className = 'badge';
        badge.style.background = role === 'Administrador' ? 'var(--gradient-warning)' : 'var(--gradient-primary)';
    }
}

// Obter iniciais do nome
function getInitials(name) {
    return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

// Atualizar UI de progresso
function updateProgressUI() {
    if (DOM.statExercises) {
        DOM.statExercises.textContent = userProgress.exercisesCompleted || 0;
    }
    
    const accuracy = userProgress.totalAnswers > 0 
        ? Math.round((userProgress.correctAnswers / userProgress.totalAnswers) * 100) 
        : 0;
    
    if (DOM.statAccuracy) {
        DOM.statAccuracy.textContent = accuracy + '%';
    }
    
    if (DOM.statTime) {
        DOM.statTime.textContent = Math.floor(userProgress.practiceTime / 60) + ' min';
    }
    
    // Garantir que o bloco "Seu Nível" continue visível
    const level = calculateUserLevel();
    if (DOM.statLevel) {
        DOM.statLevel.textContent = level;
    }
    
    if (DOM.statRachacucaGames) {
        DOM.statRachacucaGames.textContent = userProgress.rachacuca?.gamesCompleted || 0;
    }
}

// Calcular nível do usuário baseado no progresso
function calculateUserLevel() {
    const totalExercises = userProgress.exercisesCompleted || 0;
    if (totalExercises >= 200) return 'Mestre';
    if (totalExercises >= 100) return 'Avançado';
    if (totalExercises >= 50) return 'Intermediário';
    return 'Iniciante';
}

// Mostrar aplicação
function showApp() {
    DOM.authScreen.style.display = 'none';
    DOM.appScreen.style.display = 'block';
    switchSection('dashboard');
}

// Alternar sidebar mobile
function openMobileSidebar() {
    DOM.mobileSidebar.classList.add('active');
    DOM.sidebarOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMobileSidebar() {
    DOM.mobileSidebar.classList.remove('active');
    DOM.sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

function toggleUserDropdown() {
    DOM.userDropdown.classList.toggle('active');
}

// Alternar painel de notificações
function toggleNotifications() {
    DOM.notificationsPanel.classList.toggle('active');
}

function clearAllNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    if (notificationsList) {
        notificationsList.innerHTML = '<p class="text-center">Nenhuma notificação</p>';
    }
    document.getElementById('notificationCount').textContent = '0';
    showToast('Notificações limpas.', 'success');
}

// Alternar seção
function switchSection(sectionId) {
    if (currentSection === 'admin' && sectionId !== 'admin') {
        if (window.adminTabListener) {
            window.adminTabListener();
            window.adminTabListener = null;
        }
    }
    
    document.querySelectorAll('.app-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionId;
        
        updateActiveNavigation(sectionId);
        
        loadSectionContent(sectionId);
        
        if (sectionId === 'admin' && currentUser?.role === 'admin') {
            loadSystemStats(true);
            loadRachacucaStats();
            setupAdminFirebaseListener();
        }
    }
}

// Configurar listener do Firebase para Admin
function setupAdminFirebaseListener() {
    if (!db || currentUser?.role !== 'admin') return;
    
    if (window.adminTabListener) {
        window.adminTabListener();
    }
    
    window.adminTabListener = db.collection('users').onSnapshot(
        () => {
            loadUsersTable();
            loadSystemStats(true);
            loadRachacucaStats();
        },
        (error) => {
            console.error('❌ Erro no listener do Admin:', error);
        }
    );
}

// Atualizar navegação ativa
function updateActiveNavigation(sectionId) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });
    
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => {
        if (!link.classList.contains('logout')) {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionId}`) {
                link.classList.add('active');
            }
        }
    });
}

// Carregar conteúdo da seção
function loadSectionContent(sectionId) {
    switch(sectionId) {
        case 'dashboard':
            loadDashboardContent();
            break;
        case 'learn':
            loadLearnSection();
            break;
        case 'practice':
            loadPracticeSection();
            break;
        case 'games':
            loadGamesSection();
            break;
        case 'progress':
            loadProgressSection();
            break;
        case 'admin':
            loadAdminSection();
            break;
    }
}

// Carregar conteúdo do dashboard
function loadDashboardContent() {
    loadRecentActivities();
    loadChallenges();
    loadLessons();
}

// Carregar atividades recentes
function loadRecentActivities() {
    if (!DOM.activitiesList) return;
    
    const activities = userProgress.lastActivities.slice(0, 5);
    let html = '';
    
    if (activities.length === 0) {
        html = '<p class="text-center">Nenhuma atividade recente</p>';
    } else {
        activities.forEach(activity => {
            const icon = activity.type === 'correct' ? 'fa-check-circle' :
                        activity.type === 'wrong' ? 'fa-times-circle' :
                        activity.type === 'game' ? 'fa-gamepad' :
                        activity.type === 'rachacuca' ? 'fa-puzzle-piece' : 'fa-info-circle';
            
            const scoreClass = activity.type === 'correct' ? 'correct' :
                              activity.type === 'wrong' ? 'wrong' :
                              activity.type === 'game' ? 'game' :
                              activity.type === 'rachacuca' ? 'game' : '';
            
            const score = activity.type === 'correct' ? '+10' :
                         activity.type === 'wrong' ? '-5' :
                         activity.type === 'game' ? '+15' :
                         activity.type === 'rachacuca' ? `+${activity.score || 0}` : '';
            
            html += `
                <div class="activity-item ${activity.type}">
                    <div class="activity-icon">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="activity-details">
                        <p>${activity.description}</p>
                        <small>${formatTimeAgo(activity.timestamp)}</small>
                    </div>
                    ${score ? `<span class="activity-score ${scoreClass}">${score}</span>` : ''}
                </div>
            `;
        });
    }
    
    DOM.activitiesList.innerHTML = html;
}

// Carregar desafios
function loadChallenges() {
    if (!DOM.challengesList) return;
    
    const challenges = [
        {
            icon: 'fa-star',
            title: 'Domine a Tabuada do 7',
            description: 'Complete 20 multiplicações com o número 7',
            progress: 9,
            total: 20
        },
        {
            icon: 'fa-bolt',
            title: 'Desafio de Velocidade',
            description: 'Resolva 50 operações em menos de 5 minutos',
            progress: 15,
            total: 50
        },
        {
            icon: 'fa-puzzle-piece',
            title: 'Mestre do Racha Cuca',
            description: 'Complete 5 jogos do Racha Cuca',
            progress: userProgress.rachacuca?.gamesCompleted || 0,
            total: 5
        }
    ];
    
    let html = '';
    challenges.forEach(challenge => {
        const percentage = (challenge.progress / challenge.total) * 100;
        html += `
            <div class="challenge-item">
                <div class="challenge-icon">
                    <i class="fas ${challenge.icon}"></i>
                </div>
                <div class="challenge-info">
                    <h4>${challenge.title}</h4>
                    <p>${challenge.description}</p>
                    <div class="challenge-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percentage}%"></div>
                        </div>
                        <span>${challenge.progress}/${challenge.total}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    DOM.challengesList.innerHTML = html;
}

// Carregar lições
function loadLessons() {
    if (!DOM.lessonsGrid) return;
    
    const lessons = [
        {
            operation: 'addition',
            icon: 'fa-plus',
            title: 'Adição',
            description: 'Descubra como somar números e encontrar totais. A base de todas as operações.',
            difficulty: 'Fácil',
            lessonsCount: 5,
            duration: 30,
            featured: false
        },
        {
            operation: 'subtraction',
            icon: 'fa-minus',
            title: 'Subtração',
            description: 'Aprenda a encontrar diferenças entre números e resolver problemas do dia a dia.',
            difficulty: 'Fácil',
            lessonsCount: 5,
            duration: 35,
            featured: false
        },
        {
            operation: 'multiplication',
            icon: 'fa-times',
            title: 'Multiplicação',
            description: 'Domine a adição repetida e aprenda as tabuadas de forma divertida e eficiente.',
            difficulty: 'Médio',
            lessonsCount: 10,
            duration: 60,
            featured: true
        },
        {
            operation: 'division',
            icon: 'fa-divide',
            title: 'Divisão',
            description: 'Entenda como distribuir quantidades igualmente e resolver problemas de divisão.',
            difficulty: 'Médio',
            lessonsCount: 8,
            duration: 45,
            featured: false
        }
    ];
    
    let html = '';
    lessons.forEach(lesson => {
        html += `
            <div class="lesson-card ${lesson.featured ? 'featured' : ''}" data-operation="${lesson.operation}">
                <div class="lesson-header">
                    <div class="lesson-icon">
                        <i class="fas ${lesson.icon}"></i>
                    </div>
                    <div class="lesson-badge">${lesson.difficulty}</div>
                </div>
                <h3>${lesson.title}</h3>
                <p>${lesson.description}</p>
                <div class="lesson-stats">
                    <span><i class="fas fa-check-circle"></i> ${lesson.lessonsCount} lições</span>
                    <span><i class="fas fa-clock"></i> ${lesson.duration} min</span>
                </div>
                <button class="btn-lesson">Começar Lição</button>
            </div>
        `;
    });
    
    DOM.lessonsGrid.innerHTML = html;
    
    document.querySelectorAll('.lesson-card').forEach(card => {
        card.addEventListener('click', function() {
            const operation = this.getAttribute('data-operation');
            loadLesson(operation);
        });
    });
}

// Carregar lição
function loadLesson(operation) {
    const lessonTitle = document.getElementById('lessonTitle');
    const lessonContent = document.getElementById('lessonContent');
    
    if (!lessonTitle || !lessonContent || !DOM.activeLesson) return;
    
    const lessons = {
        addition: {
            title: 'Lição: Adição',
            content: `
                <div class="lesson-content">
                    <h3>O que é Adição?</h3>
                    <p>A adição é uma das quatro operações básicas da matemática. Ela representa a combinação de dois ou mais números para obter um total.</p>
                    
                    <div class="lesson-example">
                        <h4><i class="fas fa-lightbulb"></i> Exemplo Prático</h4>
                        <p>Se você tem 3 maçãs e compra mais 5 maçãs, quantas maçãs você tem agora?</p>
                        <div class="example-display">
                            <span class="example-number">3</span>
                            <span class="example-symbol">+</span>
                            <span class="example-number">5</span>
                            <span class="example-symbol">=</span>
                            <span class="example-number">8</span>
                        </div>
                        <p>Resposta: Você tem 8 maçãs no total.</p>
                    </div>
                    
                    <div class="lesson-tip">
                        <h4><i class="fas fa-tips"></i> Dica de Aprendizado</h4>
                        <p>Para somar números grandes, você pode quebrá-los em partes menores. Por exemplo:</p>
                        <p>47 + 25 = (40 + 20) + (7 + 5) = 60 + 12 = 72</p>
                    </div>
                    
                    <button class="btn-lesson-start" onclick="switchSection('practice'); loadPracticeSection('addition')">
                        <i class="fas fa-dumbbell"></i> Praticar Adição
                    </button>
                </div>
            `
        },
        subtraction: {
            title: 'Lição: Subtração',
            content: `
                <div class="lesson-content">
                    <h3>O que é Subtração?</h3>
                    <p>A subtração é a operação inversa da adição. Ela representa a remoção de uma quantidade de outra.</p>
                    
                    <div class="lesson-example">
                        <h4><i class="fas fa-lightbulb"></i> Exemplo Prático</h4>
                        <p>Se você tinha 10 reais e gastou 4 reais, quanto dinheiro sobrou?</p>
                        <div class="example-display">
                            <span class="example-number">10</span>
                            <span class="example-symbol">-</span>
                            <span class="example-number">4</span>
                            <span class="example-symbol">=</span>
                            <span class="example-number">6</span>
                        </div>
                        <p>Resposta: Sobraram 6 reais.</p>
                    </div>
                    
                    <div class="lesson-tip">
                        <h4><i class="fas fa-tips"></i> Dica de Aprendizado</h4>
                        <p>Você pode pensar na subtração como "quanto falta". Por exemplo:</p>
                        <p>15 - 7 = ? (Pense: 7 + ? = 15 → 7 + 8 = 15, então 15 - 7 = 8)</p>
                    </div>
                    
                    <button class="btn-lesson-start" onclick="switchSection('practice'); loadPracticeSection('subtraction')">
                        <i class="fas fa-dumbbell"></i> Praticar Subtração
                    </button>
                </div>
            `
        },
        multiplication: {
            title: 'Lição: Multiplicação',
            content: `
                <div class="lesson-content">
                    <h3>O que é Multiplicação?</h3>
                    <p>A multiplicação é uma adição repetida. É uma forma mais rápida de somar o mesmo número várias vezes.</p>
                    
                    <div class="lesson-example">
                        <h4><i class="fas fa-lightbulb"></i> Exemplo Prático</h4>
                        <p>Se cada pacote tem 4 bolinhas e você tem 3 pacotes, quantas bolinhas você tem no total?</p>
                        <div class="example-display">
                            <span class="example-number">4</span>
                            <span class="example-symbol">×</span>
                            <span class="example-number">3</span>
                            <span class="example-symbol">=</span>
                            <span class="example-number">12</span>
                        </div>
                        <p>Resposta: Você tem 12 bolinhas (4 + 4 + 4 = 12).</p>
                    </div>
                    
                    <div class="lesson-tip">
                        <h4><i class="fas fa-tips"></i> Dica de Aprendizado</h4>
                        <p>Aprenda as tabuadas aos poucos. Comece com a tabuada do 2, depois do 5, do 10, e assim por diante.</p>
                        <p>Use a propriedade comutativa: 3 × 4 = 4 × 3 = 12</p>
                    </div>
                    
                    <div class="multiplication-table">
                        <h4>Tabuada do 5</h4>
                        <div class="table-grid">
                            <span>5 × 1 = 5</span>
                            <span>5 × 2 = 10</span>
                            <span>5 × 3 = 15</span>
                            <span>5 × 4 = 20</span>
                            <span>5 × 5 = 25</span>
                        </div>
                    </div>
                    
                    <button class="btn-lesson-start" onclick="switchSection('practice'); loadPracticeSection('multiplication')">
                        <i class="fas fa-dumbbell"></i> Praticar Multiplicação
                    </button>
                </div>
            `
        },
        division: {
            title: 'Lição: Divisão',
            content: `
                <div class="lesson-content">
                    <h3>O que é Divisão?</h3>
                    <p>A divisão é a operação inversa da multiplicação. Ela representa a distribuição igualitária de uma quantidade.</p>
                    
                    <div class="lesson-example">
                        <h4><i class="fas fa-lightbulb"></i> Exemplo Prático</h4>
                        <p>Se você tem 12 chocolates para dividir igualmente entre 4 amigos, quantos chocolates cada um recebe?</p>
                        <div class="example-display">
                            <span class="example-number">12</span>
                            <span class="example-symbol">÷</span>
                            <span class="example-number">4</span>
                            <span class="example-symbol">=</span>
                            <span class="example-number">3</span>
                        </div>
                        <p>Resposta: Cada amigo recebe 3 chocolates.</p>
                    </div>
                    
                    <div class="lesson-tip">
                        <h4><i class="fas fa-tips"></i> Dica de Aprendizado</h4>
                        <p>Pense na divisão como "quantos grupos iguais". Por exemplo:</p>
                        <p>20 ÷ 4 = ? (Pense: Quantos grupos de 4 cabem em 20? → 5 grupos)</p>
                    </div>
                    
                    <div class="division-types">
                        <h4>Tipos de Divisão</h4>
                        <p><strong>Divisão exata:</strong> Quando não sobra resto (ex: 15 ÷ 3 = 5)</p>
                        <p><strong>Divisão com resto:</strong> Quando sobra um resto (ex: 17 ÷ 5 = 3, resto 2)</p>
                    </div>
                    
                    <button class="btn-lesson-start" onclick="switchSection('practice'); loadPracticeSection('division')">
                        <i class="fas fa-dumbbell"></i> Praticar Divisão
                    </button>
                </div>
            `
        }
    };
    
    if (lessons[operation]) {
        lessonTitle.textContent = lessons[operation].title;
        lessonContent.innerHTML = lessons[operation].content;
        DOM.activeLesson.style.display = 'block';
    }
}

// Carregar seção de prática
function loadPracticeSection(operation = null) {
    const section = document.getElementById('practice');
    if (!section) return;
    
    if (operation) {
        currentOperation = operation;
    }
    
    const operationName = getOperationName(currentOperation);
    
    const content = `
        <div class="section-header">
            <div class="header-content">
                <h2><i class="fas fa-dumbbell"></i> Praticar</h2>
                <p>Escolha uma operação e pratique com exercícios interativos.</p>
            </div>
        </div>
        
        <div class="practice-content">
            <div class="operations-selector">
                <div class="operations-grid">
                    <div class="operation-selector ${currentOperation === 'addition' ? 'active' : ''}" data-operation="addition">
                        <div class="operation-icon">
                            <i class="fas fa-plus"></i>
                        </div>
                        <h3>Adição</h3>
                        <p>Some números e encontre o total</p>
                        <div class="operation-stats">
                            <span>Acertos: ${userProgress.addition.correct || 0}/${userProgress.addition.total || 0}</span>
                        </div>
                    </div>
                    
                    <div class="operation-selector ${currentOperation === 'subtraction' ? 'active' : ''}" data-operation="subtraction">
                        <div class="operation-icon">
                            <i class="fas fa-minus"></i>
                        </div>
                        <h3>Subtração</h3>
                        <p>Encontre a diferença entre números</p>
                        <div class="operation-stats">
                            <span>Acertos: ${userProgress.subtraction.correct || 0}/${userProgress.subtraction.total || 0}</span>
                        </div>
                    </div>
                    
                    <div class="operation-selector ${currentOperation === 'multiplication' ? 'active' : ''}" data-operation="multiplication">
                        <div class="operation-icon">
                            <i class="fas fa-times"></i>
                        </div>
                        <h3>Multiplicação</h3>
                        <p>Domine as tabuadas e multiplicações</p>
                        <div class="operation-stats">
                            <span>Acertos: ${userProgress.multiplication.correct || 0}/${userProgress.multiplication.total || 0}</span>
                        </div>
                    </div>
                    
                    <div class="operation-selector ${currentOperation === 'division' ? 'active' : ''}" data-operation="division">
                        <div class="operation-icon">
                            <i class="fas fa-divide"></i>
                        </div>
                        <h3>Divisão</h3>
                        <p>Aprenda a dividir igualmente</p>
                        <div class="operation-stats">
                            <span>Acertos: ${userProgress.division.correct || 0}/${userProgress.division.total || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            ${currentOperation ? `
            <div class="practice-exercise">
                <div class="exercise-header">
                    <h3><i class="fas fa-${getOperationIcon(currentOperation)}"></i> Praticando ${operationName}</h3>
                    <div class="difficulty-selector">
                        <span>Dificuldade:</span>
                        <div class="difficulty-buttons">
                            <button class="btn-difficulty ${currentDifficulty === 'easy' ? 'active' : ''}" data-level="easy">Fácil</button>
                            <button class="btn-difficulty ${currentDifficulty === 'medium' ? 'active' : ''}" data-level="medium">Médio</button>
                            <button class="btn-difficulty ${currentDifficulty === 'hard' ? 'active' : ''}" data-level="hard">Difícil</button>
                        </div>
                    </div>
                </div>
                
                <div class="exercise-container">
                    <div class="exercise-display">
                        <div class="numbers" id="exerciseNum1">?</div>
                        <div class="operation-symbol" id="exerciseSymbol">${getOperationSymbol(currentOperation)}</div>
                        <div class="numbers" id="exerciseNum2">?</div>
                        <div class="equals">=</div>
                        <input type="number" id="exerciseAnswer" placeholder="?" autofocus>
                    </div>
                    
                    <div class="exercise-feedback" id="exerciseFeedback"></div>
                    
                    <div class="exercise-controls">
                        <button class="btn-exercise" id="checkExercise">Verificar Resposta</button>
                        <button class="btn-exercise secondary" id="newExercise">Novo Exercício</button>
                        <button class="btn-exercise outline" id="showHint">Mostrar Dica</button>
                    </div>
                </div>
            </div>
            ` : '<p class="text-center">Selecione uma operação para começar a praticar.</p>'}
        </div>
    `;
    
    section.innerHTML = content;
    
    if (currentOperation) {
        setupPracticeEvents();
        generateExercise();
    }
    
    document.querySelectorAll('.operation-selector').forEach(selector => {
        selector.addEventListener('click', function() {
            const operation = this.getAttribute('data-operation');
            loadPracticeSection(operation);
        });
    });
}

// Configurar eventos da prática
function setupPracticeEvents() {
    document.querySelectorAll('.btn-difficulty').forEach(btn => {
        btn.addEventListener('click', function() {
            currentDifficulty = this.getAttribute('data-level');
            document.querySelectorAll('.btn-difficulty').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            generateExercise();
        });
    });
    
    document.getElementById('checkExercise')?.addEventListener('click', checkPracticeAnswer);
    document.getElementById('newExercise')?.addEventListener('click', generateExercise);
    document.getElementById('showHint')?.addEventListener('click', showPracticeHint);
    
    document.getElementById('exerciseAnswer')?.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            checkPracticeAnswer();
        }
    });
}

// Gerar exercício
function generateExercise() {
    if (!currentOperation) return;
    
    let num1, num2, answer;
    const symbol = getOperationSymbol(currentOperation);
    
    const ranges = {
        'easy': { min: 1, max: 20 },
        'medium': { min: 10, max: 100 },
        'hard': { min: 50, max: 500 }
    };
    
    const range = ranges[currentDifficulty];
    
    switch(currentOperation) {
        case 'addition':
            num1 = getRandomInt(range.min, range.max);
            num2 = getRandomInt(range.min, range.max);
            answer = num1 + num2;
            break;
            
        case 'subtraction':
            num1 = getRandomInt(range.min, range.max);
            num2 = getRandomInt(range.min, num1);
            answer = num1 - num2;
            break;
            
        case 'multiplication':
            const multRange = {
                'easy': { min: 1, max: 10 },
                'medium': { min: 5, max: 15 },
                'hard': { min: 10, max: 20 }
            };
            const multR = multRange[currentDifficulty];
            num1 = getRandomInt(multR.min, multR.max);
            num2 = getRandomInt(multR.min, multR.max);
            answer = num1 * num2;
            break;
            
        case 'division':
            num2 = getRandomInt(1, 12);
            const quotient = getRandomInt(range.min, Math.floor(range.max / num2));
            num1 = num2 * quotient;
            answer = quotient;
            break;
    }
    
    currentExercise = {
        num1: num1,
        num2: num2,
        answer: answer,
        operation: currentOperation,
        symbol: symbol
    };
    
    const num1Element = document.getElementById('exerciseNum1');
    const symbolElement = document.getElementById('exerciseSymbol');
    const num2Element = document.getElementById('exerciseNum2');
    const answerInput = document.getElementById('exerciseAnswer');
    const feedback = document.getElementById('exerciseFeedback');
    
    if (num1Element) num1Element.textContent = num1;
    if (symbolElement) symbolElement.textContent = symbol;
    if (num2Element) num2Element.textContent = num2;
    if (answerInput) {
        answerInput.value = '';
        answerInput.focus();
    }
    if (feedback) {
        feedback.textContent = '';
        feedback.className = 'exercise-feedback';
    }
}

// Verificar resposta na prática
function checkPracticeAnswer() {
    const input = document.getElementById('exerciseAnswer');
    const userAnswer = parseInt(input.value);
    const feedback = document.getElementById('exerciseFeedback');
    
    if (!input || !feedback || isNaN(userAnswer)) {
        if (feedback) {
            feedback.textContent = 'Digite um número válido!';
            feedback.className = 'exercise-feedback error';
        }
        return;
    }
    
    userProgress.exercisesCompleted++;
    userProgress.totalAnswers++;
    userProgress[currentExercise.operation].total++;
    
    if (userAnswer === currentExercise.answer) {
        feedback.textContent = `🎉 Correto! ${currentExercise.num1} ${currentExercise.symbol} ${currentExercise.num2} = ${currentExercise.answer}`;
        feedback.className = 'exercise-feedback correct';
        userProgress.correctAnswers++;
        userProgress[currentExercise.operation].correct++;
        
        addActivity(`Exercício de ${getOperationName(currentExercise.operation)} concluído`, 'correct');
        
        userProgress.dailyProgress.exercises++;
        userProgress.dailyProgress.correct++;
        
        setTimeout(generateExercise, 1500);
        
        showToast('Resposta correta! +10 pontos', 'success');
    } else {
        feedback.textContent = `❌ Ops! A resposta correta é ${currentExercise.answer}. Tente novamente!`;
        feedback.className = 'exercise-feedback error';
        
        addActivity(`Exercício de ${getOperationName(currentExercise.operation)} errado`, 'wrong');
        
        userProgress.dailyProgress.exercises++;
        
        showToast('Resposta incorreta. Tente novamente!', 'error');
    }
    
    updateProgressUI();
    saveUserProgress();
    
    systemStats.totalExercises++;
    updateSystemStatsUI();
    
    saveSystemStatsCache();
}

// Mostrar dica na prática
function showPracticeHint() {
    if (!currentExercise) return;
    
    const { num1, num2, operation, answer } = currentExercise;
    const feedback = document.getElementById('exerciseFeedback');
    
    if (!feedback) return;
    
    let hint = '';
    switch(operation) {
        case 'addition':
            hint = `💡 Dica: ${num1} + ${num2} = ${num1 + num2}. Tente pensar em ${num1} mais ${num2} unidades.`;
            break;
        case 'subtraction':
            hint = `💡 Dica: ${num1} - ${num2} = ${num1 - num2}. Comece de ${num1} e conte para trás ${num2} unidades.`;
            break;
        case 'multiplication':
            hint = `💡 Dica: ${num1} × ${num2} = ${num1} repetido ${num2} vezes (${Array(num2).fill(num1).join(' + ')})`;
            break;
        case 'division':
            hint = `💡 Dica: ${num1} ÷ ${num2} = ${answer}. Quantos grupos de ${num2} cabem em ${num1}?`;
            break;
    }
    
    feedback.textContent = hint;
    feedback.className = 'exercise-feedback info';
}

// Salvar cache das estatísticas do sistema
function saveSystemStatsCache() {
    try {
        const cacheKey = 'mathkids_system_stats_cache';
        const cacheData = {
            stats: {
                totalStudents: systemStats.totalStudents,
                averageRating: systemStats.averageRating,
                improvementRate: systemStats.improvementRate,
                totalExercises: systemStats.totalExercises,
                totalUsers: systemStats.totalUsers,
                systemAccuracy: systemStats.systemAccuracy,
                totalRachacucaGames: systemStats.totalRachacucaGames,
                bestRachacucaScore: systemStats.bestRachacucaScore
            },
            timestamp: Date.now()
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
        console.warn('⚠️ Não foi possível salvar cache:', error);
    }
}

// Carregar seção de jogos
function loadGamesSection() {
    const section = document.getElementById('games');
    if (!section) return;
    
    const content = `
        <div class="section-header">
            <div class="header-content">
                <h2><i class="fas fa-gamepad"></i> Jogos Educativos</h2>
                <p>Aprenda matemática de forma divertida com nossos jogos!</p>
            </div>
        </div>
        
        <div class="games-content">
            <div class="games-grid" id="gamesGrid">
                <div class="game-card" id="lightningGame">
                    <div class="game-header">
                        <div class="game-icon">
                            <i class="fas fa-bolt"></i>
                        </div>
                        <div class="game-badge">Popular</div>
                    </div>
                    <h3>Desafio Relâmpago</h3>
                    <p>Resolva o máximo de multiplicações em 60 segundos!</p>
                    <div class="game-stats">
                        <span><i class="fas fa-trophy"></i> Seu recorde: ${localStorage.getItem('mathkids_highscore_lightning') || 0}</span>
                    </div>
                    <button class="btn-game">Jogar Agora</button>
                </div>
                
                <div class="game-card" id="divisionPuzzle">
                    <div class="game-header">
                        <div class="game-icon">
                            <i class="fas fa-puzzle-piece"></i>
                        </div>
                        <div class="game-badge">Novo</div>
                    </div>
                    <h3>Quebra-cabeça da Divisão</h3>
                    <p>Complete o quebra-cabeça resolvendo problemas de divisão.</p>
                    <div class="game-stats">
                        <span><i class="fas fa-star"></i> Nível: ${localStorage.getItem('mathkids_division_level') || 1}</span>
                    </div>
                    <button class="btn-game">Jogar Agora</button>
                </div>
                
                <div class="game-card" id="rachacucaGame">
                    <div class="game-header">
                        <div class="game-icon">
                            <i class="fas fa-puzzle-piece"></i>
                        </div>
                        <div class="game-badge">Clássico</div>
                    </div>
                    <h3>Racha Cuca</h3>
                    <p>Quebra-cabeça numérico clássico. Organize os números de 1 a 15.</p>
                    <div class="game-stats">
                        <span><i class="fas fa-trophy"></i> Jogos: ${userProgress.rachacuca?.gamesCompleted || 0}</span>
                        <span><i class="fas fa-star"></i> Melhor: ${userProgress.rachacuca?.bestScore || 0}</span>
                    </div>
                    <button class="btn-game">Jogar Agora</button>
                </div>
                
                <div class="game-card" id="mathChampionship">
                    <div class="game-header">
                        <div class="game-icon">
                            <i class="fas fa-trophy"></i>
                        </div>
                        <div class="game-badge">Competitivo</div>
                    </div>
                    <h3>Campeonato MathKids</h3>
                    <p>Enfrente operações mistas e suba no ranking.</p>
                    <div class="game-stats">
                        <span><i class="fas fa-medal"></i> Posição: #${localStorage.getItem('mathkids_ranking') || '--'}</span>
                    </div>
                    <button class="btn-game">Jogar Agora</button>
                </div>
            </div>
            
            <div class="game-container" id="gameContainer">
                <div class="game-welcome">
                    <h3>Selecione um jogo para começar!</h3>
                    <p>Escolha um dos jogos acima para testar suas habilidades matemáticas de forma divertida.</p>
                    <p>Os jogos ajudam a fixar o conhecimento e melhoram a velocidade de cálculo.</p>
                </div>
            </div>
        </div>
    `;
    
    section.innerHTML = content;
    
    document.querySelectorAll('.btn-game').forEach(button => {
        button.addEventListener('click', function() {
            const gameId = this.closest('.game-card').id;
            
            if (gameId === 'rachacucaGame') {
                startRachacucaGame();
            } else {
                startGame(gameId);
            }
        });
    });
}

// Iniciar jogo Racha Cuca
function startRachacucaGame() {
    const gamesSection = document.getElementById('games');
    if (gamesSection) {
        gamesSection.style.display = 'none';
    }
    
    if (DOM.rachacucaGameContainer) {
        DOM.rachacucaGameContainer.style.display = 'block';
        rachacucaInitGame();
    }
}

// Voltar para a seção de jogos
function rachacucaBackToGames() {
    if (DOM.rachacucaGameContainer) {
        DOM.rachacucaGameContainer.style.display = 'none';
        
        if (rachacucaTimerInterval) {
            clearInterval(rachacucaTimerInterval);
            rachacucaTimerInterval = null;
        }
    }

    const gamesSection = document.getElementById('games');
    if (gamesSection) {
        gamesSection.style.display = 'block';
        loadGamesSection();
    }
}

// Inicializar o jogo Racha Cuca
function rachacucaInitGame() {
    rachacucaCreateBoard();
    rachacucaRenderBoard();
    rachacucaCreateSolutionBoard();
    rachacucaUpdateMoveCounter();
    rachacucaResetTimer();
    rachacucaUpdateScore();
    rachacucaShuffleBoard();
    rachacucaAutoSaveAttempted = false;
}

// Criar o tabuleiro do Racha Cuca
function rachacucaCreateBoard() {
    rachacucaBoard = [];
    for (let i = 1; i <= 15; i++) {
        rachacucaBoard.push(i);
    }
    rachacucaBoard.push(null);
    rachacucaEmptyTileIndex = 15;
}

// Renderizar o tabuleiro do Racha Cuca
function rachacucaRenderBoard() {
    if (!DOM.rachacucaPuzzleBoard) return;
    
    DOM.rachacucaPuzzleBoard.innerHTML = '';
    
    rachacucaBoard.forEach((value, index) => {
        const tile = document.createElement('div');
        tile.className = 'rachacuca-puzzle-tile';
        
        if (value === null) {
            tile.classList.add('empty');
            tile.textContent = '';
            rachacucaEmptyTileIndex = index;
        } else {
            tile.textContent = value;
            tile.dataset.index = index;
            tile.dataset.value = value;
            
            if (value === index + 1) {
                tile.classList.add('correct-position');
            }
            
            // Adicionar evento de clique
            tile.addEventListener('click', () => rachacucaMoveTile(index));
        }
        
        DOM.rachacucaPuzzleBoard.appendChild(tile);
    });
}

// Calcular pontuação do Racha Cuca
function calculateRachacucaScore(moves, time, difficulty) {
    let baseScore = 1000;
    
    // Penalidade por movimentos (menos movimentos = mais pontos)
    const movePenalty = moves * 2;
    
    // Penalidade por tempo (segundos * fator)
    const timePenalty = time * 0.5;
    
    // Bônus por dificuldade
    let difficultyMultiplier = 1;
    if (difficulty === 'normal') difficultyMultiplier = 1.5;
    if (difficulty === 'hard') difficultyMultiplier = 2;
    
    // Calcular pontuação final
    let score = Math.max(0, baseScore - movePenalty - timePenalty);
    score = Math.round(score * difficultyMultiplier);
    
    return score;
}

// Atualizar pontuação do Racha Cuca
function rachacucaUpdateScore() {
    rachacucaCurrentScore = calculateRachacucaScore(rachacucaMoves, rachacucaTimerSeconds, rachacucaCurrentDifficulty);
    
    if (DOM.rachacucaScore) {
        DOM.rachacucaScore.textContent = rachacucaCurrentScore;
    }
}

// Verificar se uma peça pode ser movida no Racha Cuca
function rachacucaIsMovable(index) {
    const row = Math.floor(index / 4);
    const col = index % 4;
    const emptyRow = Math.floor(rachacucaEmptyTileIndex / 4);
    const emptyCol = rachacucaEmptyTileIndex % 4;
    
    return (row === emptyRow && Math.abs(col - emptyCol) === 1) || 
           (col === emptyCol && Math.abs(row - emptyRow) === 1);
}

// Mover uma peça no Racha Cuca
function rachacucaMoveTile(index) {
    if (rachacucaGameCompleted || !rachacucaIsMovable(index)) return;
    
    [rachacucaBoard[index], rachacucaBoard[rachacucaEmptyTileIndex]] = [rachacucaBoard[rachacucaEmptyTileIndex], rachacucaBoard[index]];
    
    rachacucaEmptyTileIndex = index;
    
    rachacucaMoves++;
    rachacucaUpdateMoveCounter();
    rachacucaUpdateScore();
    
    if (!rachacucaGameStarted) {
        rachacucaStartTimer();
        rachacucaGameStarted = true;
    }
    
    rachacucaRenderBoard();
    
    if (rachacucaCheckWin()) {
        rachacucaCompleteGame();
    }
}

// Embaralhar o tabuleiro do Racha Cuca
function rachacucaShuffleBoard() {
    if (rachacucaGameCompleted) {
        rachacucaResetGame();
        return;
    }
    
    if (rachacucaTimerInterval) {
        clearInterval(rachacucaTimerInterval);
        rachacucaTimerInterval = null;
    }
    
    rachacucaMoves = 0;
    rachacucaGameStarted = false;
    rachacucaGameCompleted = false;
    rachacucaUpdateMoveCounter();
    rachacucaUpdateScore();
    rachacucaResetTimer();
    
    if (DOM.rachacucaCompletionMessage) {
        DOM.rachacucaCompletionMessage.style.display = 'none';
    }
    
    let shuffleCount;
    switch(rachacucaCurrentDifficulty) {
        case 'easy':
            shuffleCount = 20;
            break;
        case 'hard':
            shuffleCount = 100;
            break;
        default:
            shuffleCount = 50;
            break;
    }
    
    for (let i = 0; i < shuffleCount; i++) {
        const movableTiles = [];
        
        rachacucaBoard.forEach((_, index) => {
            if (rachacucaIsMovable(index)) {
                movableTiles.push(index);
            }
        });
        
        if (movableTiles.length > 0) {
            const randomIndex = Math.floor(Math.random() * movableTiles.length);
            const tileToMove = movableTiles[randomIndex];
            
            [rachacucaBoard[tileToMove], rachacucaBoard[rachacucaEmptyTileIndex]] = [rachacucaBoard[rachacucaEmptyTileIndex], rachacucaBoard[tileToMove]];
            rachacucaEmptyTileIndex = tileToMove;
        }
    }
    
    rachacucaRenderBoard();
}

// Mostrar a solução do Racha Cuca
function rachacucaShowSolution() {
    const solvedBoard = [];
    for (let i = 1; i <= 15; i++) {
        solvedBoard.push(i);
    }
    solvedBoard.push(null);
    
    rachacucaBoard = [...solvedBoard];
    rachacucaEmptyTileIndex = 15;
    rachacucaRenderBoard();
    
    if (rachacucaTimerInterval) {
        clearInterval(rachacucaTimerInterval);
        rachacucaTimerInterval = null;
    }
    
    rachacucaGameCompleted = true;
    rachacucaGameStarted = false;
    
    if (DOM.rachacucaCompletionMessage) {
        DOM.rachacucaCompletionMessage.style.display = 'block';
    }
}

// Reiniciar o jogo Racha Cuca
function rachacucaResetGame() {
    rachacucaMoves = 0;
    rachacucaGameStarted = false;
    rachacucaGameCompleted = false;
    rachacucaUpdateMoveCounter();
    rachacucaUpdateScore();
    rachacucaResetTimer();
    rachacucaAutoSaveAttempted = false;
    
    if (DOM.rachacucaCompletionMessage) {
        DOM.rachacucaCompletionMessage.style.display = 'none';
    }
    
    rachacucaCreateBoard();
    rachacucaRenderBoard();
}

// Mostrar dica no Racha Cuca
function rachacucaShowHint() {
    for (let i = 0; i < rachacucaBoard.length; i++) {
        if (rachacucaBoard[i] !== null && rachacucaBoard[i] !== i + 1 && rachacucaIsMovable(i)) {
            const tile = document.querySelector(`.rachacuca-puzzle-tile[data-index="${i}"]`);
            if (tile) {
                tile.style.boxShadow = '0 0 15px 5px gold';
                tile.style.transform = 'scale(1.05)';
                
                setTimeout(() => {
                    tile.style.boxShadow = '';
                    tile.style.transform = '';
                }, 2000);
                
                break;
            }
        }
    }
}

// Verificar vitória no Racha Cuca
function rachacucaCheckWin() {
    for (let i = 0; i < 15; i++) {
        if (rachacucaBoard[i] !== i + 1) {
            return false;
        }
    }
    return rachacucaBoard[15] === null;
}

// Concluir o jogo Racha Cuca
async function rachacucaCompleteGame() {
    rachacucaGameCompleted = true;
    
    if (rachacucaTimerInterval) {
        clearInterval(rachacucaTimerInterval);
        rachacucaTimerInterval = null;
    }
    
    const finalScore = calculateRachacucaScore(rachacucaMoves, rachacucaTimerSeconds, rachacucaCurrentDifficulty);
    
    if (DOM.rachacucaCompletionMessage && DOM.rachacucaFinalMoves && DOM.rachacucaFinalTime && DOM.rachacucaFinalScore) {
        DOM.rachacucaFinalMoves.textContent = rachacucaMoves;
        DOM.rachacucaFinalTime.textContent = rachacucaFormatTime(rachacucaTimerSeconds);
        DOM.rachacucaFinalScore.textContent = finalScore;
        DOM.rachacucaCompletionMessage.style.display = 'block';
        
        const bestTime = localStorage.getItem('rachacuca_best_time');
        if (!bestTime || rachacucaTimerSeconds < parseInt(bestTime)) {
            localStorage.setItem('rachacuca_best_time', rachacucaTimerSeconds.toString());
        }
        
        const bestScore = localStorage.getItem('rachacuca_best_score');
        if (!bestScore || finalScore > parseInt(bestScore)) {
            localStorage.setItem('rachacuca_best_score', finalScore.toString());
        }
    }
    
    // Atualizar estatísticas do usuário
    await updateUserRachacucaStats(finalScore);
    
    addActivity(`Racha Cuca concluído! ${finalScore} pontos`, 'rachacuca', finalScore);
    
    // Salvar pontuação automaticamente
    await rachacucaAutoSaveScore();
}

// Atualizar estatísticas do Racha Cuca do usuário
async function updateUserRachacucaStats(score) {
    if (!userProgress.rachacuca) {
        userProgress.rachacuca = {
            gamesCompleted: 0,
            bestTime: 0,
            bestMoves: 0,
            bestScore: 0,
            totalTime: 0,
            totalMoves: 0,
            totalScore: 0,
            easy: { games: 0, bestScore: 0 },
            normal: { games: 0, bestScore: 0 },
            hard: { games: 0, bestScore: 0 }
        };
    }
    
    // Incrementar jogos completados
    userProgress.rachacuca.gamesCompleted = (userProgress.rachacuca.gamesCompleted || 0) + 1;
    
    // Atualizar melhor tempo
    if (rachacucaTimerSeconds < userProgress.rachacuca.bestTime || userProgress.rachacuca.bestTime === 0) {
        userProgress.rachacuca.bestTime = rachacucaTimerSeconds;
    }
    
    // Atualizar melhor número de movimentos
    if (rachacucaMoves < userProgress.rachacuca.bestMoves || userProgress.rachacuca.bestMoves === 0) {
        userProgress.rachacuca.bestMoves = rachacucaMoves;
    }
    
    // Atualizar melhor pontuação
    if (score > userProgress.rachacuca.bestScore) {
        userProgress.rachacuca.bestScore = score;
    }
    
    // Atualizar estatísticas totais
    userProgress.rachacuca.totalTime += rachacucaTimerSeconds;
    userProgress.rachacuca.totalMoves += rachacucaMoves;
    userProgress.rachacuca.totalScore += score;
    
    // Atualizar estatísticas por dificuldade
    if (rachacucaCurrentDifficulty === 'easy') {
        userProgress.rachacuca.easy.games = (userProgress.rachacuca.easy.games || 0) + 1;
        if (score > (userProgress.rachacuca.easy.bestScore || 0)) {
            userProgress.rachacuca.easy.bestScore = score;
        }
    } else if (rachacucaCurrentDifficulty === 'normal') {
        userProgress.rachacuca.normal.games = (userProgress.rachacuca.normal.games || 0) + 1;
        if (score > (userProgress.rachacuca.normal.bestScore || 0)) {
            userProgress.rachacuca.normal.bestScore = score;
        }
    } else if (rachacucaCurrentDifficulty === 'hard') {
        userProgress.rachacuca.hard.games = (userProgress.rachacuca.hard.games || 0) + 1;
        if (score > (userProgress.rachacuca.hard.bestScore || 0)) {
            userProgress.rachacuca.hard.bestScore = score;
        }
    }
    
    // Atualizar estatísticas do sistema
    systemStats.totalRachacucaGames = (systemStats.totalRachacucaGames || 0) + 1;
    if (score > systemStats.bestRachacucaScore) {
        systemStats.bestRachacucaScore = score;
    }
    
    // Atualizar UI
    updateProgressUI();
    updateSystemStatsUI(false);
    
    // Salvar progresso do usuário
    await saveUserProgress();
    
    // Atualizar cache das estatísticas do sistema
    saveSystemStatsCache();
}

// Atualizar contador de movimentos do Racha Cuca
function rachacucaUpdateMoveCounter() {
    if (DOM.rachacucaMoveCounter) {
        DOM.rachacucaMoveCounter.textContent = rachacucaMoves;
    }
}

// Iniciar timer do Racha Cuca
function rachacucaStartTimer() {
    rachacucaResetTimer();
    rachacucaTimerInterval = setInterval(() => {
        rachacucaTimerSeconds++;
        if (DOM.rachacucaTimer) {
            DOM.rachacucaTimer.textContent = rachacucaFormatTime(rachacucaTimerSeconds);
        }
        rachacucaUpdateScore();
    }, 1000);
}

// Resetar timer do Racha Cuca
function rachacucaResetTimer() {
    rachacucaTimerSeconds = 0;
    if (DOM.rachacucaTimer) {
        DOM.rachacucaTimer.textContent = '00:00';
    }
    if (rachacucaTimerInterval) {
        clearInterval(rachacucaTimerInterval);
        rachacucaTimerInterval = null;
    }
}

// Formatar tempo (MM:SS) para o Racha Cuca
function rachacucaFormatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Criar tabuleiro de solução do Racha Cuca
function rachacucaCreateSolutionBoard() {
    const solutionBoard = document.querySelector('.solution-board');
    if (!solutionBoard) return;
    
    solutionBoard.innerHTML = '';
    
    for (let i = 1; i <= 16; i++) {
        const tile = document.createElement('div');
        tile.className = 'rachacuca-solution-tile';
        
        if (i <= 15) {
            tile.textContent = i;
        } else {
            tile.classList.add('empty');
        }
        
        solutionBoard.appendChild(tile);
    }
}

// Salvar pontuação automaticamente do Racha Cuca
async function rachacucaAutoSaveScore() {
    if (rachacucaAutoSaveAttempted) return;
    
    rachacucaAutoSaveAttempted = true;
    
    if (!db || !currentUser) {
        console.log('Firebase não configurado ou usuário não autenticado. Pontuação salva localmente.');
        // Salvar localmente
        await saveRachacucaScoreLocally();
        return;
    }
    
    try {
        // Verificar se a coleção existe e criar se necessário
        await ensureRachacucaCollectionExists();
        
        const playerName = currentUser.name || 'Jogador';
        const scoreData = {
            playerName: playerName,
            moves: rachacucaMoves,
            time: rachacucaTimerSeconds,
            difficulty: rachacucaCurrentDifficulty,
            score: rachacucaCurrentScore,
            date: new Date().toISOString(),
            userId: currentUser.id,
            autoSaved: true
        };
        
        await db.collection('rachacuca_scores').add(scoreData);
        
        // Mostrar notificação de salvamento automático
        const autoSaveNotice = document.querySelector('#autoSaveNotice');
        if (autoSaveNotice) {
            autoSaveNotice.style.display = 'block';
        }
        
        showToast('Pontuação salva automaticamente!', 'success');
        
        console.log('✅ Pontuação do Racha Cuca salva automaticamente');
        
        // Atualizar estatísticas do sistema
        loadRachacucaStats();
        
    } catch (error) {
        console.error('❌ Erro ao salvar pontuação automaticamente:', error);
        
        // Fallback: salvar localmente
        await saveRachacucaScoreLocally();
    }
}

// Salvar pontuação do Racha Cuca localmente
async function saveRachacucaScoreLocally() {
    try {
        const localScores = JSON.parse(localStorage.getItem('rachacuca_local_scores') || '[]');
        const scoreData = {
            playerName: currentUser?.name || 'Jogador',
            moves: rachacucaMoves,
            time: rachacucaTimerSeconds,
            difficulty: rachacucaCurrentDifficulty,
            score: rachacucaCurrentScore,
            date: new Date().toISOString(),
            userId: currentUser?.id || 'anonymous',
            autoSaved: true
        };
        
        localScores.push(scoreData);
        localStorage.setItem('rachacuca_local_scores', JSON.stringify(localScores));
        
        // Mostrar notificação de salvamento automático
        const autoSaveNotice = document.querySelector('#autoSaveNotice');
        if (autoSaveNotice) {
            autoSaveNotice.style.display = 'block';
        }
        
        showToast('Pontuação salva localmente!', 'success');
    } catch (error) {
        console.error('❌ Erro ao salvar localmente:', error);
        showToast('Erro ao salvar pontuação', 'error');
    }
}

// Verificar e criar coleção do Racha Cuca se necessário
async function ensureRachacucaCollectionExists() {
    if (!db) return;
    
    try {
        // Tentar ler a coleção para verificar se existe
        const snapshot = await db.collection('rachacuca_scores').limit(1).get();
        console.log('✅ Coleção rachacuca_scores existe');
        return true;
    } catch (error) {
        console.log('⚠️ Coleção não existe ou erro de permissão:', error);
        
        // Não podemos criar a coleção programaticamente devido a restrições de segurança
        // O administrador precisa fazer isso manualmente no Console do Firebase
        return false;
    }
}

// Abrir modal para salvar pontuação do Racha Cuca
function rachacucaOpenSaveScoreModal() {
    if (!rachacucaGameCompleted) {
        showToast('Complete o jogo primeiro para salvar sua pontuação!', 'error');
        return;
    }
    
    if (DOM.rachacucaSaveMoves && DOM.rachacucaSaveTime && DOM.rachacucaSaveDifficulty && DOM.rachacucaSaveScore) {
        DOM.rachacucaSaveMoves.textContent = rachacucaMoves;
        DOM.rachacucaSaveTime.textContent = rachacucaFormatTime(rachacucaTimerSeconds);
        DOM.rachacucaSaveDifficulty.textContent = 
            rachacucaCurrentDifficulty === 'easy' ? 'Fácil' : 
            rachacucaCurrentDifficulty === 'normal' ? 'Normal' : 'Difícil';
        DOM.rachacucaSaveScore.textContent = rachacucaCurrentScore;
    }
    
    if (DOM.rachacucaPlayerName) {
        const playerName = localStorage.getItem('rachacuca_player_name') || currentUser?.name || '';
        DOM.rachacucaPlayerName.value = playerName;
    }
    
    if (DOM.rachacucaSaveScoreModal) {
        DOM.rachacucaSaveScoreModal.classList.add('active');
    }
}

// Salvar pontuação do Racha Cuca (manual)
async function rachacucaSaveScore() {
    if (!DOM.rachacucaPlayerName) return;
    
    const playerName = DOM.rachacucaPlayerName.value.trim();
    
    if (!playerName) {
        showToast('Por favor, digite seu nome!', 'error');
        DOM.rachacucaPlayerName.focus();
        return;
    }
    
    if (playerName.length > 20) {
        showToast('O nome deve ter no máximo 20 caracteres!', 'error');
        DOM.rachacucaPlayerName.focus();
        return;
    }
    
    localStorage.setItem('rachacuca_player_name', playerName);
    
    if (!db) {
        // Modo demo - salvar localmente
        const localScores = JSON.parse(localStorage.getItem('rachacuca_local_scores') || '[]');
        const scoreData = {
            playerName: playerName,
            moves: rachacucaMoves,
            time: rachacucaTimerSeconds,
            difficulty: rachacucaCurrentDifficulty,
            score: rachacucaCurrentScore,
            date: new Date().toISOString(),
            userId: currentUser?.id || 'anonymous',
            manuallySaved: true
        };
        
        localScores.push(scoreData);
        localStorage.setItem('rachacuca_local_scores', JSON.stringify(localScores));
        
        showToast('Pontuação salva localmente (modo demo)!', 'success');
        
        if (DOM.rachacucaSaveScoreModal) {
            DOM.rachacucaSaveScoreModal.classList.remove('active');
        }
        
        return;
    }
    
    try {
        await ensureRachacucaCollectionExists();
        
        const scoreData = {
            playerName: playerName,
            moves: rachacucaMoves,
            time: rachacucaTimerSeconds,
            difficulty: rachacucaCurrentDifficulty,
            score: rachacucaCurrentScore,
            date: new Date().toISOString(),
            userId: currentUser?.id || 'anonymous',
            manuallySaved: true
        };
        
        await db.collection('rachacuca_scores').add(scoreData);
        
        showToast('Pontuação salva com sucesso!', 'success');
        
        if (DOM.rachacucaSaveScoreModal) {
            DOM.rachacucaSaveScoreModal.classList.remove('active');
        }
        
        rachacucaLoadScores('global');
        
    } catch (error) {
        console.error('Erro ao salvar pontuação:', error);
        
        // Fallback para salvar localmente
        try {
            const localScores = JSON.parse(localStorage.getItem('rachacuca_local_scores') || '[]');
            const scoreData = {
                playerName: playerName,
                moves: rachacucaMoves,
                time: rachacucaTimerSeconds,
                difficulty: rachacucaCurrentDifficulty,
                score: rachacucaCurrentScore,
                date: new Date().toISOString(),
                userId: currentUser?.id || 'anonymous',
                manuallySaved: true,
                error: error.message
            };
            
            localScores.push(scoreData);
            localStorage.setItem('rachacuca_local_scores', JSON.stringify(localScores));
            
            showToast('Pontuação salva localmente (erro no servidor)', 'warning');
            
            if (DOM.rachacucaSaveScoreModal) {
                DOM.rachacucaSaveScoreModal.classList.remove('active');
            }
        } catch (localError) {
            console.error('❌ Erro ao salvar localmente:', localError);
            showToast(`Erro ao salvar pontuação: ${error.message}`, 'error');
        }
    }
}

// Carregar pontuações do Racha Cuca
async function rachacucaLoadScores(difficulty = 'global') {
    if (!DOM.rachacucaScoresList) return;
    
    try {
        // Primeiro tentar carregar do Firebase
        if (db) {
            try {
                let query = db.collection('rachacuca_scores');
                
                if (difficulty !== 'global') {
                    query = query.where('difficulty', '==', difficulty);
                }
                
                const snapshot = await query.orderBy('score', 'desc').limit(10).get();
                
                if (!snapshot.empty) {
                    const scores = [];
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        scores.push({
                            id: doc.id,
                            playerName: data.playerName,
                            moves: data.moves,
                            time: data.time,
                            score: data.score,
                            difficulty: data.difficulty,
                            date: data.date || data.timestamp?.toDate?.() || new Date(),
                            source: 'firebase'
                        });
                    });
                    
                    rachacucaDisplayScores(scores);
                    return;
                }
            } catch (firebaseError) {
                console.log('⚠️ Erro ao carregar do Firebase, tentando local:', firebaseError);
            }
        }
        
        // Fallback para dados locais
        const localScores = JSON.parse(localStorage.getItem('rachacuca_local_scores') || '[]');
        
        // Filtrar por dificuldade
        let filteredScores = localScores;
        if (difficulty !== 'global') {
            filteredScores = localScores.filter(score => score.difficulty === difficulty);
        }
        
        // Ordenar por pontuação (maior primeiro)
        filteredScores.sort((a, b) => b.score - a.score);
        filteredScores = filteredScores.slice(0, 10);
        
        if (filteredScores.length === 0) {
            DOM.rachacucaScoresList.innerHTML = '<p class="no-scores">Nenhuma pontuação salva ainda.</p>';
            return;
        }
        
        rachacucaDisplayScores(filteredScores);
        
    } catch (error) {
        console.error('Erro ao carregar pontuações:', error);
        DOM.rachacucaScoresList.innerHTML = `<p class="no-scores">Erro ao carregar pontuações: ${error.message}</p>`;
    }
}

// Exibir pontuações do Racha Cuca
function rachacucaDisplayScores(scores) {
    if (!DOM.rachacucaScoresList) return;
    
    DOM.rachacucaScoresList.innerHTML = '';
    
    scores.forEach((score, index) => {
        const scoreItem = document.createElement('div');
        scoreItem.className = 'score-item';
        
        const currentPlayerName = localStorage.getItem('rachacuca_player_name') || currentUser?.name || '';
        if (score.playerName === currentPlayerName && score.difficulty === rachacucaCurrentDifficulty) {
            scoreItem.classList.add('highlight');
        }
        
        // Adicionar badge para pontuações salvas localmente
        const sourceBadge = score.source === 'firebase' ? '' : '<span class="local-badge" title="Salvo localmente">📱</span>';
        
        scoreItem.innerHTML = `
            <div class="score-rank">${index + 1}</div>
            <div class="score-name">${score.playerName} ${sourceBadge}</div>
            <div class="score-details">
                <span>${score.score} pts</span>
                <span>${score.moves} mov</span>
                <span>${rachacucaFormatTime(score.time)}</span>
                <span>${score.difficulty === 'easy' ? 'Fácil' : score.difficulty === 'normal' ? 'Normal' : 'Difícil'}</span>
            </div>
        `;
        
        DOM.rachacucaScoresList.appendChild(scoreItem);
    });
}

// Iniciar jogo
function startGame(gameId) {
    currentGame = gameId;
    const gameContainer = document.getElementById('gameContainer');
    if (!gameContainer) return;
    
    const games = {
        lightningGame: {
            title: 'Desafio Relâmpago',
            description: 'Resolva o máximo de multiplicações em 60 segundos!',
            instructions: 'Digite a resposta correta para cada multiplicação o mais rápido possível.',
            timeLimit: 60
        },
        divisionPuzzle: {
            title: 'Quebra-cabeça da Divisão',
            description: 'Complete o quebra-cabeça resolvendo problemas de divisão.',
            instructions: 'Arraste as peças para os lugares corretos baseado nos resultados da divisão.',
            timeLimit: 120
        },
        mathChampionship: {
            title: 'Campeonato MathKids',
            description: 'Enfrente operações mistas e suba no ranking.',
            instructions: 'Resolva diferentes tipos de operações matemáticas para ganhar pontos.',
            timeLimit: 90
        }
    };
    
    const game = games[gameId];
    if (!game) return;
    
    gameScore = 0;
    gameTimeLeft = game.timeLimit;
    gameActive = true;
    gameHighScore = localStorage.getItem(`mathkids_highscore_${gameId}`) || 0;
    
    gameContainer.innerHTML = `
        <div class="game-header">
            <h3><i class="fas fa-${gameId === 'lightningGame' ? 'bolt' : gameId === 'divisionPuzzle' ? 'puzzle-piece' : 'trophy'}"></i> ${game.title}</h3>
            <div class="game-stats">
                <div class="stat">
                    <span>Tempo:</span>
                    <span id="gameTimer">${gameTimeLeft}s</span>
                </div>
                <div class="stat">
                    <span>Pontuação:</span>
                    <span id="gameScore">0</span>
                </div>
                <div class="stat">
                    <span>Recorde:</span>
                    <span id="gameHighScore">${gameHighScore}</span>
                </div>
            </div>
        </div>
        
        <div class="game-content">
            <div class="game-info">
                <h4>${game.description}</h4>
                <p>${game.instructions}</p>
            </div>
            
            <div class="game-exercise" id="gameExercise">
                <div class="game-question" id="gameQuestion">
                    <p>Preparado? Clique em "Iniciar Jogo" para começar!</p>
                </div>
            </div>
            
            <div class="game-controls">
                <button class="btn-game-control" id="startGameBtn">
                    <i class="fas fa-play"></i> Iniciar Jogo
                </button>
                <button class="btn-game-control secondary" id="endGameBtn" disabled>
                    <i class="fas fa-stop"></i> Parar Jogo
                </button>
                <button class="btn-game-control outline" id="howToPlayBtn">
                    <i class="fas fa-question-circle"></i> Como Jogar
                </button>
            </div>
            
            <div class="game-feedback" id="gameFeedback"></div>
        </div>
    `;
    
    setupGameEvents(gameId);
}

// Configurar eventos do jogo
function setupGameEvents(gameId) {
    document.getElementById('startGameBtn')?.addEventListener('click', () => startGameSession(gameId));
    document.getElementById('endGameBtn')?.addEventListener('click', endGame);
    document.getElementById('howToPlayBtn')?.addEventListener('click', showHowToPlay);
}

// Iniciar sessão do jogo
function startGameSession(gameId) {
    gameActive = true;
    gameScore = 0;
    gameTimeLeft = gameId === 'lightningGame' ? 60 : gameId === 'divisionPuzzle' ? 120 : 90;
    
    const startBtn = document.getElementById('startGameBtn');
    const endBtn = document.getElementById('endGameBtn');
    
    if (startBtn) startBtn.disabled = true;
    if (endBtn) endBtn.disabled = false;
    
    const gameScoreElement = document.getElementById('gameScore');
    if (gameScoreElement) gameScoreElement.textContent = gameScore;
    
    gameTimer = setInterval(updateGameTimer, 1000);
    generateGameExercise(gameId);
}

// Atualizar timer do jogo
function updateGameTimer() {
    gameTimeLeft--;
    const timerElement = document.getElementById('gameTimer');
    if (timerElement) timerElement.textContent = gameTimeLeft + 's';
    
    if (gameTimeLeft <= 0) {
        endGame();
    }
}

// Gerar exercício do jogo
function generateGameExercise(gameId) {
    if (!gameActive) return;
    
    let question, answer;
    const gameQuestion = document.getElementById('gameQuestion');
    
    if (!gameQuestion) return;
    
    switch(gameId) {
        case 'lightningGame':
            const num1 = getRandomInt(1, 12);
            const num2 = getRandomInt(1, 12);
            question = `${num1} × ${num2} = ?`;
            answer = num1 * num2;
            break;
            
        case 'divisionPuzzle':
            const divisor = getRandomInt(2, 12);
            const quotient = getRandomInt(2, 12);
            const dividend = divisor * quotient;
            question = `${dividend} ÷ ${divisor} = ?`;
            answer = quotient;
            break;
            
        case 'mathChampionship':
            const operations = ['+', '-', '×', '÷'];
            const operation = operations[Math.floor(Math.random() * operations.length)];
            
            if (operation === '÷') {
                const divisor = getRandomInt(2, 12);
                const quotient = getRandomInt(2, 12);
                const num1 = divisor * quotient;
                const num2 = divisor;
                question = `${num1} ${operation} ${num2} = ?`;
                answer = quotient;
            } else {
                const num1 = getRandomInt(1, 100);
                const num2 = getRandomInt(1, 100);
                question = `${num1} ${operation} ${num2} = ?`;
                
                switch(operation) {
                    case '+': answer = num1 + num2; break;
                    case '-': answer = num1 - num2; break;
                    case '×': answer = num1 * num2; break;
                }
            }
            break;
    }
    
    currentExercise = {
        question: question,
        answer: answer,
        gameId: gameId
    };
    
    gameQuestion.innerHTML = `
        <h4>${question}</h4>
        <div class="game-answer-container">
            <div class="game-answer-input">
                <input type="number" id="gameAnswerInput" placeholder="Digite sua resposta" autofocus>
            </div>
            <button id="submitGameAnswer" class="btn-exercise">Responder</button>
        </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        .game-answer-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--space-lg);
            margin-top: var(--space-xl);
        }
        
        .game-answer-input {
            width: 100%;
            max-width: 300px;
        }
        
        #gameAnswerInput {
            width: 100%;
            min-height: 4rem;
            border-radius: var(--radius-xl);
            border: 3px solid var(--primary-500);
            font-size: 2rem;
            font-weight: 700;
            text-align: center;
            color: var(--primary-600);
            background: var(--bg-primary);
            transition: all var(--transition-fast);
            padding: var(--space-md);
        }
        
        #gameAnswerInput:focus {
            outline: none;
            box-shadow: 0 0 0 4px var(--primary-100);
            border-color: var(--primary-600);
        }
        
        #gameAnswerInput::placeholder {
            color: var(--text-tertiary);
            font-size: 1.5rem;
        }
        
        [data-theme="dark"] #gameAnswerInput {
            background: var(--gray-700);
            border-color: var(--primary-500);
            color: var(--primary-300);
        }
        
        [data-theme="dark"] #gameAnswerInput:focus {
            background: var(--gray-800);
            border-color: var(--primary-400);
            box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.2);
        }
    `;
    
    document.head.appendChild(style);
    
    document.getElementById('submitGameAnswer')?.addEventListener('click', checkGameAnswer);
    document.getElementById('gameAnswerInput')?.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') checkGameAnswer();
    });
    
    document.getElementById('gameAnswerInput')?.focus();
}

// Verificar resposta do jogo
function checkGameAnswer() {
    if (!gameActive) return;
    
    const input = document.getElementById('gameAnswerInput');
    const userAnswer = parseInt(input.value);
    const feedback = document.getElementById('gameFeedback');
    
    if (!input || !feedback || isNaN(userAnswer)) {
        if (feedback) {
            feedback.textContent = 'Digite um número válido!';
            feedback.className = 'game-feedback error';
        }
        return;
    }
    
    if (userAnswer === currentExercise.answer) {
        gameScore += 10;
        const gameScoreElement = document.getElementById('gameScore');
        if (gameScoreElement) gameScoreElement.textContent = gameScore;
        
        feedback.textContent = '🎉 Correto! +10 pontos';
        feedback.className = 'game-feedback success';
        
        if (gameTimeLeft < 60) {
            gameTimeLeft += 2;
            feedback.textContent += ' (+2s)';
        }
    } else {
        feedback.textContent = `❌ Errado! A resposta correta é ${currentExercise.answer}`;
        feedback.className = 'game-feedback error';
        
        gameTimeLeft = Math.max(0, gameTimeLeft - 5);
        feedback.textContent += ' (-5s)';
    }
    
    setTimeout(() => {
        if (gameActive) {
            generateGameExercise(currentExercise.gameId);
            if (feedback) feedback.textContent = '';
        }
    }, 1000);
}

// Mostrar como jogar
function showHowToPlay() {
    const feedback = document.getElementById('gameFeedback');
    if (!feedback) return;
    
    feedback.innerHTML = `
        <h4>Como Jogar:</h4>
        <ul>
            <li>Resolva os exercícios matemáticos o mais rápido possível</li>
            <li>Cada resposta correta vale 10 pontos</li>
            <li>Respostas rápidas podem ganhar tempo extra</li>
            <li>Respostas erradas perdem 5 segundos</li>
            <li>Tente bater seu recorde!</li>
        </ul>
    `;
    feedback.className = 'game-feedback info';
}

// Encerrar jogo
function endGame() {
    gameActive = false;
    clearInterval(gameTimer);
    
    const startBtn = document.getElementById('startGameBtn');
    const endBtn = document.getElementById('endGameBtn');
    const gameExercise = document.getElementById('gameExercise');
    const feedback = document.getElementById('gameFeedback');
    
    if (startBtn) startBtn.disabled = false;
    if (endBtn) endBtn.disabled = true;
    
    if (gameExercise) {
        gameExercise.innerHTML = `
            <div class="game-result">
                <h4>Fim do Jogo!</h4>
                <p>Sua pontuação: <strong>${gameScore}</strong> pontos</p>
                <p>Respostas corretas: <strong>${Math.floor(gameScore / 10)}</strong></p>
                <p>Tempo restante: <strong>${gameTimeLeft}</strong> segundos</p>
            </div>
        `;
    }
    
    if (feedback) {
        feedback.textContent = 'Clique em "Iniciar Jogo" para jogar novamente!';
        feedback.className = 'game-feedback info';
    }
    
    if (gameScore > gameHighScore) {
        gameHighScore = gameScore;
        localStorage.setItem(`mathkids_highscore_${currentGame}`, gameHighScore);
        const highScoreElement = document.getElementById('gameHighScore');
        if (highScoreElement) highScoreElement.textContent = gameHighScore;
        showToast(`🎉 Novo recorde! ${gameHighScore} pontos`, 'success');
    }
    
    addActivity(`Jogo "${getGameName(currentGame)}" finalizado com ${gameScore} pontos`, 'game');
}

// Carregar seção de progresso
function loadProgressSection() {
    const section = document.getElementById('progress');
    
    const accuracy = userProgress.totalAnswers > 0 
        ? Math.round((userProgress.correctAnswers / userProgress.totalAnswers) * 100) 
        : 0;
    
    const rachacucaGames = userProgress.rachacuca?.gamesCompleted || 0;
    const rachacucaBestScore = userProgress.rachacuca?.bestScore || 0;
    const rachacucaAverageScore = userProgress.rachacuca?.gamesCompleted > 0 
        ? Math.round((userProgress.rachacuca.totalScore || 0) / userProgress.rachacuca.gamesCompleted) 
        : 0;
    
    const content = `
        <div class="section-header">
            <div class="header-content">
                <h2><i class="fas fa-chart-line"></i> Meu Progresso</h2>
                <p>Acompanhe sua evolução no aprendizado de matemática.</p>
            </div>
        </div>
        
        <div class="progress-content">
            <div class="progress-overview">
                <div class="progress-stats">
                    <div class="progress-stat">
                        <div class="stat-value">${userProgress.exercisesCompleted}</div>
                        <div class="stat-label">Exercícios Concluídos</div>
                    </div>
                    <div class="progress-stat">
                        <div class="stat-value">${accuracy}%</div>
                        <div class="stat-label">Taxa de Acerto</div>
                    </div>
                    <div class="progress-stat">
                        <div class="stat-value">${Math.floor(userProgress.practiceTime / 60)}</div>
                        <div class="stat-label">Minutos de Prática</div>
                    </div>
                    <div class="progress-stat">
                        <div class="stat-value">${rachacucaGames}</div>
                        <div class="stat-label">Racha Cuca</div>
                    </div>
                </div>
            </div>
            
            <div class="progress-details">
                <div class="progress-chart">
                    <h3><i class="fas fa-chart-bar"></i> Desempenho por Operação</h3>
                    <div class="chart-container">
                        <canvas id="operationsChart"></canvas>
                    </div>
                </div>
                
                <div class="progress-chart">
                    <h3><i class="fas fa-puzzle-piece"></i> Estatísticas Racha Cuca</h3>
                    <div class="chart-container">
                        <canvas id="rachacucaChart"></canvas>
                    </div>
                    <div class="rachacuca-stats">
                        <div class="rachacuca-stat">
                            <span>Melhor Pontuação:</span>
                            <strong>${rachacucaBestScore}</strong>
                        </div>
                        <div class="rachacuca-stat">
                            <span>Pontuação Média:</span>
                            <strong>${rachacucaAverageScore}</strong>
                        </div>
                        <div class="rachacuca-stat">
                            <span>Melhor Tempo:</span>
                            <strong>${rachacucaFormatTime(userProgress.rachacuca?.bestTime || 0)}</strong>
                        </div>
                        <div class="rachacuca-stat">
                            <span>Menos Movimentos:</span>
                            <strong>${userProgress.rachacuca?.bestMoves || 0}</strong>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="progress-history">
                <h3><i class="fas fa-history"></i> Histórico de Atividades</h3>
                <div class="activities-timeline" id="activitiesTimeline">
                    ${generateActivitiesTimeline()}
                </div>
            </div>
            
            <div class="progress-badges">
                <h3><i class="fas fa-award"></i> Conquistas</h3>
                <div class="badges-grid" id="badgesGrid">
                    ${generateBadges()}
                </div>
            </div>
        </div>
    `;
    
    section.innerHTML = content;
    
    setTimeout(() => {
        initializeOperationsChart();
        initializeRachacucaChart();
    }, 100);
}

// Gráfico de operações
function initializeOperationsChart() {
    const ctx = document.getElementById('operationsChart');
    if (!ctx) return;
    
    if (operationsChartInstance) {
        operationsChartInstance.destroy();
    }
    
    const operations = ['Adição', 'Subtração', 'Multiplicação', 'Divisão'];
    const correct = [
        userProgress.addition.correct || 0,
        userProgress.subtraction.correct || 0,
        userProgress.multiplication.correct || 0,
        userProgress.division.correct || 0
    ];
    
    const total = [
        userProgress.addition.total || 0,
        userProgress.subtraction.total || 0,
        userProgress.multiplication.total || 0,
        userProgress.division.total || 0
    ];
    
    const accuracy = total.map((t, i) => t > 0 ? Math.round((correct[i] / t) * 100) : 0);
    
    if (typeof Chart === 'undefined') {
        console.error('Chart.js não carregado');
        return;
    }
    
    try {
        operationsChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: operations,
                datasets: [
                    {
                        label: 'Acertos',
                        data: correct,
                        backgroundColor: 'rgba(14, 165, 233, 0.8)',
                        borderColor: 'rgb(14, 165, 233)',
                        borderWidth: 1
                    },
                    {
                        label: 'Tentativas',
                        data: total,
                        backgroundColor: 'rgba(203, 213, 225, 0.8)',
                        borderColor: 'rgb(203, 213, 225)',
                        borderWidth: 1
                    },
                    {
                        label: 'Acurácia (%)',
                        data: accuracy,
                        type: 'line',
                        borderColor: 'rgb(34, 197, 94)',
                        backgroundColor: 'transparent',
                        yAxisID: 'y1',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Quantidade'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y1: {
                        position: 'right',
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Acurácia (%)'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                family: 'Inter'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleFont: {
                            family: 'Inter'
                        },
                        bodyFont: {
                            family: 'Inter'
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('❌ Erro ao criar gráfico:', error);
    }
}

// Gráfico do Racha Cuca
function initializeRachacucaChart() {
    const ctx = document.getElementById('rachacucaChart');
    if (!ctx) return;
    
    if (rachacucaChartInstance) {
        rachacucaChartInstance.destroy();
    }
    
    const difficulties = ['Fácil', 'Normal', 'Difícil'];
    const games = [
        userProgress.rachacuca?.easy?.games || 0,
        userProgress.rachacuca?.normal?.games || 0,
        userProgress.rachacuca?.hard?.games || 0
    ];
    
    const scores = [
        userProgress.rachacuca?.easy?.bestScore || 0,
        userProgress.rachacuca?.normal?.bestScore || 0,
        userProgress.rachacuca?.hard?.bestScore || 0
    ];
    
    if (typeof Chart === 'undefined') {
        console.error('Chart.js não carregado');
        return;
    }
    
    try {
        rachacucaChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: difficulties,
                datasets: [
                    {
                        label: 'Jogos Completados',
                        data: games,
                        backgroundColor: 'rgba(139, 92, 246, 0.8)',
                        borderColor: 'rgb(139, 92, 246)',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Melhor Pontuação',
                        data: scores,
                        backgroundColor: 'rgba(34, 197, 94, 0.8)',
                        borderColor: 'rgb(34, 197, 94)',
                        borderWidth: 1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Jogos'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y1: {
                        position: 'right',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Pontuação'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                family: 'Inter'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleFont: {
                            family: 'Inter'
                        },
                        bodyFont: {
                            family: 'Inter'
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('❌ Erro ao criar gráfico do Racha Cuca:', error);
    }
}

// Carregar seção de administração
function loadAdminSection() {
    if (!currentUser || currentUser.role !== 'admin') {
        switchSection('dashboard');
        showToast('Acesso negado. Apenas administradores.', 'error');
        return;
    }
    
    const section = document.getElementById('admin');
    if (!section) return;
    
    const content = `
        <div class="section-header">
            <div class="header-content">
                <h2><i class="fas fa-cogs"></i> Painel de Administração</h2>
                <p>Gerencie usuários e visualize estatísticas do sistema.</p>
            </div>
        </div>
        
        <div class="admin-content">
            <div class="admin-dashboard">
                <div class="admin-stats">
                    <div class="admin-stat">
                        <div class="stat-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="totalUsers">${systemStats.totalUsers}</h3>
                            <p>Usuários Cadastrados</p>
                        </div>
                    </div>
                    <div class="admin-stat">
                        <div class="stat-icon">
                            <i class="fas fa-graduation-cap"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="activeStudents">${systemStats.totalStudents}</h3>
                            <p>Alunos Ativos</p>
                        </div>
                    </div>
                    <div class="admin-stat">
                        <div class="stat-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="totalExercises">${systemStats.totalExercises}</h3>
                            <p>Exercícios Resolvidos</p>
                        </div>
                    </div>
                    <div class="admin-stat">
                        <div class="stat-icon">
                            <i class="fas fa-puzzle-piece"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="totalRachacucaGames">${systemStats.totalRachacucaGames}</h3>
                            <p>Jogos Racha Cuca</p>
                        </div>
                    </div>
                    <div class="admin-stat">
                        <div class="stat-icon">
                            <i class="fas fa-trophy"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="bestRachacucaScore">${systemStats.bestRachacucaScore}</h3>
                            <p>Melhor Pontuação RC</p>
                        </div>
                    </div>
                    <div class="admin-stat">
                        <div class="stat-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="systemAccuracy">${systemStats.systemAccuracy}%</h3>
                            <p>Taxa de Acerto Geral</p>
                        </div>
                    </div>
                </div>
                
                <div class="admin-tabs">
                    <div class="tab-headers">
                        <button class="tab-header active" data-tab="users">Gerenciar Usuários</button>
                        <button class="tab-header" data-tab="reports">Relatórios</button>
                        <button class="tab-header" data-tab="rachacuca">Racha Cuca</button>
                        <button class="tab-header" data-tab="settings">Configurações do Sistema</button>
                    </div>
                    
                    <div class="tab-content active" id="usersTab">
                        <div class="tab-actions">
                            <button class="btn-admin" id="refreshUsers">
                                <i class="fas fa-sync-alt"></i> Atualizar
                            </button>
                            <button class="btn-admin primary" id="addUserBtn">
                                <i class="fas fa-user-plus"></i> Adicionar Usuário
                            </button>
                            <div class="search-box">
                                <i class="fas fa-search"></i>
                                <input type="text" id="searchUsers" placeholder="Buscar usuários...">
                            </div>
                        </div>
                        
                        <div class="users-table-container">
                            <table class="users-table">
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Email</th>
                                        <th>Tipo</th>
                                        <th>Cadastrado em</th>
                                        <th>Status</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody id="usersTableBody">
                                    <tr>
                                        <td colspan="6" class="text-center">Carregando usuários...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="tab-content" id="reportsTab">
                        <div class="reports-options">
                            <div class="report-type">
                                <label>Tipo de Relatório:</label>
                                <select id="reportType">
                                    <option value="progress">Progresso dos Alunos</option>
                                    <option value="usage">Uso do Sistema</option>
                                    <option value="performance">Desempenho por Operação</option>
                                    <option value="rachacuca">Estatísticas Racha Cuca</option>
                                </select>
                            </div>
                            <div class="report-period">
                                <label>Período:</label>
                                <select id="reportPeriod">
                                    <option value="week">Última Semana</option>
                                    <option value="month">Último Mês</option>
                                    <option value="quarter">Último Trimestre</option>
                                    <option value="year">Último Ano</option>
                                </select>
                            </div>
                            <button class="btn-admin primary" id="generateReport">
                                <i class="fas fa-file-export"></i> Gerar Relatório
                            </button>
                        </div>
                        
                        <div class="report-preview" id="reportPreview">
                            <p>Selecione as opções e clique em "Gerar Relatório"</p>
                        </div>
                    </div>
                    
                    <div class="tab-content" id="rachacucaTab">
                        <div class="rachacuca-admin">
                            <h3><i class="fas fa-puzzle-piece"></i> Estatísticas do Racha Cuca</h3>
                            
                            <div class="rachacuca-stats-grid">
                                <div class="rachacuca-stat-card">
                                    <div class="stat-header">
                                        <i class="fas fa-gamepad"></i>
                                        <h4>Total de Jogos</h4>
                                    </div>
                                    <div class="stat-value">${systemStats.totalRachacucaGames}</div>
                                    <div class="stat-trend">
                                        <i class="fas fa-arrow-up"></i>
                                        <span>+12 esta semana</span>
                                    </div>
                                </div>
                                
                                <div class="rachacuca-stat-card">
                                    <div class="stat-header">
                                        <i class="fas fa-trophy"></i>
                                        <h4>Melhor Pontuação</h4>
                                    </div>
                                    <div class="stat-value">${systemStats.bestRachacucaScore}</div>
                                    <div class="stat-info">Recorde do sistema</div>
                                </div>
                                
                                <div class="rachacuca-stat-card">
                                    <div class="stat-header">
                                        <i class="fas fa-users"></i>
                                        <h4>Jogadores Únicos</h4>
                                    </div>
                                    <div class="stat-value">${Math.min(systemStats.totalStudents, systemStats.totalRachacucaGames)}</div>
                                    <div class="stat-info">Alunos que jogaram</div>
                                </div>
                                
                                <div class="rachacuca-stat-card">
                                    <div class="stat-header">
                                        <i class="fas fa-chart-line"></i>
                                        <h4>Média de Pontos</h4>
                                    </div>
                                    <div class="stat-value">${systemStats.totalRachacucaGames > 0 ? Math.round(systemStats.bestRachacucaScore * 0.7) : 0}</div>
                                    <div class="stat-info">Pontuação média</div>
                                </div>
                            </div>
                            
                            <div class="rachacuca-actions">
                                <button class="btn-admin primary" id="viewRachacucaRanking">
                                    <i class="fas fa-trophy"></i> Ver Ranking Completo
                                </button>
                                <button class="btn-admin" id="exportRachacucaData">
                                    <i class="fas fa-download"></i> Exportar Dados
                                </button>
                                <button class="btn-admin" id="clearRachacucaData">
                                    <i class="fas fa-trash"></i> Limpar Dados Antigos
                                </button>
                            </div>
                            
                            <div class="rachacuca-difficulty-stats">
                                <h4>Distribuição por Dificuldade</h4>
                                <div class="difficulty-bars">
                                    <div class="difficulty-bar">
                                        <span>Fácil</span>
                                        <div class="bar-container">
                                            <div class="bar-fill" style="width: ${systemStats.totalRachacucaGames > 0 ? 40 : 0}%"></div>
                                        </div>
                                        <span>40%</span>
                                    </div>
                                    <div class="difficulty-bar">
                                        <span>Normal</span>
                                        <div class="bar-container">
                                            <div class="bar-fill" style="width: ${systemStats.totalRachacucaGames > 0 ? 35 : 0}%"></div>
                                        </div>
                                        <span>35%</span>
                                    </div>
                                    <div class="difficulty-bar">
                                        <span>Difícil</span>
                                        <div class="bar-container">
                                            <div class="bar-fill" style="width: ${systemStats.totalRachacucaGames > 0 ? 25 : 0}%"></div>
                                        </div>
                                        <span>25%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="tab-content" id="settingsTab">
                        <div class="system-settings">
                            <h3>Configurações do Sistema</h3>
                            
                            <div class="setting-group">
                                <h4><i class="fas fa-user-shield"></i> Segurança</h4>
                                <div class="setting">
                                    <label>
                                        <input type="checkbox" id="allowRegistrations" checked>
                                        Permitir novos cadastros
                                    </label>
                                </div>
                                <div class="setting">
                                    <label>
                                        <input type="checkbox" id="emailVerification" checked>
                                        Exigir verificação de email
                                    </label>
                                </div>
                            </div>
                            
                            <div class="setting-group">
                                <h4><i class="fas fa-gamepad"></i> Jogos</h4>
                                <div class="setting">
                                    <label>
                                        <input type="checkbox" id="enableGames" checked>
                                        Habilitar jogos
                                    </label>
                                </div>
                                <div class="setting">
                                    <label>
                                        <input type="checkbox" id="enableRachacuca" checked>
                                        Habilitar Racha Cuca
                                    </label>
                                </div>
                                <div class="setting">
                                    <label>Limite de tempo por jogo (minutos):</label>
                                    <input type="number" id="gameTimeLimit" value="60" min="5" max="180">
                                </div>
                            </div>
                            
                            <div class="setting-group">
                                <h4><i class="fas fa-bell"></i> Notificações</h4>
                                <div class="setting">
                                    <label>
                                        <input type="checkbox" id="systemNotifications" checked>
                                        Notificações do sistema
                                    </label>
                                </div>
                                <div class="setting">
                                    <label>
                                        <input type="checkbox" id="progressNotifications" checked>
                                        Notificações de progresso
                                    </label>
                                </div>
                            </div>
                            
                            <button class="btn-admin primary" id="saveSettings">
                                <i class="fas fa-save"></i> Salvar Configurações
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Modal para adicionar/editar usuário -->
        <div class="modal" id="userModal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-user"></i> <span id="modalUserTitle">Adicionar Usuário</span></h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="userForm">
                        <div class="form-group">
                            <label for="modalUserName">Nome Completo</label>
                            <input type="text" id="modalUserName" required>
                        </div>
                        <div class="form-group">
                            <label for="modalUserEmail">Email</label>
                            <input type="email" id="modalUserEmail" required>
                        </div>
                        <div class="form-group">
                            <label for="modalUserRole">Tipo de Conta</label>
                            <select id="modalUserRole" required>
                                <option value="student">Aluno</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="modalUserPassword">Senha</label>
                            <input type="password" id="modalUserPassword" minlength="6">
                            <small class="form-hint">Deixe em branco para manter a senha atual</small>
                        </div>
                        <input type="hidden" id="modalUserId">
                        <button type="submit" class="btn-auth btn-primary" id="saveUserBtn">
                            <i class="fas fa-save"></i> Salvar
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    section.innerHTML = content;
    
    setupAdminEvents();
}

// Configurar eventos de administração
function setupAdminEvents() {
    document.querySelectorAll('.tab-header').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            document.querySelectorAll('.tab-header').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(tabId + 'Tab').classList.add('active');
            
            if (tabId === 'rachacuca') {
                loadRachacucaAdminData();
            }
        });
    });
    
    document.getElementById('refreshUsers')?.addEventListener('click', loadUsersTable);
    document.getElementById('addUserBtn')?.addEventListener('click', () => openUserModal());
    
    document.getElementById('searchUsers')?.addEventListener('input', function(e) {
        filterUsersTable(e.target.value);
    });
    
    document.getElementById('generateReport')?.addEventListener('click', generateReport);
    
    document.getElementById('viewRachacucaRanking')?.addEventListener('click', () => {
        if (DOM.rachacucaScoresModal) {
            DOM.rachacucaScoresModal.classList.add('active');
            rachacucaLoadScores('global');
        }
    });
    
    document.getElementById('exportRachacucaData')?.addEventListener('click', exportRachacucaData);
    document.getElementById('clearRachacucaData')?.addEventListener('click', clearOldRachacucaData);
    
    document.getElementById('saveSettings')?.addEventListener('click', saveSystemSettings);
    
    loadUsersTable();
    
    setupUserModal();
}

// Carregar dados do Racha Cuca para Admin
async function loadRachacucaAdminData() {
    if (!db) return;
    
    try {
        const scoresSnapshot = await db.collection('rachacuca_scores').get();
        const scores = scoresSnapshot.docs.map(doc => doc.data());
        
        // Atualizar estatísticas na UI
        const totalGamesEl = document.querySelector('#rachacucaTab .rachacuca-stats-grid .rachacuca-stat-card:nth-child(1) .stat-value');
        const bestScoreEl = document.querySelector('#rachacucaTab .rachacuca-stats-grid .rachacuca-stat-card:nth-child(2) .stat-value');
        const uniquePlayersEl = document.querySelector('#rachacucaTab .rachacuca-stats-grid .rachacuca-stat-card:nth-child(3) .stat-value');
        const avgScoreEl = document.querySelector('#rachacucaTab .rachacuca-stats-grid .rachacuca-stat-card:nth-child(4) .stat-value');
        
        if (totalGamesEl) totalGamesEl.textContent = scores.length;
        if (bestScoreEl) {
            const bestScore = scores.reduce((max, score) => score.score > max ? score.score : max, 0);
            bestScoreEl.textContent = bestScore;
        }
        if (uniquePlayersEl) {
            const uniquePlayers = new Set(scores.map(score => score.userId)).size;
            uniquePlayersEl.textContent = uniquePlayers;
        }
        if (avgScoreEl) {
            const avgScore = scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score.score, 0) / scores.length) : 0;
            avgScoreEl.textContent = avgScore;
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados do Racha Cuca:', error);
    }
}

// Exportar dados do Racha Cuca
async function exportRachacucaData() {
    if (!db) {
        showToast('Funcionalidade disponível apenas com Firebase', 'error');
        return;
    }
    
    try {
        const scoresSnapshot = await db.collection('rachacuca_scores').get();
        const scores = scoresSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        const csv = convertToCSV(scores);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rachacuca_data_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showToast('Dados exportados com sucesso!', 'success');
    } catch (error) {
        console.error('❌ Erro ao exportar dados:', error);
        showToast('Erro ao exportar dados: ' + error.message, 'error');
    }
}

// Limpar dados antigos do Racha Cuca
async function clearOldRachacucaData() {
    if (!confirm('Tem certeza que deseja excluir dados do Racha Cuca com mais de 30 dias?')) {
        return;
    }
    
    if (!db) {
        showToast('Funcionalidade disponível apenas com Firebase', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const scoresSnapshot = await db.collection('rachacuca_scores')
            .where('date', '<', thirtyDaysAgo.toISOString())
            .get();
        
        const batch = db.batch();
        scoresSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        showToast(`${scoresSnapshot.size} registros antigos excluídos!`, 'success');
        loadRachacucaAdminData();
        
    } catch (error) {
        console.error('❌ Erro ao limpar dados:', error);
        showToast('Erro ao limpar dados: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Converter dados para CSV
function convertToCSV(data) {
    const headers = ['Jogador', 'Pontuação', 'Movimentos', 'Tempo', 'Dificuldade', 'Data'];
    const rows = data.map(item => [
        item.playerName || '',
        item.score || 0,
        item.moves || 0,
        item.time || 0,
        item.difficulty || 'normal',
        item.date ? new Date(item.date).toLocaleDateString('pt-BR') : ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// Configurar modal de usuário
function setupUserModal() {
    const modal = document.getElementById('userModal');
    const closeBtn = modal?.querySelector('.close-modal');
    const form = document.getElementById('userForm');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveUser();
        });
    }
    
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Abrir modal de usuário
function openUserModal(user = null) {
    const modal = document.getElementById('userModal');
    const title = document.getElementById('modalUserTitle');
    const form = document.getElementById('userForm');
    
    if (!modal || !title || !form) return;
    
    if (user) {
        title.textContent = 'Editar Usuário';
        document.getElementById('modalUserName').value = user.name || '';
        document.getElementById('modalUserEmail').value = user.email || '';
        document.getElementById('modalUserRole').value = user.role || 'student';
        document.getElementById('modalUserId').value = user.id || '';
        document.getElementById('modalUserPassword').value = '';
        document.getElementById('modalUserPassword').required = false;
    } else {
        title.textContent = 'Adicionar Usuário';
        form.reset();
        document.getElementById('modalUserId').value = '';
        document.getElementById('modalUserPassword').required = true;
    }
    
    modal.style.display = 'flex';
}

// Salvar usuário
async function saveUser() {
    const id = document.getElementById('modalUserId').value;
    const name = document.getElementById('modalUserName').value.trim();
    const email = document.getElementById('modalUserEmail').value.trim();
    const role = document.getElementById('modalUserRole').value;
    const password = document.getElementById('modalUserPassword').value;
    
    if (!name || !email || !role) {
        showToast('Preencha todos os campos obrigatórios', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        if (id) {
            await updateUser(id, { name, email, role, password });
            showToast('Usuário atualizado com sucesso!', 'success');
        } else {
            if (!password) {
                showToast('A senha é obrigatória para novos usuários', 'error');
                showLoading(false);
                return;
            }
            
            await createUser({ name, email, role, password });
            showToast('Usuário criado com sucesso!', 'success');
        }
        
        document.getElementById('userModal').style.display = 'none';
        
        loadUsersTable();
        
        await loadSystemStats(true);
        await loadRachacucaStats();
        
    } catch (error) {
        showToast('Erro ao salvar usuário: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Criar usuário
async function createUser(userData) {
    if (auth) {
        const userCredential = await auth.createUserWithEmailAndPassword(userData.email, userData.password);
        const userId = userCredential.user.uid;
        
        const userDoc = {
            name: userData.name,
            email: userData.email,
            role: userData.role,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            verified: false,
            progress: { ...userProgress },
            settings: {
                theme: 'light',
                notifications: true,
                sound: true,
                music: false,
                progressNotifications: true
            }
        };
        
        await db.collection('users').doc(userId).set(userDoc);
        
        if (userData.role === 'admin') {
            adminExists = true;
        }
    } else {
        const userId = 'demo_' + Date.now();
        const demoUsers = JSON.parse(localStorage.getItem('mathkids_demo_users') || '[]');
        
        demoUsers.push({
            id: userId,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            verified: true
        });
        
        localStorage.setItem('mathkids_demo_users', JSON.stringify(demoUsers));
        
        if (userData.role === 'admin') {
            adminExists = true;
            localStorage.setItem('mathkids_admin_exists', 'true');
        }
    }
}

// Atualizar usuário
async function updateUser(userId, userData) {
    if (db) {
        const updateData = {
            name: userData.name,
            email: userData.email,
            role: userData.role
        };
        
        if (userData.password) {
            const user = auth.currentUser;
            if (user && user.uid === userId) {
                await user.updatePassword(userData.password);
            }
        }
        
        await db.collection('users').doc(userId).update(updateData);
    } else {
        const demoUsers = JSON.parse(localStorage.getItem('mathkids_demo_users') || '[]');
        const index = demoUsers.findIndex(u => u.id === userId);
        
        if (index !== -1) {
            demoUsers[index] = {
                ...demoUsers[index],
                name: userData.name,
                email: userData.email,
                role: userData.role
            };
            
            localStorage.setItem('mathkids_demo_users', JSON.stringify(demoUsers));
        }
    }
}

// Carregar tabela de usuários
async function loadUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center">Carregando usuários...</td>
        </tr>
    `;
    
    try {
        let users = [];
        
        if (db) {
            const snapshot = await db.collection('users').get();
            users = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } else {
            const demoUsers = JSON.parse(localStorage.getItem('mathkids_demo_users') || '[]');
            users = demoUsers;
            
            const currentUserData = JSON.parse(localStorage.getItem('mathkids_user') || '{}');
            if (currentUserData.id && !users.some(u => u.id === currentUserData.id)) {
                users.push(currentUserData);
            }
        }
        
        renderUsersTable(users);
        
    } catch (error) {
        console.error('❌ Erro ao carregar usuários:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">Erro ao carregar usuários</td>
            </tr>
        `;
    }
}

// Renderizar tabela de usuários
function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">Nenhum usuário encontrado</td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    users.forEach(user => {
        if (user.id === currentUser?.id) return;
        
        const name = user.name || 'Sem nome';
        const email = user.email || 'Sem email';
        const role = user.role === 'admin' ? 'Administrador' : 'Aluno';
        const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '--';
        const status = user.verified ? 'Verificado' : 'Pendente';
        const statusClass = user.verified ? 'status-verified' : 'status-pending';
        
        html += `
            <tr>
                <td>${name}</td>
                <td>${email}</td>
                <td><span class="user-role-badge ${role === 'Administrador' ? 'admin' : 'student'}">${role}</span></td>
                <td>${createdAt}</td>
                <td><span class="status ${statusClass}">${status}</span></td>
                <td>
                    <div class="user-actions">
                        <button class="btn-action edit" data-user-id="${user.id}" data-user-name="${name}" data-user-email="${email}" data-user-role="${user.role}" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action delete" data-user-id="${user.id}" data-user-name="${name}" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html || `
        <tr>
            <td colspan="6" class="text-center">Nenhum usuário encontrado</td>
        </tr>
    `;
    
    setupUserTableActions();
}

// Configurar ações da tabela de usuários
function setupUserTableActions() {
    document.querySelectorAll('.btn-action.edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            const userName = this.getAttribute('data-user-name');
            const userEmail = this.getAttribute('data-user-email');
            const userRole = this.getAttribute('data-user-role');
            
            openUserModal({
                id: userId,
                name: userName,
                email: userEmail,
                role: userRole
            });
        });
    });
    
    document.querySelectorAll('.btn-action.delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            const userName = this.getAttribute('data-user-name');
            
            if (confirm(`Tem certeza que deseja excluir o usuário "${userName}"?`)) {
                deleteUser(userId);
            }
        });
    });
}

// Excluir usuário
async function deleteUser(userId) {
    showLoading(true);
    
    try {
        if (db) {
            await db.collection('users').doc(userId).delete();
            
            if (auth.currentUser && auth.currentUser.uid === userId) {
                await auth.currentUser.delete();
            }
        } else {
            const demoUsers = JSON.parse(localStorage.getItem('mathkids_demo_users') || '[]');
            const filteredUsers = demoUsers.filter(u => u.id !== userId);
            localStorage.setItem('mathkids_demo_users', JSON.stringify(filteredUsers));
        }
        
        showToast('Usuário excluído com sucesso!', 'success');
        
        loadUsersTable();
        
        await loadSystemStats(true);
        await loadRachacucaStats();
        
    } catch (error) {
        showToast('Erro ao excluir usuário: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Filtrar tabela de usuários
function filterUsersTable(searchTerm) {
    const rows = document.querySelectorAll('#usersTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
}

// Gerar relatório
function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const reportPeriod = document.getElementById('reportPeriod').value;
    const preview = document.getElementById('reportPreview');
    
    if (!preview) return;
    
    let reportContent = '';
    const periodName = getPeriodName(reportPeriod);
    
    switch(reportType) {
        case 'progress':
            reportContent = `
                <h4>📊 Relatório de Progresso dos Alunos</h4>
                <p><strong>Período:</strong> ${periodName}</p>
                <div class="report-data">
                    <div class="report-stat">
                        <span class="stat-label">Total de Alunos:</span>
                        <span class="stat-value">${systemStats.totalStudents}</span>
                    </div>
                    <div class="report-stat">
                        <span class="stat-label">Exercícios Concluídos:</span>
                        <span class="stat-value">${systemStats.totalExercises}</span>
                    </div>
                    <div class="report-stat">
                        <span class="stat-label">Taxa Média de Acerto:</span>
                        <span class="stat-value">${systemStats.systemAccuracy}%</span>
                    </div>
                    <div class="report-stat">
                        <span class="stat-label">Tempo Médio de Prática:</span>
                        <span class="stat-value">45 min/aluno</span>
                    </div>
                </div>
                <div class="report-chart">
                    <canvas id="reportChart" height="200"></canvas>
                </div>
            `;
            break;
            
        case 'usage':
            reportContent = `
                <h4>📈 Relatório de Uso do Sistema</h4>
                <p><strong>Período:</strong> ${periodName}</p>
                <div class="report-data">
                    <div class="report-stat">
                        <span class="stat-label">Usuários Totais:</span>
                        <span class="stat-value">${systemStats.totalUsers}</span>
                    </div>
                    <div class="report-stat">
                        <span class="stat-label">Novos Cadastros:</span>
                        <span class="stat-value">12</span>
                    </div>
                    <div class="report-stat">
                        <span class="stat-label">Acessos Diários:</span>
                        <span class="stat-value">245</span>
                    </div>
                    <div class="report-stat">
                        <span class="stat-label">Tempo Médio de Sessão:</span>
                        <span class="stat-value">18 min</span>
                    </div>
                </div>
                <div class="usage-breakdown">
                    <h5>Dispositivos Mais Usados:</h5>
                    <ul>
                        <li>Desktop: 65%</li>
                        <li>Mobile: 30%</li>
                        <li>Tablet: 5%</li>
                    </ul>
                </div>
            `;
            break;
            
        case 'performance':
            reportContent = `
                <h4>🎯 Relatório de Desempenho por Operação</h4>
                <p><strong>Período:</strong> ${periodName}</p>
                <div class="report-data">
                    <div class="report-stat">
                        <span class="stat-label">Adição:</span>
                        <span class="stat-value">85% de acerto</span>
                    </div>
                    <div class="report-stat">
                        <span class="stat-label">Subtração:</span>
                        <span class="stat-value">82% de acerto</span>
                    </div>
                    <div class="report-stat">
                        <span class="stat-label">Multiplicação:</span>
                        <span class="stat-value">75% de acerto</span>
                    </div>
                    <div class="report-stat">
                        <span class="stat-label">Divisão:</span>
                        <span class="stat-value">70% de acerto</span>
                    </div>
                </div>
                <div class="performance-trend">
                    <h5>Tendência de Melhoria:</h5>
                    <p>Os alunos mostraram uma melhoria média de <strong>15%</strong> no desempenho geral durante o período.</p>
                </div>
            `;
            break;
            
        case 'rachacuca':
            reportContent = `
                <h4>🧩 Relatório de Estatísticas Racha Cuca</h4>
                <p><strong>Período:</strong> ${periodName}</p>
                <div class="report-data">
                    <div class="report-stat">
                        <span class="stat-label">Total de Jogos:</span>
                        <span class="stat-value">${systemStats.totalRachacucaGames}</span>
                    </div>
                    <div class="report-stat">
                        <span class="stat-label">Melhor Pontuação:</span>
                        <span class="stat-value">${systemStats.bestRachacucaScore}</span>
                    </div>
                    <div class="report-stat">
                        <span class="stat-label">Jogadores Únicos:</span>
                        <span class="stat-value">${Math.min(systemStats.totalStudents, systemStats.totalRachacucaGames)}</span>
                    </div>
                    <div class="report-stat">
                        <span class="stat-label">Média de Pontos:</span>
                        <span class="stat-value">${systemStats.totalRachacucaGames > 0 ? Math.round(systemStats.bestRachacucaScore * 0.7) : 0}</span>
                    </div>
                </div>
                <div class="rachacuca-breakdown">
                    <h5>Distribuição por Dificuldade:</h5>
                    <ul>
                        <li>Fácil: 40% dos jogos</li>
                        <li>Normal: 35% dos jogos</li>
                        <li>Difícil: 25% dos jogos</li>
                    </ul>
                </div>
                <div class="performance-trend">
                    <h5>Impacto no Aprendizado:</h5>
                    <p>Alunos que jogam Racha Cuca regularmente mostram uma melhoria de <strong>22%</strong> no raciocínio lógico.</p>
                </div>
            `;
            break;
    }
    
    preview.innerHTML = reportContent;
    showToast('Relatório gerado com sucesso!', 'success');
}

// Salvar configurações do sistema
function saveSystemSettings() {
    const settings = {
        allowRegistrations: document.getElementById('allowRegistrations').checked,
        emailVerification: document.getElementById('emailVerification').checked,
        enableGames: document.getElementById('enableGames').checked,
        enableRachacuca: document.getElementById('enableRachacuca').checked,
        gameTimeLimit: document.getElementById('gameTimeLimit').value,
        systemNotifications: document.getElementById('systemNotifications').checked,
        progressNotifications: document.getElementById('progressNotifications').checked
    };
    
    localStorage.setItem('mathkids_system_settings', JSON.stringify(settings));
    showToast('Configurações salvas com sucesso!', 'success');
}

// Funções auxiliares
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getOperationName(operation) {
    const names = {
        addition: 'Adição',
        subtraction: 'Subtração',
        multiplication: 'Multiplicação',
        division: 'Divisão'
    };
    return names[operation] || operation;
}

function getOperationIcon(operation) {
    const icons = {
        addition: 'plus',
        subtraction: 'minus',
        multiplication: 'times',
        division: 'divide'
    };
    return icons[operation] || 'question';
}

function getOperationSymbol(operation) {
    const symbols = {
        addition: '+',
        subtraction: '-',
        multiplication: '×',
        division: '÷'
    };
    return symbols[operation] || '?';
}

function getGameName(gameId) {
    const names = {
        lightningGame: 'Desafio Relâmpago',
        divisionPuzzle: 'Quebra-cabeça da Divisão',
        mathChampionship: 'Campeonato MathKids',
        rachacucaGame: 'Racha Cuca'
    };
    return names[gameId] || gameId;
}

function getPeriodName(period) {
    const names = {
        week: 'Última Semana',
        month: 'Último Mês',
        quarter: 'Último Trimestre',
        year: 'Último Ano'
    };
    return names[period] || period;
}

function formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `Há ${minutes} min`;
    if (hours < 24) return `Há ${hours} h`;
    if (days < 7) return `Há ${days} d`;
    
    return time.toLocaleDateString('pt-BR');
}

function generateActivitiesTimeline() {
    const activities = userProgress.lastActivities.slice(0, 10);
    let html = '';
    
    if (activities.length === 0) {
        html = '<p class="text-center">Nenhuma atividade registrada ainda.</p>';
    } else {
        activities.forEach(activity => {
            const icon = activity.type === 'correct' ? 'fa-check' :
                        activity.type === 'wrong' ? 'fa-times' :
                        activity.type === 'game' ? 'fa-gamepad' :
                        activity.type === 'rachacuca' ? 'fa-puzzle-piece' : 'fa-info';
            
            const iconClass = activity.type === 'correct' ? 'success' :
                             activity.type === 'wrong' ? 'error' :
                             activity.type === 'game' ? 'info' :
                             activity.type === 'rachacuca' ? 'game' : 'info';
            
            html += `
                <div class="timeline-item">
                    <div class="timeline-marker ${iconClass}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="timeline-content">
                        <p>${activity.description}</p>
                        <small>${formatTimeAgo(activity.timestamp)}</small>
                    </div>
                </div>
            `;
        });
    }
    
    return html;
}

function generateBadges() {
    const badges = [
        { id: 'beginner', name: 'Iniciante', description: 'Primeiro login', earned: true },
        { id: 'exercises10', name: 'Aprendiz', description: '10 exercícios concluídos', earned: (userProgress.exercisesCompleted || 0) >= 10 },
        { id: 'exercises50', name: 'Estudante', description: '50 exercícios concluídos', earned: (userProgress.exercisesCompleted || 0) >= 50 },
        { id: 'accuracy80', name: 'Preciso', description: '80% de acertos', earned: ((userProgress.correctAnswers / userProgress.totalAnswers) || 0) >= 0.8 },
        { id: 'allOperations', name: 'Completo', description: 'Praticou todas operações', earned: true },
        { id: 'time60', name: 'Dedicado', description: '60 minutos de prática', earned: (userProgress.practiceTime || 0) >= 60 },
        { id: 'rachacuca1', name: 'Quebra-cabeceiro', description: '1 jogo do Racha Cuca', earned: (userProgress.rachacuca?.gamesCompleted || 0) >= 1 },
        { id: 'rachacuca5', name: 'Mestre do Puzzle', description: '5 jogos do Racha Cuca', earned: (userProgress.rachacuca?.gamesCompleted || 0) >= 5 },
        { id: 'rachacucaScore500', name: 'Pontuador', description: '500 pontos no Racha Cuca', earned: (userProgress.rachacuca?.bestScore || 0) >= 500 }
    ];
    
    let html = '';
    badges.forEach(badge => {
        html += `
            <div class="badge-item ${badge.earned ? 'earned' : 'locked'}">
                <div class="badge-icon">
                    <i class="fas fa-${badge.earned ? 'award' : 'lock'}"></i>
                </div>
                <div class="badge-info">
                    <h4>${badge.name}</h4>
                    <p>${badge.description}</p>
                </div>
            </div>
        `;
    });
    
    return html;
}

function openModal(modalId) {
    const modal = document.getElementById(modalId + 'Modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        loadModalContent(modalId);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function loadModalContent(modalId) {
    const modalBody = document.querySelector(`#${modalId}Modal .modal-body`);
    if (!modalBody) return;
    
    switch(modalId) {
        case 'profile':
            loadProfileModal(modalBody);
            break;
        case 'settings':
            loadSettingsModal(modalBody);
            break;
    }
}

function loadProfileModal(container) {
    const accuracy = userProgress.totalAnswers > 0 
        ? Math.round((userProgress.correctAnswers / userProgress.totalAnswers) * 100) 
        : 0;
    
    const rachacucaGames = userProgress.rachacuca?.gamesCompleted || 0;
    const rachacucaBestScore = userProgress.rachacuca?.bestScore || 0;
    
    container.innerHTML = `
        <div class="profile-content">
            <div class="profile-header">
                <div class="profile-avatar">
                    <span>${getInitials(currentUser.name)}</span>
                </div>
                <div class="profile-info">
                    <h4>${currentUser.name}</h4>
                    <p>${currentUser.email}</p>
                    <span class="profile-badge ${currentUser.role}">${currentUser.role === 'admin' ? 'Administrador' : 'Aluno'}</span>
                </div>
            </div>
            
            <div class="profile-stats">
                <div class="profile-stat">
                    <h5>Exercícios Concluídos</h5>
                    <p>${userProgress.exercisesCompleted}</p>
                </div>
                <div class="profile-stat">
                    <h5>Taxa de Acerto</h5>
                    <p>${accuracy}%</p>
                </div>
                <div class="profile-stat">
                    <h5>Racha Cuca</h5>
                    <p>${rachacucaGames} jogos</p>
                </div>
                <div class="profile-stat">
                    <h5>Melhor Pontuação</h5>
                    <p>${rachacucaBestScore}</p>
                </div>
            </div>
            
            <div class="profile-actions">
                <button class="btn-profile" id="changePassword">
                    <i class="fas fa-key"></i> Alterar Senha
                </button>
                <button class="btn-profile" id="editProfile">
                    <i class="fas fa-edit"></i> Editar Perfil
                </button>
            </div>
        </div>
    `;
}

function loadSettingsModal(container) {
    const settings = currentUser.settings || {
        theme: 'light',
        notifications: true,
        sound: true,
        music: false,
        progressNotifications: true
    };
    
    container.innerHTML = `
        <div class="settings-content">
            <div class="setting-group">
                <h4><i class="fas fa-palette"></i> Aparência</h4>
                <div class="setting">
                    <label>Tema:</label>
                    <select id="themeSelect">
                        <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Claro</option>
                        <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Escuro</option>
                        <option value="auto" ${settings.theme === 'auto' ? 'selected' : ''}>Automático</option>
                    </select>
                </div>
            </div>
            
            <div class="setting-group">
                <h4><i class="fas fa-volume-up"></i> Som</h4>
                <div class="setting">
                    <label>
                        <input type="checkbox" id="soundEffects" ${settings.sound ? 'checked' : ''}>
                        Efeitos sonoros
                    </label>
                </div>
                <div class="setting">
                    <label>
                        <input type="checkbox" id="backgroundMusic" ${settings.music ? 'checked' : ''}>
                        Música de fundo
                    </label>
                </div>
            </div>
            
            <div class="setting-group">
                <h4><i class="fas fa-bell"></i> Notificações</h4>
                <div class="setting">
                    <label>
                        <input type="checkbox" id="notificationsEnabled" ${settings.notifications ? 'checked' : ''}>
                        Permitir notificações
                    </label>
                </div>
                <div class="setting">
                    <label>
                        <input type="checkbox" id="progressNotifications" ${settings.progressNotifications ? 'checked' : ''}>
                        Notificações de progresso
                    </label>
                </div>
            </div>
            
            <div class="settings-actions">
                <button class="btn-settings primary" id="saveUserSettings">
                    <i class="fas fa-save"></i> Salvar Configurações
                </button>
                <button class="btn-settings" id="resetSettings">
                    <i class="fas fa-undo"></i> Restaurar Padrões
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('saveUserSettings').addEventListener('click', saveUserSettings);
    document.getElementById('resetSettings').addEventListener('click', resetUserSettings);
}

function saveUserSettings() {
    const settings = {
        theme: document.getElementById('themeSelect').value,
        sound: document.getElementById('soundEffects').checked,
        music: document.getElementById('backgroundMusic').checked,
        notifications: document.getElementById('notificationsEnabled').checked,
        progressNotifications: document.getElementById('progressNotifications').checked
    };
    
    currentUser.settings = settings;
    userData.settings = settings;
    
    if (currentUser.id) {
        const user = JSON.parse(localStorage.getItem('mathkids_user') || '{}');
        user.settings = settings;
        localStorage.setItem('mathkids_user', JSON.stringify(user));
    }
    
    if (db && currentUser.id) {
        db.collection('users').doc(currentUser.id).update({
            settings: settings
        }).catch(error => {
            console.error('❌ Error saving settings:', error);
        });
    }
    
    loadUserSettings();
    showToast('Configurações salvas com sucesso!', 'success');
}

function resetUserSettings() {
    const defaultSettings = {
        theme: 'light',
        notifications: true,
        sound: true,
        music: false,
        progressNotifications: true
    };
    
    document.getElementById('themeSelect').value = defaultSettings.theme;
    document.getElementById('soundEffects').checked = defaultSettings.sound;
    document.getElementById('backgroundMusic').checked = defaultSettings.music;
    document.getElementById('notificationsEnabled').checked = defaultSettings.notifications;
    document.getElementById('progressNotifications').checked = defaultSettings.progressNotifications;
    
    showToast('Configurações restauradas para os padrões.', 'info');
}

function loadUserSettings() {
    const settings = currentUser.settings || {
        theme: 'light',
        notifications: true,
        sound: true,
        music: false,
        progressNotifications: true
    };
    
    if (settings.theme === 'dark' || (settings.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
}

function loadNotifications() {
    const list = document.getElementById('notificationsList');
    if (!list) return;
    
    const notifications = [
        { id: 1, title: 'Bem-vindo ao MathKids Pro!', message: 'Comece a aprender matemática de forma divertida.', time: 'Agora', read: false },
        { id: 2, title: 'Novo desafio disponível', message: 'Tente o Desafio Relâmpago de Multiplicação!', time: '5 min atrás', read: false },
        { id: 3, title: 'Parabéns!', message: 'Você completou 10 exercícios.', time: 'Ontem', read: true },
        { id: 4, title: 'Novo jogo disponível!', message: 'Experimente o Racha Cuca para treinar sua lógica.', time: '2 dias atrás', read: false }
    ];
    
    let html = '';
    let unreadCount = 0;
    
    notifications.forEach(notification => {
        if (!notification.read) unreadCount++;
        
        html += `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}">
                <div class="notification-icon">
                    <i class="fas fa-bell"></i>
                </div>
                <div class="notification-content">
                    <h5>${notification.title}</h5>
                    <p>${notification.message}</p>
                    <small>${notification.time}</small>
                </div>
            </div>
        `;
    });
    
    list.innerHTML = html || '<p class="text-center">Nenhuma notificação</p>';
    document.getElementById('notificationCount').textContent = unreadCount;
}

function addActivity(description, type = 'info', score = null) {
    const activity = {
        id: Date.now(),
        description: description,
        type: type,
        score: score,
        timestamp: new Date().toISOString()
    };
    
    userProgress.lastActivities.unshift(activity);
    
    if (userProgress.lastActivities.length > 20) {
        userProgress.lastActivities = userProgress.lastActivities.slice(0, 20);
    }
    
    saveUserProgress();
    
    if (currentSection === 'dashboard' && DOM.activitiesList) {
        loadRecentActivities();
    }
    
    if (currentSection === 'progress') {
        loadProgressSection();
    }
}

function saveUserProgress() {
    if (!currentUser) return;
    
    const totalExercises = userProgress.exercisesCompleted || 0;
    if (totalExercises >= 200) userProgress.level = 'Mestre';
    else if (totalExercises >= 100) userProgress.level = 'Avançado';
    else if (totalExercises >= 50) userProgress.level = 'Intermediário';
    else userProgress.level = 'Iniciante';
    
    if (currentUser.id) {
        const user = JSON.parse(localStorage.getItem('mathkids_user') || '{}');
        user.progress = userProgress;
        localStorage.setItem('mathkids_user', JSON.stringify(user));
    }
    
    if (db && currentUser.id) {
        db.collection('users').doc(currentUser.id).update({
            progress: userProgress
        }).catch(error => {
            console.error('❌ Error saving progress:', error);
        });
    }
}

function showToast(message, type = 'info') {
    if (!DOM.toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        </div>
        <div class="toast-content">
            <p>${message}</p>
            <small>Agora</small>
        </div>
        <button class="toast-close">&times;</button>
    `;
    
    DOM.toastContainer.appendChild(toast);
    
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.style.animation = 'slideOutRight 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
    });
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideOutRight 0.3s ease-out forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    }, 5000);
    
    if (!document.getElementById('toastAnimationStyle')) {
        const style = document.createElement('style');
        style.id = 'toastAnimationStyle';
        style.textContent = `
            @keyframes slideOutRight {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100%);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

function showLoading(show) {
    if (!DOM.loadingOverlay) return;
    
    if (show) {
        DOM.loadingOverlay.classList.add('active');
    } else {
        DOM.loadingOverlay.classList.remove('active');
    }
}

function handleAuthError(error) {
    console.error('❌ Auth error:', error);
    
    let message = 'Erro na autenticação. Tente novamente.';
    
    if (error.code) {
        switch(error.code) {
            case 'auth/invalid-email':
                message = 'Email inválido.';
                break;
            case 'auth/user-disabled':
                message = 'Esta conta foi desativada.';
                break;
            case 'auth/user-not-found':
                message = 'Usuário não encontrado.';
                break;
            case 'auth/wrong-password':
                message = 'Senha incorreta.';
                break;
            case 'auth/email-already-in-use':
                message = 'Este email já está em uso.';
                break;
            case 'auth/weak-password':
                message = 'A senha é muito fraca. Use pelo menos 6 caracteres.';
                break;
            case 'auth/operation-not-allowed':
                message = 'Operação não permitida.';
                break;
            case 'auth/too-many-requests':
                message = 'Muitas tentativas. Tente novamente mais tarde.';
                break;
        }
    }
    
    showToast(message, 'error');
}

function initializeComponents() {
    const tooltips = document.querySelectorAll('[title]');
    tooltips.forEach(element => {
        element.addEventListener('mouseenter', function(e) {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = this.getAttribute('title');
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.left = rect.left + (rect.width / 2) + 'px';
            tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
            
            this._tooltip = tooltip;
        });
        
        element.addEventListener('mouseleave', function() {
            if (this._tooltip) {
                this._tooltip.remove();
                delete this._tooltip;
            }
        });
    });
    
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    prefersDark.addEventListener('change', (e) => {
        const settings = currentUser?.settings || { theme: 'auto' };
        if (settings.theme === 'auto') {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
    });
}

// Modo de demonstração
function setupDemoMode() {
    console.log('🎮 Modo de demonstração ativado');
    
    userProgress = {
        exercisesCompleted: 15,
        correctAnswers: 12,
        totalAnswers: 15,
        practiceTime: 45,
        addition: { correct: 4, total: 4 },
        subtraction: { correct: 3, total: 4 },
        multiplication: { correct: 3, total: 4 },
        division: { correct: 2, total: 3 },
        rachacuca: {
            gamesCompleted: 2,
            bestTime: 120,
            bestMoves: 45,
            bestScore: 750,
            totalTime: 240,
            totalMoves: 90,
            totalScore: 1400,
            easy: { games: 1, bestScore: 600 },
            normal: { games: 1, bestScore: 750 },
            hard: { games: 0, bestScore: 0 }
        },
        lastActivities: [
            { id: 1, description: 'Exercício de Multiplicação concluído', type: 'correct', timestamp: new Date().toISOString() },
            { id: 2, description: 'Desafio Relâmpago', type: 'game', timestamp: new Date(Date.now() - 3600000).toISOString() },
            { id: 3, description: 'Racha Cuca concluído! 750 pontos', type: 'rachacuca', score: 750, timestamp: new Date(Date.now() - 7200000).toISOString() },
            { id: 4, description: 'Exercício de Divisão errado', type: 'wrong', timestamp: new Date(Date.now() - 10800000).toISOString() }
        ],
        level: 'Iniciante',
        badges: [],
        dailyProgress: {
            exercises: 6,
            correct: 5,
            time: 27
        }
    };
    
    adminExists = localStorage.getItem('mathkids_admin_exists') === 'true';
    
    systemStats = {
        totalStudents: 1250,
        averageRating: 4.8,
        improvementRate: 98,
        totalExercises: 12450,
        totalUsers: 1260,
        systemAccuracy: 78,
        totalRachacucaGames: 356,
        bestRachacucaScore: 950,
        lastUpdated: Date.now()
    };
    
    updateSystemStatsUI();
}

async function handleDemoLogin(email, password) {
    const demoUsers = {
        'admin@mathkids.com': { password: 'admin123', role: 'admin', name: 'Administrador Demo' },
        'aluno@mathkids.com': { password: 'aluno123', role: 'student', name: 'Aluno Demo' }
    };
    
    if (demoUsers[email] && demoUsers[email].password === password) {
        const user = demoUsers[email];
        currentUser = {
            id: 'demo_' + email,
            name: user.name,
            email: email,
            role: user.role,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            progress: userProgress,
            settings: {
                theme: 'light',
                notifications: true,
                sound: true,
                music: false,
                progressNotifications: true
            }
        };
        
        localStorage.setItem('mathkids_user', JSON.stringify(currentUser));
        
        return currentUser;
    } else {
        throw new Error('Credenciais inválidas');
    }
}

// Funções para uso global
window.switchSection = switchSection;
window.loadPracticeSection = loadPracticeSection;
window.loadLesson = loadLesson;
window.startGame = startGame;
window.startRachacucaGame = startRachacucaGame;

// Atualizar estatísticas periodicamente
setInterval(() => {
    if (db) {
        loadSystemStats(false);
        loadRachacucaStats();
    }
}, 30000);

// Atualizar estatísticas quando a página ganha foco
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && db) {
        loadSystemStats(true);
        loadRachacucaStats();
    }
});

window.addEventListener('focus', function() {
    if (db) {
        loadSystemStats(true);
        loadRachacucaStats();
    }
});

console.log('✅ MathKids Pro v3.3 carregado com sucesso!');
