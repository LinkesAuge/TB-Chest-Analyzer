/**
 * uiService.js
 * 
 * Service for UI handling and manipulation in the TB Chest Analyzer.
 * Manages UI components, notifications, modals, and common UI patterns.
 */

/**
 * UIService - Handles UI components and manipulations
 */
export class UIService {
  /**
   * Initialize the UI service
   * @param {Object} stateManager - State manager instance
   * @param {Object} languageService - Language service instance
   */
  constructor(stateManager, languageService) {
    this._stateManager = stateManager;
    this._languageService = languageService;
    
    // Active notifications
    this._activeNotifications = [];
    
    // Notification counter for IDs
    this._notificationCounter = 0;
    
    // Active modal
    this._activeModal = null;
    
    // Default notification duration in ms
    this._defaultNotificationDuration = 5000;
    
    // Element IDs
    this._notificationContainerId = 'notification-container';
    this._modalContainerId = 'modal-container';
    this._loadingIndicatorId = 'loading-indicator';
  }
  
  /**
   * Initialize the UI service
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      console.log('Initializing UI service...');
      
      // Create containers
      this._createContainers();
      
      // Setup state subscriptions
      this._setupStateSubscriptions();
      
      // Setup event handlers
      this._setupEventHandlers();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize UI service:', error);
      return false;
    }
  }
  
  /**
   * Show a notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, warning, info)
   * @param {number} duration - Duration in milliseconds (0 for persistent)
   * @returns {number} Notification ID
   */
  showNotification(message, type = 'info', duration = this._defaultNotificationDuration) {
    try {
      // Get container
      const container = this._getOrCreateNotificationContainer();
      
      // Create notification ID
      const id = ++this._notificationCounter;
      
      // Create notification element
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.id = `notification-${id}`;
      notification.setAttribute('role', 'alert');
      
      // Create message element
      const messageElement = document.createElement('div');
      messageElement.className = 'notification-message';
      messageElement.textContent = message;
      notification.appendChild(messageElement);
      
      // Create close button
      const closeButton = document.createElement('button');
      closeButton.className = 'notification-close';
      closeButton.innerHTML = '&times;';
      closeButton.setAttribute('aria-label', 'Close notification');
      closeButton.addEventListener('click', () => {
        this.hideNotification(id);
      });
      notification.appendChild(closeButton);
      
      // Add to container
      container.appendChild(notification);
      
      // Store notification
      this._activeNotifications.push({
        id,
        element: notification,
        timeout: duration > 0 ? setTimeout(() => {
          this.hideNotification(id);
        }, duration) : null
      });
      
      // Show with animation
      setTimeout(() => {
        notification.classList.add('show');
      }, 10);
      
      return id;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return -1;
    }
  }
  
  /**
   * Hide a notification
   * @param {number} id - Notification ID
   */
  hideNotification(id) {
    try {
      // Find notification
      const index = this._activeNotifications.findIndex(n => n.id === id);
      if (index === -1) return;
      
      const notification = this._activeNotifications[index];
      
      // Clear timeout if exists
      if (notification.timeout) {
        clearTimeout(notification.timeout);
      }
      
      // Remove with animation
      notification.element.classList.remove('show');
      
      // Remove after animation
      setTimeout(() => {
        if (notification.element.parentNode) {
          notification.element.parentNode.removeChild(notification.element);
        }
        this._activeNotifications.splice(index, 1);
      }, 300);
    } catch (error) {
      console.error('Failed to hide notification:', error);
    }
  }
  
  /**
   * Show modal dialog
   * @param {string} title - Modal title
   * @param {string|HTMLElement} content - Modal content (HTML string or element)
   * @param {Array} buttons - Modal buttons configuration
   * @returns {Object} Modal object
   */
  showModal(title, content, buttons = []) {
    try {
      // Hide any existing modal
      if (this._activeModal) {
        this.hideModal();
      }
      
      // Get container
      const container = this._getOrCreateModalContainer();
      
      // Create modal element
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      
      // Modal content wrapper
      const modalContent = document.createElement('div');
      modalContent.className = 'modal-content';
      
      // Modal header
      const modalHeader = document.createElement('div');
      modalHeader.className = 'modal-header';
      
      // Modal title
      const modalTitle = document.createElement('h2');
      modalTitle.className = 'modal-title';
      modalTitle.textContent = title;
      modalHeader.appendChild(modalTitle);
      
      // Close button
      const closeButton = document.createElement('button');
      closeButton.className = 'modal-close';
      closeButton.innerHTML = '&times;';
      closeButton.setAttribute('aria-label', 'Close modal');
      closeButton.addEventListener('click', () => {
        this.hideModal();
      });
      modalHeader.appendChild(closeButton);
      modalContent.appendChild(modalHeader);
      
      // Modal body
      const modalBody = document.createElement('div');
      modalBody.className = 'modal-body';
      
      // Add content
      if (typeof content === 'string') {
        modalBody.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        modalBody.appendChild(content);
      }
      
      modalContent.appendChild(modalBody);
      
      // Modal footer (if buttons provided)
      if (buttons && buttons.length) {
        const modalFooter = document.createElement('div');
        modalFooter.className = 'modal-footer';
        
        // Create buttons
        buttons.forEach(button => {
          const btn = document.createElement('button');
          btn.className = `modal-button ${button.primary ? 'primary' : 'secondary'}`;
          btn.textContent = button.text;
          btn.dataset.action = button.action || 'close';
          
          // Event handler
          btn.addEventListener('click', () => {
            if (button.action) {
              // Dispatch event
              const event = new CustomEvent('modal-action', {
                detail: { action: button.action }
              });
              document.dispatchEvent(event);
            }
            
            if (button.action !== 'custom') {
              this.hideModal();
            }
          });
          
          modalFooter.appendChild(btn);
        });
        
        modalContent.appendChild(modalFooter);
      }
      
      modal.appendChild(modalContent);
      container.appendChild(modal);
      
      // Store active modal
      this._activeModal = {
        element: modal
      };
      
      // Show with animation
      document.body.classList.add('modal-open');
      setTimeout(() => {
        modal.classList.add('show');
      }, 10);
      
      // Add key handler
      document.addEventListener('keydown', this._handleModalKeydown);
      
      return this._activeModal;
    } catch (error) {
      console.error('Failed to show modal:', error);
      return null;
    }
  }
  
  /**
   * Hide active modal
   */
  hideModal() {
    try {
      if (!this._activeModal) return;
      
      // Remove with animation
      this._activeModal.element.classList.remove('show');
      
      // Remove after animation
      setTimeout(() => {
        if (this._activeModal.element.parentNode) {
          this._activeModal.element.parentNode.removeChild(this._activeModal.element);
        }
        this._activeModal = null;
        document.body.classList.remove('modal-open');
      }, 300);
      
      // Remove key handler
      document.removeEventListener('keydown', this._handleModalKeydown);
    } catch (error) {
      console.error('Failed to hide modal:', error);
    }
  }
  
  /**
   * Show loading indicator
   * @param {string} message - Loading message
   * @returns {Object} Loading indicator object
   */
  showLoading(message = 'Loading...') {
    try {
      // Create or get loading indicator
      const indicator = this._getOrCreateLoadingIndicator();
      
      // Update message
      const messageElement = indicator.querySelector('.loading-message');
      if (messageElement) {
        messageElement.textContent = message;
      }
      
      // Show indicator
      indicator.classList.add('show');
      
      // Set loading state
      this._stateManager.setState('isLoading', true);
      
      return {
        hide: () => this.hideLoading()
      };
    } catch (error) {
      console.error('Failed to show loading indicator:', error);
      return null;
    }
  }
  
  /**
   * Hide loading indicator
   */
  hideLoading() {
    try {
      // Get loading indicator
      const indicator = document.getElementById(this._loadingIndicatorId);
      if (!indicator) return;
      
      // Hide indicator
      indicator.classList.remove('show');
      
      // Set loading state
      this._stateManager.setState('isLoading', false);
    } catch (error) {
      console.error('Failed to hide loading indicator:', error);
    }
  }
  
  /**
   * Create a table from data
   * @param {Array} data - Table data
   * @param {Array} columns - Column configuration
   * @param {Object} options - Table options
   * @returns {HTMLElement} Table element
   */
  createTable(data, columns, options = {}) {
    try {
      // Create table element
      const table = document.createElement('table');
      table.className = 'data-table';
      
      // Create table header
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      
      // Add column headers
      columns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column.label;
        
        // Add data attributes
        th.dataset.column = column.key;
        
        // Add sort indicator if table is sortable
        if (options.sortable) {
          th.classList.add('sortable');
          
          // Add current sort class if applicable
          if (options.currentSort && options.currentSort.column === column.key) {
            th.classList.add(options.currentSort.ascending ? 'sort-asc' : 'sort-desc');
          }
          
          // Add click handler
          th.addEventListener('click', () => {
            if (options.onSort) {
              // Toggle or set sort direction
              let ascending = true;
              if (options.currentSort && options.currentSort.column === column.key) {
                ascending = !options.currentSort.ascending;
              }
              
              options.onSort(column.key, ascending);
            }
          });
        }
        
        headerRow.appendChild(th);
      });
      
      // Add actions column if needed
      if (options.actions && options.actions.length > 0) {
        const actionsHeader = document.createElement('th');
        actionsHeader.textContent = 'Actions';
        actionsHeader.className = 'actions-column';
        headerRow.appendChild(actionsHeader);
      }
      
      thead.appendChild(headerRow);
      table.appendChild(thead);
      
      // Create table body
      const tbody = document.createElement('tbody');
      
      // Add data rows
      data.forEach(item => {
        const row = document.createElement('tr');
        
        // Add data cells
        columns.forEach(column => {
          const td = document.createElement('td');
          
          // Get cell value
          let value = item[column.key];
          
          // Format value if formatter provided
          if (column.format && typeof column.format === 'function') {
            value = column.format(value, item);
          }
          
          td.textContent = value !== undefined && value !== null ? value : '';
          
          row.appendChild(td);
        });
        
        // Add actions cell if needed
        if (options.actions && options.actions.length > 0) {
          const actionsCell = document.createElement('td');
          actionsCell.className = 'actions-cell';
          
          // Create action buttons
          options.actions.forEach(action => {
            const button = document.createElement('button');
            button.className = 'player-action';
            button.title = action.label;
            button.setAttribute('data-action', action.action);
            button.setAttribute('data-player-id', item.id);
            
            // Add icon if provided
            if (action.icon) {
              const icon = document.createElement('i');
              icon.className = `fas fa-${action.icon}`;
              button.appendChild(icon);
            } else {
              button.textContent = action.label;
            }
            
            // Add click handler
            button.addEventListener('click', (event) => {
              event.preventDefault();
              event.stopPropagation();
              if (action.action && typeof action.action === 'function') {
                action.action(item);
              }
            });
            
            actionsCell.appendChild(button);
          });
          
          row.appendChild(actionsCell);
        }
        
        tbody.appendChild(row);
      });
      
      table.appendChild(tbody);
      
      return table;
    } catch (error) {
      console.error('Failed to create table:', error);
      return document.createElement('div');
    }
  }
  
  /**
   * Create filter UI
   * @param {HTMLElement} container - Container element
   * @param {Object} filters - Filter configuration
   * @param {Function} onFilter - Filter callback
   * @returns {HTMLElement} Filter element
   */
  createFilterUI(container, filters, onFilter) {
    try {
      // Create filter form
      const form = document.createElement('form');
      form.className = 'filter-form';
      form.addEventListener('submit', (event) => {
        event.preventDefault();
      });
      
      // Process each filter
      Object.entries(filters).forEach(([key, config]) => {
        // Create filter container
        const filterContainer = document.createElement('div');
        filterContainer.className = 'filter-item';
        
        // Create label
        if (config.label) {
          const label = document.createElement('label');
          label.textContent = config.label;
          label.htmlFor = `filter-${key}`;
          filterContainer.appendChild(label);
        }
        
        // Create input based on type
        let input;
        
        switch (config.type) {
          case 'text':
            input = document.createElement('input');
            input.type = 'text';
            input.id = `filter-${key}`;
            input.name = key;
            if (config.placeholder) {
              input.placeholder = config.placeholder;
            }
            break;
            
          case 'select':
            input = document.createElement('select');
            input.id = `filter-${key}`;
            input.name = key;
            
            if (config.options) {
              config.options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.textContent = option.label;
                input.appendChild(optionElement);
              });
            }
            break;
            
          case 'checkbox':
            input = document.createElement('input');
            input.type = 'checkbox';
            input.id = `filter-${key}`;
            input.name = key;
            break;
            
          case 'radio':
            const radioGroup = document.createElement('div');
            radioGroup.className = 'radio-group';
            
            if (config.options) {
              config.options.forEach((option, index) => {
                const radioContainer = document.createElement('label');
                radioContainer.className = 'radio-container';
                
                const radioInput = document.createElement('input');
                radioInput.type = 'radio';
                radioInput.name = key;
                radioInput.value = option.value;
                radioInput.id = `filter-${key}-${index}`;
                
                const radioLabel = document.createElement('span');
                radioLabel.textContent = option.label;
                
                radioContainer.appendChild(radioInput);
                radioContainer.appendChild(radioLabel);
                radioGroup.appendChild(radioContainer);
              });
            }
            
            filterContainer.appendChild(radioGroup);
            input = radioGroup;
            break;
            
          case 'range':
            input = document.createElement('input');
            input.type = 'range';
            input.id = `filter-${key}`;
            input.name = key;
            if (config.min !== undefined) input.min = config.min;
            if (config.max !== undefined) input.max = config.max;
            if (config.step !== undefined) input.step = config.step;
            break;
            
          default:
            input = document.createElement('input');
            input.type = 'text';
            input.id = `filter-${key}`;
            input.name = key;
        }
        
        // Add input to container (unless it's a radio group)
        if (config.type !== 'radio') {
          filterContainer.appendChild(input);
        }
        
        // Set initial value if provided
        if (config.value !== undefined) {
          if (config.type === 'checkbox') {
            input.checked = Boolean(config.value);
          } else if (config.type === 'radio') {
            const radioInput = input.querySelector(`input[value="${config.value}"]`);
            if (radioInput) {
              radioInput.checked = true;
            }
          } else {
            input.value = config.value;
          }
        }
        
        // Add event listener
        if (config.type === 'radio') {
          input.querySelectorAll('input').forEach(radio => {
            radio.addEventListener('change', () => {
              if (onFilter && typeof onFilter === 'function') {
                const filters = this._collectFilterValues(form);
                onFilter(filters);
              }
            });
          });
        } else if (config.type === 'select' || config.type === 'checkbox') {
          input.addEventListener('change', () => {
            if (onFilter && typeof onFilter === 'function') {
              const filters = this._collectFilterValues(form);
              onFilter(filters);
            }
          });
        } else {
          // Debounce text input
          let timeout;
          input.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
              if (onFilter && typeof onFilter === 'function') {
                const filters = this._collectFilterValues(form);
                onFilter(filters);
              }
            }, 300);
          });
        }
        
        form.appendChild(filterContainer);
      });
      
      container.appendChild(form);
      return form;
    } catch (error) {
      console.error('Failed to create filter UI:', error);
      return document.createElement('div');
    }
  }
  
  /**
   * Collect filter values from form
   * @param {HTMLFormElement} form - Filter form
   * @returns {Object} Filter values
   * @private
   */
  _collectFilterValues(form) {
    const filters = {};
    const formData = new FormData(form);
    
    for (const [key, value] of formData.entries()) {
      filters[key] = value;
    }
    
    // Handle checkboxes (they don't appear in FormData if unchecked)
    form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      filters[checkbox.name] = checkbox.checked;
    });
    
    return filters;
  }
  
  /**
   * Create necessary UI containers
   * @private
   */
  _createContainers() {
    // Notification container
    this._getOrCreateNotificationContainer();
    
    // Modal container
    this._getOrCreateModalContainer();
    
    // Loading indicator
    this._getOrCreateLoadingIndicator();
  }
  
  /**
   * Get or create notification container
   * @returns {HTMLElement} Notification container
   * @private
   */
  _getOrCreateNotificationContainer() {
    let container = document.getElementById(this._notificationContainerId);
    
    if (!container) {
      container = document.createElement('div');
      container.id = this._notificationContainerId;
      container.className = 'notification-container';
      document.body.appendChild(container);
    }
    
    return container;
  }
  
  /**
   * Get or create modal container
   * @returns {HTMLElement} Modal container
   * @private
   */
  _getOrCreateModalContainer() {
    let container = document.getElementById(this._modalContainerId);
    
    if (!container) {
      container = document.createElement('div');
      container.id = this._modalContainerId;
      container.className = 'modal-container';
      document.body.appendChild(container);
    }
    
    return container;
  }
  
  /**
   * Get or create loading indicator
   * @returns {HTMLElement} Loading indicator
   * @private
   */
  _getOrCreateLoadingIndicator() {
    let indicator = document.getElementById(this._loadingIndicatorId);
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = this._loadingIndicatorId;
      indicator.className = 'loading-indicator';
      
      // Add spinner
      const spinner = document.createElement('div');
      spinner.className = 'loading-spinner';
      indicator.appendChild(spinner);
      
      // Add message
      const message = document.createElement('div');
      message.className = 'loading-message';
      message.textContent = 'Loading...';
      indicator.appendChild(message);
      
      document.body.appendChild(indicator);
    }
    
    return indicator;
  }
  
  /**
   * Setup state subscriptions
   * @private
   */
  _setupStateSubscriptions() {
    // Listen for loading state changes
    this._stateManager.subscribe('isLoading', (isLoading) => {
      if (isLoading) {
        this.showLoading();
      } else {
        this.hideLoading();
      }
    });
    
    // Listen for theme changes
    this._stateManager.subscribe('theme', (theme) => {
      document.body.setAttribute('data-theme', theme);
    });
  }
  
  /**
   * Setup event handlers
   * @private
   */
  _setupEventHandlers() {
    // Modal keydown handler
    this._handleModalKeydown = (event) => {
      if (event.key === 'Escape') {
        this.hideModal();
      }
    };
  }
}