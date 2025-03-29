/**
 * errorHandler.js
 * 
 * Service for centralized error handling in the TB Chest Analyzer.
 * Manages error logging, display, and reporting.
 */

/**
 * ErrorHandler - Centralized error handling service
 */
export class ErrorHandler {
  /**
   * Initialize the error handler
   * @param {Object} uiService - UI service instance
   * @param {Object} languageService - Language service instance
   */
  constructor(uiService, languageService) {
    this._uiService = uiService;
    this._languageService = languageService;
    
    // Error log
    this._errorLog = [];
    
    // Maximum errors to keep in log
    this._maxErrorLogSize = 100;
    
    // Error reporting enabled
    this._reportingEnabled = false;
    
    // Error reporting endpoint
    this._reportingEndpoint = '';
  }
  
  /**
   * Initialize the error handler
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      console.log('Initializing error handler...');
      
      // Setup global error handlers
      this._setupGlobalHandlers();
      
      // Load settings
      this._loadSettings();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize error handler:', error);
      return false;
    }
  }
  
  /**
   * Handle an error
   * @param {Error|string} error - Error object or message
   * @param {string} source - Error source (component name)
   * @param {boolean} showToUser - Whether to show error to user
   * @param {string} level - Error level (error, warning, info)
   * @returns {string} Error ID
   */
  handleError(error, source = 'unknown', showToUser = true, level = 'error') {
    try {
      // Create error object
      const errorObj = this._createErrorObject(error, source, level);
      
      // Add to log
      this._addToLog(errorObj);
      
      // Display error if needed
      if (showToUser) {
        this._displayError(errorObj);
      }
      
      // Report error if enabled
      if (this._reportingEnabled) {
        this._reportError(errorObj);
      }
      
      // Log to console
      this._logToConsole(errorObj);
      
      return errorObj.id;
    } catch (e) {
      // Fallback logging in case of error handler failure
      console.error('Error handler failure:', e);
      console.error('Original error:', error);
      return null;
    }
  }
  
  /**
   * Get error log
   * @param {number} limit - Maximum number of errors to return
   * @returns {Array} Error log
   */
  getErrorLog(limit = null) {
    if (limit) {
      return this._errorLog.slice(0, limit);
    }
    return [...this._errorLog];
  }
  
  /**
   * Clear error log
   */
  clearErrorLog() {
    this._errorLog = [];
    console.log('Error log cleared');
  }
  
  /**
   * Enable error reporting
   * @param {string} endpoint - Reporting endpoint URL
   */
  enableReporting(endpoint) {
    this._reportingEnabled = true;
    this._reportingEndpoint = endpoint;
    
    // Save settings
    this._saveSettings();
    
    console.log('Error reporting enabled');
  }
  
  /**
   * Disable error reporting
   */
  disableReporting() {
    this._reportingEnabled = false;
    this._reportingEndpoint = '';
    
    // Save settings
    this._saveSettings();
    
    console.log('Error reporting disabled');
  }
  
  /**
   * Create error object
   * @param {Error|string} error - Error object or message
   * @param {string} source - Error source
   * @param {string} level - Error level
   * @returns {Object} Error object
   * @private
   */
  _createErrorObject(error, source, level) {
    const timestamp = new Date();
    const id = this._generateErrorId();
    
    return {
      id,
      timestamp,
      level,
      source,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
      browserInfo: this._getBrowserInfo(),
      appVersion: this._getAppVersion()
    };
  }
  
  /**
   * Generate unique error ID
   * @returns {string} Error ID
   * @private
   */
  _generateErrorId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }
  
  /**
   * Get browser information
   * @returns {Object} Browser information
   * @private
   */
  _getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }
  
  /**
   * Get application version
   * @returns {string} Application version
   * @private
   */
  _getAppVersion() {
    // This would normally come from a config file or build process
    return '1.0.0';
  }
  
  /**
   * Add error to log
   * @param {Object} errorObj - Error object
   * @private
   */
  _addToLog(errorObj) {
    // Add to beginning of array (newest first)
    this._errorLog.unshift(errorObj);
    
    // Limit log size
    if (this._errorLog.length > this._maxErrorLogSize) {
      this._errorLog = this._errorLog.slice(0, this._maxErrorLogSize);
    }
  }
  
  /**
   * Display error to user
   * @param {Object} errorObj - Error object
   * @private
   */
  _displayError(errorObj) {
    if (!this._uiService) return;
    
    // Get localized message
    let message = errorObj.message;
    if (this._languageService) {
      const key = `error.${errorObj.message.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
      const translated = this._languageService.translate(key);
      if (translated !== key) {
        message = translated;
      } else {
        const genericKey = `error.${errorObj.level}`;
        const generic = this._languageService.translate(genericKey);
        if (generic !== genericKey) {
          message = `${generic}: ${message}`;
        }
      }
    }
    
    // Level-specific notification type
    let type = 'error';
    switch (errorObj.level) {
      case 'warning':
        type = 'warning';
        break;
      case 'info':
        type = 'info';
        break;
    }
    
    // Show notification
    this._uiService.showNotification(message, type);
  }
  
  /**
   * Report error to endpoint
   * @param {Object} errorObj - Error object
   * @private
   */
  _reportError(errorObj) {
    if (!this._reportingEnabled || !this._reportingEndpoint) return;
    
    try {
      fetch(this._reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorObj)
      }).catch(err => {
        console.warn('Failed to report error:', err);
      });
    } catch (e) {
      console.warn('Error reporting failed:', e);
    }
  }
  
  /**
   * Log error to console
   * @param {Object} errorObj - Error object
   * @private
   */
  _logToConsole(errorObj) {
    const { level, source, message, stack } = errorObj;
    
    // Format message
    const formattedMessage = `[${level.toUpperCase()}] [${source}] ${message}`;
    
    // Log based on level
    switch (level.toLowerCase()) {
      case 'error':
        console.error(formattedMessage);
        if (stack) console.error(stack);
        break;
      case 'warning':
        console.warn(formattedMessage);
        if (stack) console.warn(stack);
        break;
      case 'info':
        console.info(formattedMessage);
        if (stack) console.info(stack);
        break;
      default:
        console.log(formattedMessage);
        if (stack) console.log(stack);
    }
  }
  
  /**
   * Setup global error handlers
   * @private
   */
  _setupGlobalHandlers() {
    // Uncaught exceptions
    window.addEventListener('error', (event) => {
      this.handleError(event.error || event.message, 'window.onerror');
      return false; // Let default error handler run
    });
    
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason || 'Unhandled promise rejection'));
      
      this.handleError(error, 'unhandledrejection');
    });
    
    // Override console error methods to capture errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Call original method
      originalConsoleError.apply(console, args);
      
      // Don't handle errors from error handler itself (to prevent infinite loop)
      const stack = new Error().stack || '';
      if (stack.includes('ErrorHandler') || stack.includes('_logToConsole')) {
        return;
      }
      
      // Handle first argument as error
      const error = args[0];
      if (error) {
        // Only handle as error if not already handled
        const isErrorObj = error instanceof Error;
        const errorMessage = isErrorObj ? error.message : String(error);
        const alreadyHandled = this._errorLog.some(e => e.message === errorMessage);
        
        if (!alreadyHandled) {
          this.handleError(error, 'console.error', false);
        }
      }
    };
  }
  
  /**
   * Load settings from local storage
   * @private
   */
  _loadSettings() {
    try {
      const settings = localStorage.getItem('tb_error_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        this._reportingEnabled = parsed.reportingEnabled || false;
        this._reportingEndpoint = parsed.reportingEndpoint || '';
      }
    } catch (error) {
      console.warn('Failed to load error handler settings:', error);
    }
  }
  
  /**
   * Save settings to local storage
   * @private
   */
  _saveSettings() {
    try {
      const settings = {
        reportingEnabled: this._reportingEnabled,
        reportingEndpoint: this._reportingEndpoint
      };
      localStorage.setItem('tb_error_settings', JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save error handler settings:', error);
    }
  }
}