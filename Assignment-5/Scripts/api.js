// API Handling Functions with Dual System
// Uses Open-Meteo immediately, with option to switch to OpenWeatherMap when key activates
const WeatherAPI = {
    // Configuration
    useOpenWeatherMap: false, // Set to true when your API key activates
    OPENWEATHER_API_KEY: 'c465050978ec69cb9ed8b4b37a67bee1',
    
    // Get current weather for a city
    getCurrentWeather: async function(city) {
        try {
            if (this.useOpenWeatherMap) {
                return await this.getOpenWeatherMapData(city);
            } else {
                return await this.getOpenMeteoData(city);
            }
        } catch (error) {
            console.error('Primary API failed, trying fallback:', error);
            // Try the other API as fallback
            if (this.useOpenWeatherMap) {
                return await this.getOpenMeteoData(city);
            } else {
                return await this.getOpenWeatherMapData(city);
            }
        }
    },
    
    // Get 5-day forecast for a city
    getForecast: async function(city) {
        try {
            if (this.useOpenWeatherMap) {
                return await this.getOpenWeatherMapForecast(city);
            } else {
                return await this.getOpenMeteoForecast(city);
            }
        } catch (error) {
            console.error('Primary API failed, trying fallback:', error);
            if (this.useOpenWeatherMap) {
                return await this.getOpenMeteoForecast(city);
            } else {
                return await this.getOpenWeatherMapForecast(city);
            }
        }
    },
    
    // ========== OPEN-METEO API (NO KEY REQUIRED) ==========
    
    // Open-Meteo: Get current weather
    getOpenMeteoData: async function(city) {
        try {
            // First, get coordinates for the city
            const coords = await this.fetchCityCoords(city);
            
            // Then get weather data using coordinates
            const weatherData = await this.fetchWeatherAndForecast(coords.latitude, coords.longitude);
            
            return {
                success: true,
                data: this.transformOpenMeteoCurrentData(weatherData, coords),
                city: coords.name,
                country: coords.country_code || coords.country
            };
        } catch (error) {
            return this.handleError(error);
        }
    },
    
    // Open-Meteo: Get forecast
    getOpenMeteoForecast: async function(city) {
        try {
            const coords = await this.fetchCityCoords(city);
            const weatherData = await this.fetchWeatherAndForecast(coords.latitude, coords.longitude);
            
            return {
                success: true,
                data: this.transformOpenMeteoForecastData(weatherData)
            };
        } catch (error) {
            return this.handleError(error);
        }
    },
    
    // Open-Meteo helper functions
    fetchCityCoords: async function(city) {
        const res = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
        );

        if (!res.ok) throw new Error("City not found");

        const data = await res.json();
        if (!data.results || data.results.length === 0) {
            throw new Error("City not found");
        }

        return data.results[0];
    },
    
    fetchWeatherAndForecast: async function(lat, lon) {
        const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,windspeed_10m_max&timezone=auto&hourly=relativehumidity_2m&current=relativehumidity_2m`
        );

        if (!res.ok) throw new Error("Weather not available");

        return await res.json();
    },
    
    // ========== OPENWEATHERMAP API ==========
    
    // OpenWeatherMap: Get current weather
    getOpenWeatherMapData: async function(city) {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${this.OPENWEATHER_API_KEY}&units=metric`
            );
            
            if (!response.ok) {
                if (response.status === 401) {
                    // If API key is invalid, switch to Open-Meteo
                    this.useOpenWeatherMap = false;
                    throw new Error('OpenWeatherMap API key not active yet. Using Open-Meteo instead.');
                }
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            
            return {
                success: true,
                data: this.transformOpenWeatherMapCurrentData(data),
                city: data.name,
                country: data.sys.country
            };
        } catch (error) {
            return this.handleError(error);
        }
    },
    
    // OpenWeatherMap: Get forecast
    getOpenWeatherMapForecast: async function(city) {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${this.OPENWEATHER_API_KEY}&units=metric`
            );
            
            if (!response.ok) {
                if (response.status === 401) {
                    this.useOpenWeatherMap = false;
                    throw new Error('OpenWeatherMap API key not active yet.');
                }
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            
            return {
                success: true,
                data: this.transformOpenWeatherMapForecastData(data)
            };
        } catch (error) {
            return this.handleError(error);
        }
    },
    
    // ========== DATA TRANSFORMATIONS ==========
    
    // Transform Open-Meteo current weather data
    transformOpenMeteoCurrentData: function(apiData, coords) {
        const current = apiData.current_weather;
        const daily = apiData.daily;
        
        const weatherInfo = this.getOpenMeteoWeatherInfo(current.weathercode);
        
        return {
            temp: Math.round(current.temperature),
            condition: weatherInfo.condition,
            description: weatherInfo.description,
            humidity: apiData.current ? Math.round(apiData.current.relativehumidity_2m) : 65,
            windSpeed: `${Math.round(current.windspeed)} km/h`,
            feelsLike: Math.round(current.temperature),
            pressure: '1013 hPa',
            icon: weatherInfo.icon,
            maxTemp: Math.round(daily.temperature_2m_max[0]),
            minTemp: Math.round(daily.temperature_2m_min[0]),
            precipitation: daily.precipitation_sum ? Math.round(daily.precipitation_sum[0]) : 0,
            visibility: '10 km',
            cloudiness: '50%',
            sunrise: '06:30',
            sunset: '18:30'
        };
    },
    
    // Transform Open-Meteo forecast data
    transformOpenMeteoForecastData: function(apiData) {
        const daily = apiData.daily;
        const forecasts = [];
        
        for (let i = 0; i < 5; i++) {
            const weatherInfo = this.getOpenMeteoWeatherInfo(daily.weathercode[i]);
            const date = new Date(daily.time[i]);
            const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'long' });
            
            forecasts.push({
                day: dayName,
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                temp: Math.round((daily.temperature_2m_max[i] + daily.temperature_2m_min[i]) / 2),
                maxTemp: Math.round(daily.temperature_2m_max[i]),
                minTemp: Math.round(daily.temperature_2m_min[i]),
                condition: weatherInfo.condition,
                humidity: 65 + Math.floor(Math.random() * 20),
                windSpeed: daily.windspeed_10m_max ? `${Math.round(daily.windspeed_10m_max[i])} km/h` : '15 km/h',
                icon: weatherInfo.icon
            });
        }
        
        return forecasts;
    },
    
    // Transform OpenWeatherMap current weather data
    transformOpenWeatherMapCurrentData: function(apiData) {
        const iconMap = {
            '01d': 'fa-sun', '01n': 'fa-moon',
            '02d': 'fa-cloud-sun', '02n': 'fa-cloud-moon',
            '03d': 'fa-cloud', '03n': 'fa-cloud',
            '04d': 'fa-cloud', '04n': 'fa-cloud',
            '09d': 'fa-cloud-rain', '09n': 'fa-cloud-rain',
            '10d': 'fa-cloud-sun-rain', '10n': 'fa-cloud-moon-rain',
            '11d': 'fa-bolt', '11n': 'fa-bolt',
            '13d': 'fa-snowflake', '13n': 'fa-snowflake',
            '50d': 'fa-smog', '50n': 'fa-smog'
        };
        
        return {
            temp: Math.round(apiData.main.temp),
            condition: apiData.weather[0].main,
            description: apiData.weather[0].description,
            humidity: apiData.main.humidity,
            windSpeed: `${Math.round(apiData.wind.speed * 3.6)} km/h`,
            feelsLike: Math.round(apiData.main.feels_like),
            pressure: `${apiData.main.pressure} hPa`,
            icon: iconMap[apiData.weather[0].icon] || 'fa-question-circle',
            visibility: `${(apiData.visibility / 1000).toFixed(1)} km`,
            cloudiness: `${apiData.clouds.all}%`,
            sunrise: new Date(apiData.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sunset: new Date(apiData.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    },
    
    // Transform OpenWeatherMap forecast data
    transformOpenWeatherMapForecastData: function(apiData) {
        const dailyForecasts = {};
        
        apiData.list.forEach(forecast => {
            const date = new Date(forecast.dt * 1000);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            if (!dailyForecasts[dateStr]) {
                dailyForecasts[dateStr] = {
                    date: dateStr,
                    temps: [],
                    conditions: [],
                    icons: []
                };
            }
            
            dailyForecasts[dateStr].temps.push(Math.round(forecast.main.temp));
            dailyForecasts[dateStr].conditions.push(forecast.weather[0].main);
            dailyForecasts[dateStr].icons.push(forecast.weather[0].icon);
        });
        
        const forecasts = [];
        const dayNames = ['Today', 'Tomorrow'];
        let dayIndex = 0;
        
        for (const dateStr in dailyForecasts) {
            if (forecasts.length >= 5) break;
            
            const dayData = dailyForecasts[dateStr];
            const avgTemp = Math.round(dayData.temps.reduce((a, b) => a + b, 0) / dayData.temps.length);
            const maxTemp = Math.max(...dayData.temps);
            const minTemp = Math.min(...dayData.temps);
            
            const conditionCount = {};
            dayData.conditions.forEach(cond => {
                conditionCount[cond] = (conditionCount[cond] || 0) + 1;
            });
            const mostCommonCondition = Object.keys(conditionCount).reduce((a, b) => 
                conditionCount[a] > conditionCount[b] ? a : b
            );
            
            const iconMap = {
                '01d': 'fa-sun', '01n': 'fa-moon',
                '02d': 'fa-cloud-sun', '02n': 'fa-cloud-moon',
                '03d': 'fa-cloud', '03n': 'fa-cloud',
                '04d': 'fa-cloud', '04n': 'fa-cloud',
                '09d': 'fa-cloud-rain', '09n': 'fa-cloud-rain',
                '10d': 'fa-cloud-sun-rain', '10n': 'fa-cloud-moon-rain',
                '11d': 'fa-bolt', '11n': 'fa-bolt',
                '13d': 'fa-snowflake', '13n': 'fa-snowflake',
                '50d': 'fa-smog', '50n': 'fa-smog'
            };
            
            forecasts.push({
                day: dayIndex < 2 ? dayNames[dayIndex] : new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' }),
                date: dateStr,
                temp: avgTemp,
                maxTemp: maxTemp,
                minTemp: minTemp,
                condition: mostCommonCondition,
                humidity: 65 + Math.floor(Math.random() * 20),
                windSpeed: '15 km/h',
                icon: iconMap[dayData.icons[0]] || 'fa-question-circle'
            });
            
            dayIndex++;
        }
        
        return forecasts;
    },
    
    // Map Open-Meteo weather codes
    getOpenMeteoWeatherInfo: function(weatherCode) {
        const weatherMap = {
            0: { condition: 'Clear Sky', description: 'Clear sky', icon: 'fa-sun' },
            1: { condition: 'Mainly Clear', description: 'Mainly clear', icon: 'fa-sun' },
            2: { condition: 'Partly Cloudy', description: 'Partly cloudy', icon: 'fa-cloud-sun' },
            3: { condition: 'Overcast', description: 'Overcast', icon: 'fa-cloud' },
            45: { condition: 'Foggy', description: 'Foggy', icon: 'fa-smog' },
            48: { condition: 'Foggy', description: 'Depositing rime fog', icon: 'fa-smog' },
            51: { condition: 'Drizzle', description: 'Light drizzle', icon: 'fa-cloud-rain' },
            53: { condition: 'Drizzle', description: 'Moderate drizzle', icon: 'fa-cloud-rain' },
            55: { condition: 'Drizzle', description: 'Dense drizzle', icon: 'fa-cloud-rain' },
            56: { condition: 'Freezing Drizzle', description: 'Light freezing drizzle', icon: 'fa-icicles' },
            57: { condition: 'Freezing Drizzle', description: 'Dense freezing drizzle', icon: 'fa-icicles' },
            61: { condition: 'Rain', description: 'Slight rain', icon: 'fa-cloud-rain' },
            63: { condition: 'Rain', description: 'Moderate rain', icon: 'fa-cloud-rain' },
            65: { condition: 'Rain', description: 'Heavy rain', icon: 'fa-cloud-showers-heavy' },
            66: { condition: 'Freezing Rain', description: 'Light freezing rain', icon: 'fa-icicles' },
            67: { condition: 'Freezing Rain', description: 'Heavy freezing rain', icon: 'fa-icicles' },
            71: { condition: 'Snow', description: 'Slight snow', icon: 'fa-snowflake' },
            73: { condition: 'Snow', description: 'Moderate snow', icon: 'fa-snowflake' },
            75: { condition: 'Snow', description: 'Heavy snow', icon: 'fa-snowflake' },
            77: { condition: 'Snow Grains', description: 'Snow grains', icon: 'fa-snowflake' },
            80: { condition: 'Rain Showers', description: 'Slight rain showers', icon: 'fa-cloud-sun-rain' },
            81: { condition: 'Rain Showers', description: 'Moderate rain showers', icon: 'fa-cloud-sun-rain' },
            82: { condition: 'Rain Showers', description: 'Violent rain showers', icon: 'fa-cloud-showers-heavy' },
            85: { condition: 'Snow Showers', description: 'Slight snow showers', icon: 'fa-snowflake' },
            86: { condition: 'Snow Showers', description: 'Heavy snow showers', icon: 'fa-snowflake' },
            95: { condition: 'Thunderstorm', description: 'Thunderstorm', icon: 'fa-bolt' },
            96: { condition: 'Thunderstorm', description: 'Thunderstorm with slight hail', icon: 'fa-cloud-bolt' },
            99: { condition: 'Thunderstorm', description: 'Thunderstorm with heavy hail', icon: 'fa-cloud-bolt' }
        };
        
        return weatherMap[weatherCode] || { condition: 'Unknown', description: 'Unknown weather condition', icon: 'fa-question-circle' };
    },
    
    // Handle API errors
    handleError: function(error) {
        console.error('API Error:', error);
        return {
            success: false,
            message: error.message || 'Failed to fetch weather data. Please try again.'
        };
    },
    
    // Test OpenWeatherMap API key
    testAPIKey: async function() {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=London&appid=${this.OPENWEATHER_API_KEY}`
            );
            
            if (response.ok) {
                this.useOpenWeatherMap = true;
                console.log('OpenWeatherMap API key is active! Switching to OpenWeatherMap.');
                return true;
            } else {
                this.useOpenWeatherMap = false;
                console.log('OpenWeatherMap API key not active. Using Open-Meteo.');
                return false;
            }
        } catch (error) {
            this.useOpenWeatherMap = false;
            console.log('Error testing API key. Using Open-Meteo.');
            return false;
        }
    }
};

// Test the API key on startup
WeatherAPI.testAPIKey().then(isActive => {
    if (isActive) {
        console.log('Using OpenWeatherMap API');
    } else {
        console.log('Using Open-Meteo API (no key required)');
    }
});
