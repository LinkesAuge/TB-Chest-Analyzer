/**
 * stateManager.js
 * 
 * Central state management service for the TB Chest Analyzer.
 * Implements the Observer pattern to notify components of state changes.
 */

/**
 * StateManager - Central state store with observer pattern implementation
 */
export class StateManager {
  /**
   * Initialize the state manager with default state
   */
  constructor() {
    // Private state storage
    this._state = {
      // Application state
      isLoading: true,
      currentView: 'overview',
      isModalOpen: false,
      activeModal: null,
      
      // Data state
      rawData: null,
      processedData: null,
      players: [],
      currentPlayer: null,
      playerDetails: null,
      
      // Filter state
      filters: {
        dateRange: null,
        playerSearch: '',
        selectedServer: null,
        selectedAlliance: null
      },
      
      // Chart state
      chartConfigs: {},
      
      // UI state
      language: 'en',
      darkMode: true,
      tableView: 'detailed'
    };
    
    // Observer storage by state path
    this._observers = new Map();
  }
  
  /**
   * Get current state
   * @param {string} path - Optional dot notation path to get specific state slice
   * @returns {*} State value at path or entire state object
   */
  getState(path = null) {
    if (!path) {
      // Return a deep copy to prevent direct state mutation
      return JSON.parse(JSON.stringify(this._state));
    }
    
    // Navigate the state object using the path
    return this._getValueByPath(this._state, path);
  }
  
  /**
   * Update state with partial state object
   * @param {string} path - Dot notation path to update
   * @param {*} value - New value to set
   * @returns {boolean} Success status
   */
  setState(path, value) {
    try {
      // Make a deep copy of the current state
      const newState = JSON.parse(JSON.stringify(this._state));
      
      // Update the state at the specified path
      this._setValueByPath(newState, path, value);
      
      // Update the state
      this._state = newState;
      
      // Notify observers for this path and parent paths
      this._notifyObservers(path);
      
      return true;
    } catch (error) {
      console.error('Error updating state:', error);
      return false;
    }
  }
  
  /**
   * Subscribe to state changes
   * @param {string} path - Dot notation path to subscribe to
   * @param {Function} callback - Function to call when state changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(path, callback) {
    if (!this._observers.has(path)) {
      this._observers.set(path, new Set());
    }
    
    this._observers.get(path).add(callback);
    
    // Return unsubscribe function
    return () => {
      const observers = this._observers.get(path);
      if (observers) {
        observers.delete(callback);
        if (observers.size === 0) {
          this._observers.delete(path);
        }
      }
    };
  }
  
  /**
   * Reset state to initial values
   */
  resetState() {
    this._state = this._getInitialState();
    this._notifyObservers(null); // Notify all observers
  }
  
  /**
   * Batch update multiple state paths at once
   * @param {Object} updates - Object with path:value pairs
   * @returns {boolean} Success status
   */
  batchUpdate(updates) {
    try {
      // Make a deep copy of the current state
      const newState = JSON.parse(JSON.stringify(this._state));
      
      // Apply all updates
      for (const [path, value] of Object.entries(updates)) {
        this._setValueByPath(newState, path, value);
      }
      
      // Update the state
      this._state = newState;
      
      // Notify all observers of changed paths
      for (const path of Object.keys(updates)) {
        this._notifyObservers(path);
      }
      
      return true;
    } catch (error) {
      console.error('Error in batch update:', error);
      return false;
    }
  }
  
  /**
   * Get value from object by dot notation path
   * @param {Object} obj - Object to get value from
   * @param {string} path - Dot notation path
   * @returns {*} Value at path
   * @private
   */
  _getValueByPath(obj, path) {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }
    
    return current !== undefined ? JSON.parse(JSON.stringify(current)) : undefined;
  }
  
  /**
   * Set value in object by dot notation path
   * @param {Object} obj - Object to set value in
   * @param {string} path - Dot notation path
   * @param {*} value - Value to set
   * @private
   */
  _setValueByPath(obj, path, value) {
    const parts = path.split('.');
    let current = obj;
    
    // Navigate to the parent of the property to set
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }
    
    // Set the value
    const lastPart = parts[parts.length - 1];
    current[lastPart] = value;
  }
  
  /**
   * Notify observers of state changes
   * @param {string} changedPath - Path that changed
   * @private
   */
  _notifyObservers(changedPath) {
    // If null, notify all observers
    if (changedPath === null) {
      for (const [path, observers] of this._observers.entries()) {
        const stateSlice = this._getValueByPath(this._state, path);
        for (const observer of observers) {
          observer(stateSlice);
        }
      }
      return;
    }
    
    // Notify observers of this path
    if (this._observers.has(changedPath)) {
      const stateSlice = this._getValueByPath(this._state, changedPath);
      for (const observer of this._observers.get(changedPath)) {
        observer(stateSlice);
      }
    }
    
    // Notify observers of parent paths
    const parts = changedPath.split('.');
    for (let i = parts.length - 1; i > 0; i--) {
      const parentPath = parts.slice(0, i).join('.');
      if (this._observers.has(parentPath)) {
        const stateSlice = this._getValueByPath(this._state, parentPath);
        for (const observer of this._observers.get(parentPath)) {
          observer(stateSlice);
        }
      }
    }
    
    // Notify root observers
    if (this._observers.has('')) {
      const fullState = this.getState();
      for (const observer of this._observers.get('')) {
        observer(fullState);
      }
    }
  }
  
  /**
   * Get the initial state object
   * @returns {Object} Initial state
   * @private
   */
  _getInitialState() {
    return {
      isLoading: true,
      currentView: 'overview',
      isModalOpen: false,
      activeModal: null,
      rawData: null,
      processedData: null,
      players: [],
      currentPlayer: null,
      playerDetails: null,
      filters: {
        dateRange: null,
        playerSearch: '',
        selectedServer: null,
        selectedAlliance: null
      },
      chartConfigs: {},
      language: 'en',
      darkMode: true,
      tableView: 'detailed'
    };
  }
}