/**
 * dataService.js
 * 
 * Service for data loading and processing in the TB Chest Analyzer.
 * Handles data fetching, caching, filtering, and transformation.
 */

/**
 * DataService - Handles data loading and processing
 */
export class DataService {
  /**
   * Initialize the data service
   * @param {Object} stateManager - State manager instance
   * @param {Object} errorHandler - Error handler instance
   */
  constructor(stateManager, errorHandler) {
    this._stateManager = stateManager;
    this._errorHandler = errorHandler;
    
    // Data cache
    this._cache = {
      players: [],
      alliances: [],
      servers: [],
      lastUpdated: null
    };
    
    // Default data source URL
    this._dataSourceUrl = 'data/chest_data.json';
    
    // Cache duration in milliseconds (1 hour)
    this._cacheDuration = 60 * 60 * 1000;
  }
  
  /**
   * Initialize the data service
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      console.log('Initializing data service...');
      
      // Load cached data if available
      this._loadFromCache();
      
      // Set up state subscriptions
      this._setupStateSubscriptions();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize data service:', error);
      return false;
    }
  }
  
  /**
   * Load data from source
   * @param {boolean} forceRefresh - Force refresh from source
   * @returns {Promise<boolean>} Success status
   */
  async loadData(forceRefresh = false) {
    try {
      // Check if data is already loaded and not expired
      if (!forceRefresh && this.isDataLoaded() && this._isCacheValid()) {
        console.log('Using cached data');
        return true;
      }
      
      // Update loading state
      this._stateManager.setState('isLoading', true);
      
      // Get data source URL from state or use default
      const dataSource = this._stateManager.getState('dataSource') || this._dataSourceUrl;
      
      // Fetch data
      const response = await fetch(dataSource);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process data
      await this._processData(data);
      
      // Update loading state
      this._stateManager.setState('isLoading', false);
      
      // Update state
      this._stateManager.setState('dataLoaded', true);
      
      return true;
    } catch (error) {
      // Handle error
      this._errorHandler.handleError(error, 'DataService.loadData');
      
      // Update loading state
      this._stateManager.setState('isLoading', false);
      
      return false;
    }
  }
  
  /**
   * Check if data is loaded
   * @returns {boolean} Data loaded status
   */
  isDataLoaded() {
    return this._cache.players.length > 0;
  }
  
  /**
   * Get all players
   * @returns {Array} Players data
   */
  getPlayers() {
    return [...this._cache.players];
  }
  
  /**
   * Get filtered players
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered players
   */
  getFilteredPlayers(filters = {}) {
    try {
      // Start with all players
      let filteredPlayers = [...this._cache.players];
      
      // Apply filters
      if (filters) {
        // Filter by player name
        if (filters.playerSearch) {
          const searchTerm = filters.playerSearch.toLowerCase();
          filteredPlayers = filteredPlayers.filter(player => 
            player.name.toLowerCase().includes(searchTerm)
          );
        }
        
        // Filter by server
        if (filters.selectedServer) {
          filteredPlayers = filteredPlayers.filter(player => 
            player.server === filters.selectedServer
          );
        }
        
        // Filter by alliance
        if (filters.selectedAlliance) {
          filteredPlayers = filteredPlayers.filter(player => 
            player.alliance === filters.selectedAlliance
          );
        }
        
        // Filter by minimum score
        if (filters.minScore) {
          const minScore = parseInt(filters.minScore, 10);
          if (!isNaN(minScore)) {
            filteredPlayers = filteredPlayers.filter(player => 
              player.score >= minScore
            );
          }
        }
        
        // Filter by maximum score
        if (filters.maxScore) {
          const maxScore = parseInt(filters.maxScore, 10);
          if (!isNaN(maxScore)) {
            filteredPlayers = filteredPlayers.filter(player => 
              player.score <= maxScore
            );
          }
        }
        
        // Filter by minimum chests
        if (filters.minChests) {
          const minChests = parseInt(filters.minChests, 10);
          if (!isNaN(minChests)) {
            filteredPlayers = filteredPlayers.filter(player => 
              player.chests >= minChests
            );
          }
        }
        
        // Filter by maximum chests
        if (filters.maxChests) {
          const maxChests = parseInt(filters.maxChests, 10);
          if (!isNaN(maxChests)) {
            filteredPlayers = filteredPlayers.filter(player => 
              player.chests <= maxChests
            );
          }
        }
        
        // Filter by minimum ratio
        if (filters.minRatio) {
          const minRatio = parseFloat(filters.minRatio);
          if (!isNaN(minRatio)) {
            filteredPlayers = filteredPlayers.filter(player => 
              player.ratio >= minRatio
            );
          }
        }
        
        // Filter by maximum ratio
        if (filters.maxRatio) {
          const maxRatio = parseFloat(filters.maxRatio);
          if (!isNaN(maxRatio)) {
            filteredPlayers = filteredPlayers.filter(player => 
              player.ratio <= maxRatio
            );
          }
        }
      }
      
      return filteredPlayers;
    } catch (error) {
      this._errorHandler.handleError(error, 'DataService.getFilteredPlayers', false);
      return [];
    }
  }
  
  /**
   * Get player details
   * @param {string} playerId - Player ID
   * @returns {Object|null} Player data or null if not found
   */
  getPlayerDetails(playerId) {
    return this._cache.players.find(player => player.id === playerId) || null;
  }
  
  /**
   * Get all alliances
   * @returns {Array} Alliances data
   */
  getAlliances() {
    return [...this._cache.alliances];
  }
  
  /**
   * Get all servers
   * @returns {Array} Servers data
   */
  getServers() {
    return [...this._cache.servers];
  }
  
  /**
   * Get data statistics
   * @returns {Object} Data statistics
   */
  getStatistics() {
    try {
      const players = this._cache.players;
      
      // Calculate statistics
      const totalPlayers = players.length;
      const totalChests = players.reduce((sum, player) => sum + player.chests, 0);
      const totalScore = players.reduce((sum, player) => sum + player.score, 0);
      
      const averageChests = totalPlayers > 0 ? totalChests / totalPlayers : 0;
      const averageScore = totalPlayers > 0 ? totalScore / totalPlayers : 0;
      const averageRatio = totalPlayers > 0 
        ? players.reduce((sum, player) => sum + player.ratio, 0) / totalPlayers 
        : 0;
      
      // Top players by score
      const topPlayersByScore = [...players]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      
      // Top players by chests
      const topPlayersByChests = [...players]
        .sort((a, b) => b.chests - a.chests)
        .slice(0, 10);
      
      // Top players by ratio
      const topPlayersByRatio = [...players]
        .sort((a, b) => b.ratio - a.ratio)
        .slice(0, 10);
      
      // Alliance statistics
      const allianceStats = {};
      this._cache.alliances.forEach(alliance => {
        const alliancePlayers = players.filter(player => player.alliance === alliance);
        
        allianceStats[alliance] = {
          playerCount: alliancePlayers.length,
          totalScore: alliancePlayers.reduce((sum, player) => sum + player.score, 0),
          totalChests: alliancePlayers.reduce((sum, player) => sum + player.chests, 0),
          averageScore: alliancePlayers.length > 0 
            ? alliancePlayers.reduce((sum, player) => sum + player.score, 0) / alliancePlayers.length 
            : 0,
          averageChests: alliancePlayers.length > 0 
            ? alliancePlayers.reduce((sum, player) => sum + player.chests, 0) / alliancePlayers.length 
            : 0,
          averageRatio: alliancePlayers.length > 0 
            ? alliancePlayers.reduce((sum, player) => sum + player.ratio, 0) / alliancePlayers.length 
            : 0
        };
      });
      
      // Server statistics
      const serverStats = {};
      this._cache.servers.forEach(server => {
        const serverPlayers = players.filter(player => player.server === server);
        
        serverStats[server] = {
          playerCount: serverPlayers.length,
          totalScore: serverPlayers.reduce((sum, player) => sum + player.score, 0),
          totalChests: serverPlayers.reduce((sum, player) => sum + player.chests, 0),
          averageScore: serverPlayers.length > 0 
            ? serverPlayers.reduce((sum, player) => sum + player.score, 0) / serverPlayers.length 
            : 0,
          averageChests: serverPlayers.length > 0 
            ? serverPlayers.reduce((sum, player) => sum + player.chests, 0) / serverPlayers.length 
            : 0,
          averageRatio: serverPlayers.length > 0 
            ? serverPlayers.reduce((sum, player) => sum + player.ratio, 0) / serverPlayers.length 
            : 0
        };
      });
      
      return {
        totalPlayers,
        totalChests,
        totalScore,
        averageChests,
        averageScore,
        averageRatio,
        topPlayersByScore,
        topPlayersByChests,
        topPlayersByRatio,
        allianceStats,
        serverStats,
        lastUpdated: this._cache.lastUpdated
      };
    } catch (error) {
      this._errorHandler.handleError(error, 'DataService.getStatistics', false);
      return {
        totalPlayers: 0,
        totalChests: 0,
        totalScore: 0,
        averageChests: 0,
        averageScore: 0,
        averageRatio: 0,
        topPlayersByScore: [],
        topPlayersByChests: [],
        topPlayersByRatio: [],
        allianceStats: {},
        serverStats: {},
        lastUpdated: null
      };
    }
  }
  
  /**
   * Get data for a specific chart
   * @param {string} chartType - Chart type
   * @param {Object} options - Chart options
   * @returns {Object} Chart data
   */
  getChartData(chartType, options = {}) {
    try {
      const players = this.getFilteredPlayers(options.filters);
      
      switch (chartType) {
        case 'score_distribution':
          return this._createScoreDistributionData(players);
          
        case 'chest_distribution':
          return this._createChestDistributionData(players);
          
        case 'alliance_comparison':
          return this._createAllianceComparisonData(players);
          
        case 'server_comparison':
          return this._createServerComparisonData(players);
          
        case 'ratio_distribution':
          return this._createRatioDistributionData(players);
          
        case 'top_players':
          return this._createTopPlayersData(players, options.metric || 'score');
          
        default:
          throw new Error(`Unknown chart type: ${chartType}`);
      }
    } catch (error) {
      this._errorHandler.handleError(error, 'DataService.getChartData', false);
      return {
        series: [],
        categories: []
      };
    }
  }
  
  /**
   * Clear data cache
   */
  clearCache() {
    this._cache = {
      players: [],
      alliances: [],
      servers: [],
      lastUpdated: null
    };
    
    // Clear local storage
    localStorage.removeItem('tb_data_cache');
    
    // Update state
    this._stateManager.setState('dataLoaded', false);
    
    console.log('Data cache cleared');
  }
  
  /**
   * Set data source URL
   * @param {string} url - Data source URL
   */
  setDataSource(url) {
    this._dataSourceUrl = url;
    
    // Update state
    this._stateManager.setState('dataSource', url);
    
    console.log(`Data source set to: ${url}`);
  }
  
  /**
   * Process raw data
   * @param {Object} data - Raw data
   * @returns {Promise<boolean>} Success status
   * @private
   */
  async _processData(data) {
    try {
      // Process players
      const players = data.players || [];
      
      // Transform player data
      const processedPlayers = players.map((player, index) => {
        return {
          id: player.id || `player_${index}`,
          name: player.name || `Unknown Player ${index}`,
          alliance: player.alliance || '',
          server: player.server || 'Unknown',
          score: player.score || 0,
          chests: player.chests || 0,
          ratio: player.chests > 0 ? player.score / player.chests : 0
        };
      });
      
      // Extract unique alliances
      const alliances = [...new Set(processedPlayers
        .map(player => player.alliance)
        .filter(alliance => alliance !== '')
      )].sort();
      
      // Extract unique servers
      const servers = [...new Set(processedPlayers
        .map(player => player.server)
        .filter(server => server !== 'Unknown')
      )].sort();
      
      // Update cache
      this._cache.players = processedPlayers;
      this._cache.alliances = alliances;
      this._cache.servers = servers;
      this._cache.lastUpdated = new Date();
      
      // Save to cache
      this._saveToCache();
      
      return true;
    } catch (error) {
      this._errorHandler.handleError(error, 'DataService._processData', false);
      return false;
    }
  }
  
  /**
   * Save data to cache
   * @private
   */
  _saveToCache() {
    try {
      const cacheData = {
        players: this._cache.players,
        alliances: this._cache.alliances,
        servers: this._cache.servers,
        lastUpdated: this._cache.lastUpdated.toISOString()
      };
      
      localStorage.setItem('tb_data_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save data to cache:', error);
    }
  }
  
  /**
   * Load data from cache
   * @private
   */
  _loadFromCache() {
    try {
      const cacheData = localStorage.getItem('tb_data_cache');
      
      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        
        this._cache.players = parsed.players || [];
        this._cache.alliances = parsed.alliances || [];
        this._cache.servers = parsed.servers || [];
        this._cache.lastUpdated = parsed.lastUpdated ? new Date(parsed.lastUpdated) : null;
        
        if (this._cache.players.length > 0) {
          // Update state
          this._stateManager.setState('dataLoaded', true);
          console.log('Data loaded from cache');
        }
      }
    } catch (error) {
      console.warn('Failed to load data from cache:', error);
    }
  }
  
  /**
   * Check if cache is valid
   * @returns {boolean} Cache validity
   * @private
   */
  _isCacheValid() {
    if (!this._cache.lastUpdated) return false;
    
    const now = new Date();
    const cacheAge = now - this._cache.lastUpdated;
    
    return cacheAge < this._cacheDuration;
  }
  
  /**
   * Create score distribution data
   * @param {Array} players - Players data
   * @returns {Object} Chart data
   * @private
   */
  _createScoreDistributionData(players) {
    // Define score ranges
    const ranges = [
      { min: 0, max: 1000, label: '0-1K' },
      { min: 1000, max: 5000, label: '1K-5K' },
      { min: 5000, max: 10000, label: '5K-10K' },
      { min: 10000, max: 50000, label: '10K-50K' },
      { min: 50000, max: 100000, label: '50K-100K' },
      { min: 100000, max: 500000, label: '100K-500K' },
      { min: 500000, max: 1000000, label: '500K-1M' },
      { min: 1000000, max: Infinity, label: '1M+' }
    ];
    
    // Count players in each range
    const counts = ranges.map(range => {
      return players.filter(player => 
        player.score >= range.min && player.score < range.max
      ).length;
    });
    
    return {
      series: [{
        name: 'Players',
        data: counts
      }],
      categories: ranges.map(range => range.label)
    };
  }
  
  /**
   * Create chest distribution data
   * @param {Array} players - Players data
   * @returns {Object} Chart data
   * @private
   */
  _createChestDistributionData(players) {
    // Define chest ranges
    const ranges = [
      { min: 0, max: 10, label: '0-10' },
      { min: 10, max: 50, label: '10-50' },
      { min: 50, max: 100, label: '50-100' },
      { min: 100, max: 500, label: '100-500' },
      { min: 500, max: 1000, label: '500-1K' },
      { min: 1000, max: 5000, label: '1K-5K' },
      { min: 5000, max: 10000, label: '5K-10K' },
      { min: 10000, max: Infinity, label: '10K+' }
    ];
    
    // Count players in each range
    const counts = ranges.map(range => {
      return players.filter(player => 
        player.chests >= range.min && player.chests < range.max
      ).length;
    });
    
    return {
      series: [{
        name: 'Players',
        data: counts
      }],
      categories: ranges.map(range => range.label)
    };
  }
  
  /**
   * Create alliance comparison data
   * @param {Array} players - Players data
   * @returns {Object} Chart data
   * @private
   */
  _createAllianceComparisonData(players) {
    // Get unique alliances from filtered players
    const alliances = [...new Set(players
      .map(player => player.alliance)
      .filter(alliance => alliance !== '')
    )];
    
    // Get top 10 alliances by player count
    const topAlliances = alliances
      .map(alliance => {
        const alliancePlayers = players.filter(player => player.alliance === alliance);
        return {
          name: alliance,
          playerCount: alliancePlayers.length,
          totalScore: alliancePlayers.reduce((sum, player) => sum + player.score, 0),
          totalChests: alliancePlayers.reduce((sum, player) => sum + player.chests, 0),
          averageScore: alliancePlayers.length > 0 
            ? alliancePlayers.reduce((sum, player) => sum + player.score, 0) / alliancePlayers.length 
            : 0,
          averageChests: alliancePlayers.length > 0 
            ? alliancePlayers.reduce((sum, player) => sum + player.chests, 0) / alliancePlayers.length 
            : 0
        };
      })
      .sort((a, b) => b.playerCount - a.playerCount)
      .slice(0, 10);
    
    return {
      series: [
        {
          name: 'Total Score',
          data: topAlliances.map(alliance => alliance.totalScore)
        },
        {
          name: 'Total Chests',
          data: topAlliances.map(alliance => alliance.totalChests)
        },
        {
          name: 'Average Score',
          data: topAlliances.map(alliance => alliance.averageScore)
        },
        {
          name: 'Average Chests',
          data: topAlliances.map(alliance => alliance.averageChests)
        }
      ],
      categories: topAlliances.map(alliance => alliance.name)
    };
  }
  
  /**
   * Create server comparison data
   * @param {Array} players - Players data
   * @returns {Object} Chart data
   * @private
   */
  _createServerComparisonData(players) {
    // Get unique servers from filtered players
    const servers = [...new Set(players
      .map(player => player.server)
      .filter(server => server !== 'Unknown')
    )];
    
    // Calculate stats for each server
    const serverStats = servers.map(server => {
      const serverPlayers = players.filter(player => player.server === server);
      return {
        name: server,
        playerCount: serverPlayers.length,
        totalScore: serverPlayers.reduce((sum, player) => sum + player.score, 0),
        totalChests: serverPlayers.reduce((sum, player) => sum + player.chests, 0),
        averageScore: serverPlayers.length > 0 
          ? serverPlayers.reduce((sum, player) => sum + player.score, 0) / serverPlayers.length 
          : 0,
        averageChests: serverPlayers.length > 0 
          ? serverPlayers.reduce((sum, player) => sum + player.chests, 0) / serverPlayers.length 
          : 0
      };
    });
    
    return {
      series: [
        {
          name: 'Player Count',
          data: serverStats.map(server => server.playerCount)
        },
        {
          name: 'Average Score',
          data: serverStats.map(server => server.averageScore)
        },
        {
          name: 'Average Chests',
          data: serverStats.map(server => server.averageChests)
        }
      ],
      categories: serverStats.map(server => server.name)
    };
  }
  
  /**
   * Create ratio distribution data
   * @param {Array} players - Players data
   * @returns {Object} Chart data
   * @private
   */
  _createRatioDistributionData(players) {
    // Define ratio ranges
    const ranges = [
      { min: 0, max: 10, label: '0-10' },
      { min: 10, max: 50, label: '10-50' },
      { min: 50, max: 100, label: '50-100' },
      { min: 100, max: 200, label: '100-200' },
      { min: 200, max: 500, label: '200-500' },
      { min: 500, max: 1000, label: '500-1K' },
      { min: 1000, max: Infinity, label: '1K+' }
    ];
    
    // Count players in each range
    const counts = ranges.map(range => {
      return players.filter(player => 
        player.ratio >= range.min && player.ratio < range.max
      ).length;
    });
    
    return {
      series: [{
        name: 'Players',
        data: counts
      }],
      categories: ranges.map(range => range.label)
    };
  }
  
  /**
   * Create top players data
   * @param {Array} players - Players data
   * @param {string} metric - Metric to sort by
   * @returns {Object} Chart data
   * @private
   */
  _createTopPlayersData(players, metric) {
    // Validate metric
    if (!['score', 'chests', 'ratio'].includes(metric)) {
      metric = 'score';
    }
    
    // Get top 10 players by metric
    const topPlayers = [...players]
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, 10);
    
    return {
      series: [{
        name: metric.charAt(0).toUpperCase() + metric.slice(1),
        data: topPlayers.map(player => player[metric])
      }],
      categories: topPlayers.map(player => player.name)
    };
  }
  
  /**
   * Setup state subscriptions
   * @private
   */
  _setupStateSubscriptions() {
    // Listen for data source changes
    this._stateManager.subscribe('dataSource', (dataSource) => {
      if (dataSource) {
        this._dataSourceUrl = dataSource;
      }
    });
  }
}