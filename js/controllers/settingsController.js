/**
 * settingsController.js
 * 
 * Controller for the settings view in the TB Chest Analyzer.
 * Manages application settings, themes, languages, and data sources.
 */

/**
 * SettingsController - Handles settings view and configuration
 */
export class SettingsController {
  /**
   * Initialize the settings controller
   * @param {Object} stateManager - State manager instance
   * @param {Object} uiService - UI service instance
   * @param {Object} languageService - Language service instance
   * @param {Object} dataService - Data service instance
   * @param {Object} errorHandler - Error handler instance
   */
  constructor(stateManager, uiService, languageService, dataService, errorHandler) {
    this._stateManager = stateManager;
    this._uiService = uiService;
    this._languageService = languageService;
    this._dataService = dataService;
    this._errorHandler = errorHandler;
    
    // Default settings
    this._defaultSettings = {
      theme: 'light',
      language: 'en',
      dataSource: 'data/chest_data.json',
      errorReporting: false,
      autoRefresh: false,
      refreshInterval: 60
    };
  }
  
  /**
   * Initialize the settings controller
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      console.log('Initializing settings controller...');
      
      // Load settings
      this._loadSettings();
      
      // Set up state subscriptions
      this._setupStateSubscriptions();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize settings controller:', error);
      return false;
    }
  }
  
  /**
   * Show the settings view
   */
  showView() {
    this._renderSettingsView();
  }
  
  /**
   * Render the settings view
   * @private
   */
  _renderSettingsView() {
    // Get settings container
    const settingsContainer = document.getElementById('settings-container');
    if (!settingsContainer) {
      console.error('Settings container not found');
      return;
    }
    
    // Clear previous content
    settingsContainer.innerHTML = '';
    
    // Create settings form
    const form = document.createElement('form');
    form.className = 'settings-form';
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      this._saveFormSettings(form);
    });
    
    // Create settings sections
    
    // Appearance section
    const appearanceSection = this._createSettingsSection('Appearance');
    
    // Theme setting
    const themeGroup = this._createSettingGroup(
      'theme',
      this._languageService.translate('settings.theme'),
      'select',
      [
        { value: 'light', label: this._languageService.translate('settings.theme_light') },
        { value: 'dark', label: this._languageService.translate('settings.theme_dark') }
      ],
      this._stateManager.getState('theme') || this._defaultSettings.theme
    );
    appearanceSection.appendChild(themeGroup);
    
    // Language setting
    const languages = this._languageService.getAvailableLanguages();
    const languageOptions = Object.values(languages).map(lang => ({
      value: lang.code,
      label: lang.name
    }));
    
    const languageGroup = this._createSettingGroup(
      'language',
      this._languageService.translate('settings.language'),
      'select',
      languageOptions,
      this._languageService.getCurrentLanguage()
    );
    appearanceSection.appendChild(languageGroup);
    
    form.appendChild(appearanceSection);
    
    // Data section
    const dataSection = this._createSettingsSection('Data');
    
    // Data source setting
    const dataSourceGroup = this._createSettingGroup(
      'dataSource',
      this._languageService.translate('settings.data_source'),
      'text',
      null,
      this._stateManager.getState('dataSource') || this._defaultSettings.dataSource
    );
    dataSection.appendChild(dataSourceGroup);
    
    // Auto refresh setting
    const autoRefreshGroup = this._createSettingGroup(
      'autoRefresh',
      'Auto refresh data',
      'checkbox',
      null,
      this._stateManager.getState('autoRefresh') || this._defaultSettings.autoRefresh
    );
    dataSection.appendChild(autoRefreshGroup);
    
    // Refresh interval setting (only visible if auto refresh is enabled)
    const refreshIntervalGroup = this._createSettingGroup(
      'refreshInterval',
      'Refresh interval (minutes)',
      'number',
      null,
      this._stateManager.getState('refreshInterval') || this._defaultSettings.refreshInterval
    );
    refreshIntervalGroup.style.display = this._stateManager.getState('autoRefresh') ? 'block' : 'none';
    
    // Show/hide refresh interval based on auto refresh checkbox
    const autoRefreshCheckbox = autoRefreshGroup.querySelector('input[type="checkbox"]');
    if (autoRefreshCheckbox) {
      autoRefreshCheckbox.addEventListener('change', () => {
        refreshIntervalGroup.style.display = autoRefreshCheckbox.checked ? 'block' : 'none';
      });
    }
    
    dataSection.appendChild(refreshIntervalGroup);
    
    // Clear cache button
    const clearCacheButton = document.createElement('button');
    clearCacheButton.type = 'button';
    clearCacheButton.className = 'btn btn-secondary';
    clearCacheButton.textContent = this._languageService.translate('settings.clear_cache');
    clearCacheButton.addEventListener('click', () => {
      this._dataService.clearCache();
      this._uiService.showNotification(
        this._languageService.translate('settings.cache_cleared'),
        'success'
      );
    });
    
    const clearCacheGroup = document.createElement('div');
    clearCacheGroup.className = 'setting-group button-group';
    clearCacheGroup.appendChild(clearCacheButton);
    dataSection.appendChild(clearCacheGroup);
    
    form.appendChild(dataSection);
    
    // Error reporting section
    const errorSection = this._createSettingsSection('Error Reporting');
    
    // Error reporting setting
    const errorReportingGroup = this._createSettingGroup(
      'errorReporting',
      'Enable error reporting',
      'checkbox',
      null,
      this._stateManager.getState('errorReporting') || this._defaultSettings.errorReporting
    );
    errorSection.appendChild(errorReportingGroup);
    
    // Error endpoint setting (only visible if error reporting is enabled)
    const errorEndpointGroup = this._createSettingGroup(
      'errorEndpoint',
      'Error reporting endpoint',
      'text',
      null,
      this._stateManager.getState('errorEndpoint') || ''
    );
    errorEndpointGroup.style.display = this._stateManager.getState('errorReporting') ? 'block' : 'none';
    
    // Show/hide error endpoint based on error reporting checkbox
    const errorReportingCheckbox = errorReportingGroup.querySelector('input[type="checkbox"]');
    if (errorReportingCheckbox) {
      errorReportingCheckbox.addEventListener('change', () => {
        errorEndpointGroup.style.display = errorReportingCheckbox.checked ? 'block' : 'none';
      });
    }
    
    errorSection.appendChild(errorEndpointGroup);
    
    form.appendChild(errorSection);
    
    // Reset section
    const resetSection = this._createSettingsSection('Reset');
    
    // Reset settings button
    const resetButton = document.createElement('button');
    resetButton.type = 'button';
    resetButton.className = 'btn btn-danger';
    resetButton.textContent = this._languageService.translate('settings.reset_settings');
    resetButton.addEventListener('click', () => {
      // Show confirmation dialog
      this._uiService.showModal(
        'Confirm Reset',
        this._languageService.translate('settings.confirm_reset'),
        [
          {
            text: this._languageService.translate('app.cancel'),
            action: 'close',
            primary: false
          },
          {
            text: this._languageService.translate('app.confirm'),
            action: 'reset-settings',
            primary: true
          }
        ]
      );
      
      // Handle modal action
      document.addEventListener('modal-action', (event) => {
        if (event.detail.action === 'reset-settings') {
          this._resetSettings();
          this._renderSettingsView();
          this._uiService.showNotification(
            this._languageService.translate('settings.settings_reset'),
            'success'
          );
        }
      }, { once: true });
    });
    
    const resetGroup = document.createElement('div');
    resetGroup.className = 'setting-group button-group';
    resetGroup.appendChild(resetButton);
    resetSection.appendChild(resetGroup);
    
    form.appendChild(resetSection);
    
    // Save button
    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.className = 'btn btn-primary save-settings';
    saveButton.textContent = this._languageService.translate('app.save');
    
    const saveButtonContainer = document.createElement('div');
    saveButtonContainer.className = 'save-button-container';
    saveButtonContainer.appendChild(saveButton);
    
    form.appendChild(saveButtonContainer);
    
    // Add form to container
    settingsContainer.appendChild(form);
  }
  
  /**
   * Create settings section
   * @param {string} title - Section title
   * @returns {HTMLElement} Section element
   * @private
   */
  _createSettingsSection(title) {
    const section = document.createElement('div');
    section.className = 'settings-section';
    
    const titleElement = document.createElement('h2');
    titleElement.className = 'section-title';
    titleElement.textContent = title;
    
    section.appendChild(titleElement);
    
    return section;
  }
  
  /**
   * Create setting group
   * @param {string} name - Setting name
   * @param {string} label - Setting label
   * @param {string} type - Input type
   * @param {Array|null} options - Select options
   * @param {*} value - Current value
   * @returns {HTMLElement} Setting group element
   * @private
   */
  _createSettingGroup(name, label, type, options, value) {
    const group = document.createElement('div');
    group.className = 'setting-group';
    
    // Create label
    const labelElement = document.createElement('label');
    labelElement.htmlFor = `setting-${name}`;
    labelElement.textContent = label;
    group.appendChild(labelElement);
    
    // Create input based on type
    let input;
    
    switch (type) {
      case 'text':
        input = document.createElement('input');
        input.type = 'text';
        input.id = `setting-${name}`;
        input.name = name;
        input.value = value !== undefined ? value : '';
        break;
        
      case 'number':
        input = document.createElement('input');
        input.type = 'number';
        input.id = `setting-${name}`;
        input.name = name;
        input.value = value !== undefined ? value : 0;
        input.min = 1;
        input.max = 1440; // 24 hours in minutes
        break;
        
      case 'checkbox':
        input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `setting-${name}`;
        input.name = name;
        input.checked = value === true;
        break;
        
      case 'select':
        input = document.createElement('select');
        input.id = `setting-${name}`;
        input.name = name;
        
        if (options) {
          options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.label;
            if (value === option.value) {
              optionElement.selected = true;
            }
            input.appendChild(optionElement);
          });
        }
        break;
        
      default:
        input = document.createElement('input');
        input.type = 'text';
        input.id = `setting-${name}`;
        input.name = name;
        input.value = value !== undefined ? value : '';
    }
    
    group.appendChild(input);
    
    return group;
  }
  
  /**
   * Save form settings
   * @param {HTMLFormElement} form - Settings form
   * @private
   */
  _saveFormSettings(form) {
    try {
      // Collect form data
      const formData = new FormData(form);
      const settings = {};
      
      for (const [key, value] of formData.entries()) {
        settings[key] = value;
      }
      
      // Handle checkboxes (they don't appear in FormData if unchecked)
      form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        settings[checkbox.name] = checkbox.checked;
      });
      
      // Convert number values
      for (const key in settings) {
        if (form.querySelector(`input[type="number"][name="${key}"]`)) {
          settings[key] = parseInt(settings[key], 10);
        }
      }
      
      // Save settings
      this._saveSettings(settings);
      
      // Show success notification
      this._uiService.showNotification('Settings saved successfully', 'success');
    } catch (error) {
      this._errorHandler.handleError(error, 'SettingsController._saveFormSettings');
    }
  }
  
  /**
   * Save settings
   * @param {Object} settings - Settings object
   * @private
   */
  _saveSettings(settings) {
    try {
      // Update state
      for (const [key, value] of Object.entries(settings)) {
        this._stateManager.setState(key, value);
      }
      
      // Handle specific settings
      
      // Language setting
      if (settings.language) {
        this._languageService.setLanguage(settings.language);
      }
      
      // Error reporting setting
      if (settings.errorReporting !== undefined) {
        if (settings.errorReporting && settings.errorEndpoint) {
          this._errorHandler.enableReporting(settings.errorEndpoint);
        } else {
          this._errorHandler.disableReporting();
        }
      }
      
      // Data source setting
      if (settings.dataSource) {
        this._dataService.setDataSource(settings.dataSource);
      }
      
      // Save to local storage
      localStorage.setItem('tb_settings', JSON.stringify(settings));
    } catch (error) {
      this._errorHandler.handleError(error, 'SettingsController._saveSettings');
    }
  }
  
  /**
   * Load settings
   * @private
   */
  _loadSettings() {
    try {
      // Load from local storage
      const storedSettings = localStorage.getItem('tb_settings');
      
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        
        // Update state
        for (const [key, value] of Object.entries(settings)) {
          this._stateManager.setState(key, value);
        }
      } else {
        // Use default settings
        for (const [key, value] of Object.entries(this._defaultSettings)) {
          this._stateManager.setState(key, value);
        }
      }
    } catch (error) {
      this._errorHandler.handleError(error, 'SettingsController._loadSettings', false);
      
      // Use default settings
      for (const [key, value] of Object.entries(this._defaultSettings)) {
        this._stateManager.setState(key, value);
      }
    }
  }
  
  /**
   * Reset settings to defaults
   * @private
   */
  _resetSettings() {
    try {
      // Use default settings
      for (const [key, value] of Object.entries(this._defaultSettings)) {
        this._stateManager.setState(key, value);
      }
      
      // Clear local storage
      localStorage.removeItem('tb_settings');
      
      // Apply default settings
      this._languageService.setLanguage(this._defaultSettings.language);
      this._dataService.setDataSource(this._defaultSettings.dataSource);
      this._errorHandler.disableReporting();
    } catch (error) {
      this._errorHandler.handleError(error, 'SettingsController._resetSettings');
    }
  }
  
  /**
   * Setup state subscriptions
   * @private
   */
  _setupStateSubscriptions() {
    // Listen for view changes
    this._stateManager.subscribe('currentView', (viewId) => {
      if (viewId === 'settings') {
        this.showView();
      }
    });
  }
}