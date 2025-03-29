/**
 * chartService.js
 * 
 * Service for handling chart operations in the TB Chest Analyzer.
 * Manages chart creation, configuration, and rendering using ApexCharts.
 */

/**
 * ChartService - Handles chart rendering and management
 */
export class ChartService {
  /**
   * Initialize the chart service
   * @param {Object} stateManager - State manager instance
   * @param {Object} errorHandler - Error handler instance
   */
  constructor(stateManager, errorHandler) {
    this._stateManager = stateManager;
    this._errorHandler = errorHandler;
    this._chartInstances = new Map();
    this._defaultColors = [
      '#0266C8', '#F90101', '#F2B50F', '#00933B', 
      '#8D00D4', '#FF5733', '#33FFF5', '#9CFF33'
    ];
  }
  
  /**
   * Initialize the chart service
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      // Ensure ApexCharts is available
      if (typeof ApexCharts === 'undefined') {
        console.warn('ApexCharts not found. Charts will not be rendered.');
        return false;
      }
      
      // Set up subscriptions to state changes
      this._setupStateSubscriptions();
      
      return true;
    } catch (error) {
      this._errorHandler.handleError(error, 'chart-service-initialization');
      return false;
    }
  }
  
  /**
   * Create a chart instance
   * @param {string} containerId - ID of the container element
   * @param {string} chartType - Type of chart (line, bar, etc.)
   * @param {Object} data - Chart data
   * @param {Object} options - Additional chart options
   * @returns {Object|null} Chart instance or null on error
   */
  createChart(containerId, chartType, data, options = {}) {
    try {
      // Get the container element
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`Chart container not found: ${containerId}`);
      }
      
      // Generate a unique chart ID
      const chartId = `chart-${containerId}-${Date.now()}`;
      
      // Configure chart options
      const chartOptions = this._buildChartOptions(chartType, data, options);
      
      // Create the chart instance
      const chart = new ApexCharts(container, chartOptions);
      
      // Store the chart instance
      this._chartInstances.set(chartId, {
        instance: chart,
        type: chartType,
        data: data,
        containerId: containerId
      });
      
      // Render the chart
      chart.render();
      
      // Update state with chart configuration
      this._updateChartConfig(chartId, chartOptions);
      
      return {
        id: chartId,
        instance: chart,
        update: (newData, newOptions = {}) => this.updateChart(chartId, newData, newOptions)
      };
    } catch (error) {
      this._errorHandler.handleError(error, 'chart-creation');
      return null;
    }
  }
  
  /**
   * Update an existing chart
   * @param {string} chartId - Chart ID
   * @param {Object} data - New chart data
   * @param {Object} options - New chart options
   * @returns {boolean} Success status
   */
  updateChart(chartId, data, options = {}) {
    try {
      // Get the chart instance
      const chartInfo = this._chartInstances.get(chartId);
      if (!chartInfo) {
        throw new Error(`Chart not found: ${chartId}`);
      }
      
      // Update chart data and options
      const chartOptions = this._buildChartOptions(
        chartInfo.type, 
        data || chartInfo.data, 
        options
      );
      
      // Update the chart
      const chart = chartInfo.instance;
      
      // Update series and options
      chart.updateOptions(chartOptions);
      
      // Update the stored chart data
      chartInfo.data = data || chartInfo.data;
      
      // Update state with chart configuration
      this._updateChartConfig(chartId, chartOptions);
      
      return true;
    } catch (error) {
      this._errorHandler.handleError(error, 'chart-update');
      return false;
    }
  }
  
  /**
   * Get a chart instance by ID
   * @param {string} chartId - Chart ID
   * @returns {Object|null} Chart instance or null if not found
   */
  getChart(chartId) {
    try {
      const chartInfo = this._chartInstances.get(chartId);
      if (!chartInfo) {
        return null;
      }
      
      return {
        id: chartId,
        instance: chartInfo.instance,
        update: (newData, newOptions = {}) => this.updateChart(chartId, newData, newOptions)
      };
    } catch (error) {
      this._errorHandler.handleError(error, 'chart-retrieval');
      return null;
    }
  }
  
  /**
   * Destroy a chart instance
   * @param {string} chartId - Chart ID
   * @returns {boolean} Success status
   */
  destroyChart(chartId) {
    try {
      // Get the chart instance
      const chartInfo = this._chartInstances.get(chartId);
      if (!chartInfo) {
        return false;
      }
      
      // Destroy the chart
      chartInfo.instance.destroy();
      
      // Remove from storage
      this._chartInstances.delete(chartId);
      
      // Remove from state
      const chartConfigs = this._stateManager.getState('chartConfigs');
      if (chartConfigs && chartConfigs[chartId]) {
        const newChartConfigs = { ...chartConfigs };
        delete newChartConfigs[chartId];
        this._stateManager.setState('chartConfigs', newChartConfigs);
      }
      
      return true;
    } catch (error) {
      this._errorHandler.handleError(error, 'chart-destruction');
      return false;
    }
  }
  
  /**
   * Create a basic chart with default configurations
   * @param {string} containerId - ID of the container element
   * @param {string} title - Chart title
   * @param {Array} series - Chart series data
   * @param {Array} labels - Chart labels
   * @param {string} type - Chart type
   * @returns {Object|null} Chart instance or null on error
   */
  createBasicChart(containerId, title, series, labels, type = 'bar') {
    try {
      // Prepare data object
      const data = {
        series,
        labels
      };
      
      // Prepare options
      const options = {
        title: {
          text: title
        }
      };
      
      // Create and return the chart
      return this.createChart(containerId, type, data, options);
    } catch (error) {
      this._errorHandler.handleError(error, 'basic-chart-creation');
      return null;
    }
  }
  
  /**
   * Export chart as an image
   * @param {string} chartId - Chart ID
   * @param {string} format - Export format (png, svg, etc.)
   * @returns {Promise<string>} Data URL of the exported image
   */
  async exportChart(chartId, format = 'png') {
    try {
      // Get the chart instance
      const chartInfo = this._chartInstances.get(chartId);
      if (!chartInfo) {
        throw new Error(`Chart not found: ${chartId}`);
      }
      
      // Export the chart
      return await chartInfo.instance.dataURI({ format });
    } catch (error) {
      this._errorHandler.handleError(error, 'chart-export');
      return null;
    }
  }
  
  /**
   * Resize a chart
   * @param {string} chartId - Chart ID
   * @returns {boolean} Success status
   */
  resizeChart(chartId) {
    try {
      // Get the chart instance
      const chartInfo = this._chartInstances.get(chartId);
      if (!chartInfo) {
        return false;
      }
      
      // Resize the chart
      chartInfo.instance.render();
      
      return true;
    } catch (error) {
      this._errorHandler.handleError(error, 'chart-resize');
      return false;
    }
  }
  
  /**
   * Build chart options based on type and data
   * @param {string} chartType - Type of chart
   * @param {Object} data - Chart data
   * @param {Object} customOptions - Custom options
   * @returns {Object} Chart options
   * @private
   */
  _buildChartOptions(chartType, data, customOptions = {}) {
    // Base options
    const baseOptions = {
      chart: {
        type: chartType,
        fontFamily: 'Arial, sans-serif',
        background: 'transparent',
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800
        },
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          }
        }
      },
      colors: this._defaultColors,
      theme: {
        mode: this._stateManager.getState('darkMode') ? 'dark' : 'light'
      },
      tooltip: {
        enabled: true,
        theme: this._stateManager.getState('darkMode') ? 'dark' : 'light'
      },
      legend: {
        show: true,
        position: 'bottom',
        horizontalAlign: 'center'
      },
      grid: {
        show: true,
        borderColor: '#90A4AE',
        strokeDashArray: 0,
        position: 'back',
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        }
      },
      dataLabels: {
        enabled: false
      },
      responsive: [
        {
          breakpoint: 768,
          options: {
            chart: {
              height: 300
            },
            legend: {
              position: 'bottom'
            }
          }
        }
      ]
    };
    
    // Add series data
    if (data.series) {
      baseOptions.series = data.series;
    }
    
    // Add labels if provided
    if (data.labels) {
      baseOptions.labels = data.labels;
    }
    
    // Add xaxis categories if provided
    if (data.categories) {
      baseOptions.xaxis = {
        ...baseOptions.xaxis,
        categories: data.categories
      };
    }
    
    // Apply chart-specific options
    const typeOptions = this._getChartTypeOptions(chartType, data);
    
    // Merge options
    const mergedOptions = this._deepMerge(baseOptions, typeOptions, customOptions);
    
    return mergedOptions;
  }
  
  /**
   * Get options specific to chart type
   * @param {string} chartType - Type of chart
   * @param {Object} data - Chart data
   * @returns {Object} Chart type specific options
   * @private
   */
  _getChartTypeOptions(chartType, data) {
    switch (chartType) {
      case 'bar':
        return {
          plotOptions: {
            bar: {
              horizontal: false,
              columnWidth: '70%',
              distributed: false,
              dataLabels: {
                position: 'top'
              }
            }
          }
        };
        
      case 'line':
        return {
          stroke: {
            curve: 'smooth',
            width: 3
          },
          markers: {
            size: 4,
            strokeWidth: 0
          }
        };
        
      case 'area':
        return {
          stroke: {
            curve: 'smooth',
            width: 2
          },
          fill: {
            type: 'gradient',
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.7,
              opacityTo: 0.3
            }
          }
        };
        
      case 'pie':
      case 'donut':
        return {
          plotOptions: {
            pie: {
              donut: {
                size: chartType === 'donut' ? '50%' : '0%'
              },
              customScale: 0.9,
              offsetX: 0,
              offsetY: 0,
              expandOnClick: true
            }
          },
          dataLabels: {
            enabled: true,
            formatter: function(val) {
              return val.toFixed(1) + '%';
            }
          }
        };
        
      case 'radar':
        return {
          plotOptions: {
            radar: {
              size: undefined,
              offsetX: 0,
              offsetY: 0
            }
          },
          markers: {
            size: 4,
            hover: {
              size: 6
            }
          }
        };
        
      case 'heatmap':
        return {
          plotOptions: {
            heatmap: {
              shadeIntensity: 0.5,
              colorScale: {
                ranges: [
                  {
                    from: 0,
                    to: 50,
                    color: '#128FD9',
                    name: 'low'
                  },
                  {
                    from: 51,
                    to: 100,
                    color: '#FFB200',
                    name: 'medium'
                  },
                  {
                    from: 101,
                    to: Infinity,
                    color: '#FF4560',
                    name: 'high'
                  }
                ]
              }
            }
          }
        };
        
      default:
        return {};
    }
  }
  
  /**
   * Deep merge multiple objects
   * @param {...Object} objects - Objects to merge
   * @returns {Object} Merged object
   * @private
   */
  _deepMerge(...objects) {
    const result = {};
    
    objects.forEach(obj => {
      if (!obj) return;
      
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          result[key] = this._deepMerge(result[key] || {}, obj[key]);
        } else {
          result[key] = obj[key];
        }
      });
    });
    
    return result;
  }
  
  /**
   * Update chart configuration in state
   * @param {string} chartId - Chart ID
   * @param {Object} config - Chart configuration
   * @private
   */
  _updateChartConfig(chartId, config) {
    // Get current chart configs
    const chartConfigs = this._stateManager.getState('chartConfigs') || {};
    
    // Update with new config
    const newChartConfigs = {
      ...chartConfigs,
      [chartId]: config
    };
    
    // Update state
    this._stateManager.setState('chartConfigs', newChartConfigs);
  }
  
  /**
   * Set up state subscriptions
   * @private
   */
  _setupStateSubscriptions() {
    // Listen for theme changes
    this._stateManager.subscribe('darkMode', (darkMode) => {
      // Update all charts with new theme
      for (const [chartId, chartInfo] of this._chartInstances.entries()) {
        chartInfo.instance.updateOptions({
          theme: {
            mode: darkMode ? 'dark' : 'light'
          },
          tooltip: {
            theme: darkMode ? 'dark' : 'light'
          }
        });
      }
    });
  }
}