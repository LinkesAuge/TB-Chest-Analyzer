/**
 * main.js
 * 
 * Main entry point for the TB Chest Analyzer application.
 * This file initializes the application, loads services, and sets up controllers.
 */

// Import services
import { DataService } from './services/dataService.js';
import { LanguageService } from './services/languageService.js';
import { StateManager } from './services/stateManager.js';
import { ChartService } from './services/chartService.js';
import { UIService } from './services/uiService.js';

// Import controllers
import { AppController } from './controllers/appController.js';
import { NavigationController } from './controllers/navigationController.js';
import { AnalyticsController } from './controllers/analyticsController.js';
import { PlayerController } from './controllers/playerController.js';

// Import utils
import { ErrorHandler } from './utils/errorHandler.js';

/**
 * Initialize the application when the DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('TB Chest Analyzer - Initializing application...');
    
    // Initialize error handler
    const errorHandler = new ErrorHandler();
    window.onerror = (message, source, lineno, colno, error) => {
      errorHandler.handleGlobalError(message, source, lineno, colno, error);
      return true; // Prevents default error handling
    };

    // Initialize services
    const languageService = new LanguageService();
    await languageService.initialize();
    
    const stateManager = new StateManager();
    
    const dataService = new DataService(stateManager, errorHandler);
    const chartService = new ChartService(stateManager, errorHandler);
    const uiService = new UIService(languageService, stateManager, errorHandler);
    
    // Initialize controllers
    const navigationController = new NavigationController(uiService, stateManager);
    const analyticsController = new AnalyticsController(
      dataService, 
      chartService, 
      uiService, 
      stateManager
    );
    
    const playerController = new PlayerController(
      dataService,
      chartService,
      uiService,
      stateManager
    );
    
    // Initialize main application controller
    const appController = new AppController(
      dataService,
      uiService,
      navigationController,
      analyticsController,
      playerController,
      stateManager,
      errorHandler
    );
    
    // Start the application
    await appController.initialize();
    
    console.log('TB Chest Analyzer - Application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    // Display error in the UI
    document.getElementById('app-container').innerHTML = `
      <div class="error-container">
        <h2>Application Error</h2>
        <p>Sorry, the application failed to initialize. Please try refreshing the page.</p>
        <p>Error details: ${error.message}</p>
      </div>
    `;
  }
});