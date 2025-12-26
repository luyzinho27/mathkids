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
    
    // Verificar se há administrador
    checkAdminExists();
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
    badges: []
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

// Elementos da aplicação
const menuToggle = document.getElementById('menuToggle');
const closeSidebar = document.getElementById('closeSidebar');
const mobileSidebar = document.getElementById('mobileSidebar');
const userDropdownToggle = document.getElementById('userDropdownToggle');
const userDropdown = document.getElementById('userDropdown');
const logoutBtn = document.getElementById('logoutBtn');
const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
const notificationsToggle = document.getElementById('notificationsToggle');
const notificationsPanel = document.getElementById('notificationsPanel');
const navLinks = document.querySelectorAll('.nav-link');
const sidebarLinks = document.querySelectorAll('.sidebar-link');
const operationQuicks = document.querySelectorAll('.operation-quick');
const lessonCards = document.querySelectorAll('.lesson-card');
const closeLesson = document.getElementById('closeLesson');

// Elementos de informação do usuário
const userNameElement = document.getElementById('userName');
const userRoleElement = document.getElementById('userRole');
const dropdownUserName = document.getElementById('dropdownUserName');
const dropdownUserRole = document.getElementById('dropdownUserRole');
const mobileUserName = document.getElementById('mobileUserName');
const mobileUserRole = document.getElementById('mobileUserRole');
const welcomeUserName = document.getElementById('welcomeUserName');
const adminNav = document.getElementById('adminNav');
const mobileAdminLink = document.getElementById('mobileAdminLink');

// Elementos de estatísticas
const statExercises = document.getElementById('statExercises');
const statAccuracy = document.getElementById('statAccuracy');
const statTime = document.getElementById('statTime');
const statLevel = document.getElementById('statLevel');

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
    menuToggle.addEventListener('click', toggleMobileSidebar);
    closeSidebar.addEventListener('click', toggleMobileSidebar);
    
    userDropdownToggle.addEventListener('click', function() {
        userDropdown.classList.toggle('active');
    });
    
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
    
    // Navegação entre seções
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            switchSection(sectionId);
            
            // Atualizar navegação ativa
            updateActiveNavigation(sectionId);
            
            // Fechar sidebar mobile se aberto
            if (mobileSidebar.classList.contains('active')) {
                toggleMobileSidebar();
            }
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
                toggleMobileSidebar();
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
    
    // Lições
    lessonCards.forEach(card => {
        card.addEventListener('click', function() {
            const operation = this.getAttribute('data-operation');
            loadLesson(operation);
        });
    });
    
    closeLesson.addEventListener('click', function() {
        document.getElementById('activeLesson').style.display = 'none';
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

// Verificar estado de autenticação
function checkAuthState() {
    const savedUser = localStorage.getItem('mathkids_user');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        if (user.email && user.lastLogin && (Date.now() - new Date(user.lastLogin).getTime()) < 7 * 24 * 60 * 60 * 1000) {
            // Usuário logado recentemente (menos de 7 dias)
            showApp();
            loadUserData(user);
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

// Verificar se já existe administrador
async function checkAdminExists() {
    if (!db) return;
    
    try {
        const snapshot = await db.collection('users')
            .where('role', '==', 'admin')
            .limit(1)
            .get();
        
        adminExists = !snapshot.empty;
        console.log('Admin exists:', adminExists);
    } catch (error) {
        console.error('Error checking admin existence:', error);
        adminExists = false;
    }
}

// Manipular login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    if (!email || !password) {
        showNotification('Por favor, preencha todos os campos.', 'error');
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
        showNotification('Login realizado com sucesso!', 'success');
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
        showNotification('Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('A senha deve ter pelo menos 6 caracteres.', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('As senhas não coincidem.', 'error');
        return;
    }
    
    if (!agreeTerms) {
        showNotification('Você deve concordar com os termos de uso.', 'error');
        return;
    }
    
    if (userType === 'admin' && adminExists) {
        showNotification('Já existe um administrador cadastrado.', 'error');
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
                sound: true
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
        
        showLoading(false);
        showNotification('Conta criada com sucesso! Verifique seu email.', 'success');
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
        showNotification('Por favor, informe seu email.', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        if (auth) {
            await auth.sendPasswordResetEmail(email);
            showNotification('Email de recuperação enviado! Verifique sua caixa de entrada.', 'success');
            switchAuthForm('login');
        } else {
            showNotification('Modo demo: Verifique seu email fictício.', 'info');
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
    
    showNotification('Logout realizado com sucesso.', 'info');
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
        showNotification('Erro ao carregar dados do usuário.', 'error');
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
}

// Atualizar informações do usuário na interface
function updateUserInfo() {
    const name = currentUser.name || 'Usuário';
    const role = currentUser.role === 'admin' ? 'Administrador' : 'Aluno';
    
    userNameElement.textContent = name;
    userRoleElement.textContent = role;
    dropdownUserName.textContent = name;
    dropdownUserRole.textContent = role;
    mobileUserName.textContent = name;
    mobileUserRole.textContent = role;
    welcomeUserName.textContent = name;
    
    // Atualizar badge de role
    const badge = dropdownUserRole;
    badge.textContent = role;
    badge.className = 'badge';
    
    if (role === 'Administrador') {
        badge.style.background = 'var(--gradient-accent)';
    } else {
        badge.style.background = 'var(--gradient-primary)';
    }
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
function toggleMobileSidebar() {
    mobileSidebar.classList.toggle('active');
}

// Alternar painel de notificações
function toggleNotifications() {
    notificationsPanel.classList.toggle('active');
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

// Carregar seção de prática
function loadPracticeSection(operation = null) {
    const section = document.getElementById('practice');
    
    if (operation) {
        currentOperation = operation;
    }
    
    const content = `
        <div class="section-header">
            <h2><i class="fas fa-dumbbell"></i> Praticar</h2>
            <p>Escolha uma operação e pratique com exercícios interativos.</p>
        </div>
        
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
                <h3>Praticando ${getOperationName(currentOperation)}</h3>
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
                    <div class="operation-symbol" id="exerciseSymbol">?</div>
                    <div class="numbers" id="exerciseNum2">?</div>
                    <div class="equals">=</div>
                    <input type="number" id="exerciseAnswer" placeholder="?" autofocus>
                </div>
                
                <div class="exercise-feedback" id="exerciseFeedback"></div>
                
                <div class="exercise-controls">
                    <button class="btn-exercise" id="checkExercise">Verificar</button>
                    <button class="btn-exercise secondary" id="newExercise">Novo Exercício</button>
                    <button class="btn-exercise outline" id="showHint">Dica</button>
                </div>
            </div>
        </div>
        ` : ''}
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
            const quotient = getRandomInt(range.min, range.max);
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
    document.getElementById('exerciseNum1').textContent = num1;
    document.getElementById('exerciseSymbol').textContent = symbol;
    document.getElementById('exerciseNum2').textContent = num2;
    document.getElementById('exerciseAnswer').value = '';
    document.getElementById('exerciseFeedback').textContent = '';
    document.getElementById('exerciseFeedback').className = 'exercise-feedback';
    
    // Focar no input
    document.getElementById('exerciseAnswer').focus();
}

// Verificar resposta na prática
function checkPracticeAnswer() {
    const input = document.getElementById('exerciseAnswer');
    const userAnswer = parseInt(input.value);
    const feedback = document.getElementById('exerciseFeedback');
    
    if (isNaN(userAnswer)) {
        feedback.textContent = 'Digite um número válido!';
        feedback.className = 'exercise-feedback error';
        return;
    }
    
    // Atualizar estatísticas
    userProgress.exercisesCompleted++;
    userProgress.totalAnswers++;
    userProgress[currentExercise.operation].total++;
    
    if (userAnswer === currentExercise.answer) {
        // Resposta correta
        feedback.textContent = `Correto! ${currentExercise.num1} ${currentExercise.symbol} ${currentExercise.num2} = ${currentExercise.answer}`;
        feedback.className = 'exercise-feedback success';
        userProgress.correctAnswers++;
        userProgress[currentExercise.operation].correct++;
        
        // Adicionar atividade recente
        addActivity(`Exercício de ${getOperationName(currentExercise.operation)} concluído`, 'correct');
        
        // Gerar novo exercício após 1.5 segundos
        setTimeout(generateExercise, 1500);
    } else {
        // Resposta incorreta
        feedback.textContent = `Ops! A resposta correta é ${currentExercise.answer}. Tente novamente!`;
        feedback.className = 'exercise-feedback error';
        addActivity(`Exercício de ${getOperationName(currentExercise.operation)} errado`, 'wrong');
    }
    
    // Atualizar UI
    updateProgressUI();
    saveUserProgress();
}

// Mostrar dica na prática
function showPracticeHint() {
    const { num1, num2, operation, answer } = currentExercise;
    const feedback = document.getElementById('exerciseFeedback');
    
    let hint = '';
    switch(operation) {
        case 'addition':
            hint = `Dica: ${num1} + ${num2} = ${num1 + num2}`;
            break;
        case 'subtraction':
            hint = `Dica: Comece de ${num1} e conte para trás ${num2} unidades`;
            break;
        case 'multiplication':
            hint = `Dica: ${num1} × ${num2} = ${num1} repetido ${num2} vezes`;
            break;
        case 'division':
            hint = `Dica: Quantos grupos de ${num2} cabem em ${num1}?`;
            break;
    }
    
    feedback.textContent = hint;
    feedback.className = 'exercise-feedback info';
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
                
                <button class="btn-lesson-start" onclick="loadPracticeSection('addition')">
                    <i class="fas fa-dumbbell"></i> Praticar Adição
                </button>
            `
        },
        subtraction: {
            title: 'Lição: Subtração',
            content: `
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
                
                <button class="btn-lesson-start" onclick="loadPracticeSection('subtraction')">
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
                    <p>5 × 1 = 5</p>
                    <p>5 × 2 = 10</p>
                    <p>5 × 3 = 15</p>
                    <p>5 × 4 = 20</p>
                    <p>5 × 5 = 25</p>
                </div>
                
                <button class="btn-lesson-start" onclick="loadPracticeSection('multiplication')">
                    <i class="fas fa-dumbbell"></i> Praticar Multiplicação
                </button>
            `
        },
        division: {
            title: 'Lição: Divisão',
            content: `
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
                
                <button class="btn-lesson-start" onclick="loadPracticeSection('division')">
                    <i class="fas fa-dumbbell"></i> Praticar Divisão
                </button>
            `
        }
    };
    
    if (lessons[operation]) {
        lessonTitle.textContent = lessons[operation].title;
        lessonContent.innerHTML = lessons[operation].content;
        activeLesson.style.display = 'block';
    }
}

// Carregar seção de jogos
function loadGamesSection() {
    const section = document.getElementById('games');
    
    const content = `
        <div class="section-header">
            <h2><i class="fas fa-gamepad"></i> Jogos Educativos</h2>
            <p>Aprenda matemática de forma divertida com nossos jogos!</p>
        </div>
        
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
            <!-- O jogo será carregado aqui dinamicamente -->
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

// Carregar seção de progresso
function loadProgressSection() {
    const section = document.getElementById('progress');
    
    const accuracy = userProgress.totalAnswers > 0 
        ? Math.round((userProgress.correctAnswers / userProgress.totalAnswers) * 100) 
        : 0;
    
    const content = `
        <div class="section-header">
            <h2><i class="fas fa-chart-line"></i> Meu Progresso</h2>
            <p>Acompanhe sua evolução no aprendizado de matemática.</p>
        </div>
        
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
    `;
    
    section.innerHTML = content;
    
    // Inicializar gráfico
    initializeOperationsChart();
}

// Carregar seção de administração
function loadAdminSection() {
    if (currentUser.role !== 'admin') {
        window.location.hash = 'dashboard';
        showNotification('Acesso negado. Apenas administradores.', 'error');
        return;
    }
    
    const section = document.getElementById('admin');
    
    const content = `
        <div class="section-header">
            <h2><i class="fas fa-cogs"></i> Painel de Administração</h2>
            <p>Gerencie usuários e visualize estatísticas do sistema.</p>
        </div>
        
        <div class="admin-dashboard">
            <div class="admin-stats">
                <div class="admin-stat">
                    <div class="stat-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="totalUsers">0</h3>
                        <p>Usuários Cadastrados</p>
                    </div>
                </div>
                <div class="admin-stat">
                    <div class="stat-icon">
                        <i class="fas fa-graduation-cap"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="activeStudents">0</h3>
                        <p>Alunos Ativos</p>
                    </div>
                </div>
                <div class="admin-stat">
                    <div class="stat-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="totalExercises">0</h3>
                        <p>Exercícios Resolvidos</p>
                    </div>
                </div>
                <div class="admin-stat">
                    <div class="stat-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="systemAccuracy">0%</h3>
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
    `;
    
    section.innerHTML = content;
    
    // Carregar dados de administração
    loadAdminData();
    setupAdminEvents();
}

// Carregar dados de administração
async function loadAdminData() {
    if (!db) {
        // Modo demo
        document.getElementById('totalUsers').textContent = '15';
        document.getElementById('activeStudents').textContent = '12';
        document.getElementById('totalExercises').textContent = '1,245';
        document.getElementById('systemAccuracy').textContent = '78%';
        return;
    }
    
    try {
        // Contar usuários
        const usersSnapshot = await db.collection('users').get();
        const totalUsers = usersSnapshot.size;
        
        // Contar alunos ativos (último login nos últimos 30 dias)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        let activeStudents = 0;
        let totalExercises = 0;
        let totalCorrect = 0;
        let totalAnswers = 0;
        
        usersSnapshot.forEach(doc => {
            const user = doc.data();
            if (user.role === 'student') {
                const lastLogin = new Date(user.lastLogin || user.createdAt);
                if (lastLogin > thirtyDaysAgo) {
                    activeStudents++;
                }
            }
            
            if (user.progress) {
                totalExercises += user.progress.exercisesCompleted || 0;
                totalCorrect += user.progress.correctAnswers || 0;
                totalAnswers += user.progress.totalAnswers || 0;
            }
        });
        
        const systemAccuracy = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0;
        
        // Atualizar UI
        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('activeStudents').textContent = activeStudents;
        document.getElementById('totalExercises').textContent = totalExercises.toLocaleString();
        document.getElementById('systemAccuracy').textContent = systemAccuracy + '%';
        
        // Carregar tabela de usuários
        loadUsersTable(usersSnapshot);
        
    } catch (error) {
        console.error('Error loading admin data:', error);
        showNotification('Erro ao carregar dados de administração.', 'error');
    }
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
    document.getElementById('refreshUsers')?.addEventListener('click', loadAdminData);
    document.getElementById('addUser')?.addEventListener('click', showAddUserModal);
    document.getElementById('generateReport')?.addEventListener('click', generateReport);
    document.getElementById('saveSettings')?.addEventListener('click', saveSystemSettings);
    
    // Busca de usuários
    document.getElementById('searchUsers')?.addEventListener('input', function(e) {
        filterUsersTable(e.target.value);
    });
}

// Carregar tabela de usuários
function loadUsersTable(snapshot) {
    const tbody = document.getElementById('usersTableBody');
    
    if (!snapshot || snapshot.empty) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">Nenhum usuário encontrado</td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    snapshot.forEach(doc => {
        const user = doc.data();
        const userId = doc.id;
        
        // Não mostrar o próprio usuário admin atual
        if (userId === currentUser.id) return;
        
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
                        <button class="btn-action view" data-user="${userId}" title="Ver detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action edit" data-user="${userId}" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action delete" data-user="${userId}" title="Excluir">
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

function getOperationSymbol(operation) {
    const symbols = {
        addition: '+',
        subtraction: '-',
        multiplication: '×',
        division: '÷'
    };
    return symbols[operation] || '?';
}

function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="close-notification">&times;</button>
    `;
    
    // Adicionar ao body
    document.body.appendChild(notification);
    
    // Mostrar com animação
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Configurar fechamento
    notification.querySelector('.close-notification').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

function showLoading(show) {
    if (show) {
        // Criar overlay de loading
        const loading = document.createElement('div');
        loading.id = 'loadingOverlay';
        loading.className = 'loading-overlay';
        loading.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-calculator fa-spin"></i>
                <p>Processando...</p>
            </div>
        `;
        document.body.appendChild(loading);
    } else {
        // Remover overlay de loading
        const loading = document.getElementById('loadingOverlay');
        if (loading) {
            loading.remove();
        }
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
    
    showNotification(message, 'error');
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

function addActivity(description, type = 'info') {
    const activity = {
        id: Date.now(),
        description: description,
        type: type,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('pt-BR'),
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
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
        updateActivitiesList();
    }
}

function updateActivitiesList() {
    const activitiesList = document.getElementById('activitiesList');
    if (!activitiesList) return;
    
    let html = '';
    const activities = userProgress.lastActivities.slice(0, 5);
    
    activities.forEach(activity => {
        const icon = activity.type === 'correct' ? 'fa-check-circle' :
                    activity.type === 'wrong' ? 'fa-times-circle' :
                    activity.type === 'game' ? 'fa-gamepad' : 'fa-info-circle';
        
        const scoreClass = activity.type === 'correct' ? 'correct' :
                          activity.type === 'wrong' ? 'wrong' : '';
        
        const score = activity.type === 'correct' ? '+10' :
                     activity.type === 'wrong' ? '-5' : '';
        
        html += `
            <div class="activity-item">
                <i class="fas ${icon} activity-icon"></i>
                <div class="activity-details">
                    <p>${activity.description}</p>
                    <small>Hoje às ${activity.time}</small>
                </div>
                ${score ? `<span class="activity-score ${scoreClass}">${score}</span>` : ''}
            </div>
        `;
    });
    
    if (html) {
        activitiesList.innerHTML = html;
    }
}

function generateActivitiesTimeline() {
    const activities = userProgress.lastActivities.slice(0, 10);
    let html = '';
    
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
                    <small>${activity.date} às ${activity.time}</small>
                </div>
            </div>
        `;
    });
    
    return html || '<p class="text-center">Nenhuma atividade registrada ainda.</p>';
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
                    backgroundColor: '#4f46e5'
                },
                {
                    label: 'Tentativas',
                    data: total,
                    backgroundColor: '#c7d2fe'
                },
                {
                    label: 'Acurácia (%)',
                    data: accuracy,
                    type: 'line',
                    borderColor: '#10b981',
                    backgroundColor: 'transparent',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Quantidade'
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
                }
            }
        }
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId + 'Modal');
    if (modal) {
        modal.classList.add('active');
        
        // Carregar conteúdo do modal
        loadModalContent(modalId);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
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
        <div class="profile-header">
            <div class="profile-avatar">
                <i class="fas fa-user-circle"></i>
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
    `;
}

function loadSettingsModal(container) {
    container.innerHTML = `
        <div class="settings-group">
            <h4><i class="fas fa-palette"></i> Aparência</h4>
            <div class="setting">
                <label>Tema:</label>
                <select id="themeSelect">
                    <option value="light">Claro</option>
                    <option value="dark">Escuro</option>
                    <option value="auto">Automático</option>
                </select>
            </div>
        </div>
        
        <div class="settings-group">
            <h4><i class="fas fa-volume-up"></i> Som</h4>
            <div class="setting">
                <label>
                    <input type="checkbox" id="soundEffects" checked>
                    Efeitos sonoros
                </label>
            </div>
            <div class="setting">
                <label>
                    <input type="checkbox" id="backgroundMusic">
                    Música de fundo
                </label>
            </div>
        </div>
        
        <div class="settings-group">
            <h4><i class="fas fa-bell"></i> Notificações</h4>
            <div class="setting">
                <label>
                    <input type="checkbox" id="notificationsEnabled" checked>
                    Permitir notificações
                </label>
            </div>
            <div class="setting">
                <label>
                    <input type="checkbox" id="progressNotifications" checked>
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
    `;
    
    // Carregar configurações salvas
    loadUserSettings();
}

function loadUserSettings() {
    const settings = currentUser.settings || {
        theme: 'light',
        notifications: true,
        sound: true
    };
    
    document.getElementById('themeSelect').value = settings.theme || 'light';
    document.getElementById('soundEffects').checked = settings.sound !== false;
    document.getElementById('backgroundMusic').checked = settings.music || false;
    document.getElementById('notificationsEnabled').checked = settings.notifications !== false;
    document.getElementById('progressNotifications').checked = settings.progressNotifications !== false;
}

function loadNotifications() {
    const notifications = [
        { id: 1, title: 'Bem-vindo ao MathKids Pro!', message: 'Comece a aprender matemática de forma divertida.', time: 'Agora', read: false },
        { id: 2, title: 'Novo desafio disponível', message: 'Tente o Desafio Relâmpago de Multiplicação!', time: '5 min atrás', read: false },
        { id: 3, title: 'Parabéns!', message: 'Você completou 10 exercícios.', time: 'Ontem', read: true }
    ];
    
    const list = document.getElementById('notificationsList');
    if (!list) return;
    
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
        badges: []
    };
    
    // Verificar se admin existe localmente
    adminExists = localStorage.getItem('mathkids_admin_exists') === 'true';
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
                sound: true
            }
        };
        
        // Salvar localmente
        localStorage.setItem('mathkids_user', JSON.stringify(currentUser));
        
        return currentUser;
    } else {
        throw new Error('Credenciais inválidas');
    }
}

// Exportar funções para uso global
window.loadPracticeSection = loadPracticeSection;
window.loadLesson = loadLesson;

console.log('MathKids Pro v2.0 carregado com sucesso!');
