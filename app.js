
document.addEventListener('DOMContentLoaded', function() {
    // Configuración
    const STORAGE_KEY = "GameSelectorData";
    const DEFAULT_PASSWORD = "1234"; // Contraseña inicial

    // Referencias DOM
    const authScreen = document.getElementById('auth-screen');
    const mainApp = document.getElementById('main-app');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');

    // Estado de la aplicación
    let appState = {
        players: [],
        games: [],
        history: [],
        selectedPlayers: [],
        currentView: 'main',
        theme: 'dark' // 'light' or 'dark'
    };

    // Variables para mantener el estado entre funciones
    let currentPlayerId = null;
    let currentGameId = null;

    // Constantes para iconos y plataformas
    const PLAYER_ICONS = [
        'person', 'face', 'sentiment_very_satisfied', 'sports_esports', 'star',
        'accessibility_new', 'emoji_events', 'military_tech', 'psychology', 'science'
    ];

    const CONSOLE_PLATFORMS = [
        { name: 'Xbox', icon: 'stadia_controller' },
        { name: 'PlayStation', icon: 'stadia_controller' },
        { name: 'PC', icon: 'desktop_windows' },
        { name: 'Nintendo Switch', icon: 'stadia_controller' },
        { name: 'Mobile', icon: 'phone_android' },
        { name: 'Multiplataforma', icon: 'devices_other' }
    ];

    const PLATFORM_ICONS = {
        'Xbox': '🎮', // Placeholder, will need custom icons or better Material Icons
        'PlayStation': '🎮', // Placeholder
        'PC': '💻',
        'Nintendo Switch': '📱',
        'Mobile': '📱',
        'Multiplataforma': '🌐'
    };

    // Inicialización
    init();

    // Event listeners
    loginBtn.addEventListener('click', handleLogin);
    passwordInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });

    // Funciones principales
    function init() {
        loadData();
        applyTheme();
        checkAuth();
    }

    function applyTheme() {
        if (appState.theme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }

    function toggleTheme() {
        appState.theme = appState.theme === 'dark' ? 'light' : 'dark';
        applyTheme();
        saveData();
        // Re-render the current view to update the theme switcher icon
        switch(appState.currentView) {
            case 'main': renderMainView(); break;
            case 'dashboard': renderDashboard(); break;
            case 'players': renderPlayersView(); break;
            case 'games': renderGamesView(); break;
            case 'settings': renderSettings(); break;
        }
    }

    function checkAuth() {
        const savedHash = localStorage.getItem('passwordHash');
        if (!savedHash) {
            // Primera ejecución - crear contraseña por defecto
            hashPassword(DEFAULT_PASSWORD).then(hash => {
                localStorage.setItem('passwordHash', hash);
            });
        }
    }

    async function handleLogin() {
        const password = passwordInput.value;
        if (!password) return;

        const hash = await hashPassword(password);
        const savedHash = localStorage.getItem('passwordHash');

        if (hash === savedHash) {
            authScreen.classList.add('hide');
            mainApp.classList.remove('hide');
            renderMainView();
        } else {
            alert('Contraseña incorrecta');
            passwordInput.value = '';
        }
    }

    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function loadData() {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            appState = JSON.parse(savedData);
        } else {
            // Cargar datos iniciales desde data.json
            fetch('data.json')
                .then(response => response.json())
                .then(data => {
                    appState = {...data, theme: 'dark'}; // Set default theme
                    saveData();
                })
                .catch(error => {
                    console.error('Error cargando data.json:', error);
                });
        }
    }

    function saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    }

    function renderMainView() {
        appState.currentView = 'main';
        mainApp.innerHTML = `
            <div class="navbar">
                <div class="nav-title">GameSelector</div>
                <div class="nav-buttons">
                    <button class="btn" onclick="renderMainView()"><i class="material-icons">home</i></button>
                    <button class="btn" onclick="renderDashboard()"><i class="material-icons">bar_chart</i></button>
                    <button class="btn" onclick="renderPlayersView()"><i class="material-icons">people</i></button>
                    <button class="btn" onclick="renderGamesView()"><i class="material-icons">videogame_asset</i></button>
                    <button class="btn" onclick="renderSettings()"><i class="material-icons">settings</i></button>
                    <div class="theme-switcher" onclick="toggleTheme()">
                        <i class="material-icons">${appState.theme === 'dark' ? 'wb_sunny' : 'nights_stay'}</i>
                    </div>
                </div>
            </div>
            <div class="container">
                <h5 class="section-title">SELECCIONA JUGADORES</h5>
                <div class="player-selector" id="player-selector"></div>
                <h5 class="section-title">JUEGOS DISPONIBLES</h5>
                <div class="games-grid" id="games-grid"></div>
            </div>
        `;
        renderPlayerChips();
        renderGames();
    }

    function renderPlayerChips() {
        const container = document.getElementById('player-selector');
        if (!container) return;
        container.innerHTML = '';
        appState.players.forEach(player => {
            const isSelected = appState.selectedPlayers.includes(player.id);
            const chip = document.createElement('div');
            chip.className = `player-chip ${isSelected ? 'selected' : ''}`;
            chip.innerHTML = `
                ${player.name}
                <i class="material-icons icon">${isSelected ? 'check' : 'add'}</i>
            `;
            chip.onclick = () => togglePlayer(player.id);
            container.appendChild(chip);
        });
    }

    function togglePlayer(playerId) {
        const index = appState.selectedPlayers.indexOf(playerId);
        if (index === -1) {
            appState.selectedPlayers.push(playerId);
        } else {
            appState.selectedPlayers.splice(index, 1);
        }
        saveData();
        renderPlayerChips();
        renderGames();
    }

    function renderGames() {
        const container = document.getElementById('games-grid');
        if (!container) return;
        container.innerHTML = '';
        const filteredGames = appState.games.filter(game => {
            return appState.selectedPlayers.every(playerId =>
                game.players.includes(playerId)
            );
        });

        if (filteredGames.length === 0) {
            container.innerHTML = `<p style="grid-column: 1 / -1; text-align: center;">No hay juegos disponibles para los jugadores seleccionados.</p>`;
            return;
        }

        filteredGames.forEach(game => {
            const gameCard = document.createElement('div');
            gameCard.className = 'game-card';
            gameCard.innerHTML = `
                <div class="game-image">
                    ${game.completed ? '<span class="badge green">COMPLETADO</span>' : ''}
                </div>
                <div class="game-info">
                    <div class="game-title">${game.title}</div>
                    <div class="game-platform">${game.platform}</div>
                    ${game.stats ? `
                        <div class="game-stats">
                            <span>Jugadas: ${game.stats.playedCount}</span>
                            <span>Victorias: ${game.stats.winCount}</span>
                            <span>Última vez: ${game.stats.lastPlayed}</span>
                        </div>
                    ` : ''}
                </div>
            `;
            container.appendChild(gameCard);
        });
    }

    function renderDashboard() {
        appState.currentView = 'dashboard';
        mainApp.innerHTML = `
            <div class="navbar">
                <div class="nav-title">Estadísticas</div>
                <div class="nav-buttons">
                    <button class="btn" onclick="renderMainView()"><i class="material-icons">arrow_back</i></button>
                    <div class="theme-switcher" onclick="toggleTheme()">
                        <i class="material-icons">${appState.theme === 'dark' ? 'wb_sunny' : 'nights_stay'}</i>
                    </div>
                </div>
            </div>
            <div class="container">
                 <div class="stats-container">
                    <div class="stat-card">
                        <h6 class="stat-title">Juegos por Plataforma</h6>
                        <canvas id="platform-chart"></canvas>
                    </div>
                    <div class="stat-card">
                        <h6 class="stat-title">Estado de Juegos</h6>
                        <canvas id="status-chart"></canvas>
                    </div>
                    <div class="stat-card">
                        <h6 class="stat-title">Jugadores Más Activos</h6>
                        <canvas id="players-chart"></canvas>
                    </div>
                    <div class="stat-card">
                        <h6 class="stat-title">Juegos Jugados por Título</h6>
                        <canvas id="games-played-chart"></canvas>
                    </div>
                    <div class="stat-card">
                        <h6 class="stat-title">Victorias por Título</h6>
                        <canvas id="games-wins-chart"></canvas>
                    </div>
                </div>
            </div>
        `;
        renderCharts();
    }

    function renderCharts() {
        // Chart 1: Games per platform
        const platformCtx = document.getElementById('platform-chart')?.getContext('2d');
        if (platformCtx) {
            const platformData = appState.games.reduce((acc, game) => {
                acc[game.platform] = (acc[game.platform] || 0) + 1;
                return acc;
            }, {});
            new Chart(platformCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(platformData),
                    datasets: [{
                        data: Object.values(platformData),
                        backgroundColor: ['#107C10', '#9BF00B', '#737373', '#505050', '#E6E6E6']
                    }]
                }
            });
        }

        // Chart 2: Game status
        const statusCtx = document.getElementById('status-chart')?.getContext('2d');
        if (statusCtx) {
            const completed = appState.games.filter(g => g.completed).length;
            const inProgress = appState.games.length - completed;
            new Chart(statusCtx, {
                type: 'pie',
                data: {
                    labels: ['Completados', 'En Progreso'],
                    datasets: [{
                        data: [completed, inProgress],
                        backgroundColor: ['#107C10', '#737373']
                    }]
                }
            });
        }

        // Chart 3: Player activity
        const playersCtx = document.getElementById('players-chart')?.getContext('2d');
        if (playersCtx) {
            const playerData = appState.players.map(player => {
                return {
                    name: player.name,
                    gameCount: appState.games.filter(g => g.players.includes(player.id)).length
                }
            }).sort((a, b) => b.gameCount - a.gameCount);

            new Chart(playersCtx, {
                type: 'bar',
                data: {
                    labels: playerData.map(p => p.name),
                    datasets: [{
                        label: 'Juegos Jugados',
                        data: playerData.map(p => p.gameCount),
                        backgroundColor: '#107C10'
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Chart 4: Games played by title
        const gamesPlayedCtx = document.getElementById('games-played-chart')?.getContext('2d');
        if (gamesPlayedCtx) {
            const gamePlayedData = appState.games.filter(game => game.stats && game.stats.playedCount > 0).map(game => ({
                title: game.title,
                playedCount: game.stats.playedCount
            }));
            new Chart(gamesPlayedCtx, {
                type: 'bar',
                data: {
                    labels: gamePlayedData.map(g => g.title),
                    datasets: [{
                        label: 'Veces Jugado',
                        data: gamePlayedData.map(g => g.playedCount),
                        backgroundColor: '#FFD700' // Gold color
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Chart 5: Wins by title
        const gamesWinsCtx = document.getElementById('games-wins-chart')?.getContext('2d');
        if (gamesWinsCtx) {
            const gameWinsData = appState.games.filter(game => game.stats && game.stats.winCount > 0).map(game => ({
                title: game.title,
                winCount: game.stats.winCount
            }));
            new Chart(gamesWinsCtx, {
                type: 'bar',
                data: {
                    labels: gameWinsData.map(g => g.title),
                    datasets: [{
                        label: 'Victorias',
                        data: gameWinsData.map(g => g.winCount),
                        backgroundColor: '#00BFFF' // Deep Sky Blue
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }

    let editingPlayerId = null; // Track which player is being edited
    // let editingGameId = null; // Track which game is being edited (already declared above)

    function renderPlayersView() {
        appState.currentView = 'players';
        mainApp.innerHTML = `
            <div class="navbar">
                <div class="nav-title">Jugadores</div>
                <div class="nav-buttons">
                    <button class="btn" onclick="renderMainView()"><i class="material-icons">arrow_back</i></button>
                    <button class="btn" onclick="addPlayer()"><i class="material-icons">add</i></button>
                    <div class="theme-switcher" onclick="toggleTheme()">
                        <i class="material-icons">${appState.theme === 'dark' ? 'wb_sunny' : 'nights_stay'}</i>
                    </div>
                </div>
            </div>
            <div class="container" id="players-list">
                <!-- Player list will be rendered here -->
            </div>
        `;
        renderPlayersList();
    }

    function renderPlayersList() {
        const container = document.getElementById('players-list');
        if (!container) return;
        container.innerHTML = '';
        appState.players.forEach(player => {
            const playerEl = document.createElement('div');
            playerEl.className = 'list-item';

            if (editingPlayerId === player.id) {
                // Edit mode
                const iconOptions = PLAYER_ICONS.map(icon => `<option value="${icon}" ${player.icon === icon ? 'selected' : ''}>${icon}</option>`).join('');
                playerEl.innerHTML = `
                    <div class="edit-player-container">
                        <input type="text" id="edit-player-name-${player.id}" value="${player.name}" placeholder="Nombre del jugador">
                        <select id="edit-player-icon-${player.id}">
                            ${iconOptions}
                        </select>
                        <div class="actions">
                            <button class="btn-small green" onclick="savePlayerInline(${player.id})"><i class="material-icons">done</i></button>
                            <button class="btn-small orange" onclick="cancelEditPlayer()"><i class="material-icons">cancel</i></button>
                        </div>
                    </div>
                `;
            } else {
                // View mode
                playerEl.innerHTML = `
                    <div class="player-display">
                        <i class="material-icons player-icon">${player.icon || 'person'}</i>
                        <span>${player.name}</span>
                    </div>
                    <div class="actions">
                        <button class="btn-small" onclick="editPlayerInline(${player.id})"><i class="material-icons">edit</i></button>
                        <button class="btn-small red" onclick="deletePlayer(${player.id})"><i class="material-icons">delete</i></button>
                    </div>
                `;
            }
            container.appendChild(playerEl);
        });
        
        // Agregar botón para nuevo jugador
        const newPlayerBtn = document.createElement('div');
        newPlayerBtn.className = 'list-item';
        newPlayerBtn.innerHTML = `
            <button class="btn add-game-btn" onclick="addPlayer()">
                <i class="material-icons">add</i> Agregar Nuevo Jugador
            </button>
        `;
        container.appendChild(newPlayerBtn);
    }

    function addPlayer() {
        const newId = appState.players.length > 0 ? Math.max(...appState.players.map(p => p.id)) + 1 : 1;
        const newPlayer = { id: newId, name: 'Nuevo Jugador', icon: 'person' };
        appState.players.push(newPlayer);
        saveData();
        editingPlayerId = newId; // Immediately go into edit mode for the new player
        renderPlayersList();
    }

    function editPlayerInline(playerId) {
        editingPlayerId = playerId;
        renderPlayersList();
    }

    function savePlayerInline(playerId) {
        const nameInput = document.getElementById(`edit-player-name-${playerId}`);
        const iconSelect = document.getElementById(`edit-player-icon-${playerId}`);
        const newName = nameInput.value.trim();
        const newIcon = iconSelect.value;

        if (newName === '') {
            alert('El nombre del jugador no puede estar vacío.');
            return;
        }

        const player = appState.players.find(p => p.id === playerId);
        if (player) {
            player.name = newName;
            player.icon = newIcon;
        }
        saveData();
        editingPlayerId = null; // Exit edit mode
        renderPlayersList();
    }

    function cancelEditPlayer() {
        editingPlayerId = null; // Exit edit mode without saving
        renderPlayersList();
    }

    function deletePlayer(playerId) {
        if (confirm('¿Estás seguro de eliminar este jugador? Esto también lo eliminará de todos los juegos.')) {
            appState.players = appState.players.filter(p => p.id !== playerId);
            // Also remove player from all games
            appState.games.forEach(game => {
                game.players = game.players.filter(pId => pId !== playerId);
            });
            saveData();
            renderPlayersList();
            renderGames(); // Re-render games as player data might have changed
        }
    }

    function renderGamesView() {
        appState.currentView = 'games';
        mainApp.innerHTML = `
            <div class="navbar">
                <div class="nav-title">Juegos</div>
                <div class="nav-buttons">
                    <button class="btn" onclick="renderMainView()"><i class="material-icons">arrow_back</i></button>
                    <button class="btn" onclick="openGameForm()"><i class="material-icons">add</i></button>
                    <div class="theme-switcher" onclick="toggleTheme()">
                        <i class="material-icons">${appState.theme === 'dark' ? 'wb_sunny' : 'nights_stay'}</i>
                    </div>
                </div>
            </div>
            <div class="container" id="games-list">
                <!-- Game list will be rendered here -->
            </div>
        `;
        renderGamesList();
    }

    function renderGamesList() {
        const container = document.getElementById('games-list');
        if (!container) return;
        container.innerHTML = '';
        
        appState.games.forEach(game => {
            const gameEl = document.createElement('div');
            gameEl.className = 'list-item';
            
            // Crear opciones de plataforma
            const platformOptions = CONSOLE_PLATFORMS.map(platform => 
                `<option value="${platform.name}" ${game.platform === platform.name ? 'selected' : ''}>${platform.name}</option>`
            ).join('');
            
            // Crear checkboxes para jugadores
            const playerCheckboxes = appState.players.map(player => `
                <label class="player-checkbox">
                    <input type="checkbox" id="game-player-${game.id}-${player.id}" 
                           ${game.players.includes(player.id) ? 'checked' : ''}>
                    <i class="material-icons player-icon">${player.icon || 'person'}</i>
                    ${player.name}
                </label>
            `).join('');
            
            if (editingGameId === game.id) {
                // Modo edición
                gameEl.innerHTML = `
                    <div class="edit-game-container">
                        <div class="form-group">
                            <label>Título:</label>
                            <input type="text" id="edit-game-title-${game.id}" value="${game.title}" placeholder="Título del juego">
                        </div>
                        <div class="form-group">
                            <label>Plataforma:</label>
                            <select id="edit-game-platform-${game.id}">
                                ${platformOptions}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="edit-game-completed-${game.id}" ${game.completed ? 'checked' : ''}>
                                Completado
                            </label>
                        </div>
                        <div class="form-group">
                            <label>Jugadores:</label>
                            <div class="player-checkboxes">
                                ${playerCheckboxes}
                            </div>
                        </div>
                        <div class="actions">
                            <button class="btn-small green" onclick="saveGameInline(${game.id})"><i class="material-icons">done</i></button>
                            <button class="btn-small orange" onclick="cancelEditGame()"><i class="material-icons">cancel</i></button>
                        </div>
                    </div>
                `;
            } else {
                // Modo visualización
                const playerNames = game.players.map(pId => appState.players.find(p => p.id === pId)?.name || '').join(', ');
                const playerIcons = game.players.map(pId => {
                    const player = appState.players.find(p => p.id === pId);
                    return player ? `<i class="material-icons player-icon-small">${player.icon || 'person'}</i>` : '';
                }).join('');
                
                gameEl.innerHTML = `
                    <div class="game-display">
                        <div class="game-info">
                            <span class="game-title">${game.title}</span>
                            <span class="game-platform">${game.platform}</span>
                            <span class="game-status ${game.completed ? 'completed' : 'in-progress'}">
                                ${game.completed ? 'Completado' : 'En progreso'}
                            </span>
                            <div class="game-players">
                                <span class="players-label">Jugadores:</span>
                                <span class="players-list">${playerNames}</span>
                            </div>
                        </div>
                    </div>
                    <div class="actions">
                        <button class="btn-small" onclick="editGameInline(${game.id})"><i class="material-icons">edit</i></button>
                        <button class="btn-small red" onclick="deleteGame(${game.id})"><i class="material-icons">delete</i></button>
                    </div>
                `;
            }
            container.appendChild(gameEl);
        });
        
        // Agregar formulario para nuevo juego si no estamos editando un juego existente
        if (editingGameId === null) {
            const newGameEl = document.createElement('div');
            newGameEl.className = 'list-item';
            newGameEl.innerHTML = `
                <button class="btn add-game-btn" onclick="openGameForm()">
                    <i class="material-icons">add</i> Agregar Nuevo Juego
                </button>
            `;
            container.appendChild(newGameEl);
        }
    }

    let editingGameId = null; // Track which game is being edited

    function openGameForm(gameId = null) {
        if (gameId === null) {
            // Crear un nuevo juego con valores predeterminados
            const newId = appState.games.length > 0 ? Math.max(...appState.games.map(g => g.id)) + 1 : 1;
            const newGame = {
                id: newId,
                title: 'Nuevo Juego',
                platform: 'PC',
                completed: false,
                players: []
            };
            appState.games.push(newGame);
            saveData();
            editingGameId = newId;
        } else {
            editingGameId = gameId;
        }
        renderGamesView(); // Re-render to show the form
    }

    function saveGame(gameData, gameId = null) {
        if (gameId) {
            const game = appState.games.find(g => g.id === gameId);
            if (game) Object.assign(game, gameData);
        } else {
            const newId = Math.max(0, ...appState.games.map(g => g.id)) + 1;
            appState.games.push({ id: newId, ...gameData });
        }
        saveData();
        renderGamesList();
    }

    function editGameInline(gameId) {
        editingGameId = gameId;
        renderGamesList();
    }

    function saveGameInline(gameId) {
        const titleInput = document.getElementById(`edit-game-title-${gameId}`);
        const platformSelect = document.getElementById(`edit-game-platform-${gameId}`);
        const completedCheckbox = document.getElementById(`edit-game-completed-${gameId}`);
        
        const title = titleInput.value.trim();
        const platform = platformSelect.value;
        const completed = completedCheckbox.checked;
        
        if (title === '') {
            alert('El título del juego no puede estar vacío.');
            return;
        }
        
        // Obtener jugadores seleccionados
        const selectedPlayers = [];
        appState.players.forEach(player => {
            const checkbox = document.getElementById(`game-player-${gameId}-${player.id}`);
            if (checkbox && checkbox.checked) {
                selectedPlayers.push(player.id);
            }
        });
        
        const gameData = {
            title,
            platform,
            completed,
            players: selectedPlayers
        };
        
        saveGame(gameData, gameId);
        editingGameId = null;
        renderGamesList();
    }

    function cancelEditGame() {
        editingGameId = null;
        renderGamesList();
    }

    function editGame(gameId) {
        openGameForm(gameId);
    }

    function deleteGame(gameId) {
        if (confirm('¿Estás seguro de eliminar este juego?')) {
            appState.games = appState.games.filter(g => g.id !== gameId);
            saveData();
            renderGamesList();
        }
    }

    function renderSettings() {
        appState.currentView = 'settings';
        mainApp.innerHTML = `
            <div class="navbar">
                <div class="nav-title">Configuración</div>
                <div class="nav-buttons">
                    <button class="btn" onclick="renderMainView()"><i class="material-icons">arrow_back</i></button>
                    <div class="theme-switcher" onclick="toggleTheme()">
                        <i class="material-icons">${appState.theme === 'dark' ? 'wb_sunny' : 'nights_stay'}</i>
                    </div>
                </div>
            </div>
            <div class="container">
                <div class="card">
                    <div class="card-content">
                        <span class="card-title">Cambiar Contraseña</span>
                        <div class="input-field">
                            <input type="password" id="new-password" placeholder=" ">
                            <label for="new-password">Nueva contraseña</label>
                        </div>
                        <div class="input-field">
                            <input type="password" id="confirm-password" placeholder=" ">
                            <label for="confirm-password">Confirmar contraseña</label>
                        </div>
                    </div>
                    <div class="card-action">
                        <button class="btn" onclick="changePassword()">Cambiar</button>
                    </div>
                </div>
                <div class="card" style="margin-top: 20px;">
                    <div class="card-content">
                        <span class="card-title">Gestión de Datos</span>
                        <p>Exportar o importar los datos de la aplicación.</p>
                    </div>
                    <div class="card-action">
                        <button class="btn" onclick="exportData()">Exportar</button>
                        <button class="btn" onclick="importData()">Importar</button>
                    </div>
                </div>
            </div>
        `;
    }

    function changePassword() {
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        if (!newPassword || newPassword !== confirmPassword) {
            alert('Las contraseñas no coinciden.');
            return;
        }
        hashPassword(newPassword).then(hash => {
            localStorage.setItem('passwordHash', hash);
            alert('Contraseña actualizada.');
        });
    }

    function exportData() {
        const dataStr = JSON.stringify(appState, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', 'data.json');
        linkElement.click();
    }

    function importData() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                try {
                    const data = JSON.parse(e.target.result);
                    appState = data;
                    saveData();
                    alert('Datos importados correctamente.');
                    renderMainView();
                } catch (error) {
                    alert('Error al importar el archivo.');
                }
            };
            reader.readAsText(file);
        };
        fileInput.click();
    }

    // Exponer funciones globalmente
    window.toggleTheme = toggleTheme;
    window.renderMainView = renderMainView;
    window.renderDashboard = renderDashboard;
    window.renderPlayersView = renderPlayersView;
    window.renderGamesView = renderGamesView;
    window.renderSettings = renderSettings;
    window.changePassword = changePassword;
    window.exportData = exportData;
    window.importData = importData;
    
    // Funciones para jugadores
    window.addPlayer = addPlayer;
    window.deletePlayer = deletePlayer;
    window.editPlayerInline = editPlayerInline;
    window.savePlayerInline = savePlayerInline;
    window.cancelEditPlayer = cancelEditPlayer;
    
    // Funciones para juegos
    window.openGameForm = openGameForm;
    window.deleteGame = deleteGame;
    window.editGameInline = editGameInline;
    window.saveGameInline = saveGameInline;
    window.cancelEditGame = cancelEditGame;
});
