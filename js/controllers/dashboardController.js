/**
 * dashboardController.js
 * 
 * Controller for the dashboard view in the TB Chest Analyzer.
 * Displays summary statistics, quick stats, and recent activity.
 */

/**
 * DashboardController - Handles dashboard view
 */
export class DashboardController {
  /**
   * Initialize the dashboard controller
   * @param {Object} dataService - Data service instance
   * @param {Object} chartService - Chart service instance
   * @param {Object} uiService - UI service instance
   * @param {Object} stateManager - State manager instance
   * @param {Object} languageService - Language service instance
   */
  constructor(dataService, chartService, uiService, stateManager, languageService) {
    this._dataService = dataService;
    this._chartService = chartService;
    this._uiService = uiService;
    this._stateManager = stateManager;
    this._languageService = languageService;
    
    this._dashboardCharts = {};
  }
  
  /**
   * Initialize the dashboard controller
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      console.log('Initializing dashboard controller...');
      
      // Set up state subscriptions
      this._setupStateSubscriptions();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize dashboard controller:', error);
      return false;
    }
  }
  
  /**
   * Show the dashboard view
   */
  showView() {
    // Create/refresh dashboard if data is available
    if (this._dataService.isDataLoaded()) {
      this._renderDashboardView();
    } else {
      // Show loading message
      const dashboardContainer = document.getElementById('dashboard-container');
      if (dashboardContainer) {
        dashboardContainer.innerHTML = '<div class="loading-message">Loading data...</div>';
      }
      
      // Try to load data
      this._dataService.loadData().then(success => {
        if (success) {
          this._renderDashboardView();
        } else {
          if (dashboardContainer) {
            dashboardContainer.innerHTML = '<div class="error-message">Failed to load data. Please try again.</div>';
          }
        }
      });
    }
  }
  
  /**
   * Render the dashboard view
   * @private
   */
  _renderDashboardView() {
    // Get dashboard container
    const dashboardContainer = document.getElementById('dashboard-container');
    if (!dashboardContainer) {
      console.error('Dashboard container not found');
      return;
    }
    
    // Clear previous content
    dashboardContainer.innerHTML = '';
    
    // Get statistics
    const stats = this._dataService.getStatistics();
    
    // Create dashboard layout
    const layout = document.createElement('div');
    layout.className = 'dashboard-layout';
    
    // Welcome section
    const welcomeSection = this._createWelcomeSection();
    layout.appendChild(welcomeSection);
    
    // Summary section
    const summarySection = this._createSummarySection(stats);
    layout.appendChild(summarySection);
    
    // Charts section
    const chartsSection = this._createChartsSection(stats);
    layout.appendChild(chartsSection);
    
    // Top players section
    const topPlayersSection = this._createTopPlayersSection(stats);
    layout.appendChild(topPlayersSection);
    
    // Add layout to container
    dashboardContainer.appendChild(layout);
    
    // Create charts
    this._createDashboardCharts(stats);
  }
  
  /**
   * Create welcome section
   * @returns {HTMLElement} Welcome section element
   * @private
   */
  _createWelcomeSection() {
    const section = document.createElement('div');
    section.className = 'dashboard-section welcome-section';
    
    const title = document.createElement('h1');
    title.className = 'welcome-title';
    title.textContent = this._languageService.translate('dashboard.welcome');
    
    const description = document.createElement('p');
    description.className = 'welcome-description';
    description.textContent = 'Analyze chest data, compare players, and identify top performers.';
    
    section.appendChild(title);
    section.appendChild(description);
    
    return section;
  }
  
  /**
   * Create summary section
   * @param {Object} stats - Statistics data
   * @returns {HTMLElement} Summary section element
   * @private
   */
  _createSummarySection(stats) {
    const section = document.createElement('div');
    section.className = 'dashboard-section summary-section';
    
    const title = document.createElement('h2');
    title.textContent = this._languageService.translate('dashboard.summary');
    section.appendChild(title);
    
    // Create summary cards
    const cards = document.createElement('div');
    cards.className = 'summary-cards';
    
    // Total players card
    const playersCard = this._createSummaryCard(
      'users',
      stats.totalPlayers.toLocaleString(),
      this._languageService.translate('dashboard.total_players')
    );
    cards.appendChild(playersCard);
    
    // Total chests card
    const chestsCard = this._createSummaryCard(
      'treasure-chest',
      stats.totalChests.toLocaleString(),
      this._languageService.translate('dashboard.total_chests')
    );
    cards.appendChild(chestsCard);
    
    // Average score card
    const scoreCard = this._createSummaryCard(
      'star',
      Math.round(stats.averageScore).toLocaleString(),
      this._languageService.translate('dashboard.average_score')
    );
    cards.appendChild(scoreCard);
    
    // Last updated
    const lastUpdated = document.createElement('div');
    lastUpdated.className = 'last-updated';
    
    if (stats.lastUpdated) {
      const date = new Date(stats.lastUpdated);
      lastUpdated.textContent = `Last updated: ${this._languageService.formatDate(date)}`;
    } else {
      lastUpdated.textContent = 'Last updated: Unknown';
    }
    
    section.appendChild(cards);
    section.appendChild(lastUpdated);
    
    return section;
  }
  
  /**
   * Create summary card
   * @param {string} icon - Icon name
   * @param {string} value - Card value
   * @param {string} label - Card label
   * @returns {HTMLElement} Card element
   * @private
   */
  _createSummaryCard(icon, value, label) {
    const card = document.createElement('div');
    card.className = 'summary-card';
    
    const iconElement = document.createElement('i');
    iconElement.className = `fas fa-${icon}`;
    
    const valueElement = document.createElement('div');
    valueElement.className = 'card-value';
    valueElement.textContent = value;
    
    const labelElement = document.createElement('div');
    labelElement.className = 'card-label';
    labelElement.textContent = label;
    
    card.appendChild(iconElement);
    card.appendChild(valueElement);
    card.appendChild(labelElement);
    
    return card;
  }
  
  /**
   * Create charts section
   * @param {Object} stats - Statistics data
   * @returns {HTMLElement} Charts section element
   * @private
   */
  _createChartsSection(stats) {
    const section = document.createElement('div');
    section.className = 'dashboard-section charts-section';
    
    const title = document.createElement('h2');
    title.textContent = 'Overview Charts';
    section.appendChild(title);
    
    // Create chart containers
    const chartsGrid = document.createElement('div');
    chartsGrid.className = 'charts-grid';
    
    // Score distribution chart
    const scoreChartContainer = document.createElement('div');
    scoreChartContainer.className = 'chart-container';
    scoreChartContainer.id = 'score-distribution-chart';
    
    const scoreTitle = document.createElement('h3');
    scoreTitle.textContent = 'Score Distribution';
    scoreChartContainer.appendChild(scoreTitle);
    
    chartsGrid.appendChild(scoreChartContainer);
    
    // Chest distribution chart
    const chestChartContainer = document.createElement('div');
    chestChartContainer.className = 'chart-container';
    chestChartContainer.id = 'chest-distribution-chart';
    
    const chestTitle = document.createElement('h3');
    chestTitle.textContent = 'Chest Distribution';
    chestChartContainer.appendChild(chestTitle);
    
    chartsGrid.appendChild(chestChartContainer);
    
    // Server comparison chart
    const serverChartContainer = document.createElement('div');
    serverChartContainer.className = 'chart-container';
    serverChartContainer.id = 'server-comparison-chart';
    
    const serverTitle = document.createElement('h3');
    serverTitle.textContent = 'Server Comparison';
    serverChartContainer.appendChild(serverTitle);
    
    chartsGrid.appendChild(serverChartContainer);
    
    // Alliance comparison chart
    const allianceChartContainer = document.createElement('div');
    allianceChartContainer.className = 'chart-container';
    allianceChartContainer.id = 'alliance-comparison-chart';
    
    const allianceTitle = document.createElement('h3');
    allianceTitle.textContent = 'Alliance Comparison';
    allianceChartContainer.appendChild(allianceTitle);
    
    chartsGrid.appendChild(allianceChartContainer);
    
    section.appendChild(chartsGrid);
    
    return section;
  }
  
  /**
   * Create top players section
   * @param {Object} stats - Statistics data
   * @returns {HTMLElement} Top players section element
   * @private
   */
  _createTopPlayersSection(stats) {
    const section = document.createElement('div');
    section.className = 'dashboard-section top-players-section';
    
    const title = document.createElement('h2');
    title.textContent = 'Top Players';
    section.appendChild(title);
    
    // Create tabs
    const tabs = document.createElement('div');
    tabs.className = 'tabs';
    
    const tabScore = document.createElement('button');
    tabScore.className = 'tab active';
    tabScore.dataset.target = 'top-score';
    tabScore.textContent = 'By Score';
    
    const tabChests = document.createElement('button');
    tabChests.className = 'tab';
    tabChests.dataset.target = 'top-chests';
    tabChests.textContent = 'By Chests';
    
    const tabRatio = document.createElement('button');
    tabRatio.className = 'tab';
    tabRatio.dataset.target = 'top-ratio';
    tabRatio.textContent = 'By Ratio';
    
    tabs.appendChild(tabScore);
    tabs.appendChild(tabChests);
    tabs.appendChild(tabRatio);
    
    section.appendChild(tabs);
    
    // Create tab content
    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content';
    
    // Top by score
    const topScore = document.createElement('div');
    topScore.className = 'tab-pane active';
    topScore.id = 'top-score';
    
    const scoreTable = this._createTopPlayersTable(stats.topPlayersByScore, 'score');
    topScore.appendChild(scoreTable);
    
    // Top by chests
    const topChests = document.createElement('div');
    topChests.className = 'tab-pane';
    topChests.id = 'top-chests';
    
    const chestsTable = this._createTopPlayersTable(stats.topPlayersByChests, 'chests');
    topChests.appendChild(chestsTable);
    
    // Top by ratio
    const topRatio = document.createElement('div');
    topRatio.className = 'tab-pane';
    topRatio.id = 'top-ratio';
    
    const ratioTable = this._createTopPlayersTable(stats.topPlayersByRatio, 'ratio');
    topRatio.appendChild(ratioTable);
    
    tabContent.appendChild(topScore);
    tabContent.appendChild(topChests);
    tabContent.appendChild(topRatio);
    
    section.appendChild(tabContent);
    
    // Add tab functionality
    tabs.addEventListener('click', (event) => {
      if (event.target.classList.contains('tab')) {
        // Remove active class from all tabs
        tabs.querySelectorAll('.tab').forEach(tab => {
          tab.classList.remove('active');
        });
        
        // Add active class to clicked tab
        event.target.classList.add('active');
        
        // Hide all tab panes
        tabContent.querySelectorAll('.tab-pane').forEach(pane => {
          pane.classList.remove('active');
        });
        
        // Show target pane
        const target = event.target.dataset.target;
        document.getElementById(target).classList.add('active');
      }
    });
    
    return section;
  }
  
  /**
   * Create top players table
   * @param {Array} players - Top players
   * @param {string} metric - Metric name
   * @returns {HTMLElement} Table element
   * @private
   */
  _createTopPlayersTable(players, metric) {
    // Create table
    const table = document.createElement('table');
    table.className = 'top-players-table';
    
    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const rankHeader = document.createElement('th');
    rankHeader.textContent = 'Rank';
    headerRow.appendChild(rankHeader);
    
    const nameHeader = document.createElement('th');
    nameHeader.textContent = 'Player';
    headerRow.appendChild(nameHeader);
    
    const allianceHeader = document.createElement('th');
    allianceHeader.textContent = 'Alliance';
    headerRow.appendChild(allianceHeader);
    
    const serverHeader = document.createElement('th');
    serverHeader.textContent = 'Server';
    headerRow.appendChild(serverHeader);
    
    const metricHeader = document.createElement('th');
    metricHeader.textContent = metric.charAt(0).toUpperCase() + metric.slice(1);
    headerRow.appendChild(metricHeader);
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create body
    const tbody = document.createElement('tbody');
    
    players.forEach((player, index) => {
      const row = document.createElement('tr');
      row.dataset.playerId = player.id;
      
      // Add rank
      const rankCell = document.createElement('td');
      rankCell.textContent = index + 1;
      row.appendChild(rankCell);
      
      // Add name
      const nameCell = document.createElement('td');
      nameCell.textContent = player.name;
      row.appendChild(nameCell);
      
      // Add alliance
      const allianceCell = document.createElement('td');
      allianceCell.textContent = player.alliance || '-';
      row.appendChild(allianceCell);
      
      // Add server
      const serverCell = document.createElement('td');
      serverCell.textContent = player.server;
      row.appendChild(serverCell);
      
      // Add metric
      const metricCell = document.createElement('td');
      
      // Format value based on metric
      if (metric === 'ratio') {
        metricCell.textContent = player[metric].toFixed(2);
      } else {
        metricCell.textContent = player[metric].toLocaleString();
      }
      
      row.appendChild(metricCell);
      
      // Add click handler to show player details
      row.addEventListener('click', () => {
        // Navigate to player details
        this._stateManager.setState('currentPlayer', player.id);
        this._stateManager.setState('currentView', 'players');
      });
      
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    
    return table;
  }
  
  /**
   * Create dashboard charts
   * @param {Object} stats - Statistics data
   * @private
   */
  _createDashboardCharts(stats) {
    // Clean up any existing charts
    Object.values(this._dashboardCharts).forEach(chartId => {
      this._chartService.destroyChart(chartId);
    });
    this._dashboardCharts = {};
    
    // Score distribution chart
    const scoreDistributionData = this._dataService.getChartData('score_distribution');
    const scoreChart = this._chartService.createChart(
      'score-distribution-chart',
      'bar',
      scoreDistributionData,
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
    
    if (scoreChart) {
      this._dashboardCharts.scoreDistribution = scoreChart.id;
    }
    
    // Chest distribution chart
    const chestDistributionData = this._dataService.getChartData('chest_distribution');
    const chestChart = this._chartService.createChart(
      'chest-distribution-chart',
      'bar',
      chestDistributionData,
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
    
    if (chestChart) {
      this._dashboardCharts.chestDistribution = chestChart.id;
    }
    
    // Server comparison chart
    const serverData = this._dataService.getChartData('server_comparison');
    const serverChart = this._chartService.createChart(
      'server-comparison-chart',
      'bar',
      serverData,
      {
        chart: {
          height: 250,
          stacked: false
        },
        plotOptions: {
          bar: {
            horizontal: false
          }
        }
      }
    );
    
    if (serverChart) {
      this._dashboardCharts.serverComparison = serverChart.id;
    }
    
    // Alliance comparison chart
    const allianceData = this._dataService.getChartData('alliance_comparison');
    const allianceChart = this._chartService.createChart(
      'alliance-comparison-chart',
      'bar',
      allianceData,
      {
        chart: {
          height: 250,
          stacked: false
        },
        plotOptions: {
          bar: {
            horizontal: false
          }
        }
      }
    );
    
    if (allianceChart) {
      this._dashboardCharts.allianceComparison = allianceChart.id;
    }
  }
  
  /**
   * Set up state subscriptions
   * @private
   */
  _setupStateSubscriptions() {
    // Listen for view changes
    this._stateManager.subscribe('currentView', (viewId) => {
      if (viewId === 'dashboard') {
        this.showView();
      }
    });
    
    // Listen for theme changes to update charts
    this._stateManager.subscribe('theme', () => {
      if (this._stateManager.getState('currentView') === 'dashboard' && 
          this._dataService.isDataLoaded()) {
        this._createDashboardCharts(this._dataService.getStatistics());
      }
    });
  }
}