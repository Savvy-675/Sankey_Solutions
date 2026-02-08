// Main Application Logic
document.addEventListener('DOMContentLoaded', function() {
    // Rate limiting protection
    let lastApiCallTime = 0;
    const API_COOLDOWN = 1000; // 1 second between calls
    
    // Initialize UI
    UI.init();
    
    // Load default city weather
    loadWeatherForCity('Thane');
    
    // Event Listeners
    
    // Search button click
    UI.searchBtn.addEventListener('click', function() {
        const city = UI.cityInput.value.trim();
        if (city) {
            loadWeatherForCity(city);
        } else {
            UI.showError('Please enter a city name');
        }
    });
    // Add to script.js after DOMContentLoaded
// Periodically test if OpenWeatherMap API key has activated
function checkAPIKeyActivation() {
    setInterval(async () => {
        const isActive = await WeatherAPI.testAPIKey();
        if (isActive && !WeatherAPI.useOpenWeatherMap) {
            WeatherAPI.useOpenWeatherMap = true;
            UI.showAPISource(true);
            UI.showError('OpenWeatherMap API is now active! Using premium weather data.');
            
            // Reload current city with OpenWeatherMap
            if (AppState.currentCity) {
                loadWeatherForCity(AppState.currentCity);
            }
        }
    }, 300000); // Check every 5 minutes
}

// Call this function at the end of DOMContentLoaded
checkAPIKeyActivation();
    // Enter key in search input
    UI.cityInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const city = UI.cityInput.value.trim();
            if (city) {
                loadWeatherForCity(city);
            } else {
                UI.showError('Please enter a city name');
            }
        }
    });
    
    // Toggle favorite button
    UI.toggleFavoriteBtn.addEventListener('click', function() {
        if (!AppState.currentCity || !AppState.currentWeather) {
            UI.showError('No city selected');
            return;
        }
        
        const isFavorite = AppState.checkFavoriteStatus();
        
        if (isFavorite) {
            AppState.removeFromFavorites(AppState.currentCity);
            UI.updateFavoriteButton(false);
            UI.showError(`${AppState.currentCity} removed from favorites`);
        } else {
            const added = AppState.addToFavorites();
            if (added) {
                UI.updateFavoriteButton(true);
                UI.showError(`${AppState.currentCity} added to favorites`);
            } else {
                UI.showError(`${AppState.currentCity} is already in favorites`);
            }
        }
        
        // If we're on the favorites tab, update the display
        if (AppState.currentTab === 'favorites') {
            UI.renderFavorites();
        }
    });
    
    // Tab switching
    UI.tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            UI.switchTab(tabId);
        });
    });
    
    // Close error message
    UI.closeErrorBtn.addEventListener('click', function() {
        UI.hideError();
    });
    
    // Delegate event for removing favorites
    document.addEventListener('click', function(e) {
        // Remove favorite
        if (e.target.closest('.remove-favorite')) {
            const button = e.target.closest('.remove-favorite');
            const cityName = button.dataset.city;
            
            AppState.removeFromFavorites(cityName);
            UI.renderFavorites();
            UI.updateFavoriteButton(AppState.checkFavoriteStatus());
            UI.showError(`${cityName} removed from favorites`);
        }
        
        // Load favorite city
        if (e.target.closest('.load-favorite-btn')) {
            const button = e.target.closest('.load-favorite-btn');
            const cityName = button.dataset.city;
            
            // Find the favorite city data
            const favorite = AppState.favorites.find(fav => fav.name === cityName);
            if (favorite) {
                // Update application state
                AppState.setCurrentCity(favorite.name);
                AppState.setCurrentWeather(favorite.weather);
                
                // Update UI
                UI.renderCurrentWeather(favorite.weather, favorite.name);
                UI.cityInput.value = favorite.name;
                
                // Switch to search tab
                UI.switchTab('search');
                
                // Load fresh forecast data
                UI.loadForecastForCurrentCity();
                
                UI.showError(`Loaded ${cityName} from favorites`);
            }
        }
    });
    
    // Function to load weather for a city
    async function loadWeatherForCity(city) {
        // Rate limiting check
        const now = Date.now();
        if (now - lastApiCallTime < API_COOLDOWN) {
            UI.showError('Please wait a moment before searching again');
            return;
        }
        
        lastApiCallTime = now;
        
        try {
            // Show loading state
            UI.showWeatherLoading();
            UI.searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
            UI.searchBtn.disabled = true;
            
            // Get current weather
            const result = await WeatherAPI.getCurrentWeather(city);
            
            if (result.success) {
                // Update application state
                AppState.setCurrentCity(result.city);
                AppState.setCurrentWeather(result.data);
                
                // Update UI with city and country
                UI.renderCurrentWeather(result.data, result.city, result.country);
                UI.cityInput.value = result.city;
                
                // Load forecast if we're on the forecast tab
                if (AppState.currentTab === 'forecast') {
                    UI.loadForecastForCurrentCity();
                }
                
                // Show success message
                setTimeout(() => {
                    UI.showError(`${result.city} weather loaded successfully!`);
                }, 100);
            } else {
                UI.showError(result.message);
            }
        } catch (error) {
            UI.showError('Failed to fetch weather data');
            console.error(error);
        } finally {
            // Reset button state
            UI.searchBtn.innerHTML = '<i class="fas fa-search"></i> Search';
            UI.searchBtn.disabled = false;
        }
    }
    
    // Auto-refresh weather every 10 minutes
    setInterval(() => {
        if (AppState.currentCity && AppState.currentTab === 'search') {
            loadWeatherForCity(AppState.currentCity);
        }
    }, 10 * 60 * 1000); // 10 minutes
    
    // Export function for global access
    window.loadFavoriteCity = function(cityName) {
        loadWeatherForCity(cityName);
    };
    
    // Add sample cities button for testing (optional)
    addSampleCitiesButton();
    
    // Function to add sample cities button (optional)
    function addSampleCitiesButton() {
        const sampleCities = ['London', 'Paris', 'New York', 'Tokyo', 'Sydney', 'Dubai'];
        const button = document.createElement('button');
        button.id = 'sample-cities-btn';
        button.innerHTML = '<i class="fas fa-globe-americas"></i> Try Sample Cities';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 10px 15px;
            background: linear-gradient(to right, #3498db, #2980b9);
            color: white;
            border: none;
            border-radius: 50px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        
        button.addEventListener('click', function() {
            const city = sampleCities[Math.floor(Math.random() * sampleCities.length)];
            UI.cityInput.value = city;
            loadWeatherForCity(city);
        });
        
        document.body.appendChild(button);
    }
});
