// Application State Management
const AppState = {
    currentCity: null,
    currentWeather: null,
    forecastData: null,
    favorites: [],
    currentTab: 'search',
    
    init: function() {
        // Load favorites from localStorage
        const savedFavorites = localStorage.getItem('weatherAppFavorites');
        if (savedFavorites) {
            this.favorites = JSON.parse(savedFavorites);
        }
        
        // Set default city
        this.currentCity = 'Thāne, IN';
    },
    
    setCurrentCity: function(city) {
        this.currentCity = city;
        this.checkFavoriteStatus();
    },
    
    setCurrentWeather: function(weather) {
        this.currentWeather = weather;
    },
    
    setForecastData: function(forecast) {
        this.forecastData = forecast;
    },
    
    addToFavorites: function() {
        if (!this.currentCity || !this.currentWeather) return;
        
        const cityData = {
            name: this.currentCity,
            weather: this.currentWeather
        };
        
        // Check if already in favorites
        const exists = this.favorites.some(fav => fav.name === this.currentCity);
        if (!exists) {
            this.favorites.push(cityData);
            this.saveFavorites();
            return true;
        }
        return false;
    },
    
    removeFromFavorites: function(cityName) {
        this.favorites = this.favorites.filter(fav => fav.name !== cityName);
        this.saveFavorites();
        this.checkFavoriteStatus();
    },
    
    checkFavoriteStatus: function() {
        if (!this.currentCity) return false;
        return this.favorites.some(fav => fav.name === this.currentCity);
    },
    
    saveFavorites: function() {
        localStorage.setItem('weatherAppFavorites', JSON.stringify(this.favorites));
    },
    
    setCurrentTab: function(tab) {
        this.currentTab = tab;
    }
};

// Initialize the state
AppState.init();
