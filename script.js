// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDummyKeyForDemoOnly123456789",
    authDomain: "mathkids-demo.firebaseapp.com",
    projectId: "mathkids-demo",
    storageBucket: "mathkids-demo.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890abcdef"
};

// ============================================
// INICIALIZAÇÃO E VARIÁVEIS GLOBAIS
// ============================================
let app, db, auth;
let user = null;
let userData = {};
let userProgress = {};

// Estado da aplicação
let currentOperation = null;
let currentExercise = null;
let currentDifficulty = 'easy';
let currentGame = null;
let gameActive = false;
let gameTimer = null;
let gameTimeLeft = 60;
let gameScore = 0;
let gameHighScore = 0;
let dailyChallengeActive = false;

// Dados iniciais de progresso
const initialProgressData = {
    username: '',
    email: '',
    createdAt: null,
    lastLogin: null,
    totalPoints: 0,
    exercisesCompleted: 0,
    correctAnswers: 0,
    totalAnswers: 0,
    practiceTime: 0,
    loginStreak: 0,
    lastLoginDate: null,
    currentLevel: 'Iniciante',
    addition: { correct: 0, total: 0 },
    subtraction: { correct: 0, total: 0 },
    multiplication: { correct: 0, total: 0 },
    division: { correct: 0, total: 0 },
    achievements: {
        firstLogin: false,
        firstExercise: false,
        perfectScore: false,
        streak3: false,
        streak7: false,
        multiplicationMaster: false,
        divisionExpert: false,
        practice10: false,
        practice50: false,
        practice100: false
    },
    gameScores: {
        lightning: 0,
        puzzle: null,
        championship: 0
    }
};

// ============================================
// ELEMENTOS DOM - AUTENTICAÇÃO
// ============================================
const welcomeScreen = document.getElementById('welcomeScreen');
const mainContent = document.getElementById('mainContent');
const loginBtn = document.getElementById('loginBtn');
const showLoginBtn = document.getElementById('showLoginBtn');
const showRegisterBtn = document.getElementById('showRegisterBtn');
const authModal = document.getElementById('authModal');
const closeModal = document.querySelector('.close-modal');
const authTabs = document.querySelectorAll('.auth-tab');
const authForms = document.querySelectorAll('.auth-form');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const recoverForm = document.getElementById('recoverForm');

// Campos de formulário
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const registerName = document.getElementById('registerName');
const registerEmail = document.getElementById('registerEmail');
const registerPassword = document.getElementById('registerPassword');
const registerConfirmPassword = document.getElementById('registerConfirmPassword');
const recoverEmail = document.getElementById('recoverEmail');

// Botões de ação
const submitLogin = document.getElementById('submitLogin');
const submitRegister = document.getElementById('submitRegister');
const submitRecover = document.getElementById('submitRecover');
const googleLogin = document.getElementById('googleLogin');
const googleRegister = document.getElementById('googleRegister');

// Status e loading
const authStatus = document.getElementById('authStatus');
const loadingModal = document.getElementById('loadingModal');
const loadingText = document.getElementById('loadingText');

// Informações do usuário
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');
const userName = document.getElementById('userName');
const userAvatar = document.getElementById('userAvatar');
const userGreeting = document.getElementById('userGreeting');

// ============================================
// ELEMENTOS DOM - PROGRESSO E ESTATÍSTICAS
// ============================================
// Dashboard principal
const statExercises = document.getElementById('statExercises');
const statAccuracy = document.getElementById('statAccuracy');
const statLevel = document.getElementById('statLevel');
const statStreak = document.getElementById('statStreak');

// Seção de progresso
const exercisesCompletedElement = document.getElementById('exercisesCompleted');
const correctAnswersElement = document.getElementById('correctAnswers');
const practiceTimeElement = document.getElementById('practiceTime');
const userLevelElement = document.getElementById('userLevel');
const currentPoints = document.getElementById('currentPoints');

// Barras de progresso das operações
const additionProgress = document.getElementById('additionProgress');
const subtractionProgress = document.getElementById('subtractionProgress');
const multiplicationProgress = document.getElementById('multiplicationProgress');
const divisionProgress = document.getElementById('divisionProgress');
const additionScore = document.getElementById('additionScore');
const subtractionScore = document.getElementById('subtractionScore');
const multiplicationScore = document.getElementById('multiplicationScore');
const divisionScore = document.getElementById('divisionScore');

// Recordes dos jogos
const lightningHighscore = document.getElementById('lightningHighscore');
const puzzleHighscore = document.getElementById('puzzleHighscore');
const championshipRank = document.getElementById('championshipRank');

// Conquistas
const achievementsGrid = document.getElementById('achievementsGrid');

// ============================================
// ELEMENTOS DOM - EXERCÍCIOS E JOGOS
// ============================================
// Elementos da prática
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

// Elementos dos jogos
const gameTitle = document.getElementById('gameTitle');
const gameExercise = document.getElementById('gameExercise');
const startGameBtn = document.getElementById('startGame');
const endGameBtn = document.getElementById('endGame');
const nextGameBtn = document.getElementById('nextGame');
const gameFeedback = document.getElementById('gameFeedback');
const timerElement = document.getElementById('timer');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');

// ============================================
// GRÁFICO DE PROGRESSO
// ============================================
let progressChart = null;

// ============================================
// INICIALIZAÇÃO DO FIREBASE
// ============================================
function initializeFirebase() {
    try {
        app = firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
        
        console.log('Firebase inicializado com sucesso!');
        
        // Configurar persistência de autenticação
        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .catch(error => {
                console.error("Erro ao configurar persistência:", error);
            });
        
        // Monitorar estado da autenticação
        auth.onAuthStateChanged(handleAuthStateChanged);
        
    } catch (error) {
        console.error('Erro ao inicializar Firebase:', error);
        showNotification('Firebase não configurado. Modo offline ativado.', 'warning');
        showWelcomeScreen();
    }
}

// ============================================
// MANIPULADOR DE ESTADO DE AUTENTICAÇÃO
// ============================================
async function handleAuthStateChanged(firebaseUser) {
    if (firebaseUser) {
        user = firebaseUser;
        showLoading('Carregando seus dados...');
        try {
            await loadUserData();
            await updateLastLogin(user.uid);
            showMainContent();
            updateUIForLoggedInUser();
            hideLoading();
            showNotification(`Bem-vindo de volta, ${userData.username || 'Estudante'}!`, 'success');
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
            hideLoading();
            showNotification('Erro ao carregar dados. Tente novamente.', 'error');
        }
    } else {
        user = null;
        userData = {};
        userProgress = {};
        showWelcomeScreen();
    }
}

// ============================================
// FUNÇÕES DE AUTENTICAÇÃO
// ============================================

// Mostrar tela de boas-vindas
function showWelcomeScreen() {
    welcomeScreen.style.display = 'flex';
    mainContent.style.display = 'none';
    if (userInfo) userInfo.style.display = 'none';
    if (loginBtn) loginBtn.style.display = 'flex';
}

// Mostrar conteúdo principal
function showMainContent() {
    if (welcomeScreen) welcomeScreen.style.display = 'none';
    if (mainContent) mainContent.style.display = 'block';
    if (userInfo) userInfo.style.display = 'flex';
    if (loginBtn) loginBtn.style.display = 'none';
}

// Abrir modal de autenticação
function openAuthModal() {
    if (authModal) {
        authModal.style.display = 'flex';
        resetAuthForms();
        switchAuthTab('login');
    }
}

// Fechar modal de autenticação
function closeAuthModal() {
    if (authModal) {
        authModal.style.display = 'none';
        resetAuthStatus();
    }
}

// Resetar formulários de autenticação
function resetAuthForms() {
    if (loginEmail) loginEmail.value = '';
    if (loginPassword) loginPassword.value = '';
    if (registerName) registerName.value = '';
    if (registerEmail) registerEmail.value = '';
    if (registerPassword) registerPassword.value = '';
    if (registerConfirmPassword) registerConfirmPassword.value = '';
    if (recoverEmail) recoverEmail.value = '';
    
    // Resetar checkboxes
    const rememberMe = document.getElementById('rememberMe');
    if (rememberMe) rememberMe.checked = false;
    
    const acceptTerms = document.getElementById('acceptTerms');
    if (acceptTerms) acceptTerms.checked = false;
}

// Resetar status de autenticação
function resetAuthStatus() {
    if (authStatus) {
        authStatus.textContent = '';
        authStatus.className = 'auth-status';
        authStatus.style.display = 'none';
    }
}

// Alternar entre abas de autenticação
function switchAuthTab(tabName) {
    // Atualizar abas ativas
    authTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-tab') === tabName) {
            tab.classList.add('active');
        }
    });
    
    // Atualizar formulários ativos
    authForms.forEach(form => {
        form.classList.remove('active');
        if (form.id === tabName + 'Form') {
            form.classList.add('active');
        }
    });
    
    // Atualizar título do modal
    const titles = {
        'login': 'Entrar no MathKids',
        'register': 'Criar Nova Conta',
        'recover': 'Recuperar Senha'
    };
    const authModalTitle = document.getElementById('authModalTitle');
    if (authModalTitle) {
        authModalTitle.textContent = titles[tabName];
    }
}

// Alternar visibilidade da senha
function togglePasswordVisibility(passwordFieldId, toggleIcon) {
    const passwordField = document.getElementById(passwordFieldId);
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordField.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Login com email/senha
async function handleEmailLogin() {
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();
    const rememberMe = document.getElementById('rememberMe').checked;
    
    if (!email || !password) {
        showAuthStatus('Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showAuthStatus('Por favor, insira um email válido.', 'error');
        return;
    }
    
    showLoading('Entrando...');
    
    try {
        // Configurar persistência baseada na escolha do usuário
        const persistence = rememberMe 
            ? firebase.auth.Auth.Persistence.LOCAL 
            : firebase.auth.Auth.Persistence.SESSION;
        
        await auth.setPersistence(persistence);
        
        // Fazer login
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        
        showAuthStatus('Login realizado com sucesso!', 'success');
        
        // Fechar modal após 1.5 segundos
        setTimeout(() => {
            closeAuthModal();
        }, 1500);
        
    } catch (error) {
        console.error('Erro no login:', error);
        
        let errorMessage = 'Erro ao fazer login. ';
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'Usuário não encontrado. Verifique seu email.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Senha incorreta. Tente novamente.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Email inválido. Verifique o formato.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'Esta conta foi desativada.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
                break;
            default:
                errorMessage = 'Ocorreu um erro. Tente novamente.';
        }
        
        showAuthStatus(errorMessage, 'error');
    } finally {
        hideLoading();
    }
}

// Cadastro com email/senha
async function handleEmailRegister() {
    const name = registerName.value.trim();
    const email = registerEmail.value.trim();
    const password = registerPassword.value.trim();
    const confirmPassword = registerConfirmPassword.value.trim();
    const acceptTerms = document.getElementById('acceptTerms').checked;
    
    // Validações
    if (!name || !email || !password || !confirmPassword) {
        showAuthStatus('Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    if (name.length < 3) {
        showAuthStatus('O nome deve ter pelo menos 3 caracteres.', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showAuthStatus('Por favor, insira um email válido.', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAuthStatus('A senha deve ter pelo menos 6 caracteres.', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showAuthStatus('As senhas não coincidem.', 'error');
        return;
    }
    
    if (!acceptTerms) {
        showAuthStatus('Você deve aceitar os termos de uso.', 'error');
        return;
    }
    
    showLoading('Criando sua conta...');
    
    try {
        // Criar usuário no Firebase Authentication
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Criar perfil do usuário no Firestore
        const userProfile = {
            ...initialProgressData,
            username: name,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            lastLoginDate: getTodayDateString(),
            loginStreak: 1,
            achievements: {
                ...initialProgressData.achievements,
                firstLogin: true
            }
        };
        
        // Salvar dados do usuário no Firestore
        await db.collection('users').doc(userCredential.user.uid).set(userProfile);
        
        showAuthStatus('Conta criada com sucesso! Redirecionando...', 'success');
        
        // Fechar modal após 2 segundos
        setTimeout(() => {
            closeAuthModal();
        }, 2000);
        
    } catch (error) {
        console.error('Erro no cadastro:', error);
        
        let errorMessage = 'Erro ao criar conta. ';
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Este email já está em uso. Tente fazer login.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Email inválido. Verifique o formato.';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Operação não permitida.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.';
                break;
            default:
                errorMessage = 'Ocorreu um erro. Tente novamente.';
        }
        
        showAuthStatus(errorMessage, 'error');
    } finally {
        hideLoading();
    }
}

// Login com Google
async function handleGoogleLogin() {
    if (!auth) {
        showAuthStatus('Firebase não configurado. Modo offline ativado.', 'warning');
        setTimeout(() => {
            userData = { username: 'Usuário Demo', email: 'demo@mathkids.com' };
            userProgress = { ...initialProgressData, ...userData };
            showMainContent();
            updateUIForLoggedInUser();
            closeAuthModal();
        }, 1500);
        return;
    }
    
    const provider = new firebase.auth.GoogleAuthProvider();
    
    // Adicionar escopos
    provider.addScope('profile');
    provider.addScope('email');
    
    showLoading('Conectando com Google...');
    
    try {
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        showAuthStatus('Login com Google realizado com sucesso!', 'success');
        
        // Fechar modal após 1.5 segundos
        setTimeout(() => {
            closeAuthModal();
        }, 1500);
        
    } catch (error) {
        console.error('Erro no login com Google:', error);
        
        let errorMessage = 'Erro ao fazer login com Google. ';
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Login cancelado pelo usuário.';
        } else if (error.code === 'auth/cancelled-popup-request') {
            errorMessage = 'Solicitação de login cancelada.';
        } else if (error.code === 'auth/account-exists-with-different-credential') {
            errorMessage = 'Email já registrado com outro método.';
        } else {
            errorMessage += 'Tente novamente.';
        }
        
        showAuthStatus(errorMessage, 'error');
    } finally {
        hideLoading();
    }
}

// Recuperação de senha
async function handlePasswordRecovery() {
    const email = recoverEmail.value.trim();
    
    if (!email) {
        showAuthStatus('Por favor, digite seu email.', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showAuthStatus('Por favor, insira um email válido.', 'error');
        return;
    }
    
    showLoading('Enviando link de recuperação...');
    
    try {
        await auth.sendPasswordResetEmail(email, {
            url: window.location.href,
            handleCodeInApp: false
        });
        
        showAuthStatus('Email de recuperação enviado! Verifique sua caixa de entrada.', 'success');
        
        // Limpar campo e voltar para login após 5 segundos
        setTimeout(() => {
            recoverEmail.value = '';
            switchAuthTab('login');
        }, 5000);
        
    } catch (error) {
        console.error('Erro na recuperação de senha:', error);
        
        let errorMessage = 'Erro ao enviar email de recuperação. ';
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'Usuário não encontrado. Verifique o email.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Email inválido. Verifique o formato.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
                break;
            default:
                errorMessage = 'Ocorreu um erro. Tente novamente.';
        }
        
        showAuthStatus(errorMessage, 'error');
    } finally {
        hideLoading();
    }
}

// Logout
async function handleLogout() {
    if (!auth || !user) {
        user = null;
        userData = {};
        userProgress = {};
        showWelcomeScreen();
        return;
    }
    
    showLoading('Saindo...');
    
    try {
        await auth.signOut();
        showNotification('Logout realizado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        showNotification('Erro ao fazer logout. Tente novamente.', 'error');
    } finally {
        hideLoading();
    }
}

// ============================================
// FUNÇÕES DE GERENCIAMENTO DE USUÁRIO
// ============================================

// Carregar dados do usuário
async function loadUserData() {
    if (!user || !db) {
        // Modo offline/demo
        const demoData = localStorage.getItem('mathkids_demo_data');
        if (demoData) {
            userProgress = JSON.parse(demoData);
        } else {
            userProgress = {
                ...initialProgressData,
                username: 'Estudante Demo',
                email: 'demo@mathkids.com',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };
        }
        userData = { ...userProgress };
        return;
    }
    
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (userDoc.exists) {
            userProgress = userDoc.data();
            userData = { ...userProgress };
            
            // Garantir que todas as propriedades existam
            userProgress = {
                ...initialProgressData,
                ...userProgress
            };
            
            // Salvar localmente para modo offline
            localStorage.setItem('mathkids_user_data', JSON.stringify(userProgress));
        } else {
            // Criar documento se não existir (para usuários antigos)
            const userProfile = {
                ...initialProgressData,
                username: user.displayName || user.email.split('@')[0],
                email: user.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                lastLoginDate: getTodayDateString(),
                loginStreak: 1,
                achievements: {
                    ...initialProgressData.achievements,
                    firstLogin: true
                }
            };
            
            await db.collection('users').doc(user.uid).set(userProfile);
            userProgress = userProfile;
            userData = { ...userProgress };
        }
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        
        // Tentar carregar do localStorage
        const savedData = localStorage.getItem('mathkids_user_data');
        if (savedData) {
            userProgress = JSON.parse(savedData);
            userData = { ...userProgress };
        } else {
            // Dados demo
            userProgress = {
                ...initialProgressData,
                username: user.displayName || user.email.split('@')[0] || 'Estudante',
                email: user.email || 'estudante@mathkids.com'
            };
            userData = { ...userProgress };
        }
    }
}

// Atualizar último login
async function updateLastLogin(userId) {
    if (!db || !userId) return;
    
    try {
        const today = getTodayDateString();
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            const lastLoginDate = userData.lastLoginDate;
            let loginStreak = userData.loginStreak || 0;
            
            // Calcular sequência de logins
            if (lastLoginDate) {
                const lastLogin = new Date(lastLoginDate);
                const todayDate = new Date(today);
                const diffTime = Math.abs(todayDate - lastLogin);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                    // Login consecutivo
                    loginStreak += 1;
                } else if (diffDays > 1) {
                    // Sequência quebrada
                    loginStreak = 1;
                }
                // diffDays === 0 significa mesmo dia, não incrementa
            } else {
                // Primeiro login
                loginStreak = 1;
            }
            
            // Atualizar dados
            await db.collection('users').doc(userId).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                lastLoginDate: today,
                loginStreak: loginStreak,
                currentLevel: calculateUserLevel(userData)
            });
            
            // Verificar conquistas de sequência
            if (loginStreak >= 3 && !userData.achievements?.streak3) {
                await unlockAchievement(userId, 'streak3');
            }
            if (loginStreak >= 7 && !userData.achievements?.streak7) {
                await unlockAchievement(userId, 'streak7');
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar último login:', error);
    }
}

// Calcular nível do usuário
function calculateUserLevel(userData) {
    const totalExercises = userData.exercisesCompleted || 0;
    const accuracy = userData.totalAnswers > 0 
        ? (userData.correctAnswers || 0) / (userData.totalAnswers || 1) 
        : 0;
    
    if (totalExercises >= 200 && accuracy >= 0.9) return 'Mestre Supremo';
    if (totalExercises >= 100 && accuracy >= 0.8) return 'Mestre';
    if (totalExercises >= 50 && accuracy >= 0.7) return 'Avançado';
    if (totalExercises >= 20 && accuracy >= 0.6) return 'Intermediário';
    return 'Iniciante';
}

// Atualizar UI para usuário logado
function updateUIForLoggedInUser() {
    if (!userProgress.username) return;
    
    // Informações do usuário
    if (userName) userName.textContent = userProgress.username;
    if (userGreeting) userGreeting.textContent = userProgress.username;
    
    // Atualizar avatar
    if (userAvatar) {
        if (user && user.photoURL) {
            userAvatar.innerHTML = `<img src="${user.photoURL}" alt="${userProgress.username}" style="width:100%;height:100%;border-radius:50%;">`;
        } else {
            // Usar inicial do nome
            const initial = userProgress.username.charAt(0).toUpperCase();
            userAvatar.innerHTML = `<span style="font-size:1.5rem;">${initial}</span>`;
        }
    }
    
    // Estatísticas do dashboard
    updateDashboardStats();
    
    // Estatísticas detalhadas
    updateDetailedStats();
    
    // Barras de progresso das operações
    updateOperationProgress();
    
    // Atualizar recordes dos jogos
    updateGameHighscores();
    
    // Atualizar conquistas
    updateAchievementsDisplay();
    
    // Atualizar gráfico
    updateProgressChart();
}

// Atualizar estatísticas do dashboard
function updateDashboardStats() {
    if (!userProgress) return;
    
    if (statExercises) {
        statExercises.textContent = userProgress.exercisesCompleted || 0;
    }
    
    const accuracy = userProgress.totalAnswers > 0 
        ? Math.round((userProgress.correctAnswers / userProgress.totalAnswers) * 100) 
        : 0;
    
    if (statAccuracy) {
        statAccuracy.textContent = `${accuracy}%`;
    }
    
    const level = userProgress.currentLevel || calculateUserLevel(userProgress);
    if (statLevel) {
        statLevel.textContent = level;
    }
    if (userLevelElement) {
        userLevelElement.textContent = level;
    }
    
    if (statStreak) {
        statStreak.textContent = `${userProgress.loginStreak || 0} dias`;
    }
}

// Atualizar estatísticas detalhadas
function updateDetailedStats() {
    if (!userProgress) return;
    
    if (exercisesCompletedElement) {
        exercisesCompletedElement.textContent = userProgress.exercisesCompleted || 0;
    }
    
    const accuracy = userProgress.totalAnswers > 0 
        ? Math.round((userProgress.correctAnswers / userProgress.totalAnswers) * 100) 
        : 0;
    
    if (correctAnswersElement) {
        correctAnswersElement.textContent = `${accuracy}%`;
    }
    
    if (practiceTimeElement) {
        practiceTimeElement.textContent = `${Math.floor((userProgress.practiceTime || 0) / 60)} min`;
    }
    
    if (currentPoints) {
        currentPoints.textContent = userProgress.totalPoints || 0;
    }
}

// Atualizar barras de progresso das operações
function updateOperationProgress() {
    const operations = ['addition', 'subtraction', 'multiplication', 'division'];
    
    operations.forEach(op => {
        const progressBar = document.getElementById(`${op}Progress`);
        const scoreElement = document.getElementById(`${op}Score`);
        
        if (userProgress[op]) {
            const correct = userProgress[op].correct || 0;
            const total = userProgress[op].total || 0;
            const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
            
            if (progressBar) {
                progressBar.style.width = `${percentage}%`;
            }
            
            if (scoreElement) {
                scoreElement.textContent = `${correct}/${total}`;
            }
        }
    });
}

// Atualizar recordes dos jogos
function updateGameHighscores() {
    if (!userProgress.gameScores) return;
    
    if (lightningHighscore) {
        lightningHighscore.textContent = userProgress.gameScores.lightning || 0;
    }
    
    if (puzzleHighscore) {
        const puzzleScore = userProgress.gameScores.puzzle;
        puzzleHighscore.textContent = puzzleScore ? `${puzzleScore}s` : '-';
    }
    
    if (championshipRank) {
        championshipRank.textContent = userProgress.gameScores.championship || '-';
    }
}

// ============================================
// SISTEMA DE CONQUISTAS
// ============================================

// Atualizar exibição de conquistas
function updateAchievementsDisplay() {
    if (!achievementsGrid || !userProgress.achievements) return;
    
    const achievements = [
        { id: 'firstLogin', icon: 'fa-user-plus', name: 'Primeiro Login', desc: 'Criou uma conta no MathKids' },
        { id: 'firstExercise', icon: 'fa-check-circle', name: 'Primeiro Exercício', desc: 'Completou o primeiro exercício' },
        { id: 'perfectScore', icon: 'fa-star', name: 'Nota Perfeita', desc: 'Acertou 10 exercícios seguidos' },
        { id: 'streak3', icon: 'fa-fire', name: 'Sequência Bronze', desc: 'Logou por 3 dias consecutivos' },
        { id: 'streak7', icon: 'fa-fire', name: 'Sequência Prata', desc: 'Logou por 7 dias consecutivos' },
        { id: 'multiplicationMaster', icon: 'fa-times', name: 'Mestre da Multiplicação', desc: 'Acertou 50 multiplicações' },
        { id: 'divisionExpert', icon: 'fa-divide', name: 'Especialista em Divisão', desc: 'Acertou 50 divisões' },
        { id: 'practice10', icon: 'fa-dumbbell', name: 'Praticante', desc: 'Completou 10 exercícios' },
        { id: 'practice50', icon: 'fa-medal', name: 'Atleta', desc: 'Completou 50 exercícios' },
        { id: 'practice100', icon: 'fa-trophy', name: 'Campeão', desc: 'Completou 100 exercícios' }
    ];
    
    achievementsGrid.innerHTML = '';
    
    achievements.forEach(achievement => {
        const isUnlocked = userProgress.achievements[achievement.id] || false;
        
        const achievementElement = document.createElement('div');
        achievementElement.className = `achievement ${isUnlocked ? '' : 'locked'}`;
        achievementElement.title = `${achievement.name}: ${achievement.desc}`;
        
        achievementElement.innerHTML = `
            <i class="fas ${achievement.icon}"></i>
            <span>${achievement.name}</span>
        `;
        
        achievementsGrid.appendChild(achievementElement);
    });
}

// Desbloquear conquista
async function unlockAchievement(userId, achievementId) {
    if (!db || !userId) {
        // Modo offline
        if (!userProgress.achievements[achievementId]) {
            userProgress.achievements[achievementId] = true;
            localStorage.setItem('mathkids_user_data', JSON.stringify(userProgress));
            showAchievementNotification(achievementId);
        }
        return;
    }
    
    try {
        // Verificar se já tem a conquista
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            
            if (!userData.achievements?.[achievementId]) {
                // Desbloquear conquista
                await db.collection('users').doc(userId).update({
                    [`achievements.${achievementId}`]: true,
                    totalPoints: firebase.firestore.FieldValue.increment(100)
                });
                
                // Atualizar dados locais
                userProgress.achievements[achievementId] = true;
                userProgress.totalPoints = (userProgress.totalPoints || 0) + 100;
                
                // Mostrar notificação
                showAchievementNotification(achievementId);
            }
        }
    } catch (error) {
        console.error('Erro ao desbloquear conquista:', error);
    }
}

// Mostrar notificação de conquista
function showAchievementNotification(achievementId) {
    const achievementNames = {
        'firstLogin': 'Primeiro Login',
        'firstExercise': 'Primeiro Exercício',
        'perfectScore': 'Nota Perfeita',
        'streak3': 'Sequência Bronze',
        'streak7': 'Sequência Prata',
        'multiplicationMaster': 'Mestre da Multiplicação',
        'divisionExpert': 'Especialista em Divisão',
        'practice10': 'Praticante',
        'practice50': 'Atleta',
        'practice100': 'Campeão'
    };
    
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #4361ee, #3a0ca3);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 15px;
        animation: slideIn 0.5s ease-out;
        max-width: 350px;
    `;
    
    notification.innerHTML = `
        <i class="fas fa-trophy" style="font-size: 2rem;"></i>
        <div>
            <h4 style="margin: 0 0 5px 0; font-size: 1.1rem;">Conquista Desbloqueada!</h4>
            <p style="margin: 0; font-size: 0.9rem; opacity: 0.9;">${achievementNames[achievementId] || 'Nova Conquista'}</p>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Adicionar animação CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Remover após 5 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease-out';
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 500);
    }, 5000);
}

// ============================================
// SISTEMA DE EXERCÍCIOS
// ============================================

// Selecionar operação
function selectOperation(operation) {
    if (!user && !isDemoMode()) {
        showNotification('Faça login para praticar exercícios!', 'warning');
        openAuthModal();
        return;
    }
    
    currentOperation = operation;
    
    // Atualizar título
    const operationNames = {
        'addition': 'Adição',
        'subtraction': 'Subtração',
        'multiplication': 'Multiplicação',
        'division': 'Divisão'
    };
    
    if (practiceTitle) {
        practiceTitle.textContent = `Praticando ${operationNames[operation]}`;
    }
    
    // Atualizar explicação
    updateExplanation(operation);
    
    // Ativar controles
    if (newExerciseBtn) newExerciseBtn.disabled = false;
    if (checkAnswerBtn) checkAnswerBtn.disabled = false;
    if (showHintBtn) showHintBtn.disabled = false;
    if (answerInput) {
        answerInput.disabled = false;
        answerInput.placeholder = '?';
    }
    
    // Gerar primeiro exercício
    generateExercise();
}

// Atualizar explicação
function updateExplanation(operation) {
    if (!explanation) return;
    
    const explanations = {
        'addition': `
            <h4>Adição</h4>
            <p>A <strong>adição</strong> é a operação matemática que representa a combinação de dois ou mais números para obter um total.</p>
            <p><strong>Exemplo:</strong> 3 + 5 = 8</p>
            <p><strong>Dica:</strong> Imagine que você tem 3 maçãs e ganha mais 5. Quantas maçãs você tem agora?</p>
            <p><strong>Pontos:</strong> +10 por acerto, +1 por tentativa</p>
        `,
        'subtraction': `
            <h4>Subtração</h4>
            <p>A <strong>subtração</strong> é a operação matemática que representa a remoção de uma quantidade de outra.</p>
            <p><strong>Exemplo:</strong> 10 - 4 = 6</p>
            <p><strong>Dica:</strong> Se você tinha 10 balas e comeu 4, quantas balas sobraram?</p>
            <p><strong>Pontos:</strong> +10 por acerto, +1 por tentativa</p>
        `,
        'multiplication': `
            <h4>Multiplicação</h4>
            <p>A <strong>multiplicação</strong> é uma adição repetida. É uma forma rápida de somar o mesmo número várias vezes.</p>
            <p><strong>Exemplo:</strong> 4 × 3 = 4 + 4 + 4 = 12</p>
            <p><strong>Dica:</strong> Se você tem 4 pacotes com 3 bolinhas cada, quantas bolinhas você tem no total?</p>
            <p><strong>Pontos:</strong> +15 por acerto, +1 por tentativa</p>
        `,
        'division': `
            <h4>Divisão</h4>
            <p>A <strong>divisão</strong> é a operação inversa da multiplicação. Representa a distribuição igualitária de uma quantidade.</p>
            <p><strong>Exemplo:</strong> 12 ÷ 4 = 3</p>
            <p><strong>Dica:</strong> Se você tem 12 chocolates para dividir igualmente entre 4 amigos, quantos chocolates cada um recebe?</p>
            <p><strong>Pontos:</strong> +15 por acerto, +1 por tentativa</p>
        `
    };
    
    explanation.innerHTML = explanations[operation] || '<p>Selecione uma operação para ver a explicação.</p>';
}

// Gerar exercício
function generateExercise() {
    if (!currentOperation) return;
    
    let num1, num2, answer;
    
    // Definir faixa de números baseada na dificuldade
    const ranges = {
        'easy': { min: 1, max: 20 },
        'medium': { min: 10, max: 100 },
        'hard': { min: 50, max: 500 }
    };
    
    const range = ranges[currentDifficulty] || ranges.easy;
    
    // Gerar números baseados na operação
    switch(currentOperation) {
        case 'addition':
            num1 = getRandomInt(range.min, range.max);
            num2 = getRandomInt(range.min, range.max);
            answer = num1 + num2;
            if (operationSymbol) operationSymbol.textContent = '+';
            break;
            
        case 'subtraction':
            num1 = getRandomInt(range.min, range.max);
            num2 = getRandomInt(range.min, num1);
            answer = num1 - num2;
            if (operationSymbol) operationSymbol.textContent = '-';
            break;
            
        case 'multiplication':
            const multRange = {
                'easy': { min: 1, max: 10 },
                'medium': { min: 2, max: 12 },
                'hard': { min: 5, max: 20 }
            };
            const multR = multRange[currentDifficulty] || multRange.easy;
            num1 = getRandomInt(multR.min, multR.max);
            num2 = getRandomInt(multR.min, multR.max);
            answer = num1 * num2;
            if (operationSymbol) operationSymbol.textContent = '×';
            break;
            
        case 'division':
            num2 = getRandomInt(1, currentDifficulty === 'easy' ? 10 : 12);
            const quotient = getRandomInt(range.min, Math.floor(range.max / num2));
            num1 = num2 * quotient;
            answer = quotient;
            if (operationSymbol) operationSymbol.textContent = '÷';
            break;
            
        default:
            num1 = getRandomInt(1, 10);
            num2 = getRandomInt(1, 10);
            answer = num1 + num2;
            if (operationSymbol) operationSymbol.textContent = '+';
    }
    
    currentExercise = {
        num1: num1,
        num2: num2,
        answer: answer,
        operation: currentOperation,
        difficulty: currentDifficulty
    };
    
    // Atualizar display
    if (numbersDisplay) numbersDisplay.textContent = num1;
    if (numbersDisplay2) numbersDisplay2.textContent = num2;
    if (answerInput) {
        answerInput.value = '';
        answerInput.focus();
    }
    
    // Limpar feedback
    if (feedback) {
        feedback.textContent = '';
        feedback.className = 'feedback';
    }
}

// Verificar resposta
async function checkAnswer() {
    if (!currentExercise || !answerInput) return;
    
    const userAnswer = parseInt(answerInput.value);
    
    if (isNaN(userAnswer)) {
        if (feedback) {
            feedback.textContent = 'Digite um número válido!';
            feedback.className = 'feedback incorrect';
        }
        return;
    }
    
    const isCorrect = userAnswer === currentExercise.answer;
    
    // Salvar progresso
    await saveExerciseProgress(isCorrect, currentExercise.operation);
    
    // Atualizar feedback
    if (feedback) {
        if (isCorrect) {
            feedback.textContent = `🎉 Correto! ${currentExercise.num1} ${getOperationSymbol(currentExercise.operation)} ${currentExercise.num2} = ${currentExercise.answer}`;
            feedback.className = 'feedback correct';
            
            // Gerar novo exercício após 1.5 segundos
            setTimeout(generateExercise, 1500);
        } else {
            feedback.textContent = `✗ Ops! Tente novamente. ${getHint()}`;
            feedback.className = 'feedback incorrect';
        }
    }
}

// Mostrar dica
function showHint() {
    if (!feedback || !currentExercise) return;
    
    feedback.textContent = `💡 Dica: ${getHint()}`;
    feedback.className = 'feedback';
}

// Obter dica
function getHint() {
    if (!currentExercise) return '';
    
    const { num1, num2, operation } = currentExercise;
    
    switch(operation) {
        case 'addition':
            return `Pense em ${num1} + ${num2}. Você pode contar: ${num1}, ${num1 + 1}, ... até ${num1 + num2}.`;
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

// Salvar progresso do exercício
async function saveExerciseProgress(isCorrect, operation) {
    if (!user && !isDemoMode()) return;
    
    try {
        const points = isCorrect ? getPointsForOperation(operation) : 1;
        
        // Atualizar dados locais
        userProgress.exercisesCompleted = (userProgress.exercisesCompleted || 0) + 1;
        userProgress.totalAnswers = (userProgress.totalAnswers || 0) + 1;
        userProgress.totalPoints = (userProgress.totalPoints || 0) + points;
        
        if (isCorrect) {
            userProgress.correctAnswers = (userProgress.correctAnswers || 0) + 1;
        }
        
        // Atualizar estatísticas da operação
        if (!userProgress[operation]) {
            userProgress[operation] = { correct: 0, total: 0 };
        }
        userProgress[operation].total = (userProgress[operation].total || 0) + 1;
        if (isCorrect) {
            userProgress[operation].correct = (userProgress[operation].correct || 0) + 1;
        }
        
        // Atualizar nível
        userProgress.currentLevel = calculateUserLevel(userProgress);
        
        // Verificar conquistas
        checkAndUnlockAchievements();
        
        // Atualizar UI
        updateUIForLoggedInUser();
        
        // Salvar no Firebase se logado
        if (user && db) {
            const updates = {
                exercisesCompleted: firebase.firestore.FieldValue.increment(1),
                totalAnswers: firebase.firestore.FieldValue.increment(1),
                totalPoints: firebase.firestore.FieldValue.increment(points),
                currentLevel: userProgress.currentLevel,
                [`${operation}.total`]: firebase.firestore.FieldValue.increment(1)
            };
            
            if (isCorrect) {
                updates.correctAnswers = firebase.firestore.FieldValue.increment(1);
                updates[`${operation}.correct`] = firebase.firestore.FieldValue.increment(1);
            }
            
            await db.collection('users').doc(user.uid).update(updates);
        }
        
        // Salvar localmente
        localStorage.setItem('mathkids_user_data', JSON.stringify(userProgress));
        
    } catch (error) {
        console.error('Erro ao salvar progresso:', error);
    }
}

// Verificar e desbloquear conquistas
function checkAndUnlockAchievements() {
    if (!userProgress) return;
    
    const userId = user ? user.uid : 'demo';
    
    // Primeiro exercício
    if (userProgress.exercisesCompleted === 1 && !userProgress.achievements.firstExercise) {
        unlockAchievement(userId, 'firstExercise');
    }
    
    // Praticante (10 exercícios)
    if (userProgress.exercisesCompleted >= 10 && !userProgress.achievements.practice10) {
        unlockAchievement(userId, 'practice10');
    }
    
    // Atleta (50 exercícios)
    if (userProgress.exercisesCompleted >= 50 && !userProgress.achievements.practice50) {
        unlockAchievement(userId, 'practice50');
    }
    
    // Campeão (100 exercícios)
    if (userProgress.exercisesCompleted >= 100 && !userProgress.achievements.practice100) {
        unlockAchievement(userId, 'practice100');
    }
    
    // Mestre da Multiplicação
    if (userProgress.multiplication?.correct >= 50 && !userProgress.achievements.multiplicationMaster) {
        unlockAchievement(userId, 'multiplicationMaster');
    }
    
    // Especialista em Divisão
    if (userProgress.division?.correct >= 50 && !userProgress.achievements.divisionExpert) {
        unlockAchievement(userId, 'divisionExpert');
    }
    
    // Nota Perfeita (simplificado: 10 acertos seguidos)
    const recentCorrect = userProgress.correctAnswers % 10;
    if (recentCorrect === 0 && userProgress.correctAnswers > 0 && !userProgress.achievements.perfectScore) {
        unlockAchievement(userId, 'perfectScore');
    }
}

// Obter pontos por operação
function getPointsForOperation(operation) {
    switch(operation) {
        case 'multiplication':
        case 'division':
            return 15;
        default:
            return 10;
    }
}

// Obter símbolo da operação
function getOperationSymbol(operation) {
    switch(operation) {
        case 'addition': return '+';
        case 'subtraction': return '-';
        case 'multiplication': return '×';
        case 'division': return '÷';
        default: return '+';
    }
}

// ============================================
// SISTEMA DE JOGOS
// ============================================

// Selecionar jogo
function selectGame(gameId) {
    if (!user && !isDemoMode()) {
        showNotification('Faça login para jogar!', 'warning');
        openAuthModal();
        return;
    }
    
    currentGame = gameId;
    
    const gameTitles = {
        'multiplicationGame': 'Desafio Relâmpago de Multiplicação',
        'divisionGame': 'Quebra-cabeça da Divisão',
        'mixedGame': 'Campeonato MathKids'
    };
    
    if (gameTitle) {
        gameTitle.textContent = gameTitles[gameId] || 'Jogo MathKids';
    }
    
    // Ativar botão de iniciar
    if (startGameBtn) startGameBtn.disabled = false;
    if (endGameBtn) endGameBtn.disabled = true;
    if (nextGameBtn) nextGameBtn.disabled = true;
    
    // Limpar conteúdo anterior
    if (gameExercise) {
        gameExercise.innerHTML = '';
    }
    if (gameFeedback) {
        gameFeedback.textContent = '';
        gameFeedback.style.display = 'none';
    }
    
    // Mostrar instruções do jogo
    showGameInstructions(gameId);
}

// Mostrar instruções do jogo
function showGameInstructions(gameId) {
    if (!gameExercise) return;
    
    const instructions = {
        'multiplicationGame': `
            <div class="game-instructions">
                <h4>🎯 Desafio Relâmpago</h4>
                <p><strong>Objetivo:</strong> Resolva o máximo de multiplicações em 60 segundos!</p>
                <p><strong>Regras:</strong></p>
                <ul>
                    <li>Cada resposta correta vale 10 pontos</li>
                    <li>Respostas erradas não penalizam</li>
                    <li>Tente bater seu recorde!</li>
                </ul>
                <p><strong>Pronto para o desafio?</strong></p>
                <button class="btn-primary" id="readyToPlay">Estou Pronto!</button>
            </div>
        `,
        'divisionGame': `
            <div class="game-instructions">
                <h4>🧩 Quebra-cabeça da Divisão</h4>
                <p><strong>Objetivo:</strong> Complete divisões antes do tempo acabar!</p>
                <p><strong>Regras:</strong></p>
                <ul>
                    <li>Cada nível tem 5 divisões</li>
                    <li>Tempo limite por nível: 90 segundos</li>
                    <li>Bônus por tempo restante</li>
                </ul>
                <p><strong>Pronto para começar?</strong></p>
                <button class="btn-primary" id="readyToPlay">Vamos Lá!</button>
            </div>
        `,
        'mixedGame': `
            <div class="game-instructions">
                <h4>🏆 Campeonato MathKids</h4>
                <p><strong>Objetivo:</strong> Resolva operações mistas e suba no ranking!</p>
                <p><strong>Regras:</strong></p>
                <ul>
                    <li>4 níveis de dificuldade</li>
                    <li>Cada nível tem 10 questões</li>
                    <li>Pontuação progressiva</li>
                </ul>
                <p><strong>Pronto para competir?</strong></p>
                <button class="btn-primary" id="readyToPlay">Começar Competição!</button>
            </div>
        `
    };
    
    gameExercise.innerHTML = instructions[gameId] || '<p>Selecione um jogo para começar.</p>';
    
    // Adicionar evento ao botão de pronto
    setTimeout(() => {
        const readyBtn = document.getElementById('readyToPlay');
        if (readyBtn) {
            readyBtn.addEventListener('click', () => {
                if (startGameBtn) startGameBtn.disabled = false;
            });
        }
    }, 100);
}

// Iniciar jogo
function startGame() {
    if (!currentGame) return;
    
    gameActive = true;
    gameScore = 0;
    gameTimeLeft = 60;
    
    // Atualizar UI
    if (startGameBtn) startGameBtn.disabled = true;
    if (endGameBtn) endGameBtn.disabled = false;
    if (nextGameBtn) nextGameBtn.disabled = false;
    
    // Iniciar temporizador
    updateGameTimer();
    
    // Gerar primeiro exercício do jogo
    generateGameExercise();
}

// Atualizar temporizador do jogo
function updateGameTimer() {
    if (!gameActive) return;
    
    gameTimer = setInterval(() => {
        gameTimeLeft--;
        
        if (timerElement) {
            timerElement.textContent = gameTimeLeft;
        }
        
        if (gameTimeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

// Gerar exercício do jogo
function generateGameExercise() {
    if (!gameActive || !currentGame || !gameExercise) return;
    
    let num1, num2, answer, operation, symbol;
    
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
            
        default:
            return;
    }
    
    currentExercise = {
        num1: num1,
        num2: num2,
        answer: answer,
        operation: operation,
        symbol: symbol
    };
    
    // Criar interface do exercício
    gameExercise.innerHTML = `
        <div class="game-question">
            <div class="question-display">
                <div class="number">${num1}</div>
                <div class="symbol">${symbol}</div>
                <div class="number">${num2}</div>
                <div class="equals">=</div>
                <input type="number" id="gameAnswer" class="game-answer" placeholder="?" autofocus>
            </div>
            <p class="time-remaining">Tempo restante: <span id="gameTime">${gameTimeLeft}</span>s</p>
        </div>
    `;
    
    // Adicionar evento à resposta
    const gameAnswerInput = document.getElementById('gameAnswer');
    if (gameAnswerInput) {
        gameAnswerInput.focus();
        gameAnswerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                checkGameAnswer();
            }
        });
    }
}

// Verificar resposta no jogo
function checkGameAnswer() {
    if (!gameActive || !currentExercise) return;
    
    const gameAnswerInput = document.getElementById('gameAnswer');
    if (!gameAnswerInput) return;
    
    const userAnswer = parseInt(gameAnswerInput.value);
    
    if (isNaN(userAnswer)) {
        if (gameFeedback) {
            gameFeedback.textContent = 'Digite um número válido!';
            gameFeedback.style.display = 'block';
            gameFeedback.style.color = '#f87171';
        }
        return;
    }
    
    const isCorrect = userAnswer === currentExercise.answer;
    
    if (isCorrect) {
        gameScore += 10;
        if (scoreElement) {
            scoreElement.textContent = gameScore;
        }
        
        if (gameFeedback) {
            gameFeedback.textContent = `🎉 Correto! +10 pontos`;
            gameFeedback.style.display = 'block';
            gameFeedback.style.color = '#4ade80';
        }
        
        // Salvar progresso
        saveGameProgress();
        
    } else {
        if (gameFeedback) {
            gameFeedback.textContent = `✗ Errado! A resposta era ${currentExercise.answer}`;
            gameFeedback.style.display = 'block';
            gameFeedback.style.color = '#f87171';
        }
    }
    
    // Gerar próximo exercício após 1 segundo
    setTimeout(() => {
        if (gameActive) {
            generateGameExercise();
        }
    }, 1000);
}

// Salvar progresso do jogo
async function saveGameProgress() {
    if (!user && !isDemoMode()) return;
    
    try {
        // Atualizar recorde se necessário
        if (currentGame === 'multiplicationGame' && gameScore > (userProgress.gameScores?.lightning || 0)) {
            userProgress.gameScores = userProgress.gameScores || {};
            userProgress.gameScores.lightning = gameScore;
            
            // Salvar no Firebase se logado
            if (user && db) {
                await db.collection('users').doc(user.uid).update({
                    'gameScores.lightning': gameScore
                });
            }
            
            // Salvar localmente
            localStorage.setItem('mathkids_user_data', JSON.stringify(userProgress));
            
            // Atualizar UI
            updateGameHighscores();
        }
    } catch (error) {
        console.error('Erro ao salvar progresso do jogo:', error);
    }
}

// Encerrar jogo
function endGame() {
    gameActive = false;
    if (gameTimer) {
        clearInterval(gameTimer);
    }
    
    // Atualizar UI
    if (startGameBtn) startGameBtn.disabled = false;
    if (endGameBtn) endGameBtn.disabled = true;
    if (nextGameBtn) nextGameBtn.disabled = true;
    
    // Mostrar resultado final
    if (gameExercise) {
        gameExercise.innerHTML = `
            <div class="game-results">
                <h4>🏁 Fim do Jogo!</h4>
                <div class="result-stats">
                    <p><strong>Pontuação Final:</strong> ${gameScore} pontos</p>
                    <p><strong>Respostas Corretas:</strong> ${Math.floor(gameScore / 10)}</p>
                    <p><strong>Tempo Restante:</strong> ${gameTimeLeft} segundos</p>
                </div>
                ${gameScore > (userProgress.gameScores?.lightning || 0) ? 
                    '<p class="new-record">🎊 Novo Recorde! 🎊</p>' : 
                    ''}
                <button class="btn-primary" onclick="selectGame('${currentGame}')">Jogar Novamente</button>
            </div>
        `;
    }
    
    if (gameFeedback) {
        gameFeedback.textContent = 'Clique em "Iniciar Jogo" para jogar novamente!';
        gameFeedback.style.display = 'block';
        gameFeedback.style.color = '#4361ee';
    }
}

// ============================================
// GRÁFICO DE PROGRESSO
// ============================================

// Inicializar gráfico de progresso
function initializeProgressChart() {
    const ctx = document.getElementById('progressChart')?.getContext('2d');
    if (!ctx) return;
    
    progressChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Adição', 'Subtração', 'Multiplicação', 'Divisão'],
            datasets: [{
                label: 'Acertos',
                data: [0, 0, 0, 0],
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
    if (!progressChart || !userProgress) return;
    
    progressChart.data.datasets[0].data = [
        userProgress.addition?.correct || 0,
        userProgress.subtraction?.correct || 0,
        userProgress.multiplication?.correct || 0,
        userProgress.division?.correct || 0
    ];
    progressChart.update();
}

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

// Mostrar status de autenticação
function showAuthStatus(message, type = 'info') {
    if (!authStatus) return;
    
    authStatus.textContent = message;
    authStatus.className = `auth-status ${type}`;
    authStatus.style.display = 'block';
    
    // Limpar após alguns segundos para mensagens de sucesso
    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            authStatus.style.display = 'none';
        }, 3000);
    }
}

// Mostrar carregamento
function showLoading(message = 'Carregando...') {
    if (!loadingModal || !loadingText) return;
    
    loadingText.textContent = message;
    loadingModal.style.display = 'flex';
}

// Esconder carregamento
function hideLoading() {
    if (loadingModal) {
        loadingModal.style.display = 'none';
    }
}

// Mostrar notificação
function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    // Cor baseada no tipo
    switch(type) {
        case 'success':
            notification.style.backgroundColor = '#4ade80';
            break;
        case 'error':
            notification.style.backgroundColor = '#f87171';
            break;
        case 'warning':
            notification.style.backgroundColor = '#fbbf24';
            break;
        default:
            notification.style.backgroundColor = '#4361ee';
    }
    
    document.body.appendChild(notification);
    
    // Adicionar animação
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Remover após 5 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 300);
    }, 5000);
}

// Validar email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Gerar número aleatório
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Obter data atual como string (YYYY-MM-DD)
function getTodayDateString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// Verificar modo demo
function isDemoMode() {
    return !user && localStorage.getItem('mathkids_accept_demo') === 'true';
}

// ============================================
// CONFIGURAÇÃO DE EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Navegação suave
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                // Atualizar navegação ativa
                document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
                this.classList.add('active');
                
                // Rolar para a seção
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Botões de autenticação
    if (loginBtn) loginBtn.addEventListener('click', openAuthModal);
    if (showLoginBtn) showLoginBtn.addEventListener('click', openAuthModal);
    if (showRegisterBtn) showRegisterBtn.addEventListener('click', () => {
        openAuthModal();
        switchAuthTab('register');
    });
    
    if (closeModal) closeModal.addEventListener('click', closeAuthModal);
    
    // Fechar modal ao clicar fora
    if (authModal) {
        authModal.addEventListener('click', function(e) {
            if (e.target === authModal) {
                closeAuthModal();
            }
        });
    }
    
    // Trocar abas de autenticação
    authTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchAuthTab(tabName);
        });
    });
    
    // Links para trocar entre formulários
    document.querySelectorAll('[data-tab]').forEach(link => {
        if (link.tagName === 'A') {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const tabName = this.getAttribute('data-tab');
                switchAuthTab(tabName);
            });
        }
    });
    
    // Botões de login/cadastro
    if (submitLogin) submitLogin.addEventListener('click', handleEmailLogin);
    if (submitRegister) submitRegister.addEventListener('click', handleEmailRegister);
    if (submitRecover) submitRecover.addEventListener('click', handlePasswordRecovery);
    if (googleLogin) googleLogin.addEventListener('click', handleGoogleLogin);
    if (googleRegister) googleRegister.addEventListener('click', handleGoogleLogin);
    
    // Logout
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    
    // Alternar visibilidade da senha
    const toggleLoginPassword = document.getElementById('toggleLoginPassword');
    if (toggleLoginPassword) {
        toggleLoginPassword.addEventListener('click', function() {
            togglePasswordVisibility('loginPassword', this);
        });
    }
    
    const toggleRegisterPassword = document.getElementById('toggleRegisterPassword');
    if (toggleRegisterPassword) {
        toggleRegisterPassword.addEventListener('click', function() {
            togglePasswordVisibility('registerPassword', this);
        });
    }
    
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    if (toggleConfirmPassword) {
        toggleConfirmPassword.addEventListener('click', function() {
            togglePasswordVisibility('registerConfirmPassword', this);
        });
    }
    
    // Botões da hero section
    const quickPracticeBtn = document.getElementById('quickPractice');
    if (quickPracticeBtn) {
        quickPracticeBtn.addEventListener('click', function() {
            selectOperation('multiplication');
        });
    }
    
    const continueLearningBtn = document.getElementById('continueLearning');
    if (continueLearningBtn) {
        continueLearningBtn.addEventListener('click', function() {
            // Continuar da última operação ou começar com multiplicação
            if (currentOperation) {
                selectOperation(currentOperation);
            } else {
                selectOperation('multiplication');
            }
        });
    }
    
    const startDailyChallengeBtn = document.getElementById('startDailyChallenge');
    if (startDailyChallengeBtn) {
        startDailyChallengeBtn.addEventListener('click', function() {
            dailyChallengeActive = true;
            selectGame('multiplicationGame');
            document.querySelector('#games').scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    // Cartões de operação
    document.querySelectorAll('.operation-card').forEach(card => {
        card.addEventListener('click', function() {
            const operation = this.getAttribute('data-operation');
            selectOperation(operation);
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
    if (newExerciseBtn) newExerciseBtn.addEventListener('click', generateExercise);
    if (checkAnswerBtn) checkAnswerBtn.addEventListener('click', checkAnswer);
    if (showHintBtn) showHintBtn.addEventListener('click', showHint);
    
    // Entrada de resposta
    if (answerInput) {
        answerInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                checkAnswer();
            }
        });
    }
    
    // Cartões de jogo
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', function() {
            const gameId = this.id;
            selectGame(gameId);
        });
    });
    
    // Controles do jogo
    if (startGameBtn) startGameBtn.addEventListener('click', startGame);
    if (endGameBtn) endGameBtn.addEventListener('click', endGame);
    if (nextGameBtn) nextGameBtn.addEventListener('click', generateGameExercise);
    
    // Links de rodapé
    const contactSupport = document.getElementById('contactSupport');
    if (contactSupport) {
        contactSupport.addEventListener('click', function(e) {
            e.preventDefault();
            showNotification('Entre em contato: suporte@mathkids.com', 'info');
        });
    }
    
    const accountHelp = document.getElementById('accountHelp');
    if (accountHelp) {
        accountHelp.addEventListener('click', function(e) {
            e.preventDefault();
            openAuthModal();
            switchAuthTab('recover');
        });
    }
    
    // Permitir modo demo
    const demoAccept = document.getElementById('demoAccept');
    if (demoAccept) {
        demoAccept.addEventListener('click', function() {
            localStorage.setItem('mathkids_accept_demo', 'true');
            userProgress = {
                ...initialProgressData,
                username: 'Estudante Demo',
                email: 'demo@mathkids.com'
            };
            showMainContent();
            updateUIForLoggedInUser();
            showNotification('Modo demo ativado! Seu progresso será salvo localmente.', 'success');
        });
    }
}

// ============================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar Firebase
    initializeFirebase();
    
    // Configurar eventos
    setupEventListeners();
    
    // Inicializar gráfico
    initializeProgressChart();
    
    // Verificar se há usuário logado
    if (auth && auth.currentUser) {
        showLoading('Restaurando sessão...');
    } else {
        // Verificar modo demo
        if (isDemoMode()) {
            userProgress = JSON.parse(localStorage.getItem('mathkids_user_data') || '{}');
            if (Object.keys(userProgress).length > 0) {
                showMainContent();
                updateUIForLoggedInUser();
            } else {
                showWelcomeScreen();
            }
        } else {
            showWelcomeScreen();
        }
    }
    
    // Adicionar estilo para notificações
    const notificationStyle = document.createElement('style');
    notificationStyle.textContent = `
        .achievement-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4361ee, #3a0ca3);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 15px;
            animation: slideIn 0.5s ease-out;
            max-width: 350px;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(notificationStyle);
});

// ============================================
// FUNÇÕES GLOBAIS PARA ACESSO HTML
// ============================================

// Tornar funções acessíveis globalmente
window.selectOperation = selectOperation;
window.selectGame = selectGame;
window.startGame = startGame;
window.endGame = endGame;
window.generateGameExercise = generateGameExercise;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.handleLogout = handleLogout;
