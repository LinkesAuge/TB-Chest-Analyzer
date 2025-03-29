/**
 * index.js
 * 
 * Entry point for the TB Chest Analyzer application.
 * Connects the modular architecture to the HTML.
 */

// Import from main.js
import './main.js';

/**
 * This file serves as a bridge between the original HTML and the new modular architecture.
 * 
 * Integration steps:
 * 
 * 1. Add the following to index.html before the closing </body> tag:
 *    <script type="module" src="js/index.js"></script>
 * 
 * 2. Remove the old inline JavaScript from index.html
 * 
 * 3. Ensure all referenced HTML elements have the proper IDs:
 *    - app-container: Main container for the application
 *    - loading-spinner: Loading indicator
 *    - notification-container: Container for notifications
 *    - view-overview, view-players, etc.: View containers
 *    - Add data-view attributes to navigation buttons
 * 
 * 4. Update data-i18n attributes on elements for internationalization
 * 
 * 5. Ensure CSS includes styles for notifications, modals, etc.
 */