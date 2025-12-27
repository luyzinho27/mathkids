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
    level: 'Iniciante',
    badges: [],
    dailyProgress: { exercises: 0, correct: 0, time: 0 }
};

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

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    try {
        app = firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
        loadSystemStats();
    } catch (error) {
        setupDemoMode();
    }
    
    setupEventListeners();
    checkAuthState();
    initializeComponents();
    
    if (auth) {
        auth.onAuthStateChanged(handleAuthStateChange);
    }
});

// Configurar event listeners
function setupEventListeners() {
    // Autenticação
    document.getElementById('showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        switchAuthForm('register');
    });
    
    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        switchAuthForm('login');
    });
    
    document.getElementById('showLoginFromRecover').addEventListener('click', (e) => {
        e.preventDefault();
        switchAuthForm('login');
    });
    
    document.getElementById('forgotPasswordLink').addEventListener('click', (e) => {
        e.preventDefault();
        switchAuthForm('recover');
    });
    
    document.getElementById('loginFormElement').addEventListener('submit', handleLogin);
    document.getElementById('registerFormElement').addEventListener('submit', handleRegister);
    document.getElementById('recoverFormElement').addEventListener('submit', handlePasswordRecovery);
    
    // Toggle de senhas
    setupPasswordToggles();
    
    // Navegação
    document.getElementById('menuToggle').addEventListener('click', openMobileSidebar);
    document.getElementById('closeSidebar').addEventListener('click', closeMobileSidebar);
    document.getElementById('sidebarOverlay').addEventListener('click', closeMobileSidebar);
    
    document.getElementById('userDropdownToggle').addEventListener('click', toggleUserDropdown);
    
    document.addEventListener('click', (e) => {
        const userDropdown = document.getElementById('userDropdown');
        const userDropdownToggle = document.getElementById('userDropdownToggle');
        if (!userDropdownToggle.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.remove('active');
        }
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('mobileLogoutBtn').addEventListener('click', handleLogout);
    
    // Notificações
    document.getElementById('notificationsToggle').addEventListener('click', toggleNotifications);
    document.getElementById('clearNotifications').addEventListener('click', clearAllNotifications);
    
    document.addEventListener('click', (e) => {
        const notificationsToggle = document.getElementById('notificationsToggle');
        const notificationsPanel = document.getElementById('notificationsPanel');
        if (!notificationsToggle.contains(e.target) && !notificationsPanel.contains(e.target)) {
            notificationsPanel.classList.remove('active');
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
    
    // Sidebar mobile
    document.querySelectorAll('.sidebar-link').forEach(link => {
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
    
    // Operações rápidas
    document.querySelectorAll('.operation-quick').forEach(operation => {
        operation.addEventListener('click', function() {
            const operationType = this.getAttribute('data-operation');
            switchSection('practice');
            loadPracticeSection(operationType);
        });
    });
    
    // Ações rápidas
    document.getElementById('quickPractice').addEventListener('click', function() {
        this.classList.add('active');
        setTimeout(() => this.classList.remove('active'), 300);
        const operations = ['addition', 'subtraction', 'multiplication', 'division'];
        const randomOperation = operations[Math.floor(Math.random() * operations.length)];
        switchSection('practice');
        loadPracticeSection(randomOperation);
    });
    
    document.getElementById('quickGame').addEventListener('click', function() {
        this.classList.add('active');
        setTimeout(() => this.classList.remove('active'), 300);
        const games = ['lightningGame', 'divisionPuzzle', 'mathChampionship'];
        const randomGame = games[Math.floor(Math.random() * games.length)];
        switchSection('games');
        startGame(randomGame);
    });
    
    // Recarregar features da tela inicial
    document.querySelectorAll('.feature').forEach(feature => {
        feature.addEventListener('click', function() {
            location.reload();
        });
    });
    
    // Modais
    document.querySelectorAll('[href="#profile"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('profile');
        });
    });
    
    document.querySelectorAll('[href="#settings"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('settings');
        });
    });
    
    // Links de termos
    document.getElementById('termsLink').addEventListener('click', (e) => {
        e.preventDefault();
        openModal('terms');
    });
    
    document.getElementById('privacyLink').addEventListener('click', (e) => {
        e.preventDefault();
        openModal('privacy');
    });
    
    document.getElementById('termsLinkFooter').addEventListener('click', (e) => {
        e.preventDefault();
        openModal('terms');
    });
    
    document.getElementById('privacyLinkFooter').addEventListener('click', (e) => {
        e.preventDefault();
        openModal('privacy');
    });
    
    document.getElementById('contactLink').addEventListener('click', (e) => {
        e.preventDefault();
        openModal('contact');
    });
    
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

// Carregar estatísticas do sistema
async function loadSystemStats() {
    try {
        if (!db) {
            updateSystemStatsUI();
            return;
        }
        
        const usersSnapshot = await db.collection('users').where('role', '==', 'student').get();
        const totalStudents = usersSnapshot.size;
        
        let totalExercises = 0;
        usersSnapshot.forEach(doc => {
            const user = doc.data();
            if (user.progress) {
                totalExercises += user.progress.exercisesCompleted || 0;
            }
        });
        
        const systemStats = {
            totalStudents,
            averageRating: 4.8,
            improvementRate: 98,
            totalExercises,
            totalUsers: usersSnapshot.size + 1
        };
        
        // Atualizar UI
        document.getElementById('statsStudents').textContent = systemStats.totalStudents.toLocaleString();
        document.getElementById('statsRating').textContent = systemStats.averageRating.toFixed(1);
        document.getElementById('statsImprovement').textContent = systemStats.improvementRate + '%';
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// Verificar autenticação
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

// Alternar formulários de autenticação
function switchAuthForm(formType) {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('recoverForm').classList.remove('active');
    
    switch(formType) {
        case 'login':
            document.getElementById('loginForm').classList.add('active');
            break;
        case 'register':
            document.getElementById('registerForm').classList.add('active');
            break;
        case 'recover':
            document.getElementById('recoverForm').classList.add('active');
            break;
    }
}

// Configurar toggles de senha
function setupPasswordToggles() {
    const toggles = [
        { button: 'toggleLoginPassword', input: 'loginPassword' },
        { button: 'toggleRegisterPassword', input: 'registerPassword' },
        { button: 'toggleRegisterConfirmPassword', input: 'registerConfirmPassword' }
    ];
    
    toggles.forEach(({ button, input }) => {
        const toggleBtn = document.getElementById(button);
        const passwordInput = document.getElementById(input);
        
        if (toggleBtn && passwordInput) {
            toggleBtn.addEventListener('click', () => {
                const type = passwordInput.type === 'password' ? 'text' : 'password';
                passwordInput.type = type;
                const icon = toggleBtn.querySelector('i');
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            });
        }
    });
}

// Login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showToast('Preencha todos os campos.', 'error');
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
        showToast('Login realizado!', 'success');
        showApp();
        
    } catch (error) {
        showLoading(false);
        handleAuthError(error);
    }
}

// Registro
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const userType = document.getElementById('userType').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    if (!name || !email || !password || !confirmPassword || !userType) {
        showToast('Preencha todos os campos.', 'error');
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
        showToast('Concorde com os termos de uso.', 'error');
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
            name,
            email,
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
        } else {
            localStorage.setItem('mathkids_user', JSON.stringify({
                ...userData,
                id: userId
            }));
        }
        
        showLoading(false);
        showToast('Conta criada com sucesso!', 'success');
        switchAuthForm('login');
        loadSystemStats();
        
    } catch (error) {
        showLoading(false);
        handleAuthError(error);
    }
}

// Recuperação de senha
async function handlePasswordRecovery(e) {
    e.preventDefault();
    
    const email = document.getElementById('recoverEmail').value.trim();
    
    if (!email) {
        showToast('Informe seu email.', 'error');
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
        
        showLoading(false);
    } catch (error) {
        showLoading(false);
        handleAuthError(error);
    }
}

// Logout
function handleLogout() {
    if (auth) {
        auth.signOut().then(logoutLocal).catch(logoutLocal);
    } else {
        logoutLocal();
    }
}

function logoutLocal() {
    localStorage.removeItem('mathkids_user');
    currentUser = null;
    
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('appScreen').style.display = 'none';
    
    document.getElementById('loginFormElement').reset();
    document.getElementById('registerFormElement').reset();
    
    switchAuthForm('login');
    showToast('Logout realizado.', 'info');
}

// Carregar dados do usuário
async function loadUserDataFromFirebase(userId) {
    try {
        const doc = await db.collection('users').doc(userId).get();
        
        if (doc.exists) {
            const data = doc.data();
            currentUser = { id: userId, ...data };
            
            if (db) {
                await db.collection('users').doc(userId).update({
                    lastLogin: new Date().toISOString()
                });
            }
            
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
    
    updateUserInfo();
    
    if (user.progress) {
        userProgress = user.progress;
        updateProgressUI();
    }
    
    if (user.settings) {
        loadUserSettings();
    }
    
    const adminNav = document.getElementById('adminNav');
    const mobileAdminLink = document.getElementById('mobileAdminLink');
    
    if (user.role === 'admin') {
        adminNav.style.display = 'flex';
        mobileAdminLink.style.display = 'flex';
    } else {
        adminNav.style.display = 'none';
        mobileAdminLink.style.display = 'none';
    }
    
    loadDashboardContent();
}

function updateUserInfo() {
    const name = currentUser.name || 'Usuário';
    const role = currentUser.role === 'admin' ? 'Administrador' : 'Aluno';
    const initials = getInitials(name);
    
    const elements = [
        document.getElementById('userName'),
        document.getElementById('dropdownUserName'),
        document.getElementById('mobileUserName'),
        document.getElementById('welcomeUserName')
    ];
    
    const roles = [
        document.getElementById('userRole'),
        document.getElementById('dropdownUserRole'),
        document.getElementById('mobileUserRole')
    ];
    
    const avatars = [
        document.getElementById('userAvatarInitials'),
        document.getElementById('dropdownAvatarInitials'),
        document.getElementById('mobileAvatarInitials')
    ];
    
    elements.forEach(el => el && (el.textContent = name));
    roles.forEach(el => el && (el.textContent = role));
    avatars.forEach(el => el && (el.textContent = initials));
    
    const badge = document.getElementById('dropdownUserRole');
    if (badge) {
        badge.textContent = role;
        badge.className = 'badge';
        badge.style.background = role === 'Administrador' ? 'var(--gradient-warning)' : 'var(--gradient-primary)';
    }
}

function getInitials(name) {
    return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
}

function updateProgressUI() {
    document.getElementById('statExercises').textContent = userProgress.exercisesCompleted || 0;
    
    const accuracy = userProgress.totalAnswers > 0 
        ? Math.round((userProgress.correctAnswers / userProgress.totalAnswers) * 100) 
        : 0;
    document.getElementById('statAccuracy').textContent = accuracy + '%';
    
    document.getElementById('statTime').textContent = Math.floor(userProgress.practiceTime / 60) + ' min';
    document.getElementById('statLevel').textContent = userProgress.level || 'Iniciante';
}

function showApp() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'block';
    switchSection('dashboard');
}

function openMobileSidebar() {
    document.getElementById('mobileSidebar').classList.add('active');
    document.getElementById('sidebarOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMobileSidebar() {
    document.getElementById('mobileSidebar').classList.remove('active');
    document.getElementById('sidebarOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

function toggleUserDropdown() {
    document.getElementById('userDropdown').classList.toggle('active');
}

function toggleNotifications() {
    document.getElementById('notificationsPanel').classList.toggle('active');
}

function clearAllNotifications() {
    const list = document.getElementById('notificationsList');
    list.innerHTML = '<p class="text-center">Nenhuma notificação</p>';
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
        loadSectionContent(sectionId);
    }
}

function updateActiveNavigation(sectionId) {
    document.querySelectorAll('.nav-link, .sidebar-link').forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href && href.substring(1) === sectionId) {
            link.classList.add('active');
        }
    });
}

function loadSectionContent(sectionId) {
    switch(sectionId) {
        case 'dashboard': loadDashboardContent(); break;
        case 'learn': loadLearnSection(); break;
        case 'practice': loadPracticeSection(); break;
        case 'games': loadGamesSection(); break;
        case 'progress': loadProgressSection(); break;
        case 'admin': loadAdminSection(); break;
    }
}

function loadDashboardContent() {
    loadRecentActivities();
    loadChallenges();
    loadLessons();
}

function loadRecentActivities() {
    const activitiesList = document.getElementById('activitiesList');
    if (!activitiesList) return;
    
    const activities = userProgress.lastActivities.slice(0, 5);
    let html = '';
    
    if (activities.length === 0) {
        html = '<p class="text-center">Nenhuma atividade recente</p>';
    } else {
        activities.forEach(activity => {
            const icon = activity.type === 'correct' ? 'fa-check-circle' :
                        activity.type === 'wrong' ? 'fa-times-circle' :
                        activity.type === 'game' ? 'fa-gamepad' : 'fa-info-circle';
            
            const scoreClass = activity.type === 'correct' ? 'correct' : 'wrong';
            const score = activity.type === 'correct' ? '+10' : '-5';
            
            html += `
                <div class="activity-item ${activity.type}">
                    <div class="activity-icon"><i class="fas ${icon}"></i></div>
                    <div class="activity-details">
                        <p>${activity.description}</p>
                        <small>${formatTimeAgo(activity.timestamp)}</small>
                    </div>
                    <span class="activity-score ${scoreClass}">${score}</span>
                </div>
            `;
        });
    }
    
    activitiesList.innerHTML = html;
}

function loadChallenges() {
    const challengesList = document.getElementById('challengesList');
    if (!challengesList) return;
    
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
        }
    ];
    
    let html = '';
    challenges.forEach(challenge => {
        const percentage = (challenge.progress / challenge.total) * 100;
        html += `
            <div class="challenge-item">
                <div class="challenge-icon"><i class="fas ${challenge.icon}"></i></div>
                <div class="challenge-info">
                    <h4>${challenge.title}</h4>
                    <p>${challenge.description}</p>
                    <div class="challenge-progress">
                        <div class="progress-bar"><div class="progress-fill" style="width: ${percentage}%"></div></div>
                        <span>${challenge.progress}/${challenge.total}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    challengesList.innerHTML = html;
}

function loadLessons() {
    const lessonsGrid = document.getElementById('lessonsGrid');
    if (!lessonsGrid) return;
    
    const lessons = [
        {
            operation: 'addition',
            icon: 'fa-plus',
            title: 'Adição',
            description: 'Descubra como somar números e encontrar totais.',
            difficulty: 'Fácil',
            lessonsCount: 5,
            duration: 30
        },
        {
            operation: 'subtraction',
            icon: 'fa-minus',
            title: 'Subtração',
            description: 'Aprenda a encontrar diferenças entre números.',
            difficulty: 'Fácil',
            lessonsCount: 5,
            duration: 35
        },
        {
            operation: 'multiplication',
            icon: 'fa-times',
            title: 'Multiplicação',
            description: 'Domine a adição repetida e aprenda as tabuadas.',
            difficulty: 'Médio',
            lessonsCount: 10,
            duration: 60,
            featured: true
        },
        {
            operation: 'division',
            icon: 'fa-divide',
            title: 'Divisão',
            description: 'Entenda como distribuir quantidades igualmente.',
            difficulty: 'Médio',
            lessonsCount: 8,
            duration: 45
        }
    ];
    
    let html = '';
    lessons.forEach(lesson => {
        html += `
            <div class="lesson-card ${lesson.featured ? 'featured' : ''}" data-operation="${lesson.operation}">
                <div class="lesson-header">
                    <div class="lesson-icon"><i class="fas ${lesson.icon}"></i></div>
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
    
    lessonsGrid.innerHTML = html;
    
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
    const activeLesson = document.getElementById('activeLesson');
    
    const lessons = {
        addition: {
            title: 'Lição: Adição',
            content: `
                <div class="lesson-content">
                    <h3>O que é Adição?</h3>
                    <p>A adição é uma das quatro operações básicas da matemática.</p>
                    <div class="lesson-example">
                        <h4><i class="fas fa-lightbulb"></i> Exemplo Prático</h4>
                        <p>3 + 5 = 8</p>
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
                    <p>A subtração é a operação inversa da adição.</p>
                    <div class="lesson-example">
                        <h4><i class="fas fa-lightbulb"></i> Exemplo Prático</h4>
                        <p>10 - 4 = 6</p>
                    </div>
                    <button class="btn-lesson-start" onclick="switchSection('practice'); loadPracticeSection('subtraction')">
                        <i class="fas fa-dumbbell"></i> Praticar Subtração
                    </button>
                </div>
            `
        }
    };
    
    if (lessons[operation]) {
        lessonTitle.textContent = lessons[operation].title;
        lessonContent.innerHTML = lessons[operation].content;
        activeLesson.style.display = 'block';
    }
}

function loadPracticeSection(operation = null) {
    const section = document.getElementById('practice');
    
    if (operation) {
        currentOperation = operation;
    }
    
    const operationName = getOperationName(currentOperation);
    const operationStats = userProgress[currentOperation] || { correct: 0, total: 0 };
    
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
                    ${generateOperationSelectors()}
                </div>
            </div>
            
            ${currentOperation ? generateExerciseSection(operationName) : '<p class="text-center">Selecione uma operação.</p>'}
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

function generateOperationSelectors() {
    const operations = [
        { id: 'addition', name: 'Adição', icon: 'plus', desc: 'Some números e encontre o total' },
        { id: 'subtraction', name: 'Subtração', icon: 'minus', desc: 'Encontre a diferença entre números' },
        { id: 'multiplication', name: 'Multiplicação', icon: 'times', desc: 'Domine as tabuadas e multiplicações' },
        { id: 'division', name: 'Divisão', icon: 'divide', desc: 'Aprenda a dividir igualmente' }
    ];
    
    return operations.map(op => `
        <div class="operation-selector ${currentOperation === op.id ? 'active' : ''}" data-operation="${op.id}">
            <div class="operation-icon"><i class="fas fa-${op.icon}"></i></div>
            <h3>${op.name}</h3>
            <p>${op.desc}</p>
            <div class="operation-stats">
                <span>Acertos: ${userProgress[op.id].correct || 0}/${userProgress[op.id].total || 0}</span>
            </div>
        </div>
    `).join('');
}

function generateExerciseSection(operationName) {
    return `
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
                    <button class="btn-exercise" id="checkExercise">Verificar</button>
                    <button class="btn-exercise secondary" id="newExercise">Novo</button>
                    <button class="btn-exercise outline" id="showHint">Dica</button>
                </div>
            </div>
        </div>
    `;
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
    
    currentExercise = { num1, num2, answer, operation: currentOperation };
    
    document.getElementById('exerciseNum1').textContent = num1;
    document.getElementById('exerciseSymbol').textContent = getOperationSymbol(currentOperation);
    document.getElementById('exerciseNum2').textContent = num2;
    
    const input = document.getElementById('exerciseAnswer');
    if (input) {
        input.value = '';
        input.focus();
    }
    
    const feedback = document.getElementById('exerciseFeedback');
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
        feedback.textContent = 'Digite um número válido!';
        feedback.className = 'exercise-feedback error';
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
        userProgress.dailyProgress.exercises++;
        userProgress.dailyProgress.correct++;
        
        setTimeout(generateExercise, 1500);
        showToast('Resposta correta! +10 pontos', 'success');
    } else {
        feedback.textContent = `❌ Ops! A resposta correta é ${currentExercise.answer}.`;
        feedback.className = 'exercise-feedback error';
        
        addActivity(`Exercício de ${getOperationName(currentExercise.operation)} errado`, 'wrong');
        userProgress.dailyProgress.exercises++;
        
        showToast('Resposta incorreta.', 'error');
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
            hint = `💡 Dica: ${currentExercise.num1} + ${currentExercise.num2} = ${currentExercise.num1 + currentExercise.num2}`;
            break;
        case 'subtraction':
            hint = `💡 Dica: ${currentExercise.num1} - ${currentExercise.num2} = ${currentExercise.num1 - currentExercise.num2}`;
            break;
        case 'multiplication':
            hint = `💡 Dica: ${currentExercise.num1} × ${currentExercise.num2} = ${currentExercise.answer}`;
            break;
        case 'division':
            hint = `💡 Dica: ${currentExercise.num1} ÷ ${currentExercise.num2} = ${currentExercise.answer}`;
            break;
    }
    
    feedback.textContent = hint;
    feedback.className = 'exercise-feedback info';
}

function loadGamesSection() {
    const section = document.getElementById('games');
    
    const content = `
        <div class="section-header">
            <div class="header-content">
                <h2><i class="fas fa-gamepad"></i> Jogos Educativos</h2>
                <p>Aprenda matemática de forma divertida com nossos jogos!</p>
            </div>
        </div>
        
        <div class="games-content">
            <div class="games-grid">
                <div class="game-card" id="lightningGame">
                    <div class="game-header">
                        <div class="game-icon"><i class="fas fa-bolt"></i></div>
                        <div class="game-badge">Popular</div>
                    </div>
                    <h3>Desafio Relâmpago</h3>
                    <p>Resolva o máximo de multiplicações em 60 segundos!</p>
                    <div class="game-stats">
                        <span><i class="fas fa-trophy"></i> Recorde: ${localStorage.getItem('mathkids_highscore_lightning') || 0}</span>
                    </div>
                    <button class="btn-game">Jogar</button>
                </div>
                
                <div class="game-card" id="divisionPuzzle">
                    <div class="game-header">
                        <div class="game-icon"><i class="fas fa-puzzle-piece"></i></div>
                        <div class="game-badge">Novo</div>
                    </div>
                    <h3>Quebra-cabeça da Divisão</h3>
                    <p>Complete o quebra-cabeça resolvendo problemas de divisão.</p>
                    <div class="game-stats">
                        <span><i class="fas fa-star"></i> Nível: ${localStorage.getItem('mathkids_division_level') || 1}</span>
                    </div>
                    <button class="btn-game">Jogar</button>
                </div>
                
                <div class="game-card" id="mathChampionship">
                    <div class="game-header">
                        <div class="game-icon"><i class="fas fa-trophy"></i></div>
                        <div class="game-badge">Competitivo</div>
                    </div>
                    <h3>Campeonato MathKids</h3>
                    <p>Enfrente operações mistas e suba no ranking.</p>
                    <div class="game-stats">
                        <span><i class="fas fa-medal"></i> Posição: #${localStorage.getItem('mathkids_ranking') || '--'}</span>
                    </div>
                    <button class="btn-game">Jogar</button>
                </div>
            </div>
            
            <div class="game-container" id="gameContainer">
                <div class="game-welcome">
                    <h3>Selecione um jogo para começar!</h3>
                    <p>Escolha um dos jogos acima para testar suas habilidades matemáticas.</p>
                </div>
            </div>
        </div>
    `;
    
    section.innerHTML = content;
    
    document.querySelectorAll('.btn-game').forEach(button => {
        button.addEventListener('click', function() {
            const gameId = this.closest('.game-card').id;
            startGame(gameId);
        });
    });
}

function startGame(gameId) {
    currentGame = gameId;
    const gameContainer = document.getElementById('gameContainer');
    
    const games = {
        lightningGame: {
            title: 'Desafio Relâmpago',
            description: 'Resolva o máximo de multiplicações em 60 segundos!',
            instructions: 'Digite a resposta correta o mais rápido possível.',
            timeLimit: 60
        },
        divisionPuzzle: {
            title: 'Quebra-cabeça da Divisão',
            description: 'Complete o quebra-cabeça resolvendo problemas de divisão.',
            instructions: 'Arraste as peças para os lugares corretos.',
            timeLimit: 120
        }
    };
    
    const game = games[gameId];
    if (!game) return;
    
    gameScore = 0;
    gameTimeLeft = game.timeLimit;
    gameActive = true;
    
    gameContainer.innerHTML = `
        <div class="game-header">
            <h3><i class="fas fa-${gameId === 'lightningGame' ? 'bolt' : 'puzzle-piece'}"></i> ${game.title}</h3>
            <div class="game-stats">
                <div class="stat"><span>Tempo:</span><span id="gameTimer">${gameTimeLeft}s</span></div>
                <div class="stat"><span>Pontuação:</span><span id="gameScore">0</span></div>
                <div class="stat"><span>Recorde:</span><span id="gameHighScore">${localStorage.getItem(`mathkids_highscore_${gameId}`) || 0}</span></div>
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
                <button class="btn-game-control" id="startGameBtn"><i class="fas fa-play"></i> Iniciar Jogo</button>
                <button class="btn-game-control secondary" id="endGameBtn" disabled><i class="fas fa-stop"></i> Parar</button>
            </div>
            
            <div class="game-feedback" id="gameFeedback"></div>
        </div>
    `;
    
    document.getElementById('startGameBtn').addEventListener('click', () => startGameSession(gameId));
    document.getElementById('endGameBtn').addEventListener('click', endGame);
}

function startGameSession(gameId) {
    gameActive = true;
    gameScore = 0;
    gameTimeLeft = gameId === 'lightningGame' ? 60 : 120;
    
    document.getElementById('startGameBtn').disabled = true;
    document.getElementById('endGameBtn').disabled = false;
    document.getElementById('gameScore').textContent = gameScore;
    
    gameTimer = setInterval(updateGameTimer, 1000);
    generateGameExercise(gameId);
}

function updateGameTimer() {
    gameTimeLeft--;
    document.getElementById('gameTimer').textContent = gameTimeLeft + 's';
    
    if (gameTimeLeft <= 0) {
        endGame();
    }
}

function generateGameExercise(gameId) {
    if (!gameActive) return;
    
    let question, answer;
    const gameQuestion = document.getElementById('gameQuestion');
    
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
    }
    
    currentExercise = { question, answer, gameId };
    
    gameQuestion.innerHTML = `
        <h4>${question}</h4>
        <div class="game-answer-input">
            <input type="number" id="gameAnswerInput" placeholder="Digite sua resposta" autofocus>
            <button id="submitGameAnswer">Responder</button>
        </div>
    `;
    
    // Adicionar estilo ao input do jogo
    const style = document.createElement('style');
    style.textContent = `
        .game-answer-input {
            display: flex;
            gap: var(--space-md);
            margin-top: var(--space-lg);
        }
        
        #gameAnswerInput {
            flex: 1;
            padding: 0.75rem 1rem;
            border: 2px solid var(--primary-500);
            border-radius: var(--radius-md);
            font-size: 1.25rem;
            font-weight: 600;
            text-align: center;
            color: var(--primary-600);
            background: white;
            transition: all var(--transition-fast);
        }
        
        #gameAnswerInput:focus {
            outline: none;
            box-shadow: 0 0 0 3px var(--primary-100);
            border-color: var(--primary-600);
        }
        
        #submitGameAnswer {
            padding: 0.75rem 1.5rem;
            background: var(--gradient-primary);
            color: white;
            border: none;
            border-radius: var(--radius-md);
            font-weight: 600;
            cursor: pointer;
            transition: all var(--transition-fast);
        }
        
        #submitGameAnswer:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
        }
    `;
    
    document.head.appendChild(style);
    
    document.getElementById('submitGameAnswer').addEventListener('click', checkGameAnswer);
    document.getElementById('gameAnswerInput').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') checkGameAnswer();
    });
    
    document.getElementById('gameAnswerInput').focus();
}

function checkGameAnswer() {
    if (!gameActive) return;
    
    const input = document.getElementById('gameAnswerInput');
    const userAnswer = parseInt(input.value);
    const feedback = document.getElementById('gameFeedback');
    
    if (isNaN(userAnswer)) {
        feedback.textContent = 'Digite um número válido!';
        feedback.className = 'game-feedback error';
        return;
    }
    
    if (userAnswer === currentExercise.answer) {
        gameScore += 10;
        document.getElementById('gameScore').textContent = gameScore;
        feedback.textContent = '🎉 Correto! +10 pontos';
        feedback.className = 'game-feedback success';
        
        if (gameTimeLeft < 60) {
            gameTimeLeft += 2;
            feedback.textContent += ' (+2s)';
        }
    } else {
        feedback.textContent = `❌ Errado! A resposta é ${currentExercise.answer}`;
        feedback.className = 'game-feedback error';
        gameTimeLeft = Math.max(0, gameTimeLeft - 5);
        feedback.textContent += ' (-5s)';
    }
    
    setTimeout(() => {
        if (gameActive) {
            generateGameExercise(currentExercise.gameId);
            feedback.textContent = '';
        }
    }, 1000);
}

function endGame() {
    gameActive = false;
    clearInterval(gameTimer);
    
    document.getElementById('startGameBtn').disabled = false;
    document.getElementById('endGameBtn').disabled = true;
    
    const gameExercise = document.getElementById('gameExercise');
    const feedback = document.getElementById('gameFeedback');
    
    gameExercise.innerHTML = `
        <div class="game-result">
            <h4>Fim do Jogo!</h4>
            <p>Sua pontuação: <strong>${gameScore}</strong> pontos</p>
            <p>Tempo restante: <strong>${gameTimeLeft}</strong> segundos</p>
        </div>
    `;
    
    feedback.textContent = 'Clique em "Iniciar Jogo" para jogar novamente!';
    feedback.className = 'game-feedback info';
    
    const highScore = localStorage.getItem(`mathkids_highscore_${currentGame}`) || 0;
    if (gameScore > highScore) {
        localStorage.setItem(`mathkids_highscore_${currentGame}`, gameScore);
        document.getElementById('gameHighScore').textContent = gameScore;
        showToast(`🎉 Novo recorde! ${gameScore} pontos`, 'success');
    }
    
    addActivity(`Jogo "${getGameName(currentGame)}" finalizado com ${gameScore} pontos`, 'game');
}

function loadProgressSection() {
    const section = document.getElementById('progress');
    
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
            
            <div class="progress-details">
                <div class="progress-chart">
                    <h3><i class="fas fa-chart-bar"></i> Desempenho por Operação</h3>
                    <canvas id="operationsChart" height="300"></canvas>
                </div>
                
                <div class="progress-history">
                    <h3><i class="fas fa-history"></i> Histórico de Atividades</h3>
                    <div class="activities-timeline" id="activitiesTimeline">
                        ${generateActivitiesTimeline()}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    section.innerHTML = content;
    
    // Inicializar gráfico corrigido
    setTimeout(() => {
        initializeOperationsChart();
    }, 100);
}

function generateActivitiesTimeline() {
    const activities = userProgress.lastActivities.slice(0, 10);
    let html = '';
    
    if (activities.length === 0) {
        html = '<p class="text-center">Nenhuma atividade registrada.</p>';
    } else {
        activities.forEach(activity => {
            const icon = activity.type === 'correct' ? 'fa-check' :
                        activity.type === 'wrong' ? 'fa-times' :
                        activity.type === 'game' ? 'fa-gamepad' : 'fa-info';
            
            const iconClass = activity.type === 'correct' ? 'success' :
                             activity.type === 'wrong' ? 'error' : 'info';
            
            html += `
                <div class="timeline-item">
                    <div class="timeline-marker ${iconClass}"><i class="fas ${icon}"></i></div>
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

function initializeOperationsChart() {
    const ctx = document.getElementById('operationsChart');
    if (!ctx) return;
    
    try {
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
        
        new Chart(ctx, {
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
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Quantidade' }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Erro ao criar gráfico:', error);
    }
}

function loadAdminSection() {
    if (!currentUser || currentUser.role !== 'admin') {
        switchSection('dashboard');
        showToast('Acesso negado. Apenas administradores.', 'error');
        return;
    }
    
    const section = document.getElementById('admin');
    
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
                        <div class="stat-icon"><i class="fas fa-users"></i></div>
                        <div class="stat-info">
                            <h3 id="totalUsers">0</h3>
                            <p>Usuários Cadastrados</p>
                        </div>
                    </div>
                    <div class="admin-stat">
                        <div class="stat-icon"><i class="fas fa-graduation-cap"></i></div>
                        <div class="stat-info">
                            <h3 id="activeStudents">0</h3>
                            <p>Alunos Ativos</p>
                        </div>
                    </div>
                </div>
                
                <div class="admin-tabs">
                    <div class="tab-headers">
                        <button class="tab-header active" data-tab="users">Gerenciar Usuários</button>
                        <button class="tab-header" data-tab="reports">Relatórios</button>
                        <button class="tab-header" data-tab="settings">Configurações</button>
                    </div>
                    
                    <div class="tab-content active" id="usersTab">
                        <div class="tab-actions">
                            <button class="btn-admin" id="refreshUsers"><i class="fas fa-sync-alt"></i> Atualizar</button>
                            <button class="btn-admin primary" id="addUser"><i class="fas fa-user-plus"></i> Adicionar</button>
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
                                        <th>Cadastro</th>
                                        <th>Status</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody id="usersTableBody">
                                    <tr><td colspan="6" class="text-center">Carregando...</td></tr>
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
                                    <option value="performance">Desempenho</option>
                                </select>
                            </div>
                            <div class="report-period">
                                <label>Período:</label>
                                <select id="reportPeriod">
                                    <option value="week">Última Semana</option>
                                    <option value="month">Último Mês</option>
                                </select>
                            </div>
                            <button class="btn-admin primary" id="generateReport"><i class="fas fa-file-export"></i> Gerar</button>
                        </div>
                        
                        <div class="report-preview" id="reportPreview">
                            <p>Selecione as opções e clique em "Gerar Relatório"</p>
                        </div>
                    </div>
                    
                    <div class="tab-content" id="settingsTab">
                        <div class="system-settings">
                            <h3>Configurações do Sistema</h3>
                            <div class="setting-group">
                                <h4><i class="fas fa-user-shield"></i> Segurança</h4>
                                <div class="setting">
                                    <label><input type="checkbox" id="allowRegistrations" checked> Permitir novos cadastros</label>
                                </div>
                            </div>
                            <button class="btn-admin primary" id="saveSettings"><i class="fas fa-save"></i> Salvar</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    section.innerHTML = content;
    setupAdminEvents();
    loadUsersTable();
}

function setupAdminEvents() {
    document.querySelectorAll('.tab-header').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            document.querySelectorAll('.tab-header').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(tabId + 'Tab').classList.add('active');
        });
    });
    
    document.getElementById('refreshUsers')?.addEventListener('click', loadUsersTable);
    document.getElementById('addUser')?.addEventListener('click', showAddUserModal);
    document.getElementById('generateReport')?.addEventListener('click', generateReport);
    document.getElementById('saveSettings')?.addEventListener('click', saveSystemSettings);
    
    document.getElementById('searchUsers')?.addEventListener('input', function(e) {
        filterUsersTable(e.target.value);
    });
}

async function loadUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Carregando...</td></tr>';
    
    try {
        let users = [];
        
        if (db) {
            const snapshot = await db.collection('users').get();
            users = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } else {
            const demoUser = JSON.parse(localStorage.getItem('mathkids_user') || '{}');
            if (demoUser.id) users = [demoUser];
        }
        
        renderUsersTable(users);
        
        // Atualizar estatísticas
        const totalUsers = users.length;
        const activeStudents = users.filter(u => u.role === 'student').length;
        
        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('activeStudents').textContent = activeStudents;
        
        // Atualizar também na tela inicial
        document.getElementById('statsStudents').textContent = activeStudents;
        
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Erro ao carregar</td></tr>';
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum usuário</td></tr>';
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
                        <button class="btn-action view" data-user="${user.id}" title="Ver"><i class="fas fa-eye"></i></button>
                        <button class="btn-action edit" data-user="${user.id}" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="btn-action delete" data-user="${user.id}" title="Excluir"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html || '<tr><td colspan="6" class="text-center">Nenhum usuário</td></tr>';
    
    // Configurar eventos
    document.querySelectorAll('.btn-action.view').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user');
            viewUserDetails(userId);
        });
    });
}

function filterUsersTable(searchTerm) {
    const rows = document.querySelectorAll('#usersTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
}

function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const reportPeriod = document.getElementById('reportPeriod').value;
    const preview = document.getElementById('reportPreview');
    
    let reportContent = '';
    
    switch(reportType) {
        case 'progress':
            reportContent = `
                <h4>Relatório de Progresso</h4>
                <p>Período: ${reportPeriod === 'week' ? 'Última Semana' : 'Último Mês'}</p>
                <div class="report-data">
                    <p>📊 Total de exercícios: ${userProgress.exercisesCompleted}</p>
                    <p>🎯 Taxa de acerto: ${userProgress.totalAnswers > 0 ? Math.round((userProgress.correctAnswers / userProgress.totalAnswers) * 100) : 0}%</p>
                </div>
            `;
            break;
        case 'usage':
            reportContent = `
                <h4>Relatório de Uso</h4>
                <p>Período: ${reportPeriod === 'week' ? 'Última Semana' : 'Último Mês'}</p>
                <div class="report-data">
                    <p>👥 Usuários ativos: ${document.getElementById('activeStudents').textContent}</p>
                    <p>📈 Jogos mais jogados: Desafio Relâmpago</p>
                </div>
            `;
            break;
    }
    
    preview.innerHTML = reportContent;
    showToast('Relatório gerado!', 'success');
}

function saveSystemSettings() {
    const settings = {
        allowRegistrations: document.getElementById('allowRegistrations').checked
    };
    
    localStorage.setItem('mathkids_system_settings', JSON.stringify(settings));
    showToast('Configurações salvas!', 'success');
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
        mathChampionship: 'Campeonato MathKids'
    };
    return names[gameId] || gameId;
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
            console.error('Error saving progress:', error);
        });
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        </div>
        <div class="toast-content">
            <p>${message}</p>
            <small>Agora</small>
        </div>
        <button class="toast-close">&times;</button>
    `;
    
    const container = document.getElementById('toastContainer');
    container.appendChild(toast);
    
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });
    
    setTimeout(() => {
        if (toast.parentNode) toast.remove();
    }, 5000);
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

function handleAuthError(error) {
    let message = 'Erro na autenticação.';
    
    if (error.code) {
        switch(error.code) {
            case 'auth/invalid-email': message = 'Email inválido.'; break;
            case 'auth/user-not-found': message = 'Usuário não encontrado.'; break;
            case 'auth/wrong-password': message = 'Senha incorreta.'; break;
            case 'auth/email-already-in-use': message = 'Email já em uso.'; break;
            case 'auth/weak-password': message = 'Senha muito fraca.'; break;
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

function setupDemoMode() {
    console.log('Modo de demonstração ativado');
    
    userProgress = {
        exercisesCompleted: 15,
        correctAnswers: 12,
        totalAnswers: 15,
        practiceTime: 45,
        addition: { correct: 4, total: 4 },
        subtraction: { correct: 3, total: 4 },
        multiplication: { correct: 3, total: 4 },
        division: { correct: 2, total: 3 },
        lastActivities: [
            { id: 1, description: 'Exercício de Multiplicação concluído', type: 'correct', timestamp: new Date().toISOString() }
        ],
        level: 'Iniciante',
        badges: [],
        dailyProgress: { exercises: 6, correct: 5, time: 27 }
    };
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

// Funções globais
window.switchSection = switchSection;
window.loadPracticeSection = loadPracticeSection;
window.loadLesson = loadLesson;
window.startGame = startGame;

console.log('MathKids Pro carregado!');
