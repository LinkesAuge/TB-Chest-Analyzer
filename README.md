# TB Chest Analyzer

A tool for analyzing player chest data from the Total Battle game.

## Overview

TB Chest Analyzer is a client-side web application that helps players analyze chest data, compare player performance, and track progress over time.

## Features

- Data visualization with charts and tables
- Player ranking system
- Comparative analysis
- Score calculation based on configurable rules
- Multiple language support (English, German)

## Architecture

The application follows a modular architecture:

- `/js` - Main JavaScript code
  - `/controllers` - Controller classes
  - `/models` - Data models
  - `/services` - Core services
  - `/utils` - Utilities
  - `/views` - View components
  - `/charts` - Chart components
  - `main.js` - Main application entry point
  - `index.js` - HTML integration

## Getting Started

1. Clone the repository
2. Open `index.html` in a web browser
3. Upload your data or use the provided sample data

## Development

The application is built with:

- Vanilla JavaScript (ES6+)
- ApexCharts.js for data visualization
- CSS for styling

No build process is required as ES6 modules are used directly.