/**
 * navigationController.js
 * 
 * Controller for handling navigation in the TB Chest Analyzer.
 * Manages view switching, URL hash handling, and browser history.
 */

/**
 * NavigationController - Handles application navigation
 */
export class NavigationController {
  /**
   * Initialize the navigation controller
   * @param {Object} stateManager - State manager instance
   * @param {Object} uiService - UI service instance
   */
  constructor(stateManager, uiService) {
    this._stateManager = stateManager;
    this._uiService = uiService;
    
    this._views = {
      dashboard: {
        id: 'dashboard',
        title: 'Dashboard',
        icon: 'tachometer-alt',
        default: true
      },
      players: {
        id: 'players',
        title: 'Players',
        icon: 'users'
      },
      analytics: {
        id: 'analytics',
        title: 'Analytics',
        icon: 'chart-bar'
      },
      settings: {
        id: 'settings',
        title: 'Settings',
        icon: 'cog'
      }
    };
    
    this._navElement = null;
    this._viewContainers = {};
  }
  
  /**
   * Initialize the navigation controller
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      console.log('Initializing navigation controller...');
      
      // Create navigation elements
      this._createNavigation();
      
      // Set up event handlers
      this._setupEventHandlers();
      
      // Setup view containers
      this._setupViewContainers();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize navigation controller:', error);
      return false;
    }
  }
  
  /**
   * Get available views
   * @returns {Object} Views configuration
   */
  getViews() {
    return this._views;
  }
  
  /**
   * Navigate to a view
   * @param {string} viewId - View identifier
   * @param {Object} params - Navigation parameters
   * @param {boolean} updateUrl - Whether to update URL
   */
  navigateTo(viewId, params = {}, updateUrl = true) {
    try {
      // Check if view exists
      if (!this._views[viewId]) {
        throw new Error(`View not found: ${viewId}`);
      }
      
      // Update active navigation item
      this._updateActiveNavItem(viewId);
      
      // Hide all view containers
      Object.values(this._viewContainers).forEach(container => {
        container.style.display = 'none';
      });
      
      // Show target container
      if (this._viewContainers[viewId]) {
        this._viewContainers[viewId].style.display = 'block';
      }
      
      // Update document title
      document.title = `TB Chest Analyzer - ${this._views[viewId].title}`;
      
      // Update state
      this._stateManager.setState('currentView', viewId);
      this._stateManager.setState('navParams', params);
      
      // Update URL if requested
      if (updateUrl) {
        this._updateUrl(viewId, params);
      }
      
      console.log(`Navigated to view: ${viewId}`);
    } catch (error) {
      console.error('Navigation failed:', error);
      this._uiService.showNotification(`Navigation failed: ${error.message}`, 'error');
    }
  }
  
  /**
   * Get current navigation state
   * @returns {Object} Current navigation state
   */
  getCurrentState() {
    return {
      view: this._stateManager.getState('currentView'),
      params: this._stateManager.getState('navParams') || {}
    };
  }
  
  /**
   * Handle URL hash change
   * @returns {Object} Parsed navigation state
   */
  handleUrlHash() {
    const hash = window.location.hash.substring(1) || '';
    
    // Default view
    if (!hash) {
      const defaultView = Object.values(this._views).find(view => view.default)?.id || 'dashboard';
      return { view: defaultView, params: {} };
    }
    
    // Parse hash
    try {
      const [viewId, paramString] = hash.split('?');
      
      // Check if view exists
      if (!this._views[viewId]) {
        throw new Error(`Invalid view: ${viewId}`);
      }
      
      // Parse params
      const params = {};
      if (paramString) {
        const searchParams = new URLSearchParams(paramString);
        for (const [key, value] of searchParams.entries()) {
          // Handle special types (numbers, booleans, etc.)
          if (!isNaN(value) && value.trim() !== '') {
            params[key] = Number(value);
          } else if (value === 'true') {
            params[key] = true;
          } else if (value === 'false') {
            params[key] = false;
          } else {
            params[key] = value;
          }
        }
      }
      
      return { view: viewId, params };
    } catch (error) {
      console.error('Failed to parse URL hash:', error);
      
      // Fallback to default view
      const defaultView = Object.values(this._views).find(view => view.default)?.id || 'dashboard';
      return { view: defaultView, params: {} };
    }
  }
  
  /**
   * Create navigation menu
   * @private
   */
  _createNavigation() {
    // Get or create navigation element
    this._navElement = document.getElementById('main-nav');
    if (!this._navElement) {
      this._navElement = document.createElement('nav');
      this._navElement.id = 'main-nav';
      document.body.prepend(this._navElement);
    }
    
    // Clear existing content
    this._navElement.innerHTML = '';
    
    // App title
    const titleElement = document.createElement('div');
    titleElement.className = 'nav-title';
    titleElement.textContent = 'TB Chest Analyzer';
    this._navElement.appendChild(titleElement);
    
    // Nav items container
    const navItems = document.createElement('ul');
    navItems.className = 'nav-items';
    
    // Create nav items for each view
    Object.values(this._views).forEach(view => {
      const navItem = document.createElement('li');
      navItem.className = 'nav-item';
      navItem.setAttribute('data-view', view.id);
      
      const navLink = document.createElement('a');
      navLink.href = `#${view.id}`;
      
      // Icon
      if (view.icon) {
        const iconElement = document.createElement('i');
        iconElement.className = `fas fa-${view.icon}`;
        navLink.appendChild(iconElement);
      }
      
      // Text
      const textElement = document.createElement('span');
      textElement.textContent = view.title;
      navLink.appendChild(textElement);
      
      navItem.appendChild(navLink);
      navItems.appendChild(navItem);
    });
    
    this._navElement.appendChild(navItems);
    
    // User menu (if needed)
    const userMenu = document.createElement('div');
    userMenu.className = 'nav-user-menu';
    
    // Theme toggle
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    themeToggle.title = 'Toggle dark mode';
    
    // Set initial state based on current theme
    const isDarkMode = this._stateManager.getState('theme') === 'dark';
    themeToggle.innerHTML = isDarkMode 
      ? '<i class="fas fa-sun"></i>' 
      : '<i class="fas fa-moon"></i>';
    
    themeToggle.addEventListener('click', () => {
      const currentTheme = this._stateManager.getState('theme') || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      // Update icon
      themeToggle.innerHTML = newTheme === 'dark' 
        ? '<i class="fas fa-sun"></i>' 
        : '<i class="fas fa-moon"></i>';
      
      // Update state
      this._stateManager.setState('theme', newTheme);
    });
    
    userMenu.appendChild(themeToggle);
    this._navElement.appendChild(userMenu);
  }
  
  /**
   * Update active navigation item
   * @param {string} viewId - View identifier
   * @private
   */
  _updateActiveNavItem(viewId) {
    if (!this._navElement) return;
    
    // Remove active class from all nav items
    const navItems = this._navElement.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.classList.remove('active');
    });
    
    // Add active class to target nav item
    const targetItem = this._navElement.querySelector(`.nav-item[data-view="${viewId}"]`);
    if (targetItem) {
      targetItem.classList.add('active');
    }
  }
  
  /**
   * Set up view containers
   * @private
   */
  _setupViewContainers() {
    // Get main content element
    const mainContent = document.getElementById('main-content');
    if (!mainContent) {
      console.error('Main content element not found');
      return;
    }
    
    // Clear existing content
    mainContent.innerHTML = '';
    
    // Create containers for each view
    Object.keys(this._views).forEach(viewId => {
      const container = document.createElement('div');
      container.id = `${viewId}-container`;
      container.className = 'view-container';
      container.style.display = 'none';
      
      mainContent.appendChild(container);
      this._viewContainers[viewId] = container;
    });
  }
  
  /**
   * Set up event handlers
   * @private
   */
  _setupEventHandlers() {
    // Handle navigation clicks
    if (this._navElement) {
      this._navElement.addEventListener('click', (event) => {
        // Check if clicked element is a navigation link
        const navLink = event.target.closest('.nav-item a');
        if (navLink) {
          event.preventDefault();
          
          // Get view ID from parent nav item
          const navItem = navLink.closest('.nav-item');
          const viewId = navItem.getAttribute('data-view');
          
          if (viewId) {
            this.navigateTo(viewId);
          }
        }
      });
    }
    
    // Handle hash changes
    window.addEventListener('hashchange', () => {
      const { view, params } = this.handleUrlHash();
      this.navigateTo(view, params, false);
    });
  }
  
  /**
   * Update URL with navigation state
   * @param {string} viewId - View identifier
   * @param {Object} params - Navigation parameters
   * @private
   */
  _updateUrl(viewId, params = {}) {
    // Build hash
    let hash = `#${viewId}`;
    
    // Add params if any
    if (Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.set(key, value.toString());
        }
      }
      
      const paramString = searchParams.toString();
      if (paramString) {
        hash += `?${paramString}`;
      }
    }
    
    // Update URL without triggering hashchange event
    const currentUrl = window.location.href;
    const newUrl = currentUrl.split('#')[0] + hash;
    
    if (newUrl !== currentUrl) {
      window.history.pushState(null, '', hash);
    }
  }
}