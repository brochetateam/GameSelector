// GameSelector App - Organiza tus partidas de videojuegos
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
        currentView: 'main'
    };
    
    // Inicialización
    init();
    
    // Event listeners
    loginBtn.addEventListener('click', handleLogin);
    
    // Funciones principales
    function init() {
        loadData();
        checkAuth();
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
            M.toast({html: 'Contraseña incorrecta', classes: 'red'});
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
            // Datos de ejemplo iniciales
            appState.players = [
                {id: 1, name: 'Jugador 1'},
                {id: 2, name: 'Jugador 2'},
                {id: 3, name: 'Jugador 3'},
                {id: 4, name: 'Jugador 4'},
                {id: 5, name: 'Jugador 5'}
            ];
            
            appState.games = [
                {id: 1, title: 'Halo Infinite', platform: 'Xbox', players: [1,2,3,4], completed: false},
                {id: 2, title: 'FIFA 25', platform: 'PlayStation', players: [1,3,5], completed: false},
                {id: 3, title: 'Minecraft', platform: 'PC', players: [2,4,5], completed: true},
                {id: 4, title: 'Fortnite', platform: 'Multiplataforma', players: [1,2,3,4,5], completed: false}
            ];
            
            saveData();
        }
    }
    
    function saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    }
    
    function renderMainView() {
        mainApp.innerHTML = `
            <div class="navbar">
                <div class="nav-title">GameSelector</div>
                <div class="nav-buttons">
                    <button class="btn xbox-green" onclick="renderMainView()">Inicio</button>
                    <button class="btn xbox-green" onclick="renderDashboard()">Estadísticas</button>
                    <button class="btn xbox-green" onclick="renderPlayersView()">Jugadores</button>
                    <button class="btn xbox-green" onclick="renderGamesView()">Juegos</button>
                    <button class="btn xbox-green" onclick="renderSettings()">Configuración</button>
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
        container.innerHTML = '';
        
        appState.players.forEach(player => {
            const isSelected = appState.selectedPlayers.includes(player.id);
            const chip = document.createElement('div');
            chip.className = `player-chip ${isSelected ? 'selected' : ''}`;
            chip.innerHTML = `
                ${player.name}
                <i class="material-icons">${isSelected ? 'check' : 'add'}</i>
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
        container.innerHTML = '';
        
        // Filtra juegos que incluyan a TODOS los jugadores seleccionados
        const filteredGames = appState.games.filter(game => {
            return appState.selectedPlayers.every(playerId => 
                game.players.includes(playerId)
            );
        });
        
        if (filteredGames.length === 0) {
            container.innerHTML = `
                <div class="center" style="grid-column: 1/-1; padding: 20px;">
                    <p>No hay juegos disponibles para los jugadores seleccionados</p>
                </div>
            `;
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
                    <div class="game-platform">
                        <i class="material-icons">${getPlatformIcon(game.platform)}</i>
                        ${game.platform}
                    </div>
                </div>
            `;
            container.appendChild(gameCard);
        });
    }
    
    function getPlatformIcon(platform) {
        if (platform.includes('Xbox')) return 'sports_esports';
        if (platform.includes('PlayStation')) return 'videogame_asset';
        if (platform.includes('PC')) return 'computer';
        return 'gamepad';
    }
    
    function renderDashboard() {
        // Implementar dashboard con estadísticas
        mainApp.innerHTML = `
            <div class="navbar">
                <div class="nav-title">Estadísticas</div>
                <div class="nav-buttons">
                    <button class="btn xbox-green" onclick="renderMainView()">Volver</button>
                </div>
            </div>
            
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
            </div>
        `;
        
        // TODO: Implementar gráficos con Chart.js
    }
    
    function renderPlayersView() {
        // Implementar gestión de jugadores
        mainApp.innerHTML = `
            <div class="navbar">
                <div class="nav-title">Gestión de Jugadores</div>
                <div class="nav-buttons">
                    <button class="btn xbox-green" onclick="renderMainView()">Volver</button>
                    <button class="btn xbox-green" onclick="openPlayerForm()">
                        <i class="material-icons">add</i>
                    </button>
                </div>
            </div>
            
            <div class="container">
                <table class="highlight">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="players-list"></tbody>
                </table>
            </div>
            
            <!-- Modal para agregar/editar jugadores -->
            <div id="player-modal" class="modal">
                <div class="modal-content">
                    <h4 id="modal-title">Nuevo Jugador</h4>
                    <div class="input-field">
                        <input type="text" id="player-name" placeholder="Nombre del jugador">
                    </div>
                </div>
                <div class="modal-footer">
                    <a href="#!" class="modal-close btn-flat">Cancelar</a>
                    <a href="#!" class="btn xbox-green" onclick="savePlayer()">Guardar</a>
                </div>
            </div>
        `;
        
        M.Modal.init(document.querySelectorAll('.modal'));
        renderPlayersList();
    }
    
    function renderPlayersList() {
        const container = document.getElementById('players-list');
        container.innerHTML = '';
        
        appState.players.forEach(player => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${player.name}</td>
                <td>
                    <button class="btn-small blue" onclick="editPlayer(${player.id})">
                        <i class="material-icons">edit</i>
                    </button>
                    <button class="btn-small red" onclick="deletePlayer(${player.id})">
                        <i class="material-icons">delete</i>
                    </button>
                </td>
            `;
            container.appendChild(row);
        });
    }
    
    function renderGamesView() {
        // Implementar gestión de juegos (similar a jugadores)
        mainApp.innerHTML = `
            <div class="navbar">
                <div class="nav-title">Gestión de Juegos</div>
                <div class="nav-buttons">
                    <button class="btn xbox-green" onclick="renderMainView()">Volver</button>
                    <button class="btn xbox-green" onclick="openGameForm()">
                        <i class="material-icons">add</i>
                    </button>
                </div>
            </div>
            
            <div class="container">
                <table class="highlight">
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Plataforma</th>
                            <th>Jugadores</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="games-list"></tbody>
                </table>
            </div>
            
            <!-- Modal para agregar/editar juegos -->
            <div id="game-modal" class="modal">
                <div class="modal-content">
                    <h4 id="game-modal-title">Nuevo Juego</h4>
                    <div class="input-field">
                        <input type="text" id="game-title" placeholder="Título del juego">
                    </div>
                    <div class="input-field">
                        <select id="game-platform">
                            <option value="" disabled selected>Selecciona plataforma</option>
                            <option value="PC">PC</option>
                            <option value="Xbox">Xbox</option>
                            <option value="PlayStation">PlayStation</option>
                            <option value="Nintendo Switch">Nintendo Switch</option>
                            <option value="Multiplataforma">Multiplataforma</option>
                        </select>
                        <label>Plataforma</label>
                    </div>
                    <div>
                        <label>Jugadores que juegan</label>
                        <div id="game-players-selector" class="player-selector"></div>
                    </div>
                    <div class="switch">
                        <label>
                            Completado
                            <input type="checkbox" id="game-completed">
                            <span class="lever"></span>
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <a href="#!" class="modal-close btn-flat">Cancelar</a>
                    <a href="#!" class="btn xbox-green" onclick="saveGame()">Guardar</a>
                </div>
            </div>
        `;
        
        M.Modal.init(document.querySelectorAll('.modal'));
        M.FormSelect.init(document.querySelectorAll('select'));
        renderGamesList();
    }
    
    function renderGamesList() {
        const container = document.getElementById('games-list');
        container.innerHTML = '';
        
        appState.games.forEach(game => {
            const playerNames = game.players.map(playerId => {
                const player = appState.players.find(p => p.id === playerId);
                return player ? player.name : '';
            }).filter(name => name !== '');
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${game.title}</td>
                <td>${game.platform}</td>
                <td>${playerNames.join(', ')}</td>
                <td>${game.completed ? 'Completado' : 'En progreso'}</td>
                <td>
                    <button class="btn-small blue" onclick="editGame(${game.id})">
                        <i class="material-icons">edit</i>
                    </button>
                    <button class="btn-small red" onclick="deleteGame(${game.id})">
                        <i class="material-icons">delete</i>
                    </button>
                </td>
            `;
            container.appendChild(row);
        });
    }
    
    function renderSettings() {
        mainApp.innerHTML = `
            <div class="navbar">
                <div class="nav-title">Configuración</div>
                <div class="nav-buttons">
                    <button class="btn xbox-green" onclick="renderMainView()">Volver</button>
                </div>
            </div>
            
            <div class="container">
                <div class="card">
                    <div class="card-content">
                        <span class="card-title">Cambiar Contraseña</span>
                        <div class="input-field">
                            <input type="password" id="new-password" placeholder="Nueva contraseña">
                        </div>
                        <div class="input-field">
                            <input type="password" id="confirm-password" placeholder="Confirmar contraseña">
                        </div>
                    </div>
                    <div class="card-action">
                        <button class="btn xbox-green" onclick="changePassword()">Cambiar Contraseña</button>
                    </div>
                </div>
                
                <div class="card mt-20">
                    <div class="card-content">
                        <span class="card-title">Gestión de Datos</span>
                        <p>Exportar o importar todos los datos de la aplicación</p>
                    </div>
                    <div class="card-action">
                        <button class="btn blue" onclick="exportData()">Exportar Datos</button>
                        <button class="btn green" onclick="document.getElementById('import-data').click()">Importar Datos</button>
                        <input type="file" id="import-data" accept=".json" style="display:none" onchange="importData(event)">
                    </div>
                </div>
            </div>
        `;
    }
    
    // Funciones de gestión de datos
    async function changePassword() {
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (!newPassword || newPassword !== confirmPassword) {
            M.toast({html: 'Las contraseñas no coinciden', classes: 'red'});
            return;
        }
        
        const hash = await hashPassword(newPassword);
        localStorage.setItem('passwordHash', hash);
        M.toast({html: 'Contraseña actualizada', classes: 'green'});
    }
    
    function exportData() {
        const dataStr = JSON.stringify(appState);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'GameSelectorData.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
    
    function importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                appState = data;
                saveData();
                M.toast({html: 'Datos importados correctamente', classes: 'green'});
                renderMainView();
            } catch (error) {
                M.toast({html: 'Error al importar datos', classes: 'red'});
            }
        };
        reader.readAsText(file);
    }
    
    // Funciones para gestión de jugadores
    function openPlayerForm(playerId = null) {
        const modal = document.getElementById('player-modal');
        const modalTitle = document.getElementById('modal-title');
        const playerNameInput = document.getElementById('player-name');
        
        if (playerId) {
            const player = appState.players.find(p => p.id === playerId);
            if (player) {
                modalTitle.textContent = 'Editar Jugador';
                playerNameInput.value = player.name;
                currentPlayerId = playerId;
            }
        } else {
            modalTitle.textContent = 'Nuevo Jugador';
            playerNameInput.value = '';
            currentPlayerId = null;
        }
        
        M.Modal.getInstance(modal).open();
    }
    
    function savePlayer() {
        const playerName = document.getElementById('player-name').value.trim();
        if (!playerName) {
            M.toast({html: 'El nombre del jugador es requerido', classes: 'red'});
            return;
        }
        
        if (currentPlayerId) {
            // Editar jugador existente
            const playerIndex = appState.players.findIndex(p => p.id === currentPlayerId);
            if (playerIndex !== -1) {
                appState.players[playerIndex].name = playerName;
            }
        } else {
            // Crear nuevo jugador
            const newId = Math.max(0, ...appState.players.map(p => p.id)) + 1;
            appState.players.push({
                id: newId,
                name: playerName
            });
        }
        
        saveData();
        renderPlayersList();
        M.toast({html: 'Jugador guardado', classes: 'green'});
        M.Modal.getInstance(document.getElementById('player-modal')).close();
    }
    
    function editPlayer(playerId) {
        openPlayerForm(playerId);
    }
    
    function deletePlayer(playerId) {
        if (confirm('¿Estás seguro de eliminar este jugador?')) {
            appState.players = appState.players.filter(p => p.id !== playerId);
            
            // Actualizar juegos que incluían a este jugador
            appState.games.forEach(game => {
                game.players = game.players.filter(pId => pId !== playerId);
            });
            
            saveData();
            renderPlayersList();
            M.toast({html: 'Jugador eliminado', classes: 'green'});
        }
    }
    
    // Funciones para gestión de juegos
    function openGameForm(gameId = null) {
        const modal = document.getElementById('game-modal');
        const modalTitle = document.getElementById('game-modal-title');
        const gameTitleInput = document.getElementById('game-title');
        const gamePlatformSelect = document.getElementById('game-platform');
        const gameCompletedCheckbox = document.getElementById('game-completed');
        const playersSelector = document.getElementById('game-players-selector');
        
        playersSelector.innerHTML = '';
        appState.players.forEach(player => {
            const chip = document.createElement('div');
            chip.className = 'player-chip';
            chip.innerHTML = `
                ${player.name}
                <i class="material-icons">add</i>
            `;
            chip.dataset.playerId = player.id;
            chip.onclick = () => chip.classList.toggle('selected');
            playersSelector.appendChild(chip);
        });
        
        if (gameId) {
            const game = appState.games.find(g => g.id === gameId);
            if (game) {
                modalTitle.textContent = 'Editar Juego';
                gameTitleInput.value = game.title;
                gamePlatformSelect.value = game.platform;
                gameCompletedCheckbox.checked = game.completed;
                
                // Seleccionar jugadores
                game.players.forEach(playerId => {
                    const chip = playersSelector.querySelector(`[data-player-id="${playerId}"]`);
                    if (chip) {
                        chip.classList.add('selected');
                        chip.querySelector('i').textContent = 'check';
                    }
                });
                
                currentGameId = gameId;
            }
        } else {
            modalTitle.textContent = 'Nuevo Juego';
            gameTitleInput.value = '';
            gamePlatformSelect.value = '';
            gameCompletedCheckbox.checked = false;
            currentGameId = null;
        }
        
        M.Modal.getInstance(modal).open();
        M.FormSelect.init(gamePlatformSelect);
    }
    
    function saveGame() {
        const title = document.getElementById('game-title').value.trim();
        const platform = document.getElementById('game-platform').value;
        const completed = document.getElementById('game-completed').checked;
        
        if (!title || !platform) {
            M.toast({html: 'Título y plataforma son requeridos', classes: 'red'});
            return;
        }
        
        const selectedPlayers = Array.from(
            document.querySelectorAll('#game-players-selector .player-chip.selected')
        ).map(chip => parseInt(chip.dataset.playerId));
        
        if (selectedPlayers.length === 0) {
            M.toast({html: 'Selecciona al menos un jugador', classes: 'red'});
            return;
        }
        
        if (currentGameId) {
            // Editar juego existente
            const gameIndex = appState.games.findIndex(g => g.id === currentGameId);
            if (gameIndex !== -1) {
                appState.games[gameIndex] = {
                    ...appState.games[gameIndex],
                    title,
                    platform,
                    players: selectedPlayers,
                    completed
                };
            }
        } else {
            // Crear nuevo juego
            const newId = Math.max(0, ...appState.games.map(g => g.id)) + 1;
            appState.games.push({
                id: newId,
                title,
                platform,
                players: selectedPlayers,
                completed
            });
        }
        
        saveData();
        renderGamesList();
        M.toast({html: 'Juego guardado', classes: 'green'});
        M.Modal.getInstance(document.getElementById('game-modal')).close();
    }
    
    function editGame(gameId) {
        openGameForm(gameId);
    }
    
    function deleteGame(gameId) {
        if (confirm('¿Estás seguro de eliminar este juego?')) {
            appState.games = appState.games.filter(g => g.id !== gameId);
            saveData();
            renderGamesList();
            M.toast({html: 'Juego eliminado', classes: 'green'});
        }
    }
    
    // Variables para mantener el estado entre funciones
    let currentPlayerId = null;
    let currentGameId = null;
    
    // Exponer funciones globalmente para acceso desde HTML
    window.renderMainView = renderMainView;
    window.renderDashboard = renderDashboard;
    window.renderPlayersView = renderPlayersView;
    window.renderGamesView = renderGamesView;
    window.renderSettings = renderSettings;
    window.openPlayerForm = openPlayerForm;
    window.savePlayer = savePlayer;
    window.editPlayer = editPlayer;
    window.deletePlayer = deletePlayer;
    window.openGameForm = openGameForm;
    window.saveGame = saveGame;
    window.editGame = editGame;
    window.deleteGame = deleteGame;
    window.changePassword = changePassword;
    window.exportData = exportData;
    window.importData = importData;
});

// Inicializar Materialize components
document.addEventListener('DOMContentLoaded', function() {
    M.AutoInit();
});
