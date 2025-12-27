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

// Inicialização do Firebase
try {
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    analytics = firebase.analytics();
    
    // Verificar estatísticas do sistema
    loadSystemStats();
} catch (error) {
    console.log("Firebase não configurado. Modo de demonstração ativado.");
    setupDemoMode();
}

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
    totalUsers: 0
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
    lastActivities: [],
    level: 'Iniciante',
    badges: [],
    dailyProgress: {
        exercises: 0,
        correct: 0,
        time: 0
    }
};

// Elementos DOM
const authScreen = document.getElementById('authScreen');
const appScreen = document.getElementById('appScreen');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const recoverForm = document.getElementById('recoverForm');
const loginFormElement = document.getElementById('loginFormElement');
const registerFormElement = document.getElementById('registerFormElement');
const recoverFormElement = document.getElementById('recoverFormElement');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const showLoginFromRecover = document.getElementById('showLoginFromRecover');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const adminOption = document.getElementById('adminOption');
const userTypeSelect = document.getElementById('userType');

// Estatísticas da tela inicial
const statsStudents = document.getElementById('statsStudents');
const statsRating = document.getElementById('statsRating');
const statsImprovement = document.getElementById('statsImprovement');

// Elementos da aplicação
const menuToggle = document.getElementById('menuToggle');
const closeSidebar = document.getElementById('closeSidebar');
const mobileSidebar = document.getElementById('mobileSidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const userDropdownToggle = document.getElementById('userDropdownToggle');
const userDropdown = document.getElementById('userDropdown');
const logoutBtn = document.getElementById('logoutBtn');
const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
const notificationsToggle = document.getElementById('notificationsToggle');
const notificationsPanel = document.getElementById('notificationsPanel');
const clearNotifications = document.getElementById('clearNotifications');
const navLinks = document.querySelectorAll('.nav-link');
const sidebarLinks = document.querySelectorAll('.sidebar-link');
const operationQuicks = document.querySelectorAll('.operation-quick');
const closeLesson = document.getElementById('closeLesson');
const quickPractice = document.getElementById('quickPractice');
const quickGame = document.getElementById('quickGame');
const refreshDashboard = document.getElementById('refreshDashboard');

// Elementos de informação do usuário
const userNameElement = document.getElementById('userName');
const userRoleElement = document.getElementById('userRole');
const userAvatarInitials = document.getElementById('userAvatarInitials');
const dropdownUserName = document.getElementById('dropdownUserName');
const dropdownUserRole = document.getElementById('dropdownUserRole');
const dropdownAvatarInitials = document.getElementById('dropdownAvatarInitials');
const mobileUserName = document.getElementById('mobileUserName');
const mobileUserRole = document.getElementById('mobileUserRole');
const mobileAvatarInitials = document.getElementById('mobileAvatarInitials');
const welcomeUserName = document.getElementById('welcomeUserName');
const adminNav = document.getElementById('adminNav');
const mobileAdminLink = document.getElementById('mobileAdminLink');

// Elementos de estatísticas
const statExercises = document.getElementById('statExercises');
const statAccuracy = document.getElementById('statAccuracy');
const statTime = document.getElementById('statTime');
const statLevel = document.getElementById('statLevel');

// Modais
const termsModal = document.getElementById('termsModal');
const privacyModal = document.getElementById('privacyModal');
const contactModal = document.getElementById('contactModal');
const profileModal = document.getElementById('profileModal');
const settingsModal = document.getElementById('settingsModal');
const termsLink = document.getElementById('termsLink');
const privacyLink = document.getElementById('privacyLink');
const termsLinkFooter = document.getElementById('termsLinkFooter');
const privacyLinkFooter = document.getElementById('privacyLinkFooter');
const contactLink = document.getElementById('contactLink');

// Toast container
const toastContainer = document.getElementById('toastContainer');

// Loading overlay
const loadingOverlay = document.getElementById('loadingOverlay');

// Quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
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

// Configurar todos os event listeners
function setupEventListeners() {
    // Alternância entre formulários de autenticação
    showRegister.addEventListener('click', function(e) {
        e.preventDefault();
        switchAuthForm('register');
    });
    
    showLogin.addEventListener('click', function(e) {
        e.preventDefault();
        switchAuthForm('login');
    });
    
    showLoginFromRecover.addEventListener('click', function(e) {
        e.preventDefault();
        switchAuthForm('login');
    });
    
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        switchAuthForm('recover');
    });
    
    // Submissão de formulários
    loginFormElement.addEventListener('submit', handleLogin);
    registerFormElement.addEventListener('submit', handleRegister);
    recoverFormElement.addEventListener('submit', handlePasswordRecovery);
    
    // Toggle de senhas
    setupPasswordToggles();
    
    // Navegação
    menuToggle.addEventListener('click', openMobileSidebar);
    closeSidebar.addEventListener('click', closeMobileSidebar);
    sidebarOverlay.addEventListener('click', closeMobileSidebar);
    
    userDropdownToggle.addEventListener('click', toggleUserDropdown);
    
    // Fechar dropdown ao clicar fora
    document.addEventListener('click', function(e) {
        if (!userDropdownToggle.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.remove('active');
        }
    });
    
    // Logout
    logoutBtn.addEventListener('click', handleLogout);
    mobileLogoutBtn.addEventListener('click', handleLogout);
    
    // Notificações
    notificationsToggle.addEventListener('click', toggleNotifications);
    clearNotifications.addEventListener('click', clearAllNotifications);
    
    // Fechar notificações ao clicar fora
    document.addEventListener('click', function(e) {
        if (!notificationsToggle.contains(e.target) && !notificationsPanel.contains(e.target)) {
            notificationsPanel.classList.remove('active');
        }
    });
    
    // Navegação entre seções
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            switchSection(sectionId);
            
            // Atualizar navegação ativa
            updateActiveNavigation(sectionId);
            
            // Fechar sidebar mobile se aberto
            closeMobileSidebar();
        });
    });
    
    // Navegação na sidebar mobile
    sidebarLinks.forEach(link => {
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
    operationQuicks.forEach(operation => {
        operation.addEventListener('click', function() {
            const operationType = this.getAttribute('data-operation');
            switchSection('practice');
            loadPracticeSection(operationType);
        });
    });
    
    closeLesson.addEventListener('click', function() {
        document.getElementById('activeLesson').style.display = 'none';
    });
    
    // Ações rápidas
    quickPractice.addEventListener('click', function() {
        const operations = ['addition', 'subtraction', 'multiplication', 'division'];
        const randomOperation = operations[Math.floor(Math.random() * operations.length)];
        switchSection('practice');
        loadPracticeSection(randomOperation);
    });
    
    quickGame.addEventListener('click', function() {
        const games = ['lightningGame', 'divisionPuzzle', 'mathChampionship'];
        const randomGame = games[Math.floor(Math.random() * games.length)];
        switchSection('games');
        startGame(randomGame);
    });
    
    refreshDashboard.addEventListener('click', function() {
        loadDashboardContent();
        showToast('Dashboard atualizado!', 'success');
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
    termsLink.addEventListener('click', function(e) {
        e.preventDefault();
        openModal('terms');
    });
    
    privacyLink.addEventListener('click', function(e) {
        e.preventDefault();
        openModal('privacy');
    });
    
    termsLinkFooter.addEventListener('click', function(e) {
        e.preventDefault();
        openModal('terms');
    });
    
    privacyLinkFooter.addEventListener('click', function(e) {
        e.preventDefault();
        openModal('privacy');
    });
    
    contactLink.addEventListener('click', function(e) {
        e.preventDefault();
        openModal('contact');
    });
    
    // Fechar modais
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            closeModal(this.closest('.modal').id);
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
                this.querySelector('i').classList.toggle('fa-eye');
                this.querySelector('i').classList.toggle('fa-eye-slash');
            });
        }
    });
}

// Carregar estatísticas do sistema
async function loadSystemStats() {
    if (!db) {
        // Modo demo
        updateSystemStatsUI();
        return;
    }
    
    try {
        // Contar usuários estudantes
        const usersSnapshot = await db.collection('users').where('role', '==', 'student').get();
        const totalStudents = usersSnapshot.size;
        
        // Calcular estatísticas agregadas
        let totalExercises = 0;
        let totalUsers = usersSnapshot.size + 1; // +1 para admin
        
        usersSnapshot.forEach(doc => {
            const user = doc.data();
            if (user.progress) {
                totalExercises += user.progress.exercisesCompleted || 0;
            }
        });
        
        // Atualizar estatísticas do sistema
        systemStats = {
            totalStudents,
            averageRating: 4.8, // Valor fixo para demonstração
            improvementRate: 98, // Valor fixo para demonstração
            totalExercises,
            totalUsers
        };
        
        // Atualizar UI
        updateSystemStatsUI();
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas do sistema:', error);
        updateSystemStatsUI(); // Usar valores padrão
    }
}

// Atualizar UI das estatísticas do sistema
function updateSystemStatsUI() {
    statsStudents.textContent = systemStats.totalStudents.toLocaleString();
    statsRating.textContent = systemStats.averageRating.toFixed(1);
    statsImprovement.textContent = systemStats.improvementRate + '%';
}

// Verificar estado de autenticação
function checkAuthState() {
    const savedUser = localStorage.getItem('mathkids_user');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        if (user.email && user.lastLogin && (Date.now() - new Date(user.lastLogin).getTime()) < 7 * 24 * 60 * 60 * 1000) {
            // Usuário logado recentemente (menos de 7 dias)
            loadUserData(user);
            showApp();
        }
    }
}

// Alternar entre formulários de autenticação
function switchAuthForm(formType) {
    // Esconder todos os formulários
    loginForm.classList.remove('active');
    registerForm.classList.remove('active');
    recoverForm.classList.remove('active');
    
    // Mostrar o formulário selecionado
    switch(formType) {
        case 'login':
            loginForm.classList.add('active');
            break;
        case 'register':
            registerForm.classList.add('active');
            checkAdminOption();
            break;
        case 'recover':
            recoverForm.classList.add('active');
            break;
    }
}

// Verificar se deve mostrar opção de admin
async function checkAdminOption() {
    if (adminExists) {
        adminOption.disabled = true;
        adminOption.title = "Já existe um administrador. Contate o administrador atual para acesso.";
    } else {
        adminOption.disabled = false;
        adminOption.title = "Se torne o administrador principal";
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
            // Firebase Auth
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            await loadUserDataFromFirebase(userCredential.user.uid);
        } else {
            // Modo demo
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

// Manipular cadastro
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const userType = document.getElementById('userType').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    // Validações
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
            // Firebase Auth
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            userId = userCredential.user.uid;
            
            // Enviar verificação de email
            await userCredential.user.sendEmailVerification();
        } else {
            // Modo demo
            userId = 'demo_' + Date.now();
        }
        
        // Criar dados do usuário
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
        
        // Salvar no Firebase ou localStorage
        if (db) {
            await db.collection('users').doc(userId).set(userData);
        } else {
            localStorage.setItem('mathkids_user', JSON.stringify({
                ...userData,
                id: userId
            }));
        }
        
        // Se for admin, atualizar flag
        if (userType === 'admin') {
            adminExists = true;
            localStorage.setItem('mathkids_admin_exists', 'true');
        }
        
        // Atualizar estatísticas do sistema
        systemStats.totalStudents++;
        systemStats.totalUsers++;
        updateSystemStatsUI();
        
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
            console.error('Logout error:', error);
            logoutLocal();
        });
    } else {
        logoutLocal();
    }
}

function logoutLocal() {
    // Limpar dados locais
    localStorage.removeItem('mathkids_user');
    currentUser = null;
    userData = {};
    
    // Mostrar tela de autenticação
    authScreen.style.display = 'flex';
    appScreen.style.display = 'none';
    
    // Limpar formulários
    loginFormElement.reset();
    registerFormElement.reset();
    recoverFormElement.reset();
    
    // Mostrar formulário de login
    switchAuthForm('login');
    
    showToast('Logout realizado com sucesso.', 'info');
}

// Manipular mudança de estado de autenticação
function handleAuthStateChange(user) {
    if (user) {
        // Usuário está logado
        loadUserDataFromFirebase(user.uid);
        showApp();
    } else {
        // Usuário não está logado
        console.log('User is signed out');
    }
}

// Carregar dados do usuário do Firebase
async function loadUserDataFromFirebase(userId) {
    try {
        const doc = await db.collection('users').doc(userId).get();
        
        if (doc.exists) {
            const data = doc.data();
            currentUser = { id: userId, ...data };
            
            // Atualizar último login
            await db.collection('users').doc(userId).update({
                lastLogin: new Date().toISOString()
            });
            
            // Salvar localmente
            localStorage.setItem('mathkids_user', JSON.stringify({
                ...data,
                id: userId,
                lastLogin: new Date().toISOString()
            }));
            
            // Carregar interface
            loadUserData(currentUser);
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showToast('Erro ao carregar dados do usuário.', 'error');
    }
}

// Carregar dados do usuário
function loadUserData(user) {
    currentUser = user;
    userData = user;
    
    // Atualizar informações do usuário na interface
    updateUserInfo();
    
    // Carregar progresso
    if (user.progress) {
        userProgress = user.progress;
        updateProgressUI();
    }
    
    // Carregar configurações
    if (user.settings) {
        loadUserSettings();
    }
    
    // Mostrar/ocultar admin nav
    if (user.role === 'admin') {
        adminNav.style.display = 'flex';
        mobileAdminLink.style.display = 'flex';
    } else {
        adminNav.style.display = 'none';
        mobileAdminLink.style.display = 'none';
    }
    
    // Carregar notificações
    loadNotifications();
    
    // Carregar conteúdo do dashboard
    loadDashboardContent();
}

// Atualizar informações do usuário na interface
function updateUserInfo() {
    const name = currentUser.name || 'Usuário';
    const role = currentUser.role === 'admin' ? 'Administrador' : 'Aluno';
    const initials = getInitials(name);
    
    userNameElement.textContent = name;
    userRoleElement.textContent = role;
    userAvatarInitials.textContent = initials;
    dropdownUserName.textContent = name;
    dropdownUserRole.textContent = role;
    dropdownAvatarInitials.textContent = initials;
    mobileUserName.textContent = name;
    mobileUserRole.textContent = role;
    mobileAvatarInitials.textContent = initials;
    welcomeUserName.textContent = name;
    
    // Atualizar badge de role
    const badge = dropdownUserRole;
    badge.textContent = role;
    badge.className = 'badge';
    
    if (role === 'Administrador') {
        badge.style.background = 'var(--gradient-warning)';
    } else {
        badge.style.background = 'var(--gradient-primary)';
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
    // Estatísticas do dashboard
    statExercises.textContent = userProgress.exercisesCompleted || 0;
    
    const accuracy = userProgress.totalAnswers > 0 
        ? Math.round((userProgress.correctAnswers / userProgress.totalAnswers) * 100) 
        : 0;
    statAccuracy.textContent = accuracy + '%';
    
    statTime.textContent = Math.floor(userProgress.practiceTime / 60) + ' min';
    statLevel.textContent = userProgress.level || 'Iniciante';
}

// Mostrar aplicação
function showApp() {
    authScreen.style.display = 'none';
    appScreen.style.display = 'block';
    
    // Carregar seção inicial
    switchSection('dashboard');
}

// Alternar sidebar mobile
function openMobileSidebar() {
    mobileSidebar.classList.add('active');
    sidebarOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMobileSidebar() {
    mobileSidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

function toggleUserDropdown() {
    userDropdown.classList.toggle('active');
}

// Alternar painel de notificações
function toggleNotifications() {
    notificationsPanel.classList.toggle('active');
}

function clearAllNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    notificationsList.innerHTML = '<p class="text-center">Nenhuma notificação</p>';
    document.getElementById('notificationCount').textContent = '0';
    showToast('Notificações limpas.', 'success');
}

// Alternar seção
function switchSection(sectionId) {
    // Esconder todas as seções
    document.querySelectorAll('.app-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostrar seção selecionada
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionId;
        
        // Carregar conteúdo dinâmico se necessário
        loadSectionContent(sectionId);
    }
}

// Atualizar navegação ativa
function updateActiveNavigation(sectionId) {
    // Atualizar nav principal
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });
    
    // Atualizar sidebar mobile
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
    // Carregar atividades recentes
    loadRecentActivities();
    
    // Carregar desafios
    loadChallenges();
    
    // Carregar lições
    loadLessons();
}

// Carregar atividades recentes
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
            
            const scoreClass = activity.type === 'correct' ? 'correct' :
                              activity.type === 'wrong' ? 'wrong' : '';
            
            const score = activity.type === 'correct' ? '+10' :
                         activity.type === 'wrong' ? '-5' : '';
            
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
    
    activitiesList.innerHTML = html;
}

// Carregar desafios
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
        },
        {
            icon: 'fa-trophy',
            title: 'Campeão da Divisão',
            description: 'Resolva 30 divisões sem erros',
            progress: 12,
            total: 30
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
    
    challengesList.innerHTML = html;
}

// Carregar lições
function loadLessons() {
    const lessonsGrid = document.getElementById('lessonsGrid');
    if (!lessonsGrid) return;
    
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
    
    lessonsGrid.innerHTML = html;
    
    // Configurar eventos das lições
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
    const activeLesson = document.getElementById('activeLesson');
    
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
        activeLesson.style.display = 'block';
        
        // Adicionar estilo para o conteúdo da lição
        const style = document.createElement('style');
        style.textContent = `
            .lesson-content {
                display: flex;
                flex-direction: column;
                gap: var(--space-xl);
            }
            
            .lesson-content h3 {
                font-size: 1.5rem;
                color: var(--text-primary);
            }
            
            .lesson-content p {
                color: var(--text-secondary);
                line-height: 1.6;
            }
            
            .lesson-example, .lesson-tip, .multiplication-table, .division-types {
                background: var(--bg-secondary);
                border-radius: var(--radius-lg);
                padding: var(--space-lg);
                border-left: 4px solid var(--primary-500);
            }
            
            .lesson-example h4, .lesson-tip h4, .multiplication-table h4, .division-types h4 {
                font-size: 1rem;
                margin-bottom: var(--space-md);
                color: var(--text-primary);
                display: flex;
                align-items: center;
                gap: var(--space-sm);
            }
            
            .example-display {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
                margin: var(--space-md) 0;
                flex-wrap: wrap;
            }
            
            .example-number, .example-symbol {
                font-size: 1.5rem;
                font-weight: 600;
                padding: var(--space-sm) var(--space-md);
                background: var(--bg-primary);
                border-radius: var(--radius-md);
            }
            
            .example-number {
                color: var(--primary-600);
            }
            
            .example-symbol {
                color: var(--text-primary);
            }
            
            .table-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: var(--space-sm);
                margin-top: var(--space-md);
            }
            
            .table-grid span {
                padding: var(--space-sm);
                background: var(--bg-primary);
                border-radius: var(--radius-md);
                text-align: center;
                font-size: 0.875rem;
            }
            
            .btn-lesson-start {
                margin-top: var(--space-xl);
                padding: var(--space-md) var(--space-xl);
                background: var(--gradient-primary);
                color: white;
                border: none;
                border-radius: var(--radius-md);
                font-weight: 600;
                font-size: 1rem;
                cursor: pointer;
                transition: all var(--transition-normal);
                display: flex;
                align-items: center;
                justify-content: center;
                gap: var(--space-sm);
                width: 100%;
            }
            
            .btn-lesson-start:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-md);
            }
        `;
        
        // Remover estilo anterior se existir
        const existingStyle = document.getElementById('lessonStyle');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        style.id = 'lessonStyle';
        document.head.appendChild(style);
    }
}

// Carregar seção de prática
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
    
    // Configurar eventos
    if (currentOperation) {
        setupPracticeEvents();
        generateExercise();
    }
    
    // Configurar seletores de operação
    document.querySelectorAll('.operation-selector').forEach(selector => {
        selector.addEventListener('click', function() {
            const operation = this.getAttribute('data-operation');
            loadPracticeSection(operation);
        });
    });
}

// Configurar eventos da prática
function setupPracticeEvents() {
    // Dificuldade
    document.querySelectorAll('.btn-difficulty').forEach(btn => {
        btn.addEventListener('click', function() {
            currentDifficulty = this.getAttribute('data-level');
            document.querySelectorAll('.btn-difficulty').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            generateExercise();
        });
    });
    
    // Controles do exercício
    document.getElementById('checkExercise')?.addEventListener('click', checkPracticeAnswer);
    document.getElementById('newExercise')?.addEventListener('click', generateExercise);
    document.getElementById('showHint')?.addEventListener('click', showPracticeHint);
    
    // Enter para verificar resposta
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
    
    // Atualizar display
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
    
    // Atualizar estatísticas
    userProgress.exercisesCompleted++;
    userProgress.totalAnswers++;
    userProgress[currentExercise.operation].total++;
    
    if (userAnswer === currentExercise.answer) {
        // Resposta correta
        feedback.textContent = `🎉 Correto! ${currentExercise.num1} ${currentExercise.symbol} ${currentExercise.num2} = ${currentExercise.answer}`;
        feedback.className = 'exercise-feedback correct';
        userProgress.correctAnswers++;
        userProgress[currentExercise.operation].correct++;
        
        // Adicionar atividade recente
        addActivity(`Exercício de ${getOperationName(currentExercise.operation)} concluído`, 'correct');
        
        // Atualizar progresso diário
        userProgress.dailyProgress.exercises++;
        userProgress.dailyProgress.correct++;
        
        // Gerar novo exercício após 1.5 segundos
        setTimeout(generateExercise, 1500);
        
        showToast('Resposta correta! +10 pontos', 'success');
    } else {
        // Resposta incorreta
        feedback.textContent = `❌ Ops! A resposta correta é ${currentExercise.answer}. Tente novamente!`;
        feedback.className = 'exercise-feedback error';
        
        // Adicionar atividade recente
        addActivity(`Exercício de ${getOperationName(currentExercise.operation)} errado`, 'wrong');
        
        // Atualizar progresso diário
        userProgress.dailyProgress.exercises++;
        
        showToast('Resposta incorreta. Tente novamente!', 'error');
    }
    
    // Atualizar UI
    updateProgressUI();
    saveUserProgress();
    
    // Atualizar estatísticas do sistema
    systemStats.totalExercises++;
    updateSystemStatsUI();
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

// Carregar seção de jogos
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
    
    // Configurar eventos dos jogos
    document.querySelectorAll('.btn-game').forEach(button => {
        button.addEventListener('click', function() {
            const gameId = this.closest('.game-card').id;
            startGame(gameId);
        });
    });
}

// Iniciar jogo
function startGame(gameId) {
    currentGame = gameId;
    const gameContainer = document.getElementById('gameContainer');
    
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
    
    // Configurar eventos do jogo
    setupGameEvents(gameId);
}

// Configurar eventos do jogo
function setupGameEvents(gameId) {
    document.getElementById('startGameBtn').addEventListener('click', () => startGameSession(gameId));
    document.getElementById('endGameBtn').addEventListener('click', endGame);
    document.getElementById('howToPlayBtn').addEventListener('click', showHowToPlay);
}

// Iniciar sessão do jogo
function startGameSession(gameId) {
    gameActive = true;
    gameScore = 0;
    gameTimeLeft = gameId === 'lightningGame' ? 60 : gameId === 'divisionPuzzle' ? 120 : 90;
    
    // Atualizar UI
    document.getElementById('startGameBtn').disabled = true;
    document.getElementById('endGameBtn').disabled = false;
    document.getElementById('gameScore').textContent = gameScore;
    
    // Iniciar timer
    gameTimer = setInterval(updateGameTimer, 1000);
    
    // Gerar primeiro exercício
    generateGameExercise(gameId);
}

// Atualizar timer do jogo
function updateGameTimer() {
    gameTimeLeft--;
    document.getElementById('gameTimer').textContent = gameTimeLeft + 's';
    
    if (gameTimeLeft <= 0) {
        endGame();
    }
}

// Gerar exercício do jogo
function generateGameExercise(gameId) {
    if (!gameActive) return;
    
    let question, answer;
    const gameExercise = document.getElementById('gameExercise');
    const gameQuestion = document.getElementById('gameQuestion');
    
    switch(gameId) {
        case 'lightningGame':
            // Multiplicação
            const num1 = getRandomInt(1, 12);
            const num2 = getRandomInt(1, 12);
            question = `${num1} × ${num2} = ?`;
            answer = num1 * num2;
            break;
            
        case 'divisionPuzzle':
            // Divisão
            const divisor = getRandomInt(2, 12);
            const quotient = getRandomInt(2, 12);
            const dividend = divisor * quotient;
            question = `${dividend} ÷ ${divisor} = ?`;
            answer = quotient;
            break;
            
        case 'mathChampionship':
            // Operação mista
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
        <div class="game-answer-input">
            <input type="number" id="gameAnswerInput" placeholder="Digite sua resposta" autofocus>
            <button id="submitGameAnswer">Responder</button>
        </div>
    `;
    
    // Configurar evento de resposta
    document.getElementById('submitGameAnswer').addEventListener('click', checkGameAnswer);
    document.getElementById('gameAnswerInput').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') checkGameAnswer();
    });
    
    // Focar no input
    document.getElementById('gameAnswerInput').focus();
}

// Verificar resposta do jogo
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
        // Resposta correta
        gameScore += 10;
        document.getElementById('gameScore').textContent = gameScore;
        feedback.textContent = '🎉 Correto! +10 pontos';
        feedback.className = 'game-feedback success';
        
        // Adicionar tempo extra para respostas rápidas
        if (gameTimeLeft < 60) {
            gameTimeLeft += 2;
            feedback.textContent += ' (+2s)';
        }
    } else {
        // Resposta incorreta
        feedback.textContent = `❌ Errado! A resposta correta é ${currentExercise.answer}`;
        feedback.className = 'game-feedback error';
        
        // Penalidade de tempo
        gameTimeLeft = Math.max(0, gameTimeLeft - 5);
        feedback.textContent += ' (-5s)';
    }
    
    // Gerar próximo exercício após 1 segundo
    setTimeout(() => {
        if (gameActive) {
            generateGameExercise(currentExercise.gameId);
            feedback.textContent = '';
        }
    }, 1000);
}

// Mostrar como jogar
function showHowToPlay() {
    const feedback = document.getElementById('gameFeedback');
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
    
    // Atualizar UI
    document.getElementById('startGameBtn').disabled = false;
    document.getElementById('endGameBtn').disabled = true;
    
    const gameExercise = document.getElementById('gameExercise');
    const feedback = document.getElementById('gameFeedback');
    
    gameExercise.innerHTML = `
        <div class="game-result">
            <h4>Fim do Jogo!</h4>
            <p>Sua pontuação: <strong>${gameScore}</strong> pontos</p>
            <p>Respostas corretas: <strong>${Math.floor(gameScore / 10)}</strong></p>
            <p>Tempo restante: <strong>${gameTimeLeft}</strong> segundos</p>
        </div>
    `;
    
    feedback.textContent = 'Clique em "Iniciar Jogo" para jogar novamente!';
    feedback.className = 'game-feedback info';
    
    // Atualizar recorde se necessário
    if (gameScore > gameHighScore) {
        gameHighScore = gameScore;
        localStorage.setItem(`mathkids_highscore_${currentGame}`, gameHighScore);
        document.getElementById('gameHighScore').textContent = gameHighScore;
        showToast(`🎉 Novo recorde! ${gameHighScore} pontos`, 'success');
    }
    
    // Adicionar atividade
    addActivity(`Jogo "${getGameName(currentGame)}" finalizado com ${gameScore} pontos`, 'game');
}

// Carregar seção de progresso
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
            
            <div class="progress-badges">
                <h3><i class="fas fa-award"></i> Conquistas</h3>
                <div class="badges-grid" id="badgesGrid">
                    ${generateBadges()}
                </div>
            </div>
        </div>
    `;
    
    section.innerHTML = content;
    
    // Inicializar gráfico
    initializeOperationsChart();
}

// Carregar seção de administração
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
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="systemAccuracy">78%</h3>
                            <p>Taxa de Acerto Geral</p>
                        </div>
                    </div>
                </div>
                
                <div class="admin-tabs">
                    <div class="tab-headers">
                        <button class="tab-header active" data-tab="users">Gerenciar Usuários</button>
                        <button class="tab-header" data-tab="reports">Relatórios</button>
                        <button class="tab-header" data-tab="settings">Configurações do Sistema</button>
                    </div>
                    
                    <div class="tab-content active" id="usersTab">
                        <div class="tab-actions">
                            <button class="btn-admin" id="refreshUsers">
                                <i class="fas fa-sync-alt"></i> Atualizar
                            </button>
                            <button class="btn-admin primary" id="addUser">
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
    `;
    
    section.innerHTML = content;
    
    // Configurar eventos de administração
    setupAdminEvents();
}

// Configurar eventos de administração
function setupAdminEvents() {
    // Tabs
    document.querySelectorAll('.tab-header').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Atualizar tabs ativas
            document.querySelectorAll('.tab-header').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(tabId + 'Tab').classList.add('active');
        });
    });
    
    // Botões
    document.getElementById('refreshUsers')?.addEventListener('click', loadUsersTable);
    document.getElementById('addUser')?.addEventListener('click', showAddUserModal);
    document.getElementById('generateReport')?.addEventListener('click', generateReport);
    document.getElementById('saveSettings')?.addEventListener('click', saveSystemSettings);
    
    // Busca de usuários
    document.getElementById('searchUsers')?.addEventListener('input', function(e) {
        filterUsersTable(e.target.value);
    });
    
    // Carregar tabela de usuários
    loadUsersTable();
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
            // Firebase
            const snapshot = await db.collection('users').get();
            users = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } else {
            // Modo demo
            const demoUser = JSON.parse(localStorage.getItem('mathkids_user') || '{}');
            if (demoUser.id) {
                users = [demoUser];
            }
            
            // Adicionar mais usuários de exemplo
            for (let i = 1; i <= 5; i++) {
                users.push({
                    id: `demo_student_${i}`,
                    name: `Aluno Exemplo ${i}`,
                    email: `aluno${i}@exemplo.com`,
                    role: 'student',
                    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
                    verified: i % 2 === 0
                });
            }
        }
        
        renderUsersTable(users);
        
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
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
        // Não mostrar o próprio usuário admin atual
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
                        <button class="btn-action view" data-user="${user.id}" title="Ver detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action edit" data-user="${user.id}" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action delete" data-user="${user.id}" title="Excluir">
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
    
    // Configurar eventos dos botões de ação
    setupUserActionButtons();
}

// Configurar botões de ação de usuários
function setupUserActionButtons() {
    document.querySelectorAll('.btn-action.view').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user');
            viewUserDetails(userId);
        });
    });
    
    document.querySelectorAll('.btn-action.edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user');
            editUser(userId);
        });
    });
    
    document.querySelectorAll('.btn-action.delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user');
            deleteUser(userId);
        });
    });
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
    
    let reportContent = '';
    
    switch(reportType) {
        case 'progress':
            reportContent = `
                <h4>Relatório de Progresso dos Alunos</h4>
                <p>Período: ${getPeriodName(reportPeriod)}</p>
                <div class="report-data">
                    <p>📊 Total de exercícios concluídos: ${systemStats.totalExercises}</p>
                    <p>🎯 Taxa média de acerto: 78%</p>
                    <p>👥 Alunos ativos: ${systemStats.totalStudents}</p>
                    <p>⏰ Tempo médio de prática: 45 minutos/aluno</p>
                </div>
            `;
            break;
            
        case 'usage':
            reportContent = `
                <h4>Relatório de Uso do Sistema</h4>
                <p>Período: ${getPeriodName(reportPeriod)}</p>
                <div class="report-data">
                    <p>👥 Usuários totais: ${systemStats.totalUsers}</p>
                    <p>📈 Novos cadastros: 12</p>
                    <p>🎮 Jogos mais jogados: Desafio Relâmpago</p>
                    <p>📱 Dispositivos mais usados: Desktop (65%), Mobile (35%)</p>
                </div>
            `;
            break;
            
        case 'performance':
            reportContent = `
                <h4>Relatório de Desempenho por Operação</h4>
                <p>Período: ${getPeriodName(reportPeriod)}</p>
                <div class="report-data">
                    <p>➕ Adição: 85% de acerto</p>
                    <p>➖ Subtração: 82% de acerto</p>
                    <p>✖️ Multiplicação: 75% de acerto</p>
                    <p>➗ Divisão: 70% de acerto</p>
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
        mathChampionship: 'Campeonato MathKids'
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
                        activity.type === 'game' ? 'fa-gamepad' : 'fa-info';
            
            const iconClass = activity.type === 'correct' ? 'success' :
                             activity.type === 'wrong' ? 'error' : 'info';
            
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
        { id: 'time60', name: 'Dedicado', description: '60 minutos de prática', earned: (userProgress.practiceTime || 0) >= 60 }
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

function initializeOperationsChart() {
    const ctx = document.getElementById('operationsChart');
    if (!ctx) return;
    
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
}

function openModal(modalId) {
    const modal = document.getElementById(modalId + 'Modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Carregar conteúdo do modal
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
                    <h5>Tempo de Prática</h5>
                    <p>${Math.floor(userProgress.practiceTime / 60)} min</p>
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
    
    // Adicionar estilo
    const style = document.createElement('style');
    style.textContent = `
        .profile-content {
            display: flex;
            flex-direction: column;
            gap: var(--space-xl);
        }
        
        .profile-header {
            display: flex;
            align-items: center;
            gap: var(--space-lg);
            padding-bottom: var(--space-lg);
            border-bottom: 1px solid var(--border-light);
        }
        
        .profile-avatar {
            width: 4rem;
            height: 4rem;
            background: var(--gradient-primary);
            border-radius: var(--radius-full);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.5rem;
            font-weight: 600;
        }
        
        .profile-info {
            flex: 1;
        }
        
        .profile-info h4 {
            font-size: 1.25rem;
            margin-bottom: 0.25rem;
            color: var(--text-primary);
        }
        
        .profile-info p {
            color: var(--text-secondary);
            font-size: 0.875rem;
            margin-bottom: 0.5rem;
        }
        
        .profile-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            background: var(--gradient-primary);
            color: white;
            border-radius: var(--radius-full);
            font-size: 0.75rem;
            font-weight: 600;
        }
        
        .profile-badge.admin {
            background: var(--gradient-warning);
        }
        
        .profile-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: var(--space-md);
            padding: var(--space-lg);
            background: var(--bg-secondary);
            border-radius: var(--radius-lg);
        }
        
        .profile-stat {
            text-align: center;
        }
        
        .profile-stat h5 {
            font-size: 0.75rem;
            color: var(--text-secondary);
            margin-bottom: 0.25rem;
            font-weight: 500;
        }
        
        .profile-stat p {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .profile-actions {
            display: flex;
            gap: var(--space-md);
        }
        
        .btn-profile {
            flex: 1;
            padding: 0.75rem;
            background: var(--bg-secondary);
            border: 1px solid var(--border-light);
            border-radius: var(--radius-md);
            color: var(--text-primary);
            font-size: 0.875rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            transition: all var(--transition-fast);
        }
        
        .btn-profile:hover {
            background: var(--bg-tertiary);
            border-color: var(--border-medium);
        }
    `;
    
    document.head.appendChild(style);
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
    
    // Configurar eventos
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
    
    // Atualizar no usuário atual
    currentUser.settings = settings;
    userData.settings = settings;
    
    // Salvar localmente
    if (currentUser.id) {
        const user = JSON.parse(localStorage.getItem('mathkids_user') || '{}');
        user.settings = settings;
        localStorage.setItem('mathkids_user', JSON.stringify(user));
    }
    
    // Salvar no Firebase se disponível
    if (db && currentUser.id) {
        db.collection('users').doc(currentUser.id).update({
            settings: settings
        }).catch(error => {
            console.error('Error saving settings:', error);
        });
    }
    
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
    
    // Restaurar valores padrão
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
    
    // Aplicar tema
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
        { id: 3, title: 'Parabéns!', message: 'Você completou 10 exercícios.', time: 'Ontem', read: true }
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

function addActivity(description, type = 'info') {
    const activity = {
        id: Date.now(),
        description: description,
        type: type,
        timestamp: new Date().toISOString()
    };
    
    // Adicionar ao início da lista
    userProgress.lastActivities.unshift(activity);
    
    // Manter apenas as últimas 20 atividades
    if (userProgress.lastActivities.length > 20) {
        userProgress.lastActivities = userProgress.lastActivities.slice(0, 20);
    }
    
    // Atualizar localStorage
    saveUserProgress();
    
    // Atualizar lista de atividades se estiver visível
    if (currentSection === 'dashboard') {
        loadRecentActivities();
    }
    
    if (currentSection === 'progress') {
        loadProgressSection();
    }
}

function saveUserProgress() {
    if (!currentUser) return;
    
    // Atualizar level baseado no progresso
    const totalExercises = userProgress.exercisesCompleted || 0;
    if (totalExercises >= 200) userProgress.level = 'Mestre';
    else if (totalExercises >= 100) userProgress.level = 'Avançado';
    else if (totalExercises >= 50) userProgress.level = 'Intermediário';
    else userProgress.level = 'Iniciante';
    
    // Salvar localmente
    if (currentUser.id) {
        const user = JSON.parse(localStorage.getItem('mathkids_user') || '{}');
        user.progress = userProgress;
        localStorage.setItem('mathkids_user', JSON.stringify(user));
    }
    
    // Salvar no Firebase se disponível
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
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        </div>
        <div class="toast-content">
            <p>${message}</p>
            <small>Agora</small>
        </div>
        <button class="toast-close">&times;</button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Configurar fechamento
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.style.animation = 'slideOutRight 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
    });
    
    // Remover automaticamente após 5 segundos
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
    
    // Adicionar estilo de animação
    const style = document.createElement('style');
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

function showLoading(show) {
    if (show) {
        loadingOverlay.classList.add('active');
    } else {
        loadingOverlay.classList.remove('active');
    }
}

function handleAuthError(error) {
    console.error('Auth error:', error);
    
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
    // Inicializar tooltips
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
    
    // Detectar tema do sistema
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    prefersDark.addEventListener('change', (e) => {
        const settings = currentUser?.settings || { theme: 'auto' };
        if (settings.theme === 'auto') {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
    });
}

// Modo de demonstração (quando Firebase não está configurado)
function setupDemoMode() {
    console.log('Modo de demonstração ativado');
    
    // Criar dados de demonstração
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
            { id: 1, description: 'Exercício de Multiplicação concluído', type: 'correct', timestamp: new Date().toISOString() },
            { id: 2, description: 'Desafio Relâmpago', type: 'game', timestamp: new Date(Date.now() - 3600000).toISOString() },
            { id: 3, description: 'Exercício de Divisão errado', type: 'wrong', timestamp: new Date(Date.now() - 7200000).toISOString() }
        ],
        level: 'Iniciante',
        badges: [],
        dailyProgress: {
            exercises: 6,
            correct: 5,
            time: 27
        }
    };
    
    // Verificar se admin existe localmente
    adminExists = localStorage.getItem('mathkids_admin_exists') === 'true';
    
    // Estatísticas do sistema em modo demo
    systemStats = {
        totalStudents: 1250,
        averageRating: 4.8,
        improvementRate: 98,
        totalExercises: 12450,
        totalUsers: 1260
    };
    
    // Atualizar UI das estatísticas
    updateSystemStatsUI();
}

async function handleDemoLogin(email, password) {
    // Verificar credenciais de demonstração
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
        
        // Salvar localmente
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

console.log('MathKids Pro v3.0 carregado com sucesso!');
