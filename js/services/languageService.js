/**
 * languageService.js
 * 
 * Service for internationalization and localization in the TB Chest Analyzer.
 * Manages translations, language switching, and text formatting.
 */

/**
 * LanguageService - Handles internationalization and localization
 */
export class LanguageService {
  /**
   * Initialize the language service
   * @param {Object} stateManager - State manager instance
   */
  constructor(stateManager) {
    this._stateManager = stateManager;
    
    // Default language
    this._defaultLanguage = 'en';
    
    // Current language
    this._currentLanguage = this._defaultLanguage;
    
    // Available languages
    this._languages = {
      en: {
        name: 'English',
        code: 'en',
        icon: '🇬🇧'
      },
      de: {
        name: 'Deutsch',
        code: 'de',
        icon: '🇩🇪'
      },
      fr: {
        name: 'Français',
        code: 'fr',
        icon: '🇫🇷'
      }
    };
    
    // Translation data
    this._translations = {
      en: {}, // Will be populated in initialize()
      de: {},
      fr: {}
    };
  }
  
  /**
   * Initialize the language service
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      console.log('Initializing language service...');
      
      // Load translations
      await this._loadTranslations();
      
      // Set initial language
      const savedLanguage = localStorage.getItem('tb_language') || 
                           this._getBrowserLanguage() || 
                           this._defaultLanguage;
      
      await this.setLanguage(savedLanguage);
      
      // Subscribe to state changes
      this._setupStateSubscriptions();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize language service:', error);
      return false;
    }
  }
  
  /**
   * Get available languages
   * @returns {Object} Available languages
   */
  getAvailableLanguages() {
    return this._languages;
  }
  
  /**
   * Get current language
   * @returns {string} Current language code
   */
  getCurrentLanguage() {
    return this._currentLanguage;
  }
  
  /**
   * Set current language
   * @param {string} languageCode - Language code
   * @returns {Promise<boolean>} Success status
   */
  async setLanguage(languageCode) {
    try {
      // Check if language exists
      if (!this._languages[languageCode]) {
        // Fall back to default if requested language doesn't exist
        console.warn(`Language '${languageCode}' not available, falling back to '${this._defaultLanguage}'`);
        languageCode = this._defaultLanguage;
      }
      
      // Set current language
      this._currentLanguage = languageCode;
      
      // Save to local storage
      localStorage.setItem('tb_language', languageCode);
      
      // Update state
      this._stateManager.setState('language', languageCode);
      
      // Apply translations to DOM
      this._applyTranslations();
      
      console.log(`Language set to '${languageCode}'`);
      
      return true;
    } catch (error) {
      console.error('Failed to set language:', error);
      return false;
    }
  }
  
  /**
   * Get translation for a key
   * @param {string} key - Translation key
   * @param {Object} params - Replacement parameters
   * @returns {string} Translated text
   */
  translate(key, params = {}) {
    try {
      // Get translation
      const translation = this._getTranslationByKey(key);
      
      // Replace parameters
      if (params && Object.keys(params).length > 0) {
        return this._replaceParams(translation, params);
      }
      
      return translation;
    } catch (error) {
      console.warn(`Translation error for key '${key}':`, error);
      return key; // Return key as fallback
    }
  }
  
  /**
   * Format date according to current language
   * @param {Date|string|number} date - Date to format
   * @param {Object} options - Format options
   * @returns {string} Formatted date
   */
  formatDate(date, options = {}) {
    try {
      // Create Date object if string or number
      const dateObj = typeof date === 'string' || typeof date === 'number' 
        ? new Date(date) 
        : date;
      
      // Default options
      const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      };
      
      // Merge options
      const mergedOptions = { ...defaultOptions, ...options };
      
      // Format date
      return dateObj.toLocaleDateString(this._currentLanguage, mergedOptions);
    } catch (error) {
      console.warn('Date formatting error:', error);
      return String(date); // Return original date as fallback
    }
  }
  
  /**
   * Format number according to current language
   * @param {number} num - Number to format
   * @param {Object} options - Format options
   * @returns {string} Formatted number
   */
  formatNumber(num, options = {}) {
    try {
      // Default options
      const defaultOptions = {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      };
      
      // Merge options
      const mergedOptions = { ...defaultOptions, ...options };
      
      // Format number
      return num.toLocaleString(this._currentLanguage, mergedOptions);
    } catch (error) {
      console.warn('Number formatting error:', error);
      return String(num); // Return original number as fallback
    }
  }
  
  /**
   * Convert text to current language
   * @param {HTMLElement} element - Element to translate
   */
  translateElement(element) {
    try {
      // Get translation key
      const key = element.getAttribute('data-lang-key');
      if (!key) return;
      
      // Get translation parameters
      const params = {};
      const paramsAttr = element.getAttribute('data-lang-params');
      if (paramsAttr) {
        try {
          Object.assign(params, JSON.parse(paramsAttr));
        } catch (e) {
          console.warn('Invalid lang params JSON:', paramsAttr);
        }
      }
      
      // Apply translation
      const translation = this.translate(key, params);
      element.textContent = translation;
    } catch (error) {
      console.warn('Element translation error:', error);
    }
  }
  
  /**
   * Load translations for all languages
   * @returns {Promise<boolean>} Success status
   * @private
   */
  async _loadTranslations() {
    try {
      // English translations (default)
      this._translations.en = {
        // General
        'app.title': 'TB Chest Analyzer',
        'app.loading': 'Loading...',
        'app.error': 'Error',
        'app.success': 'Success',
        'app.warning': 'Warning',
        'app.info': 'Information',
        'app.close': 'Close',
        'app.save': 'Save',
        'app.cancel': 'Cancel',
        'app.confirm': 'Confirm',
        'app.delete': 'Delete',
        'app.edit': 'Edit',
        'app.view': 'View',
        'app.add': 'Add',
        'app.remove': 'Remove',
        'app.search': 'Search',
        'app.filter': 'Filter',
        'app.sort': 'Sort',
        'app.ascending': 'Ascending',
        'app.descending': 'Descending',
        'app.yes': 'Yes',
        'app.no': 'No',
        
        // Navigation
        'nav.dashboard': 'Dashboard',
        'nav.players': 'Players',
        'nav.analytics': 'Analytics',
        'nav.settings': 'Settings',
        
        // Dashboard
        'dashboard.title': 'Dashboard',
        'dashboard.welcome': 'Welcome to TB Chest Analyzer',
        'dashboard.summary': 'Summary',
        'dashboard.total_players': 'Total Players',
        'dashboard.total_chests': 'Total Chests',
        'dashboard.average_score': 'Average Score',
        'dashboard.quick_stats': 'Quick Stats',
        
        // Players
        'players.title': 'Players',
        'players.search': 'Search Players',
        'players.filter_server': 'Filter by Server',
        'players.filter_alliance': 'Filter by Alliance',
        'players.all_servers': 'All Servers',
        'players.all_alliances': 'All Alliances',
        'players.name': 'Player Name',
        'players.alliance': 'Alliance',
        'players.server': 'Server',
        'players.score': 'Score',
        'players.chests': 'Chests',
        'players.ratio': 'Ratio',
        'players.actions': 'Actions',
        'players.view_details': 'View Details',
        'players.add_to_comparison': 'Add to Comparison',
        'players.compare': 'Compare',
        'players.details': 'Player Details',
        'players.performance': 'Performance Overview',
        'players.comparison': 'Comparison to Average',
        'players.no_results': 'No players found matching the current filters.',
        
        // Analytics
        'analytics.title': 'Analytics',
        'analytics.chart_type': 'Chart Type',
        'analytics.data_filter': 'Data Filter',
        'analytics.time_period': 'Time Period',
        'analytics.export': 'Export',
        'analytics.bar_chart': 'Bar Chart',
        'analytics.line_chart': 'Line Chart',
        'analytics.pie_chart': 'Pie Chart',
        'analytics.radar_chart': 'Radar Chart',
        'analytics.export_png': 'Export as PNG',
        'analytics.export_jpg': 'Export as JPG',
        'analytics.export_svg': 'Export as SVG',
        'analytics.export_csv': 'Export as CSV',
        
        // Settings
        'settings.title': 'Settings',
        'settings.language': 'Language',
        'settings.theme': 'Theme',
        'settings.theme_light': 'Light',
        'settings.theme_dark': 'Dark',
        'settings.data_source': 'Data Source',
        'settings.clear_cache': 'Clear Cache',
        'settings.cache_cleared': 'Cache cleared successfully',
        'settings.reset_settings': 'Reset Settings',
        'settings.settings_reset': 'Settings reset to defaults',
        'settings.confirm_reset': 'Are you sure you want to reset all settings to defaults?',
        
        // Errors
        'error.data_load': 'Failed to load data',
        'error.navigation': 'Navigation failed',
        'error.not_found': 'Not found',
        'error.invalid_input': 'Invalid input',
        'error.unknown': 'An unknown error occurred'
      };
      
      // German translations
      this._translations.de = {
        // General
        'app.title': 'TB Truhen-Analysator',
        'app.loading': 'Wird geladen...',
        'app.error': 'Fehler',
        'app.success': 'Erfolg',
        'app.warning': 'Warnung',
        'app.info': 'Information',
        'app.close': 'Schließen',
        'app.save': 'Speichern',
        'app.cancel': 'Abbrechen',
        'app.confirm': 'Bestätigen',
        'app.delete': 'Löschen',
        'app.edit': 'Bearbeiten',
        'app.view': 'Ansehen',
        'app.add': 'Hinzufügen',
        'app.remove': 'Entfernen',
        'app.search': 'Suchen',
        'app.filter': 'Filtern',
        'app.sort': 'Sortieren',
        'app.ascending': 'Aufsteigend',
        'app.descending': 'Absteigend',
        'app.yes': 'Ja',
        'app.no': 'Nein',
        
        // Navigation
        'nav.dashboard': 'Dashboard',
        'nav.players': 'Spieler',
        'nav.analytics': 'Analyse',
        'nav.settings': 'Einstellungen',
        
        // Dashboard
        'dashboard.title': 'Dashboard',
        'dashboard.welcome': 'Willkommen beim TB Truhen-Analysator',
        'dashboard.summary': 'Zusammenfassung',
        'dashboard.total_players': 'Spieler insgesamt',
        'dashboard.total_chests': 'Truhen insgesamt',
        'dashboard.average_score': 'Durchschnittliche Punktzahl',
        'dashboard.quick_stats': 'Schnelle Statistiken',
        
        // Players
        'players.title': 'Spieler',
        'players.search': 'Spieler suchen',
        'players.filter_server': 'Nach Server filtern',
        'players.filter_alliance': 'Nach Allianz filtern',
        'players.all_servers': 'Alle Server',
        'players.all_alliances': 'Alle Allianzen',
        'players.name': 'Spielername',
        'players.alliance': 'Allianz',
        'players.server': 'Server',
        'players.score': 'Punktzahl',
        'players.chests': 'Truhen',
        'players.ratio': 'Verhältnis',
        'players.actions': 'Aktionen',
        'players.view_details': 'Details anzeigen',
        'players.add_to_comparison': 'Zum Vergleich hinzufügen',
        'players.compare': 'Vergleichen',
        'players.details': 'Spielerdetails',
        'players.performance': 'Leistungsübersicht',
        'players.comparison': 'Vergleich zum Durchschnitt',
        'players.no_results': 'Keine Spieler gefunden, die den aktuellen Filtern entsprechen.',
        
        // Analytics
        'analytics.title': 'Analyse',
        'analytics.chart_type': 'Diagrammtyp',
        'analytics.data_filter': 'Datenfilter',
        'analytics.time_period': 'Zeitraum',
        'analytics.export': 'Exportieren',
        'analytics.bar_chart': 'Balkendiagramm',
        'analytics.line_chart': 'Liniendiagramm',
        'analytics.pie_chart': 'Kreisdiagramm',
        'analytics.radar_chart': 'Radardiagramm',
        'analytics.export_png': 'Als PNG exportieren',
        'analytics.export_jpg': 'Als JPG exportieren',
        'analytics.export_svg': 'Als SVG exportieren',
        'analytics.export_csv': 'Als CSV exportieren',
        
        // Settings
        'settings.title': 'Einstellungen',
        'settings.language': 'Sprache',
        'settings.theme': 'Theme',
        'settings.theme_light': 'Hell',
        'settings.theme_dark': 'Dunkel',
        'settings.data_source': 'Datenquelle',
        'settings.clear_cache': 'Cache leeren',
        'settings.cache_cleared': 'Cache erfolgreich geleert',
        'settings.reset_settings': 'Einstellungen zurücksetzen',
        'settings.settings_reset': 'Einstellungen auf Standardwerte zurückgesetzt',
        'settings.confirm_reset': 'Sind Sie sicher, dass Sie alle Einstellungen auf die Standardwerte zurücksetzen möchten?',
        
        // Errors
        'error.data_load': 'Fehler beim Laden der Daten',
        'error.navigation': 'Navigation fehlgeschlagen',
        'error.not_found': 'Nicht gefunden',
        'error.invalid_input': 'Ungültige Eingabe',
        'error.unknown': 'Ein unbekannter Fehler ist aufgetreten'
      };
      
      // French translations
      this._translations.fr = {
        // General
        'app.title': 'Analyseur de Coffres TB',
        'app.loading': 'Chargement...',
        'app.error': 'Erreur',
        'app.success': 'Succès',
        'app.warning': 'Avertissement',
        'app.info': 'Information',
        'app.close': 'Fermer',
        'app.save': 'Enregistrer',
        'app.cancel': 'Annuler',
        'app.confirm': 'Confirmer',
        'app.delete': 'Supprimer',
        'app.edit': 'Modifier',
        'app.view': 'Voir',
        'app.add': 'Ajouter',
        'app.remove': 'Retirer',
        'app.search': 'Rechercher',
        'app.filter': 'Filtrer',
        'app.sort': 'Trier',
        'app.ascending': 'Ascendant',
        'app.descending': 'Descendant',
        'app.yes': 'Oui',
        'app.no': 'Non',
        
        // Navigation
        'nav.dashboard': 'Tableau de bord',
        'nav.players': 'Joueurs',
        'nav.analytics': 'Analyse',
        'nav.settings': 'Paramètres',
        
        // Dashboard
        'dashboard.title': 'Tableau de bord',
        'dashboard.welcome': 'Bienvenue sur l\'Analyseur de Coffres TB',
        'dashboard.summary': 'Résumé',
        'dashboard.total_players': 'Joueurs totaux',
        'dashboard.total_chests': 'Coffres totaux',
        'dashboard.average_score': 'Score moyen',
        'dashboard.quick_stats': 'Statistiques rapides',
        
        // Players
        'players.title': 'Joueurs',
        'players.search': 'Rechercher des joueurs',
        'players.filter_server': 'Filtrer par serveur',
        'players.filter_alliance': 'Filtrer par alliance',
        'players.all_servers': 'Tous les serveurs',
        'players.all_alliances': 'Toutes les alliances',
        'players.name': 'Nom du joueur',
        'players.alliance': 'Alliance',
        'players.server': 'Serveur',
        'players.score': 'Score',
        'players.chests': 'Coffres',
        'players.ratio': 'Ratio',
        'players.actions': 'Actions',
        'players.view_details': 'Voir les détails',
        'players.add_to_comparison': 'Ajouter à la comparaison',
        'players.compare': 'Comparer',
        'players.details': 'Détails du joueur',
        'players.performance': 'Aperçu des performances',
        'players.comparison': 'Comparaison à la moyenne',
        'players.no_results': 'Aucun joueur trouvé correspondant aux filtres actuels.',
        
        // Analytics
        'analytics.title': 'Analyse',
        'analytics.chart_type': 'Type de graphique',
        'analytics.data_filter': 'Filtre de données',
        'analytics.time_period': 'Période',
        'analytics.export': 'Exporter',
        'analytics.bar_chart': 'Graphique à barres',
        'analytics.line_chart': 'Graphique linéaire',
        'analytics.pie_chart': 'Graphique circulaire',
        'analytics.radar_chart': 'Graphique radar',
        'analytics.export_png': 'Exporter en PNG',
        'analytics.export_jpg': 'Exporter en JPG',
        'analytics.export_svg': 'Exporter en SVG',
        'analytics.export_csv': 'Exporter en CSV',
        
        // Settings
        'settings.title': 'Paramètres',
        'settings.language': 'Langue',
        'settings.theme': 'Thème',
        'settings.theme_light': 'Clair',
        'settings.theme_dark': 'Sombre',
        'settings.data_source': 'Source de données',
        'settings.clear_cache': 'Vider le cache',
        'settings.cache_cleared': 'Cache vidé avec succès',
        'settings.reset_settings': 'Réinitialiser les paramètres',
        'settings.settings_reset': 'Paramètres réinitialisés aux valeurs par défaut',
        'settings.confirm_reset': 'Êtes-vous sûr de vouloir réinitialiser tous les paramètres aux valeurs par défaut?',
        
        // Errors
        'error.data_load': 'Échec du chargement des données',
        'error.navigation': 'Échec de la navigation',
        'error.not_found': 'Non trouvé',
        'error.invalid_input': 'Entrée invalide',
        'error.unknown': 'Une erreur inconnue s\'est produite'
      };
      
      return true;
    } catch (error) {
      console.error('Failed to load translations:', error);
      return false;
    }
  }
  
  /**
   * Get browser language
   * @returns {string} Browser language code
   * @private
   */
  _getBrowserLanguage() {
    try {
      // Get browser language
      const browserLang = navigator.language || navigator.userLanguage;
      
      // Extract language code (e.g., 'en-US' -> 'en')
      const langCode = browserLang.split('-')[0];
      
      // Check if language is available
      return this._languages[langCode] ? langCode : null;
    } catch (error) {
      console.warn('Failed to get browser language:', error);
      return null;
    }
  }
  
  /**
   * Get translation for a key
   * @param {string} key - Translation key
   * @returns {string} Translated text
   * @private
   */
  _getTranslationByKey(key) {
    // Try current language
    if (this._translations[this._currentLanguage] && 
        this._translations[this._currentLanguage][key]) {
      return this._translations[this._currentLanguage][key];
    }
    
    // Fall back to default language
    if (this._translations[this._defaultLanguage] && 
        this._translations[this._defaultLanguage][key]) {
      return this._translations[this._defaultLanguage][key];
    }
    
    // Return key as fallback
    return key;
  }
  
  /**
   * Replace parameters in a translation
   * @param {string} text - Translation text
   * @param {Object} params - Replacement parameters
   * @returns {string} Text with replaced parameters
   * @private
   */
  _replaceParams(text, params) {
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }
  
  /**
   * Apply translations to DOM
   * @private
   */
  _applyTranslations() {
    // Find all elements with data-lang-key attribute
    const elements = document.querySelectorAll('[data-lang-key]');
    
    // Translate each element
    elements.forEach(element => {
      this.translateElement(element);
    });
  }
  
  /**
   * Set up state subscriptions
   * @private
   */
  _setupStateSubscriptions() {
    // Listen for language changes from state
    this._stateManager.subscribe('language', (languageCode) => {
      if (languageCode !== this._currentLanguage) {
        this.setLanguage(languageCode);
      }
    });
  }
}