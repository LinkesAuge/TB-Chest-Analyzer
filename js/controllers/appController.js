/**
 * appController.js
 * 
 * Main application controller for the TB Chest Analyzer.
 * Coordinates between services and sub-controllers.
 */

/**
 * AppController - Main application controller
 */
export class AppController {
  /**
   * Initialize the application controller
   * @param {Object} dataService - Data service instance
   * @param {Object} uiService - UI service instance
   * @param {Object} navigationController - Navigation controller instance
   * @param {Object} analyticsController - Analytics controller instance
   * @param {Object} playerController - Player controller instance
   * @param {Object} stateManager - State manager instance
   * @param {Object} errorHandler - Error handler instance
   */
  constructor(
    dataService,
    uiService,
    navigationController,
    analyticsController,
    playerController,
    stateManager,
    errorHandler
  ) {
    this._dataService = dataService;
    this._uiService = uiService;
    this._navigationController = navigationController;
    this._analyticsController = analyticsController;
    this._playerController = playerController;
    this._stateManager = stateManager;
    this._errorHandler = errorHandler;
  }
  
  /**
   * Initialize the application
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      console.log('Initializing application...');
      
      // Show loading state
      this._uiService.showLoading(true);
      
      // Initialize the UI components
      this._initializeUI();
      
      // Load data
      const dataLoaded = await this._dataService.loadData();
      if (!dataLoaded) {
        throw new Error('Failed to load data');
      }
      
      // Initialize controllers
      await this._initializeControllers();
      
      // Set up window events
      this._setupWindowEvents();
      
      // Hide loading state
      this._uiService.showLoading(false);
      
      // Show initial view based on URL hash or default to overview
      this._handleInitialNavigation();
      
      console.log('Application initialized successfully');
      return true;
    } catch (error) {
      this._errorHandler.handleError(error, 'app-initialization', true);
      this._uiService.showLoading(false);
      return false;
    }
  }
  
  /**
   * Initialize UI components
   * @private
   */
  _initializeUI() {
    // Create notification container if it doesn't exist
    if (!document.getElementById('notification-container')) {
      const notificationContainer = document.createElement('div');
      notificationContainer.id = 'notification-container';
      document.body.appendChild(notificationContainer);
    }
    
    // Create loading indicator if it doesn't exist
    if (!document.getElementById('loading-spinner')) {
      const loadingSpinner = document.createElement('div');
      loadingSpinner.id = 'loading-spinner';
      loadingSpinner.innerHTML = '<div class="spinner"></div>';
      document.body.appendChild(loadingSpinner);
    }
  }
  
  /**
   * Initialize sub-controllers
   * @returns {Promise<boolean>} Success status
   * @private
   */
  async _initializeControllers() {
    try {
      // Initialize navigation controller
      await this._navigationController.initialize();
      
      // Initialize analytics controller
      await this._analyticsController.initialize();
      
      // Initialize player controller
      await this._playerController.initialize();
      
      return true;
    } catch (error) {
      this._errorHandler.handleError(error, 'controller-initialization');
      return false;
    }
  }
  
  /**
   * Handle initial navigation based on URL or default
   * @private
   */
  _handleInitialNavigation() {
    // Check for hash in URL
    const hash = window.location.hash.substring(1);
    
    if (hash) {
      // Validate the view ID
      const validViews = ['overview', 'players', 'analytics', 'charts', 'score', 'settings'];
      if (validViews.includes(hash)) {
        this._uiService.showView(hash);
      } else {
        this._uiService.showView('overview');
      }
    } else {
      this._uiService.showView('overview');
    }
  }
  
  /**
   * Set up window-level event handlers
   * @private
   */
  _setupWindowEvents() {
    // Handle popstate (browser back/forward)
    window.addEventListener('popstate', (event) => {
      if (event.state && event.state.view) {
        this._uiService.showView(event.state.view);
      } else {
        this._uiService.showView('overview');
      }
    });
    
    // Handle beforeunload (page exit)
    window.addEventListener('beforeunload', (event) => {
      // Check if there are unsaved changes
      if (this._stateManager.getState('isModalOpen')) {
        // Show confirmation dialog
        event.preventDefault();
        event.returnValue = '';
      }
    });
    
    // Handle keyboard shortcuts
    window.addEventListener('keydown', (event) => {
      // Escape key closes modal
      if (event.key === 'Escape' && this._stateManager.getState('isModalOpen')) {
        // Close the active modal
        const activeModal = document.querySelector('.modal');
        if (activeModal) {
          event.preventDefault();
          activeModal.querySelector('.modal-close').click();
        }
      }
    });
  }
}