/**
 * playerController.js
 * 
 * Controller for handling player view and interactions in the TB Chest Analyzer.
 * Manages player data display, filtering, sorting, and detail views.
 */

/**
 * PlayerController - Handles player view and interactions
 */
export class PlayerController {
  /**
   * Initialize the player controller
   * @param {Object} dataService - Data service instance
   * @param {Object} chartService - Chart service instance
   * @param {Object} uiService - UI service instance
   * @param {Object} stateManager - State manager instance
   */
  constructor(dataService, chartService, uiService, stateManager) {
    this._dataService = dataService;
    this._chartService = chartService;
    this._uiService = uiService;
    this._stateManager = stateManager;
    
    this._playerCharts = {};
    this._comparisonData = [];
  }
  
  /**
   * Initialize the player controller
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      console.log('Initializing player controller...');
      
      // Set up event handlers
      this._setupEventHandlers();
      
      // Subscribe to state changes
      this._setupStateSubscriptions();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize player controller:', error);
      return false;
    }
  }
  
  /**
   * Show the players view
   */
  showView() {
    // Create/refresh player list if data is available
    if (this._dataService.isDataLoaded()) {
      this._renderPlayersView();
    } else {
      // Show loading message
      const playersContainer = document.getElementById('players-container');
      if (playersContainer) {
        playersContainer.innerHTML = '<div class="loading-message">Loading data...</div>';
      }
      
      // Try to load data
      this._dataService.loadData().then(success => {
        if (success) {
          this._renderPlayersView();
        } else {
          if (playersContainer) {
            playersContainer.innerHTML = '<div class="error-message">Failed to load data. Please try again.</div>';
          }
        }
      });
    }
  }
  
  /**
   * Show player details
   * @param {string} playerId - Player ID
   */
  showPlayerDetails(playerId) {
    try {
      // Get player data
      const playerData = this._dataService.getPlayerDetails(playerId);
      if (!playerData) {
        throw new Error(`Player not found: ${playerId}`);
      }
      
      // Update state
      this._stateManager.setState('currentPlayer', playerId);
      this._stateManager.setState('playerDetails', playerData);
      
      // Create modal content
      const content = this._createPlayerDetailsContent(playerData);
      
      // Define modal buttons
      const buttons = [
        {
          text: 'Close',
          action: 'close',
          primary: false
        },
        {
          text: 'Add to Comparison',
          action: 'compare',
          primary: true
        }
      ];
      
      // Show modal
      this._uiService.showModal(`Player: ${playerData.name}`, content, buttons);
      
      // Handle modal button actions
      document.addEventListener('modal-action', this._handleModalAction.bind(this), { once: true });
      
      // Create player charts
      this._createPlayerCharts(playerData);
    } catch (error) {
      console.error('Failed to show player details:', error);
      this._uiService.showNotification(`Failed to show player details: ${error.message}`, 'error');
    }
  }
  
  /**
   * Filter players by criteria
   * @param {Object} filters - Filter criteria
   */
  filterPlayers(filters) {
    // Update state
    this._stateManager.setState('filters', {
      ...this._stateManager.getState('filters'),
      ...filters
    });
    
    // Re-render players view
    this._renderPlayersView();
  }
  
  /**
   * Sort players by column
   * @param {string} column - Column to sort by
   * @param {boolean} ascending - Sort direction
   */
  sortPlayers(column, ascending = true) {
    // Update state
    this._stateManager.setState('players.sortColumn', column);
    this._stateManager.setState('players.sortAscending', ascending);
    
    // Re-render players view
    this._renderPlayersView();
  }
  
  /**
   * Add a player to comparison
   * @param {string} playerId - Player ID
   * @returns {boolean} Success status
   */
  addToComparison(playerId) {
    try {
      // Get player data
      const playerData = this._dataService.getPlayerDetails(playerId);
      if (!playerData) {
        throw new Error(`Player not found: ${playerId}`);
      }
      
      // Check if already in comparison
      if (this._comparisonData.some(p => p.id === playerId)) {
        console.log('Player already in comparison');
        return false;
      }
      
      // Add to comparison data
      this._comparisonData.push(playerData);
      
      // Show notification
      this._uiService.showNotification(`Added ${playerData.name} to comparison`, 'success');
      
      // Update comparison badge if it exists
      const badge = document.getElementById('comparison-badge');
      if (badge) {
        badge.textContent = this._comparisonData.length;
        badge.style.display = this._comparisonData.length > 0 ? 'block' : 'none';
      }
      
      return true;
    } catch (error) {
      console.error('Failed to add player to comparison:', error);
      this._uiService.showNotification(`Failed to add player to comparison: ${error.message}`, 'error');
      return false;
    }
  }
  
  /**
   * Remove a player from comparison
   * @param {string} playerId - Player ID
   */
  removeFromComparison(playerId) {
    // Filter out the player
    this._comparisonData = this._comparisonData.filter(p => p.id !== playerId);
    
    // Update comparison badge if it exists
    const badge = document.getElementById('comparison-badge');
    if (badge) {
      badge.textContent = this._comparisonData.length;
      badge.style.display = this._comparisonData.length > 0 ? 'block' : 'none';
    }
    
    // Re-render comparison view if active
    if (document.getElementById('comparison-container') && 
        document.getElementById('comparison-container').style.display !== 'none') {
      this._renderComparisonView();
    }
  }
  
  /**
   * Show player comparison view
   */
  showComparisonView() {
    // Check if we have players to compare
    if (this._comparisonData.length === 0) {
      this._uiService.showNotification('No players selected for comparison', 'warning');
      return;
    }
    
    // Create comparison content
    const content = this._createComparisonContent();
    
    // Show modal
    this._uiService.showModal('Player Comparison', content, [
      {
        text: 'Close',
        action: 'close',
        primary: false
      },
      {
        text: 'Clear All',
        action: 'clear-comparison',
        primary: true
      }
    ]);
    
    // Handle modal button actions
    document.addEventListener('modal-action', this._handleModalAction.bind(this), { once: true });
    
    // Create comparison charts
    this._createComparisonCharts();
  }
  
  /**
   * Clear all players from comparison
   */
  clearComparison() {
    this._comparisonData = [];
    
    // Update comparison badge if it exists
    const badge = document.getElementById('comparison-badge');
    if (badge) {
      badge.textContent = '0';
      badge.style.display = 'none';
    }
    
    // Close comparison modal if open
    const modal = document.querySelector('.modal');
    if (modal) {
      modal.querySelector('.modal-close').click();
    }
  }
  
  /**
   * Render the players view
   * @private
   */
  _renderPlayersView() {
    // Get the players container
    const playersContainer = document.getElementById('players-container');
    if (!playersContainer) {
      console.error('Players container not found');
      return;
    }
    
    // Clear previous content
    playersContainer.innerHTML = '';
    
    // Create filter and controls section
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'players-controls';
    playersContainer.appendChild(controlsContainer);
    
    // Add filter UI
    this._uiService.createFilterUI(controlsContainer, {
      playerSearch: {
        type: 'text',
        label: 'Search Players',
        placeholder: 'Enter player name'
      },
      selectedServer: {
        type: 'select',
        label: 'Server',
        options: [
          { value: '', label: 'All Servers' },
          ...this._dataService.getServers().map(server => ({ 
            value: server, 
            label: server 
          }))
        ]
      },
      selectedAlliance: {
        type: 'select',
        label: 'Alliance',
        options: [
          { value: '', label: 'All Alliances' },
          ...this._dataService.getAlliances().map(alliance => ({ 
            value: alliance, 
            label: alliance 
          }))
        ]
      }
    }, this.filterPlayers.bind(this));
    
    // Add comparison button and badge
    const comparisonButton = document.createElement('button');
    comparisonButton.className = 'comparison-button';
    comparisonButton.innerHTML = 'Show Comparison <span id="comparison-badge">0</span>';
    comparisonButton.addEventListener('click', () => {
      this.showComparisonView();
    });
    
    controlsContainer.appendChild(comparisonButton);
    
    // Update badge count
    const badge = document.getElementById('comparison-badge');
    if (badge) {
      badge.textContent = this._comparisonData.length;
      badge.style.display = this._comparisonData.length > 0 ? 'block' : 'none';
    }
    
    // Get filtered players
    const filters = this._stateManager.getState('filters');
    const players = this._dataService.getFilteredPlayers(filters);
    
    // Sort players if needed
    const sortColumn = this._stateManager.getState('players.sortColumn') || 'score';
    const sortAscending = this._stateManager.getState('players.sortAscending') || false;
    
    const sortedPlayers = [...players].sort((a, b) => {
      let valueA = a[sortColumn];
      let valueB = b[sortColumn];
      
      // Handle string vs number sorting
      if (typeof valueA === 'string') {
        return sortAscending 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      } else {
        return sortAscending 
          ? valueA - valueB 
          : valueB - valueA;
      }
    });
    
    // Create players table
    const columns = [
      { key: 'name', label: 'Player' },
      { key: 'alliance', label: 'Alliance' },
      { key: 'server', label: 'Server' },
      { key: 'score', label: 'Score' },
      { key: 'chests', label: 'Chests' },
      { key: 'ratio', label: 'Ratio', format: value => value.toFixed(2) }
    ];
    
    const actions = [
      { 
        label: 'View', 
        icon: 'eye',
        action: (player) => this.showPlayerDetails(player.id)
      },
      { 
        label: 'Compare', 
        icon: 'chart-line',
        action: (player) => this.addToComparison(player.id)
      }
    ];
    
    const table = this._uiService.createTable(
      sortedPlayers, 
      columns, 
      {
        sortable: true,
        actions: actions,
        onSort: this.sortPlayers.bind(this),
        currentSort: {
          column: sortColumn,
          ascending: sortAscending
        }
      }
    );
    
    // Add table to container
    playersContainer.appendChild(table);
    
    // Show no results message if needed
    if (sortedPlayers.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'no-results-message';
      noResults.textContent = 'No players found matching the current filters.';
      playersContainer.appendChild(noResults);
    }
  }
  
  /**
   * Create player details content
   * @param {Object} player - Player data
   * @returns {HTMLElement} Content element
   * @private
   */
  _createPlayerDetailsContent(player) {
    const content = document.createElement('div');
    content.className = 'player-details';
    
    // Create player info section
    const infoSection = document.createElement('div');
    infoSection.className = 'player-info-section';
    
    // Basic info
    const basicInfo = document.createElement('div');
    basicInfo.className = 'player-basic-info';
    
    // Player name
    const nameElement = document.createElement('h2');
    nameElement.className = 'player-name';
    nameElement.textContent = player.name;
    basicInfo.appendChild(nameElement);
    
    // Alliance and server
    const serverInfo = document.createElement('div');
    serverInfo.className = 'player-server-info';
    
    if (player.alliance) {
      const allianceElement = document.createElement('p');
      allianceElement.innerHTML = `<strong>Alliance:</strong> ${player.alliance}`;
      serverInfo.appendChild(allianceElement);
    }
    
    const serverElement = document.createElement('p');
    serverElement.innerHTML = `<strong>Server:</strong> ${player.server}`;
    serverInfo.appendChild(serverElement);
    
    basicInfo.appendChild(serverInfo);
    infoSection.appendChild(basicInfo);
    
    // Stats info
    const statsInfo = document.createElement('div');
    statsInfo.className = 'player-stats-info';
    
    const stats = [
      { label: 'Score', value: player.score },
      { label: 'Chests', value: player.chests },
      { label: 'Ratio', value: player.ratio.toFixed(2) }
    ];
    
    stats.forEach(stat => {
      const statElement = document.createElement('div');
      statElement.className = 'player-stat';
      
      const valueElement = document.createElement('span');
      valueElement.className = 'stat-value';
      valueElement.textContent = stat.value;
      
      const labelElement = document.createElement('span');
      labelElement.className = 'stat-label';
      labelElement.textContent = stat.label;
      
      statElement.appendChild(valueElement);
      statElement.appendChild(labelElement);
      statsInfo.appendChild(statElement);
    });
    
    infoSection.appendChild(statsInfo);
    content.appendChild(infoSection);
    
    // Create charts section
    const chartsSection = document.createElement('div');
    chartsSection.className = 'player-charts-section';
    
    // Performance chart
    const performanceChartContainer = document.createElement('div');
    performanceChartContainer.className = 'chart-container';
    performanceChartContainer.id = 'player-performance-chart';
    
    const performanceTitle = document.createElement('h3');
    performanceTitle.textContent = 'Performance Overview';
    performanceChartContainer.appendChild(performanceTitle);
    
    chartsSection.appendChild(performanceChartContainer);
    
    // Comparison chart
    const comparisonChartContainer = document.createElement('div');
    comparisonChartContainer.className = 'chart-container';
    comparisonChartContainer.id = 'player-comparison-chart';
    
    const comparisonTitle = document.createElement('h3');
    comparisonTitle.textContent = 'Comparison to Average';
    comparisonChartContainer.appendChild(comparisonTitle);
    
    chartsSection.appendChild(comparisonChartContainer);
    
    content.appendChild(chartsSection);
    
    return content;
  }
  
  /**
   * Create player charts
   * @param {Object} player - Player data
   * @private
   */
  _createPlayerCharts(player) {
    // Clean up any existing charts
    Object.values(this._playerCharts).forEach(chartId => {
      this._chartService.destroyChart(chartId);
    });
    this._playerCharts = {};
    
    // Performance chart (bar chart)
    const performanceData = {
      series: [{
        name: 'Performance',
        data: [player.score, player.chests, player.ratio.toFixed(2)]
      }],
      categories: ['Score', 'Chests', 'Ratio']
    };
    
    const performanceChart = this._chartService.createChart(
      'player-performance-chart',
      'bar',
      performanceData,
      {
        chart: {
          height: 250
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '55%'
          }
        },
        colors: ['#0266C8']
      }
    );
    
    if (performanceChart) {
      this._playerCharts.performance = performanceChart.id;
    }
    
    // Comparison to average chart (radar chart)
    // Get average data
    const allPlayers = this._dataService.getFilteredPlayers({});
    
    const avgScore = allPlayers.reduce((sum, p) => sum + p.score, 0) / allPlayers.length;
    const avgChests = allPlayers.reduce((sum, p) => sum + p.chests, 0) / allPlayers.length;
    const avgRatio = allPlayers.reduce((sum, p) => sum + p.ratio, 0) / allPlayers.length;
    
    const comparisonData = {
      series: [
        {
          name: player.name,
          data: [
            player.score / avgScore * 100,
            player.chests / avgChests * 100,
            player.ratio / avgRatio * 100
          ]
        },
        {
          name: 'Average',
          data: [100, 100, 100]
        }
      ],
      categories: ['Score', 'Chests', 'Ratio']
    };
    
    const comparisonChart = this._chartService.createChart(
      'player-comparison-chart',
      'radar',
      comparisonData,
      {
        chart: {
          height: 250
        },
        colors: ['#0266C8', '#F90101'],
        yaxis: {
          labels: {
            formatter: function(val) {
              return val.toFixed(0) + '%';
            }
          }
        }
      }
    );
    
    if (comparisonChart) {
      this._playerCharts.comparison = comparisonChart.id;
    }
  }
  
  /**
   * Create comparison content
   * @returns {HTMLElement} Content element
   * @private
   */
  _createComparisonContent() {
    const content = document.createElement('div');
    content.className = 'player-comparison';
    content.id = 'comparison-container';
    
    // Create players list
    const playersList = document.createElement('div');
    playersList.className = 'comparison-players-list';
    
    this._comparisonData.forEach(player => {
      const playerItem = document.createElement('div');
      playerItem.className = 'comparison-player-item';
      
      const playerInfo = document.createElement('div');
      playerInfo.className = 'player-info';
      playerInfo.innerHTML = `
        <span class="player-name">${player.name}</span>
        <span class="player-alliance">${player.alliance || ''}</span>
        <span class="player-server">${player.server}</span>
      `;
      
      const removeButton = document.createElement('button');
      removeButton.className = 'remove-comparison-player';
      removeButton.innerHTML = '&times;';
      removeButton.title = 'Remove from comparison';
      removeButton.addEventListener('click', () => {
        this.removeFromComparison(player.id);
      });
      
      playerItem.appendChild(playerInfo);
      playerItem.appendChild(removeButton);
      playersList.appendChild(playerItem);
    });
    
    content.appendChild(playersList);
    
    // Create charts section
    const chartsSection = document.createElement('div');
    chartsSection.className = 'comparison-charts-section';
    
    // Score comparison chart
    const scoreChartContainer = document.createElement('div');
    scoreChartContainer.className = 'chart-container';
    scoreChartContainer.id = 'comparison-score-chart';
    
    const scoreTitle = document.createElement('h3');
    scoreTitle.textContent = 'Score Comparison';
    scoreChartContainer.appendChild(scoreTitle);
    
    chartsSection.appendChild(scoreChartContainer);
    
    // Chest comparison chart
    const chestChartContainer = document.createElement('div');
    chestChartContainer.className = 'chart-container';
    chestChartContainer.id = 'comparison-chest-chart';
    
    const chestTitle = document.createElement('h3');
    chestTitle.textContent = 'Chest Comparison';
    chestChartContainer.appendChild(chestTitle);
    
    chartsSection.appendChild(chestChartContainer);
    
    // Ratio comparison chart
    const ratioChartContainer = document.createElement('div');
    ratioChartContainer.className = 'chart-container';
    ratioChartContainer.id = 'comparison-ratio-chart';
    
    const ratioTitle = document.createElement('h3');
    ratioTitle.textContent = 'Ratio Comparison';
    ratioChartContainer.appendChild(ratioTitle);
    
    chartsSection.appendChild(ratioChartContainer);
    
    content.appendChild(chartsSection);
    
    return content;
  }
  
  /**
   * Create comparison charts
   * @private
   */
  _createComparisonCharts() {
    // Create score comparison chart
    const scoreData = {
      series: [{
        name: 'Score',
        data: this._comparisonData.map(player => player.score)
      }],
      categories: this._comparisonData.map(player => player.name)
    };
    
    this._chartService.createChart(
      'comparison-score-chart',
      'bar',
      scoreData,
      {
        chart: {
          height: 250
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '55%'
          }
        },
        colors: ['#0266C8']
      }
    );
    
    // Create chest comparison chart
    const chestData = {
      series: [{
        name: 'Chests',
        data: this._comparisonData.map(player => player.chests)
      }],
      categories: this._comparisonData.map(player => player.name)
    };
    
    this._chartService.createChart(
      'comparison-chest-chart',
      'bar',
      chestData,
      {
        chart: {
          height: 250
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '55%'
          }
        },
        colors: ['#F90101']
      }
    );
    
    // Create ratio comparison chart
    const ratioData = {
      series: [{
        name: 'Ratio',
        data: this._comparisonData.map(player => player.ratio.toFixed(2))
      }],
      categories: this._comparisonData.map(player => player.name)
    };
    
    this._chartService.createChart(
      'comparison-ratio-chart',
      'bar',
      ratioData,
      {
        chart: {
          height: 250
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '55%'
          }
        },
        colors: ['#F2B50F']
      }
    );
  }
  
  /**
   * Handle modal action events
   * @param {Event} event - Modal action event
   * @private
   */
  _handleModalAction(event) {
    const action = event.detail.action;
    
    switch (action) {
      case 'compare':
        // Add current player to comparison
        const currentPlayer = this._stateManager.getState('currentPlayer');
        if (currentPlayer) {
          this.addToComparison(currentPlayer);
        }
        break;
        
      case 'clear-comparison':
        // Clear all comparison data
        this.clearComparison();
        break;
    }
  }
  
  /**
   * Set up event handlers
   * @private
   */
  _setupEventHandlers() {
    // Event delegation for player table actions
    document.addEventListener('click', (event) => {
      // Check if the clicked element is a player action button
      if (event.target.matches('.player-action') || event.target.closest('.player-action')) {
        const actionButton = event.target.matches('.player-action') 
          ? event.target 
          : event.target.closest('.player-action');
          
        const playerId = actionButton.getAttribute('data-player-id');
        const action = actionButton.getAttribute('data-action');
        
        if (playerId && action) {
          if (action === 'view') {
            this.showPlayerDetails(playerId);
          } else if (action === 'compare') {
            this.addToComparison(playerId);
          }
        }
      }
    });
  }
  
  /**
   * Set up state subscriptions
   * @private
   */
  _setupStateSubscriptions() {
    // Listen for view changes
    this._stateManager.subscribe('currentView', (viewId) => {
      if (viewId === 'players') {
        this.showView();
      }
    });
    
    // Listen for filter changes
    this._stateManager.subscribe('filters', () => {
      if (this._stateManager.getState('currentView') === 'players') {
        this._renderPlayersView();
      }
    });
  }
}