// UI Rendering Functions
const UI = {
    // Initialize UI elements
    init: function() {
        this.cityInput = document.getElementById('city-input');
        this.searchBtn = document.getElementById('search-btn');
        this.toggleFavoriteBtn = document.getElementById('toggle-favorite');
        this.tabs = document.querySelectorAll('.tab');
        this.contentSections = document.querySelectorAll('.content-section');
        this.errorMessage = document.getElementById('error-message');
        this.errorText = document.getElementById('error-text');
        this.closeErrorBtn = document.getElementById('close-error');
        this.favoritesContainer = document.getElementById('favorites-container');
        this.forecastContainer = document.getElementById('forecast-container');
        
        // Set current date
        this.updateCurrentDate();
    },
    
    // Update current date display
    updateCurrentDate: function() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', options);
    },
    
    // Render current weather
    renderCurrentWeather: function(weatherData, city, country = '') {
        const displayName = country ? `${city}, ${country}` : city;
        document.getElementById('city-name').textContent = displayName;
        document.getElementById('current-temp').textContent = weatherData.temp;
        
        // Use description if available, otherwise use condition
        const conditionText = weatherData.description || weatherData.condition;
        document.getElementById('weather-condition').textContent = conditionText;
        
        document.getElementById('humidity').textContent = weatherData.humidity + '%';
        document.getElementById('wind-speed').textContent = weatherData.windSpeed;
        document.getElementById('feels-like').textContent = weatherData.feelsLike + '°C';
        document.getElementById('pressure').textContent = weatherData.pressure;
        
        // Update additional weather details if they exist
        if (weatherData.visibility) {
            document.getElementById('visibility').textContent = weatherData.visibility;
        }
        if (weatherData.cloudiness) {
            document.getElementById('cloudiness').textContent = weatherData.cloudiness;
        }
        if (weatherData.sunrise) {
            document.getElementById('sunrise').textContent = weatherData.sunrise;
        }
        if (weatherData.sunset) {
            document.getElementById('sunset').textContent = weatherData.sunset;
        }
        
        // Update weather icon
        const weatherIcon = document.getElementById('weather-icon');
        weatherIcon.className = `fas ${weatherData.icon}`;
        
        // Update favorite button
        this.updateFavoriteButton(AppState.checkFavoriteStatus());
    },
    
    // Render 5-day forecast
    renderForecast: function(forecastData) {
        this.forecastContainer.innerHTML = '';
        
        if (!forecastData || forecastData.length === 0) {
            this.forecastContainer.innerHTML = '<p class="empty-message">No forecast data available</p>';
            return;
        }
        
        forecastData.forEach(day => {
            const forecastDay = document.createElement('div');
            forecastDay.className = 'forecast-day';
            
            forecastDay.innerHTML = `
                <div class="forecast-date">${day.day}<br><small>${day.date}</small></div>
                <div class="forecast-icon">
                    <i class="fas ${day.icon}"></i>
                </div>
                <div class="forecast-temp">${day.temp}°C</div>
                <div class="forecast-condition">${day.condition}</div>
                <div class="forecast-temp-range">
                    <span class="max-temp">H: ${day.maxTemp}°</span>
                    <span class="min-temp">L: ${day.minTemp}°</span>
                </div>
                <div class="forecast-details">
                    <div>
                        <div class="label">Humidity</div>
                        <div class="value">${day.humidity}%</div>
                    </div>
                    <div>
                        <div class="label">Wind</div>
                        <div class="value">${day.windSpeed}</div>
                    </div>
                </div>
            `;
            
            this.forecastContainer.appendChild(forecastDay);
        });
    },
    
    // Render favorites list
    renderFavorites: function() {
        this.favoritesContainer.innerHTML = '';
        
        if (AppState.favorites.length === 0) {
            this.favoritesContainer.innerHTML = '<p class="empty-message">No favorite cities yet. Add some from the search tab!</p>';
            return;
        }
        
        AppState.favorites.forEach(favorite => {
            const favoriteCity = document.createElement('div');
            favoriteCity.className = 'favorite-city';
            
            favoriteCity.innerHTML = `
                <div class="favorite-city-header">
                    <div class="favorite-city-name">${favorite.name}</div>
                    <button class="remove-favorite" data-city="${favorite.name}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="favorite-weather">
                    <div>
                        <div class="favorite-temp">${favorite.weather.temp}°C</div>
                        <div class="favorite-condition">${favorite.weather.condition}</div>
                    </div>
                    <div class="favorite-icon">
                        <i class="fas ${favorite.weather.icon} fa-2x"></i>
                    </div>
                </div>
                <div class="favorite-details">
                    <div>Humidity: ${favorite.weather.humidity}%</div>
                    <div>Wind: ${favorite.weather.windSpeed}</div>
                </div>
                <button class="load-favorite-btn" data-city="${favorite.name}">
                    <i class="fas fa-search"></i> View Weather
                </button>
            `;
            
            this.favoritesContainer.appendChild(favoriteCity);
        });
    },
    
    // Update favorite button based on current city status
    updateFavoriteButton: function(isFavorite) {
        if (isFavorite) {
            this.toggleFavoriteBtn.innerHTML = '<i class="fas fa-star"></i> Remove from Favorites';
            this.toggleFavoriteBtn.style.background = 'linear-gradient(to right, #e74c3c, #c0392b)';
        } else {
            this.toggleFavoriteBtn.innerHTML = '<i class="far fa-star"></i> Add to Favorites';
            this.toggleFavoriteBtn.style.background = 'linear-gradient(to right, #f39c12, #e67e22)';
        }
    },
    // Add to UI object in ui.js
showAPISource: function(isOpenWeatherMap) {
    // Remove existing indicator if any
    const existingIndicator = document.querySelector('.api-source-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    const indicator = document.createElement('div');
    indicator.className = 'api-source-indicator';
    indicator.innerHTML = isOpenWeatherMap 
        ? '<i class="fas fa-key"></i> Using OpenWeatherMap API' 
        : '<i class="fas fa-unlock"></i> Using Open-Meteo API (Free)';
    indicator.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        background: ${isOpenWeatherMap ? '#27ae60' : '#3498db'};
        color: white;
        padding: 8px 15px;
        border-radius: 20px;
        font-size: 12px;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        animation: fadeIn 0.5s ease;
    `;
    
    document.body.appendChild(indicator);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        indicator.style.opacity = '0';
        indicator.style.transition = 'opacity 0.5s ease';
        setTimeout(() => indicator.remove(), 500);
    }, 5000);
},
    // Show error message
    showError: function(message) {
        this.errorText.textContent = message;
        this.errorMessage.classList.add('show');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideError();
        }, 5000);
    },
    
    // Hide error message
    hideError: function() {
        this.errorMessage.classList.remove('show');
    },
    
    // Switch tabs
    switchTab: function(tabId) {
        // Update active tab button
        this.tabs.forEach(tab => {
            if (tab.dataset.tab === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Update active content section
        this.contentSections.forEach(section => {
            if (section.id === tabId) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });
        
        // Update application state
        AppState.setCurrentTab(tabId);
        
        // If switching to forecast tab and we have a current city, load forecast
        if (tabId === 'forecast' && AppState.currentCity && AppState.currentWeather) {
            this.loadForecastForCurrentCity();
        }
        
        // If switching to favorites tab, render favorites
        if (tabId === 'favorites') {
            this.renderFavorites();
        }
    },
    
    // Load forecast for current city
    loadForecastForCurrentCity: async function() {
        try {
            // Show loading state
            this.forecastContainer.innerHTML = '<p class="empty-message"><i class="fas fa-spinner fa-spin"></i> Loading forecast...</p>';
            
            const result = await WeatherAPI.getForecast(AppState.currentCity);
            
            if (result.success) {
                AppState.setForecastData(result.data);
                this.renderForecast(result.data);
            } else {
                this.forecastContainer.innerHTML = '<p class="empty-message">Failed to load forecast</p>';
                this.showError(result.message);
            }
        } catch (error) {
            this.forecastContainer.innerHTML = '<p class="empty-message">Failed to load forecast data</p>';
            this.showError('Failed to load forecast data');
            console.error(error);
        }
    },
    
    // Show loading state for weather
    showWeatherLoading: function() {
        document.getElementById('city-name').textContent = 'Loading...';
        document.getElementById('current-temp').textContent = '--';
        document.getElementById('weather-condition').textContent = 'Fetching weather data...';
        document.getElementById('humidity').textContent = '--';
        document.getElementById('wind-speed').textContent = '--';
        document.getElementById('feels-like').textContent = '--';
        document.getElementById('pressure').textContent = '--';
        document.getElementById('visibility').textContent = '--';
        document.getElementById('cloudiness').textContent = '--';
        document.getElementById('sunrise').textContent = '--';
        document.getElementById('sunset').textContent = '--';
        
        const weatherIcon = document.getElementById('weather-icon');
        weatherIcon.className = 'fas fa-spinner fa-spin';
    }
};
