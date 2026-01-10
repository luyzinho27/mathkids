// script.js - MathKids Pro - Versão Otimizada com Racha Cuca

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
let app, db, auth;
let currentUser = null;
let adminExists = false;

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

// Variáveis do Racha Cuca
let rachaCucaBoard = [];
let rachaCucaEmptyTileIndex = 15;
let rachaCucaMoves = 0;
let rachaCucaGameTimer = 0;
let rachaCucaTimerInterval = null;
let rachaCucaGameStarted = false;
let rachaCucaGameCompleted = false;
let rachaCucaDifficulty = 'normal';

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
    lastActivities: [],
    level: 'Iniciante'
};

// Inicialização do Firebase
try {
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    loadSystemStats();
} catch (error) {
    console.log("Modo de demonstração ativado.");
    setupDemoMode();
}

// Elementos DOM
const DOM = {
    authScreen: document.getElementById('authScreen'),
    appScreen: document.getElementById('appScreen'),
    loginForm: document.getElementById('loginFormElement'),
    registerForm: document.getElementById('registerFormElement'),
    recoverForm: document.getElementById('recoverFormElement'),
    showRegister: document.getElementById('showRegister'),
    showLogin: document.getElementById('showLogin'),
    showLoginFromRecover: document.getElementById('showLoginFromRecover'),
    forgotPasswordLink: document.getElementById('forgotPasswordLink'),
    logoutBtn: document.getElementById('logoutBtn'),
    mobileLogoutBtn: document.getElementById('mobileLogoutBtn'),
    userName: document.getElementById('userName'),
    userRole: document.getElementById('userRole'),
    userAvatarInitials: document.getElementById('userAvatarInitials'),
    welcomeUserName: document.getElementById('welcomeUserName'),
    dropdownUserName: document.getElementById('dropdownUserName'),
    dropdownUserRole: document.getElementById('dropdownUserRole'),
    dropdownAvatarInitials: document.getElementById('dropdownAvatarInitials'),
    mobileUserName: document.getElementById('mobileUserName'),
    mobileUserRole: document.getElementById('mobileUserRole'),
    mobileAvatarInitials: document.getElementById('mobileAvatarInitials'),
    adminNav: document.getElementById('adminNav'),
    mobileAdminLink: document.getElementById('mobileAdminLink'),
    menuToggle: document.getElementById('menuToggle'),
    closeSidebar: document.getElementById('closeSidebar'),
    mobileSidebar: document.getElementById('mobileSidebar'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    userDropdownToggle: document.getElementById('userDropdownToggle'),
    userDropdown: document.getElementById('userDropdown'),
    notificationsToggle: document.getElementById('notificationsToggle'),
    notificationsPanel: document.getElementById('notificationsPanel'),
    clearNotifications: document.getElementById('clearNotifications'),
    statExercises: document.getElementById('statExercises'),
    statAccuracy: document.getElementById('statAccuracy'),
    statTime: document.getElementById('statTime'),
    statLevel: document.getElementById('statLevel'),
    activitiesList: document.getElementById('activitiesList'),
    challengesList: document.getElementById('challengesList'),
    lessonsGrid: document.getElementById('lessonsGrid'),
    activeLesson: document.getElementById('activeLesson'),
    closeLesson: document.getElementById('closeLesson'),
    quickPractice: document.getElementById('quickPractice'),
    quickGame: document.getElementById('quickGame'),
    refreshDashboard: document.getElementById('refreshDashboard'),
    termsLink: document.getElementById('termsLink'),
    privacyLink: document.getElementById('privacyLink'),
    termsLinkFooter: document.getElementById('termsLinkFooter'),
    privacyLinkFooter: document.getElementById('privacyLinkFooter'),
    contactLink: document.getElementById('contactLink'),
    toastContainer: document.getElementById('toastContainer'),
    loadingOverlay: document.getElementById('loadingOverlay')
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    checkAuthState();
    initializeComponents();
    
    if (auth) {
        auth.onAuthStateChanged(handleAuthStateChange);
    }
});

// Configurar Event Listeners
function setupEventListeners() {
    // Autenticação
    DOM.showRegister?.addEventListener('click', (e) => { e.preventDefault(); switchAuthForm('register'); });
    DOM.showLogin?.addEventListener('click', (e) => { e.preventDefault(); switchAuthForm('login'); });
    DOM.showLoginFromRecover?.addEventListener('click', (e) => { e.preventDefault(); switchAuthForm('login'); });
    DOM.forgotPasswordLink?.addEventListener('click', (e) => { e.preventDefault(); switchAuthForm('recover'); });
    
    DOM.loginForm?.addEventListener('submit', handleLogin);
    DOM.registerForm?.addEventListener('submit', handleRegister);
    DOM.recoverForm?.addEventListener('submit', handlePasswordRecovery);
    
    // Navegação
    DOM.menuToggle?.addEventListener('click', openMobileSidebar);
    DOM.closeSidebar?.addEventListener('click', closeMobileSidebar);
    DOM.sidebarOverlay?.addEventListener('click', closeMobileSidebar);
    DOM.userDropdownToggle?.addEventListener('click', toggleUserDropdown);
    
    document.addEventListener('click', (e) => {
        if (!DOM.userDropdownToggle?.contains(e.target) && !DOM.userDropdown?.contains(e.target)) {
            DOM.userDropdown?.classList.remove('active');
        }
    });
    
    // Logout
    DOM.logoutBtn?.addEventListener('click', handleLogout);
    DOM.mobileLogoutBtn?.addEventListener('click', handleLogout);
    
    // Notificações
    DOM.notificationsToggle?.addEventListener('click', toggleNotifications);
    DOM.clearNotifications?.addEventListener('click', clearAllNotifications);
    
    document.addEventListener('click', (e) => {
        if (!DOM.notificationsToggle?.contains(e.target) && !DOM.notificationsPanel?.contains(e.target)) {
            DOM.notificationsPanel?.classList.remove('active');
        }
    });
    
    // Navegação entre seções
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            switchSection(sectionId);
            updateActiveNavigation(sectionId);
            closeMobileSidebar();
        });
    });
    
    // Navegação mobile
    document.querySelectorAll('.sidebar-link').forEach(link => {
        if (!link.classList.contains('logout')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const sectionId = this.getAttribute('href').substring(1);
                switchSection(sectionId);
                updateActiveNavigation(sectionId);
                closeMobileSidebar();
            });
        }
    });
    
    // Botões rápidos
    DOM.quickPractice?.addEventListener('click', () => {
        const operations = ['addition', 'subtraction', 'multiplication', 'division'];
        const randomOperation = operations[Math.floor(Math.random() * operations.length)];
        switchSection('practice');
        loadPracticeSection(randomOperation);
    });
    
    DOM.quickGame?.addEventListener('click', () => {
        const games = ['lightningGame', 'divisionPuzzle', 'mathChampionship', 'rachaCucaGame'];
        const randomGame = games[Math.floor(Math.random() * games.length)];
        switchSection('games');
        if (randomGame === 'rachaCucaGame') {
            startRachaCucaGame();
        } else {
            startGame(randomGame);
        }
    });
    
    DOM.refreshDashboard?.addEventListener('click', () => {
        loadDashboardContent();
        showToast('Dashboard atualizado!', 'success');
    });
    
    DOM.closeLesson?.addEventListener('click', () => {
        DOM.activeLesson.style.display = 'none';
    });
    
    // Operações rápidas no dashboard
    document.querySelectorAll('.operation-quick').forEach(operation => {
        operation.addEventListener('click', function() {
            const operationType = this.getAttribute('data-operation');
            switchSection('practice');
            loadPracticeSection(operationType);
        });
    });
    
    // Modal links
    [DOM.termsLink, DOM.termsLinkFooter].forEach(link => {
        link?.addEventListener('click', (e) => { e.preventDefault(); openModal('terms'); });
    });
    
    [DOM.privacyLink, DOM.privacyLinkFooter].forEach(link => {
        link?.addEventListener('click', (e) => { e.preventDefault(); openModal('privacy'); });
    });
    
    DOM.contactLink?.addEventListener('click', (e) => { e.preventDefault(); openModal('contact'); });
    
    // Fechar modais
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            closeModal(this.closest('.modal').id);
        });
    });
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });
}

// ===== FUNÇÕES DE AUTENTICAÇÃO =====
async function loadSystemStats() {
    if (!db) return;
    
    try {
        const usersSnapshot = await db.collection('users').where('role', '==', 'student').get();
        const adminSnapshot = await db.collection('users').where('role', '==', 'admin').limit(1).get();
        adminExists = !adminSnapshot.empty;
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

function checkAuthState() {
    const savedUser = localStorage.getItem('mathkids_user');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        if (user.email && user.lastLogin && (Date.now() - new Date(user.lastLogin).getTime()) < 7 * 24 * 60 * 60 * 1000) {
            loadUserData(user);
            showApp();
        }
    }
}

function switchAuthForm(formType) {
    ['login', 'register', 'recover'].forEach(type => {
        const form = document.getElementById(`${type}Form`);
        if (form) form.classList.remove('active');
    });
    
    const targetForm = document.getElementById(`${formType}Form`);
    if (targetForm) targetForm.classList.add('active');
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
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
        
    } catch (error) {
        showLoading(false);
        handleAuthError(error);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const userType = document.getElementById('userType').value;
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
        } else {
            userId = 'demo_' + Date.now();
        }
        
        const userData = {
            name,
            email,
            role: userType,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            progress: userProgress,
            settings: { theme: 'light', notifications: true, sound: true }
        };
        
        if (db) {
            await db.collection('users').doc(userId).set(userData);
            await loadSystemStats();
        } else {
            localStorage.setItem('mathkids_user', JSON.stringify({ ...userData, id: userId }));
        }
        
        if (userType === 'admin') {
            adminExists = true;
            localStorage.setItem('mathkids_admin_exists', 'true');
        }
        
        showLoading(false);
        showToast('Conta criada com sucesso!', 'success');
        switchAuthForm('login');
        
    } catch (error) {
        showLoading(false);
        handleAuthError(error);
    }
}

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
            showToast('Email de recuperação enviado!', 'success');
            switchAuthForm('login');
        } else {
            showToast('Modo demo: Verifique seu email fictício.', 'info');
        }
    } catch (error) {
        handleAuthError(error);
    } finally {
        showLoading(false);
    }
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
            email,
            role: user.role,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            progress: userProgress,
            settings: { theme: 'light', notifications: true, sound: true }
        };
        
        localStorage.setItem('mathkids_user', JSON.stringify(currentUser));
        return currentUser;
    } else {
        throw new Error('Credenciais inválidas');
    }
}

function setupDemoMode() {
    adminExists = localStorage.getItem('mathkids_admin_exists') === 'true';
}

// ===== GERENCIAMENTO DE USUÁRIO =====
function handleAuthStateChange(user) {
    if (user) {
        loadUserDataFromFirebase(user.uid);
        showApp();
    }
}

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
        console.error('Erro ao carregar dados:', error);
        showToast('Erro ao carregar dados do usuário.', 'error');
    }
}

function loadUserData(user) {
    currentUser = user;
    
    if (user.progress) {
        userProgress = user.progress;
        updateProgressUI();
    }
    
    if (user.settings) {
        loadUserSettings();
    }
    
    updateUserInfo();
    loadNotifications();
    loadDashboardContent();
}

function updateUserInfo() {
    const name = currentUser.name || 'Usuário';
    const role = currentUser.role === 'admin' ? 'Administrador' : 'Aluno';
    const initials = getInitials(name);
    
    [DOM.userName, DOM.dropdownUserName, DOM.mobileUserName, DOM.welcomeUserName].forEach(el => {
        if (el) el.textContent = name;
    });
    
    [DOM.userRole, DOM.dropdownUserRole, DOM.mobileUserRole].forEach(el => {
        if (el) el.textContent = role;
    });
    
    [DOM.userAvatarInitials, DOM.dropdownAvatarInitials, DOM.mobileAvatarInitials].forEach(el => {
        if (el) el.textContent = initials;
    });
    
    if (DOM.adminNav) DOM.adminNav.style.display = currentUser.role === 'admin' ? 'flex' : 'none';
    if (DOM.mobileAdminLink) DOM.mobileAdminLink.style.display = currentUser.role === 'admin' ? 'flex' : 'none';
}

function getInitials(name) {
    return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
}

function updateProgressUI() {
    if (DOM.statExercises) DOM.statExercises.textContent = userProgress.exercisesCompleted || 0;
    
    const accuracy = userProgress.totalAnswers > 0 
        ? Math.round((userProgress.correctAnswers / userProgress.totalAnswers) * 100) 
        : 0;
    
    if (DOM.statAccuracy) DOM.statAccuracy.textContent = accuracy + '%';
    if (DOM.statTime) DOM.statTime.textContent = Math.floor(userProgress.practiceTime / 60) + ' min';
    if (DOM.statLevel) DOM.statLevel.textContent = userProgress.level || 'Iniciante';
}

function handleLogout() {
    if (auth) {
        auth.signOut().then(() => logoutLocal()).catch(() => logoutLocal());
    } else {
        logoutLocal();
    }
}

function logoutLocal() {
    localStorage.removeItem('mathkids_user');
    currentUser = null;
    userProgress = { exercisesCompleted: 0, correctAnswers: 0, totalAnswers: 0, practiceTime: 0, addition: { correct: 0, total: 0 }, subtraction: { correct: 0, total: 0 }, multiplication: { correct: 0, total: 0 }, division: { correct: 0, total: 0 }, lastActivities: [], level: 'Iniciante' };
    
    DOM.authScreen.style.display = 'flex';
    DOM.appScreen.style.display = 'none';
    
    DOM.loginForm?.reset();
    DOM.registerForm?.reset();
    DOM.recoverForm?.reset();
    
    switchAuthForm('login');
    showToast('Logout realizado com sucesso.', 'info');
}

// ===== NAVEGAÇÃO =====
function showApp() {
    DOM.authScreen.style.display = 'none';
    DOM.appScreen.style.display = 'block';
    switchSection('dashboard');
}

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

function switchSection(sectionId) {
    document.querySelectorAll('.app-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionId;
        updateActiveNavigation(sectionId);
        loadSectionContent(sectionId);
    }
}

function updateActiveNavigation(sectionId) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });
    
    document.querySelectorAll('.sidebar-link').forEach(link => {
        if (!link.classList.contains('logout')) {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionId}`) {
                link.classList.add('active');
            }
        }
    });
}

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
            if (currentUser?.role === 'admin') {
                loadAdminSection();
            } else {
                switchSection('dashboard');
                showToast('Acesso negado. Apenas administradores.', 'error');
            }
            break;
    }
}

// ===== DASHBOARD =====
function loadDashboardContent() {
    loadRecentActivities();
    loadChallenges();
    loadLessons();
}

function loadRecentActivities() {
    if (!DOM.activitiesList) return;
    
    const activities = userProgress.lastActivities.slice(0, 5);
    let html = '';
    
    if (activities.length === 0) {
        html = '<p class="text-center">Nenhuma atividade recente</p>';
    } else {
        activities.forEach(activity => {
            const icon = activity.type === 'correct' ? 'fa-check-circle' :
                        activity.type === 'wrong' ? 'fa-times-circle' : 'fa-gamepad';
            
            const score = activity.type === 'correct' ? '+10' : '-5';
            const scoreClass = activity.type === 'correct' ? 'correct' : 'wrong';
            
            html += `
                <div class="activity-item ${activity.type}">
                    <div class="activity-icon">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="activity-details">
                        <p>${activity.description}</p>
                        <small>${formatTimeAgo(activity.timestamp)}</small>
                    </div>
                    <span class="activity-score ${scoreClass}">${score}</span>
                </div>
            `;
        });
    }
    
    DOM.activitiesList.innerHTML = html;
}

function loadChallenges() {
    if (!DOM.challengesList) return;
    
    const challenges = [
        { icon: 'fa-star', title: 'Domine a Tabuada do 7', description: 'Complete 20 multiplicações com o número 7', progress: 9, total: 20 },
        { icon: 'fa-bolt', title: 'Desafio de Velocidade', description: 'Resolva 50 operações em menos de 5 minutos', progress: 15, total: 50 },
        { icon: 'fa-trophy', title: 'Campeão da Divisão', description: 'Resolva 30 divisões sem erros', progress: 12, total: 30 }
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

// ===== APRENDER =====
function loadLearnSection() {
    if (!DOM.lessonsGrid) return;
    
    const lessons = [
        { operation: 'addition', icon: 'fa-plus', title: 'Adição', description: 'Descubra como somar números e encontrar totais.', difficulty: 'Fácil' },
        { operation: 'subtraction', icon: 'fa-minus', title: 'Subtração', description: 'Aprenda a encontrar diferenças entre números.', difficulty: 'Fácil' },
        { operation: 'multiplication', icon: 'fa-times', title: 'Multiplicação', description: 'Domine a adição repetida e aprenda as tabuadas.', difficulty: 'Médio' },
        { operation: 'division', icon: 'fa-divide', title: 'Divisão', description: 'Entenda como distribuir quantidades igualmente.', difficulty: 'Médio' }
    ];
    
    let html = '';
    lessons.forEach(lesson => {
        html += `
            <div class="lesson-card" data-operation="${lesson.operation}">
                <div class="lesson-header">
                    <div class="lesson-icon">
                        <i class="fas ${lesson.icon}"></i>
                    </div>
                    <div class="lesson-badge">${lesson.difficulty}</div>
                </div>
                <h3>${lesson.title}</h3>
                <p>${lesson.description}</p>
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

function loadLesson(operation) {
    const lessonTitle = document.getElementById('lessonTitle');
    const lessonContent = document.getElementById('lessonContent');
    
    if (!lessonTitle || !lessonContent || !DOM.activeLesson) return;
    
    const lessons = {
        addition: {
            title: 'Lição: Adição',
            content: `
                <h3>O que é Adição?</h3>
                <p>A adição representa a combinação de dois ou mais números para obter um total.</p>
                <div class="lesson-example">
                    <h4>Exemplo: 3 + 5 = 8</h4>
                    <p>Se você tem 3 maçãs e compra mais 5, você tem 8 maçãs no total.</p>
                </div>
                <button class="btn-lesson-start" onclick="switchSection('practice'); loadPracticeSection('addition')">
                    <i class="fas fa-dumbbell"></i> Praticar Adição
                </button>
            `
        },
        subtraction: {
            title: 'Lição: Subtração',
            content: `
                <h3>O que é Subtração?</h3>
                <p>A subtção é a operação inversa da adição. Ela representa a remoção de uma quantidade de outra.</p>
                <div class="lesson-example">
                    <h4>Exemplo: 10 - 4 = 6</h4>
                    <p>Se você tinha 10 reais e gastou 4, sobram 6 reais.</p>
                </div>
                <button class="btn-lesson-start" onclick="switchSection('practice'); loadPracticeSection('subtraction')">
                    <i class="fas fa-dumbbell"></i> Praticar Subtração
                </button>
            `
        },
        multiplication: {
            title: 'Lição: Multiplicação',
            content: `
                <h3>O que é Multiplicação?</h3>
                <p>A multiplicação é uma adição repetida. É uma forma mais rápida de somar o mesmo número várias vezes.</p>
                <div class="lesson-example">
                    <h4>Exemplo: 4 × 3 = 12</h4>
                    <p>Se cada pacote tem 4 bolinhas e você tem 3 pacotes, você tem 12 bolinhas (4 + 4 + 4).</p>
                </div>
                <button class="btn-lesson-start" onclick="switchSection('practice'); loadPracticeSection('multiplication')">
                    <i class="fas fa-dumbbell"></i> Praticar Multiplicação
                </button>
            `
        },
        division: {
            title: 'Lição: Divisão',
            content: `
                <h3>O que é Divisão?</h3>
                <p>A divisão é a operação inversa da multiplicação. Ela representa a distribuição igualitária.</p>
                <div class="lesson-example">
                    <h4>Exemplo: 12 ÷ 4 = 3</h4>
                    <p>Se você tem 12 chocolates para dividir entre 4 amigos, cada um recebe 3 chocolates.</p>
                </div>
                <button class="btn-lesson-start" onclick="switchSection('practice'); loadPracticeSection('division')">
                    <i class="fas fa-dumbbell"></i> Praticar Divisão
                </button>
            `
        }
    };
    
    if (lessons[operation]) {
        lessonTitle.textContent = lessons[operation].title;
        lessonContent.innerHTML = lessons[operation].content;
        DOM.activeLesson.style.display = 'block';
    }
}

// ===== PRATICAR =====
function loadPracticeSection(operation = null) {
    const section = document.getElementById('practice');
    if (!section) return;
    
    currentOperation = operation || currentOperation;
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
                    ${['addition', 'subtraction', 'multiplication', 'division'].map(op => `
                        <div class="operation-selector ${currentOperation === op ? 'active' : ''}" data-operation="${op}">
                            <div class="operation-icon">
                                <i class="fas fa-${getOperationIcon(op)}"></i>
                            </div>
                            <h3>${getOperationName(op)}</h3>
                            <p>${getOperationDescription(op)}</p>
                            <div class="operation-stats">
                                <span>Acertos: ${userProgress[op]?.correct || 0}/${userProgress[op]?.total || 0}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${currentOperation ? `
            <div class="practice-exercise">
                <div class="exercise-header">
                    <h3><i class="fas fa-${getOperationIcon(currentOperation)}"></i> Praticando ${operationName}</h3>
                    <div class="difficulty-selector">
                        <span>Dificuldade:</span>
                        <div class="difficulty-buttons">
                            ${['easy', 'medium', 'hard'].map(level => `
                                <button class="btn-difficulty ${currentDifficulty === level ? 'active' : ''}" data-level="${level}">
                                    ${level === 'easy' ? 'Fácil' : level === 'medium' ? 'Médio' : 'Difícil'}
                                </button>
                            `).join('')}
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
            ` : '<p class="text-center">Selecione uma operação para começar.</p>'}
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

function getOperationName(operation) {
    const names = { addition: 'Adição', subtraction: 'Subtração', multiplication: 'Multiplicação', division: 'Divisão' };
    return names[operation] || operation;
}

function getOperationIcon(operation) {
    const icons = { addition: 'plus', subtraction: 'minus', multiplication: 'times', division: 'divide' };
    return icons[operation] || 'question';
}

function getOperationSymbol(operation) {
    const symbols = { addition: '+', subtraction: '-', multiplication: '×', division: '÷' };
    return symbols[operation] || '?';
}

function getOperationDescription(operation) {
    const desc = {
        addition: 'Some números e encontre o total',
        subtraction: 'Encontre a diferença entre números',
        multiplication: 'Domine as tabuadas e multiplicações',
        division: 'Aprenda a dividir igualmente'
    };
    return desc[operation] || '';
}

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
        if (e.key === 'Enter') checkPracticeAnswer();
    });
}

function generateExercise() {
    if (!currentOperation) return;
    
    let num1, num2, answer;
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
            num1 = getRandomInt(1, currentDifficulty === 'hard' ? 20 : currentDifficulty === 'medium' ? 15 : 10);
            num2 = getRandomInt(1, currentDifficulty === 'hard' ? 20 : currentDifficulty === 'medium' ? 15 : 10);
            answer = num1 * num2;
            break;
        case 'division':
            num2 = getRandomInt(2, 12);
            const quotient = getRandomInt(range.min, Math.floor(range.max / num2));
            num1 = num2 * quotient;
            answer = quotient;
            break;
    }
    
    currentExercise = { num1, num2, answer, operation: currentOperation };
    
    const num1Element = document.getElementById('exerciseNum1');
    const num2Element = document.getElementById('exerciseNum2');
    const answerInput = document.getElementById('exerciseAnswer');
    const feedback = document.getElementById('exerciseFeedback');
    
    if (num1Element) num1Element.textContent = num1;
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
        feedback.textContent = `🎉 Correto! ${currentExercise.num1} ${getOperationSymbol(currentExercise.operation)} ${currentExercise.num2} = ${currentExercise.answer}`;
        feedback.className = 'exercise-feedback correct';
        userProgress.correctAnswers++;
        userProgress[currentExercise.operation].correct++;
        addActivity(`Exercício de ${getOperationName(currentExercise.operation)} concluído`, 'correct');
        setTimeout(generateExercise, 1500);
        showToast('Resposta correta! +10 pontos', 'success');
    } else {
        feedback.textContent = `❌ Ops! A resposta correta é ${currentExercise.answer}.`;
        feedback.className = 'exercise-feedback error';
        addActivity(`Exercício de ${getOperationName(currentExercise.operation)} errado`, 'wrong');
        showToast('Resposta incorreta. Tente novamente!', 'error');
    }
    
    updateProgressUI();
    saveUserProgress();
}

function showPracticeHint() {
    if (!currentExercise) return;
    
    const feedback = document.getElementById('exerciseFeedback');
    if (!feedback) return;
    
    let hint = '';
    switch(currentExercise.operation) {
        case 'addition':
            hint = `💡 Dica: ${currentExercise.num1} + ${currentExercise.num2} = ${currentExercise.answer}`;
            break;
        case 'subtraction':
            hint = `💡 Dica: Comece de ${currentExercise.num1} e conte para trás ${currentExercise.num2} unidades`;
            break;
        case 'multiplication':
            hint = `💡 Dica: ${currentExercise.num1} repetido ${currentExercise.num2} vezes`;
            break;
        case 'division':
            hint = `💡 Dica: Quantos grupos de ${currentExercise.num2} cabem em ${currentExercise.num1}?`;
            break;
    }
    
    feedback.textContent = hint;
    feedback.className = 'exercise-feedback info';
}

// ===== JOGOS =====
function loadGamesSection() {
    const section = document.getElementById('games');
    if (!section) return;
    
    const rachaCucaBestTime = localStorage.getItem('mathkids_racha_cuca_best_time') || '--';
    const lightningHighScore = localStorage.getItem('mathkids_highscore_lightning') || 0;
    
    const content = `
        <div class="section-header">
            <div class="header-content">
                <h2><i class="fas fa-gamepad"></i> Jogos Educativos</h2>
                <p>Aprenda matemática de forma divertida!</p>
            </div>
        </div>
        
        <div class="games-content">
            <div class="games-grid">
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
                        <span><i class="fas fa-trophy"></i> Recorde: ${lightningHighScore}</span>
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
                        <span><i class="fas fa-star"></i> Nível: 1</span>
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
                        <span><i class="fas fa-medal"></i> Posição: #--</span>
                    </div>
                    <button class="btn-game">Jogar Agora</button>
                </div>
                
                <div class="game-card" id="rachaCucaGame">
                    <div class="game-header">
                        <div class="game-icon">
                            <i class="fas fa-puzzle-piece"></i>
                        </div>
                        <div class="game-badge">Lógica</div>
                    </div>
                    <h3>Racha Cuca</h3>
                    <p>Organize os números na ordem correta no quebra-cabeça.</p>
                    <div class="game-stats">
                        <span><i class="fas fa-clock"></i> Melhor tempo: ${rachaCucaBestTime}</span>
                    </div>
                    <button class="btn-game">Jogar Agora</button>
                </div>
            </div>
            
            <div class="game-container" id="gameContainer">
                <div class="game-welcome">
                    <h3>Selecione um jogo para começar!</h3>
                    <p>Escolha um dos jogos acima para testar suas habilidades.</p>
                </div>
            </div>
        </div>
    `;
    
    section.innerHTML = content;
    
    document.querySelectorAll('.btn-game').forEach(button => {
        button.addEventListener('click', function() {
            const gameId = this.closest('.game-card').id;
            if (gameId === 'rachaCucaGame') {
                startRachaCucaGame();
            } else {
                startGame(gameId);
            }
        });
    });
}

function startGame(gameId) {
    currentGame = gameId;
    const gameContainer = document.getElementById('gameContainer');
    if (!gameContainer) return;
    
    const games = {
        lightningGame: { title: 'Desafio Relâmpago', description: 'Resolva o máximo de multiplicações em 60 segundos!' },
        divisionPuzzle: { title: 'Quebra-cabeça da Divisão', description: 'Complete o quebra-cabeça resolvendo problemas de divisão.' },
        mathChampionship: { title: 'Campeonato MathKids', description: 'Enfrente operações mistas e suba no ranking.' }
    };
    
    const game = games[gameId];
    if (!game) return;
    
    gameContainer.innerHTML = `
        <div class="game-header">
            <h3><i class="fas fa-${gameId === 'lightningGame' ? 'bolt' : gameId === 'divisionPuzzle' ? 'puzzle-piece' : 'trophy'}"></i> ${game.title}</h3>
            <div class="game-stats">
                <div class="stat">
                    <span>Tempo:</span>
                    <span>60s</span>
                </div>
                <div class="stat">
                    <span>Pontuação:</span>
                    <span>0</span>
                </div>
            </div>
        </div>
        
        <div class="game-content">
            <div class="game-info">
                <h4>${game.description}</h4>
                <p>Preparado? Clique em "Iniciar Jogo" para começar!</p>
            </div>
            
            <div class="game-controls">
                <button class="btn-game-control">
                    <i class="fas fa-play"></i> Iniciar Jogo
                </button>
            </div>
        </div>
    `;
}

// ===== RACHA CUCA =====
function startRachaCucaGame() {
    currentGame = 'rachaCuca';
    const gameContainer = document.getElementById('gameContainer');
    if (!gameContainer) return;
    
    gameContainer.innerHTML = `
        <div class="racha-cuca-game">
            <div class="game-header">
                <h3><i class="fas fa-puzzle-piece"></i> Racha Cuca</h3>
                <div class="game-stats">
                    <div class="stat">
                        <span>Movimentos:</span>
                        <span id="rachaCucaMoves">0</span>
                    </div>
                    <div class="stat">
                        <span>Tempo:</span>
                        <span id="rachaCucaTimer">00:00</span>
                    </div>
                </div>
            </div>
            
            <div class="game-content">
                <div class="puzzle-area">
                    <div class="instructions">
                        <h4><i class="fas fa-info-circle"></i> Como Jogar</h4>
                        <p>Clique nas peças adjacentes ao espaço vazio para organizar os números em ordem crescente.</p>
                    </div>
                    
                    <div class="puzzle-container">
                        <div id="rachaCucaBoard" class="puzzle-board"></div>
                        
                        <div class="puzzle-controls">
                            <button id="rachaCucaShuffle" class="btn-exercise">
                                <i class="fas fa-random"></i> Embaralhar
                            </button>
                            <button id="rachaCucaReset" class="btn-exercise secondary">
                                <i class="fas fa-redo"></i> Reiniciar
                            </button>
                        </div>
                    </div>
                    
                    <div class="completion-message" id="rachaCucaCompletion" style="display: none;">
                        <h4><i class="fas fa-trophy"></i> Parabéns!</h4>
                        <p>Tempo: <span id="rachaCucaFinalTime">00:00</span></p>
                        <p>Movimentos: <span id="rachaCucaFinalMoves">0</span></p>
                        <button id="rachaCucaPlayAgain" class="btn-exercise">
                            <i class="fas fa-play"></i> Jogar Novamente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    initRachaCucaGame();
    setupRachaCucaEvents();
}

function initRachaCucaGame() {
    createRachaCucaBoard();
    renderRachaCucaBoard();
    updateRachaCucaStats();
    shuffleRachaCucaBoard();
}

function createRachaCucaBoard() {
    rachaCucaBoard = [];
    for (let i = 1; i <= 15; i++) rachaCucaBoard.push(i);
    rachaCucaBoard.push(null);
    rachaCucaEmptyTileIndex = 15;
}

function renderRachaCucaBoard() {
    const boardElement = document.getElementById('rachaCucaBoard');
    if (!boardElement) return;
    
    boardElement.innerHTML = '';
    
    rachaCucaBoard.forEach((value, index) => {
        const tile = document.createElement('div');
        tile.className = 'racha-cuca-tile';
        
        if (value === null) {
            tile.classList.add('empty');
        } else {
            tile.textContent = value;
            tile.dataset.index = index;
            tile.dataset.value = value;
            
            if (value === index + 1) {
                tile.classList.add('correct-position');
            }
            
            if (isRachaCucaMovable(index)) {
                tile.classList.add('movable');
                tile.addEventListener('click', () => moveRachaCucaTile(index));
            }
        }
        
        boardElement.appendChild(tile);
    });
}

function isRachaCucaMovable(index) {
    const row = Math.floor(index / 4);
    const col = index % 4;
    const emptyRow = Math.floor(rachaCucaEmptyTileIndex / 4);
    const emptyCol = rachaCucaEmptyTileIndex % 4;
    
    return (row === emptyRow && Math.abs(col - emptyCol) === 1) || 
           (col === emptyCol && Math.abs(row - emptyRow) === 1);
}

function moveRachaCucaTile(index) {
    if (rachaCucaGameCompleted || !isRachaCucaMovable(index)) return;
    
    [rachaCucaBoard[index], rachaCucaBoard[rachaCucaEmptyTileIndex]] = [rachaCucaBoard[rachaCucaEmptyTileIndex], rachaCucaBoard[index]];
    rachaCucaEmptyTileIndex = index;
    rachaCucaMoves++;
    updateRachaCucaStats();
    
    if (!rachaCucaGameStarted) {
        startRachaCucaTimer();
        rachaCucaGameStarted = true;
    }
    
    renderRachaCucaBoard();
    
    if (checkRachaCucaWin()) {
        completeRachaCucaGame();
    }
}

function shuffleRachaCucaBoard() {
    if (rachaCucaTimerInterval) {
        clearInterval(rachaCucaTimerInterval);
        rachaCucaTimerInterval = null;
    }
    
    rachaCucaMoves = 0;
    rachaCucaGameStarted = false;
    rachaCucaGameCompleted = false;
    updateRachaCucaStats();
    resetRachaCucaTimer();
    
    document.getElementById('rachaCucaCompletion').style.display = 'none';
    
    let shuffleCount;
    switch(rachaCucaDifficulty) {
        case 'easy': shuffleCount = 20; break;
        case 'hard': shuffleCount = 100; break;
        default: shuffleCount = 50; break;
    }
    
    for (let i = 0; i < shuffleCount; i++) {
        const movableTiles = [];
        rachaCucaBoard.forEach((_, index) => {
            if (isRachaCucaMovable(index)) movableTiles.push(index);
        });
        
        if (movableTiles.length > 0) {
            const randomIndex = Math.floor(Math.random() * movableTiles.length);
            const tileToMove = movableTiles[randomIndex];
            [rachaCucaBoard[tileToMove], rachaCucaBoard[rachaCucaEmptyTileIndex]] = [rachaCucaBoard[rachaCucaEmptyTileIndex], rachaCucaBoard[tileToMove]];
            rachaCucaEmptyTileIndex = tileToMove;
        }
    }
    
    renderRachaCucaBoard();
}

function checkRachaCucaWin() {
    for (let i = 0; i < 15; i++) {
        if (rachaCucaBoard[i] !== i + 1) return false;
    }
    return rachaCucaBoard[15] === null;
}

function completeRachaCucaGame() {
    rachaCucaGameCompleted = true;
    
    if (rachaCucaTimerInterval) {
        clearInterval(rachaCucaTimerInterval);
        rachaCucaTimerInterval = null;
    }
    
    const completionMessage = document.getElementById('rachaCucaCompletion');
    const finalMoves = document.getElementById('rachaCucaFinalMoves');
    const finalTime = document.getElementById('rachaCucaFinalTime');
    
    if (completionMessage && finalMoves && finalTime) {
        finalMoves.textContent = rachaCucaMoves;
        finalTime.textContent = formatTime(rachaCucaGameTimer);
        completionMessage.style.display = 'block';
    }
    
    const currentBest = localStorage.getItem('mathkids_racha_cuca_best_time');
    if (!currentBest || rachaCucaGameTimer < parseInt(currentBest)) {
        localStorage.setItem('mathkids_racha_cuca_best_time', rachaCucaGameTimer);
        showToast(`🎉 Novo recorde! ${rachaCucaGameTimer} segundos`, 'success');
    }
    
    addActivity(`Racha Cuca concluído em ${rachaCucaMoves} movimentos`, 'game');
}

function updateRachaCucaStats() {
    const movesElement = document.getElementById('rachaCucaMoves');
    const timerElement = document.getElementById('rachaCucaTimer');
    
    if (movesElement) movesElement.textContent = rachaCucaMoves;
    if (timerElement) timerElement.textContent = formatTime(rachaCucaGameTimer);
}

function startRachaCucaTimer() {
    resetRachaCucaTimer();
    rachaCucaTimerInterval = setInterval(() => {
        rachaCucaGameTimer++;
        updateRachaCucaStats();
    }, 1000);
}

function resetRachaCucaTimer() {
    rachaCucaGameTimer = 0;
    updateRachaCucaStats();
    if (rachaCucaTimerInterval) {
        clearInterval(rachaCucaTimerInterval);
        rachaCucaTimerInterval = null;
    }
}

function setupRachaCucaEvents() {
    document.getElementById('rachaCucaShuffle')?.addEventListener('click', shuffleRachaCucaBoard);
    document.getElementById('rachaCucaReset')?.addEventListener('click', () => {
        createRachaCucaBoard();
        renderRachaCucaBoard();
        rachaCucaMoves = 0;
        rachaCucaGameStarted = false;
        rachaCucaGameCompleted = false;
        updateRachaCucaStats();
        resetRachaCucaTimer();
        document.getElementById('rachaCucaCompletion').style.display = 'none';
    });
    
    document.getElementById('rachaCucaPlayAgain')?.addEventListener('click', shuffleRachaCucaBoard);
}

// ===== PROGRESSO =====
function loadProgressSection() {
    const section = document.getElementById('progress');
    if (!section) return;
    
    const accuracy = userProgress.totalAnswers > 0 
        ? Math.round((userProgress.correctAnswers / userProgress.totalAnswers) * 100) 
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
                        <div class="stat-value">${userProgress.level}</div>
                        <div class="stat-label">Seu Nível</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    section.innerHTML = content;
}

// ===== FUNÇÕES AUXILIARES =====
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

function addActivity(description, type = 'info') {
    const activity = {
        id: Date.now(),
        description,
        type,
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
            console.error('Erro ao salvar progresso:', error);
        });
    }
}

function loadUserSettings() {
    const settings = currentUser.settings || { theme: 'light' };
    if (settings.theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

function loadNotifications() {
    const list = document.getElementById('notificationsList');
    if (!list) return;
    
    const notifications = [
        { id: 1, title: 'Bem-vindo ao MathKids Pro!', message: 'Comece a aprender matemática de forma divertida.', time: 'Agora', read: false },
        { id: 2, title: 'Novo desafio disponível', message: 'Tente o Desafio Relâmpago de Multiplicação!', time: '5 min atrás', read: false }
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

function showToast(message, type = 'info') {
    if (!DOM.toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        </div>
        <div class="toast-content">
            <p>${message}</p>
        </div>
        <button class="toast-close">&times;</button>
    `;
    
    DOM.toastContainer.appendChild(toast);
    
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });
    
    setTimeout(() => toast.remove(), 5000);
}

function showLoading(show) {
    if (!DOM.loadingOverlay) return;
    DOM.loadingOverlay.classList.toggle('active', show);
}

function handleAuthError(error) {
    let message = 'Erro na autenticação.';
    
    if (error.code) {
        switch(error.code) {
            case 'auth/invalid-email': message = 'Email inválido.'; break;
            case 'auth/user-not-found': message = 'Usuário não encontrado.'; break;
            case 'auth/wrong-password': message = 'Senha incorreta.'; break;
            case 'auth/email-already-in-use': message = 'Este email já está em uso.'; break;
            case 'auth/weak-password': message = 'A senha é muito fraca.'; break;
        }
    }
    
    showToast(message, 'error');
}

function initializeComponents() {
    // Detectar tema do sistema
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    prefersDark.addEventListener('change', (e) => {
        const settings = currentUser?.settings || { theme: 'auto' };
        if (settings.theme === 'auto') {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId + 'Modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Funções para uso global
window.switchSection = switchSection;
window.loadPracticeSection = loadPracticeSection;
window.loadLesson = loadLesson;
window.startGame = startGame;
window.startRachaCucaGame = startRachaCucaGame;
