# TB Chest Analyzer

A modular web application for analyzing and visualizing chest data in TB games. The application supports player comparisons, statistical analysis, and data filtering.

## Features

- **Dashboard:** Overview of key statistics and metrics
- **Player Analysis:** Detailed view of individual player performance
- **Player Comparison:** Side-by-side comparison of multiple players
- **Data Filtering:** Filter and sort data based on various criteria
- **Analytics:** Visualize data with various chart types
- **Customization:** Theme settings, language options, and more

## Architecture

The application follows a modular architecture with clear separation of concerns:

### Core Services

- **StateManager:** Central state management with observer pattern
- **ErrorHandler:** Centralized error handling and reporting
- **LanguageService:** Internationalization and localization 
- **DataService:** Data loading, caching, and processing
- **UIService:** UI components and manipulations
- **ChartService:** Chart creation and management

### Controllers

- **AppController:** Main application controller
- **NavigationController:** Handles navigation and routing
- **DashboardController:** Manages dashboard view
- **PlayerController:** Handles player view and comparisons
- **AnalyticsController:** Manages analytics and charts
- **SettingsController:** Handles application settings

## Project Structure

```
TB-Chest-Analyzer/
├── css/
│   └── styles.css
├── data/
│   └── chest_data.json
├── js/
│   ├── controllers/
│   │   ├── analyticsController.js
│   │   ├── appController.js
│   │   ├── dashboardController.js
│   │   ├── navigationController.js
│   │   ├── playerController.js
│   │   └── settingsController.js
│   ├── services/
│   │   ├── chartService.js
│   │   ├── dataService.js
│   │   ├── errorHandler.js
│   │   ├── languageService.js
│   │   ├── stateManager.js
│   │   └── uiService.js
│   └── index.js
└── index.html
```

## Getting Started

1. Clone the repository
2. Open `index.html` in your browser or serve it with a local web server
3. No build process required - the application uses vanilla JavaScript with ES modules

## Browser Compatibility

The application uses modern JavaScript features, including ES modules, and is compatible with:
- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 16+

## Development

### Adding New Features

To add new features to the application:

1. Identify the appropriate service or controller
2. Extend functionality following the existing patterns
3. Update the UI components as needed
4. Register new functionality with StateManager for state management

### Coding Standards

- Use ES6+ syntax
- Follow camelCase naming convention
- Include detailed JSDoc comments
- Maintain separation of concerns

## License

[MIT License](LICENSE)