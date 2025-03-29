/**
 * analyticsController.js
 * 
 * Controller for handling analytics view and data in the TB Chest Analyzer.
 * Manages chart creation, data processing, and user interactions within the analytics view.
 */

/**
 * AnalyticsController - Handles analytics view and data
 */
export class AnalyticsController {
  /**
   * Initialize the analytics controller
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
    
    this._chartInstances = {};
    this._activeChartType = 'playerDistribution';
  }
  
  /**
   * Initialize the analytics controller
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      console.log('Initializing analytics controller...');
      
      // Set up event handlers
      this._setupEventHandlers();
      
      // Subscribe to state changes
      this._setupStateSubscriptions();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize analytics controller:', error);
      return false;
    }
  }
  
  /**
   * Show the analytics view
   */
  showView() {
    // Create/refresh charts if data is available
    if (this._dataService.isDataLoaded()) {
      this._renderAnalyticsView();
    } else {
      // Show loading message
      const analyticsContainer = document.getElementById('analytics-container');
      if (analyticsContainer) {
        analyticsContainer.innerHTML = '<div class="loading-message">Loading data...</div>';
      }
      
      // Try to load data
      this._dataService.loadData().then(success => {
        if (success) {
          this._renderAnalyticsView();
        } else {
          if (analyticsContainer) {
            analyticsContainer.innerHTML = '<div class="error-message">Failed to load data. Please try again.</div>';
          }
        }
      });
    }
  }
  
  /**
   * Switch to a different chart type
   * @param {string} chartType - Type of chart to switch to
   */
  switchChartType(chartType) {
    // Validate chart type
    const validChartTypes = [
      'playerDistribution', 'chestComparison', 
      'alliancePerformance', 'serverActivity', 'topPlayers'
    ];
    
    if (!validChartTypes.includes(chartType)) {
      console.error(`Invalid chart type: ${chartType}`);
      return;
    }
    
    this._activeChartType = chartType;
    
    // Update state
    this._stateManager.setState('analytics.activeChartType', chartType);
    
    // Re-render the view
    this._renderAnalyticsView();
  }
  
  /**
   * Update chart options
   * @param {Object} options - Chart options
   */
  updateChartOptions(options) {
    // Get current chart instance
    const chartId = this._chartInstances[this._activeChartType];
    if (!chartId) {
      return;
    }
    
    // Update chart with new options
    const chart = this._chartService.getChart(chartId);
    if (chart) {
      const analyticsData = this._dataService.getAnalyticsData(
        this._activeChartType, 
        options
      );
      
      chart.update(analyticsData, options);
    }
    
    // Update state
    this._stateManager.setState('analytics.chartOptions', {
      ...this._stateManager.getState('analytics.chartOptions'),
      [this._activeChartType]: options
    });
  }
  
  /**
   * Export the current chart as an image
   * @param {string} format - Export format (png, svg, etc.)
   * @returns {Promise<string>} Data URL of the exported image
   */
  async exportChart(format = 'png') {
    // Get current chart instance
    const chartId = this._chartInstances[this._activeChartType];
    if (!chartId) {
      return null;
    }
    
    // Export chart
    return await this._chartService.exportChart(chartId, format);
  }
  
  /**
   * Render the analytics view
   * @private
   */
  _renderAnalyticsView() {
    // Get the analytics container
    const analyticsContainer = document.getElementById('analytics-container');
    if (!analyticsContainer) {
      console.error('Analytics container not found');
      return;
    }
    
    // Clear previous content
    analyticsContainer.innerHTML = '';
    
    // Create chart selector
    const selectorContainer = document.createElement('div');
    selectorContainer.className = 'chart-selector';
    analyticsContainer.appendChild(selectorContainer);
    
    // Create chart selector options
    const chartTypes = [
      { id: 'playerDistribution', label: 'Player Distribution' },
      { id: 'chestComparison', label: 'Chest Comparison' },
      { id: 'alliancePerformance', label: 'Alliance Performance' },
      { id: 'serverActivity', label: 'Server Activity' },
      { id: 'topPlayers', label: 'Top Players' }
    ];
    
    chartTypes.forEach(type => {
      const button = document.createElement('button');
      button.className = 'chart-type-button';
      button.dataset.chartType = type.id;
      button.textContent = type.label;
      
      if (type.id === this._activeChartType) {
        button.classList.add('active');
      }
      
      button.addEventListener('click', () => {
        this.switchChartType(type.id);
      });
      
      selectorContainer.appendChild(button);
    });
    
    // Create chart container
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    chartContainer.id = 'analytics-chart-container';
    analyticsContainer.appendChild(chartContainer);
    
    // Create options container
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'chart-options-container';
    analyticsContainer.appendChild(optionsContainer);
    
    // Create chart options based on active chart type
    this._createChartOptions(optionsContainer);
    
    // Create export buttons
    const exportContainer = document.createElement('div');
    exportContainer.className = 'export-container';
    
    const exportButton = document.createElement('button');
    exportButton.className = 'export-button';
    exportButton.textContent = 'Export Chart';
    exportButton.addEventListener('click', () => {
      this._handleExport();
    });
    
    exportContainer.appendChild(exportButton);
    analyticsContainer.appendChild(exportContainer);
    
    // Render the chart
    this._renderChart();
  }
  
  /**
   * Render the active chart
   * @private
   */
  _renderChart() {
    // Get options for the active chart type
    const options = this._stateManager.getState('analytics.chartOptions');
    const chartOptions = options ? options[this._activeChartType] || {} : {};
    
    // Get analytics data
    const analyticsData = this._dataService.getAnalyticsData(this._activeChartType, chartOptions);
    if (!analyticsData) {
      console.error('Failed to get analytics data');
      return;
    }
    
    // Determine chart type based on active chart
    let chartType = 'bar';
    switch (this._activeChartType) {
      case 'playerDistribution':
        chartType = 'bar';
        break;
      case 'chestComparison':
        chartType = 'bar';
        break;
      case 'alliancePerformance':
        chartType = 'line';
        break;
      case 'serverActivity':
        chartType = 'area';
        break;
      case 'topPlayers':
        chartType = 'bar';
        break;
    }
    
    // Get chart title
    const titles = {
      'playerDistribution': 'Player Distribution',
      'chestComparison': 'Chest Comparison',
      'alliancePerformance': 'Alliance Performance',
      'serverActivity': 'Server Activity',
      'topPlayers': 'Top Players'
    };
    
    // Create or update chart
    const container = document.getElementById('analytics-chart-container');
    if (!container) {
      console.error('Chart container not found');
      return;
    }
    
    // Clear previous chart
    if (this._chartInstances[this._activeChartType]) {
      this._chartService.destroyChart(this._chartInstances[this._activeChartType]);
      delete this._chartInstances[this._activeChartType];
    }
    
    // Create chart options
    const chartCustomOptions = {
      title: {
        text: titles[this._activeChartType],
        align: 'center',
        style: {
          fontSize: '18px',
          fontWeight: 'bold'
        }
      },
      ...chartOptions
    };
    
    // Create chart
    const chart = this._chartService.createChart(
      'analytics-chart-container',
      chartType,
      analyticsData,
      chartCustomOptions
    );
    
    if (chart) {
      this._chartInstances[this._activeChartType] = chart.id;
    }
  }
  
  /**
   * Create chart options UI
   * @param {HTMLElement} container - Container for options UI
   * @private
   */
  _createChartOptions(container) {
    // Clear container
    container.innerHTML = '';
    
    // Create form for options
    const form = document.createElement('form');
    form.className = 'chart-options-form';
    container.appendChild(form);
    
    // Add options based on chart type
    switch (this._activeChartType) {
      case 'playerDistribution':
        this._createPlayerDistributionOptions(form);
        break;
      case 'chestComparison':
        this._createChestComparisonOptions(form);
        break;
      case 'alliancePerformance':
        this._createAlliancePerformanceOptions(form);
        break;
      case 'serverActivity':
        this._createServerActivityOptions(form);
        break;
      case 'topPlayers':
        this._createTopPlayersOptions(form);
        break;
    }
    
    // Add apply button
    const applyButton = document.createElement('button');
    applyButton.type = 'submit';
    applyButton.className = 'apply-options-button';
    applyButton.textContent = 'Apply Options';
    form.appendChild(applyButton);
    
    // Add form submit handler
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      
      // Collect form data
      const formData = new FormData(form);
      const options = {};
      
      for (const [key, value] of formData.entries()) {
        options[key] = value;
      }
      
      // Update chart
      this.updateChartOptions(options);
    });
  }
  
  /**
   * Create options for player distribution chart
   * @param {HTMLElement} form - Form element to add options to
   * @private
   */
  _createPlayerDistributionOptions(form) {
    // Group by option
    const groupByLabel = document.createElement('label');
    groupByLabel.textContent = 'Group By:';
    form.appendChild(groupByLabel);
    
    const groupBySelect = document.createElement('select');
    groupBySelect.name = 'groupBy';
    
    const options = [
      { value: 'server', label: 'Server' },
      { value: 'alliance', label: 'Alliance' }
    ];
    
    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      groupBySelect.appendChild(optionElement);
    });
    
    form.appendChild(groupBySelect);
  }
  
  /**
   * Create options for chest comparison chart
   * @param {HTMLElement} form - Form element to add options to
   * @private
   */
  _createChestComparisonOptions(form) {
    // Top count option
    const topCountLabel = document.createElement('label');
    topCountLabel.textContent = 'Number of Players:';
    form.appendChild(topCountLabel);
    
    const topCountInput = document.createElement('input');
    topCountInput.type = 'number';
    topCountInput.name = 'topCount';
    topCountInput.min = '5';
    topCountInput.max = '50';
    topCountInput.value = '10';
    form.appendChild(topCountInput);
  }
  
  /**
   * Create options for alliance performance chart
   * @param {HTMLElement} form - Form element to add options to
   * @private
   */
  _createAlliancePerformanceOptions(form) {
    // Top count option
    const topCountLabel = document.createElement('label');
    topCountLabel.textContent = 'Number of Alliances:';
    form.appendChild(topCountLabel);
    
    const topCountInput = document.createElement('input');
    topCountInput.type = 'number';
    topCountInput.name = 'topCount';
    topCountInput.min = '3';
    topCountInput.max = '20';
    topCountInput.value = '10';
    form.appendChild(topCountInput);
  }
  
  /**
   * Create options for server activity chart
   * @param {HTMLElement} form - Form element to add options to
   * @private
   */
  _createServerActivityOptions(form) {
    // No specific options for server activity yet
    const helpText = document.createElement('p');
    helpText.className = 'help-text';
    helpText.textContent = 'No additional options available for this chart.';
    form.appendChild(helpText);
  }
  
  /**
   * Create options for top players chart
   * @param {HTMLElement} form - Form element to add options to
   * @private
   */
  _createTopPlayersOptions(form) {
    // Metric option
    const metricLabel = document.createElement('label');
    metricLabel.textContent = 'Metric:';
    form.appendChild(metricLabel);
    
    const metricSelect = document.createElement('select');
    metricSelect.name = 'metric';
    
    const metrics = [
      { value: 'score', label: 'Score' },
      { value: 'chests', label: 'Chests' },
      { value: 'ratio', label: 'Ratio' }
    ];
    
    metrics.forEach(metric => {
      const option = document.createElement('option');
      option.value = metric.value;
      option.textContent = metric.label;
      metricSelect.appendChild(option);
    });
    
    form.appendChild(metricSelect);
    
    // Top count option
    const topCountLabel = document.createElement('label');
    topCountLabel.textContent = 'Number of Players:';
    form.appendChild(topCountLabel);
    
    const topCountInput = document.createElement('input');
    topCountInput.type = 'number';
    topCountInput.name = 'topCount';
    topCountInput.min = '5';
    topCountInput.max = '50';
    topCountInput.value = '10';
    form.appendChild(topCountInput);
  }
  
  /**
   * Handle export button click
   * @private
   */
  _handleExport() {
    this.exportChart().then(dataUrl => {
      if (dataUrl) {
        // Create download link
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${this._activeChartType}-chart.png`;
        link.click();
      }
    });
  }
  
  /**
   * Set up event handlers
   * @private
   */
  _setupEventHandlers() {
    // Event delegation for chart type selection
    document.addEventListener('click', (event) => {
      // Check if the clicked element is a chart type button
      if (event.target.matches('.chart-type-button')) {
        const chartType = event.target.getAttribute('data-chart-type');
        if (chartType) {
          this.switchChartType(chartType);
        }
      }
    });
    
    // Window resize handler for chart responsiveness
    window.addEventListener('resize', this._handleResize.bind(this));
  }
  
  /**
   * Handle window resize
   * @private
   */
  _handleResize() {
    // Resize active chart
    const chartId = this._chartInstances[this._activeChartType];
    if (chartId) {
      this._chartService.resizeChart(chartId);
    }
  }
  
  /**
   * Set up state subscriptions
   * @private
   */
  _setupStateSubscriptions() {
    // Listen for view changes
    this._stateManager.subscribe('currentView', (viewId) => {
      if (viewId === 'analytics') {
        this.showView();
      }
    });
    
    // Listen for data changes
    this._stateManager.subscribe('processedData', () => {
      if (this._stateManager.getState('currentView') === 'analytics') {
        this._renderAnalyticsView();
      }
    });
    
    // Listen for filter changes
    this._stateManager.subscribe('filters', () => {
      if (this._stateManager.getState('currentView') === 'analytics') {
        this._renderChart();
      }
    });
  }
}