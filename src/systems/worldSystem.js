import { weatherDesign } from '../data/langHoaGio/weatherDesign.js';

const seasons = ['spring', 'summer', 'autumn', 'winter'];
const weatherRotation = ['sunny', 'drizzle', 'sunny', 'fog', 'sunny', 'storm', 'rainbow'];

export function createWorldState() {
  return {
    day: 1,
    season: 'spring',
    weather: 'sunny',
    forecast: buildForecast(1),
  };
}

export function advanceDay(worldState) {
  worldState.day += 1;
  const seasonIndex = Math.floor((worldState.day - 1) / weatherDesign.daysPerSeason) % seasons.length;
  worldState.season = seasons[seasonIndex];
  worldState.weather = weatherRotation[(worldState.day - 1) % weatherRotation.length];
  worldState.forecast = buildForecast(worldState.day);
  return worldState;
}

export function getWeatherInfo(worldState) {
  const weather = weatherDesign.weatherTypes.find((entry) => entry.id === worldState.weather);
  const season = weatherDesign.seasons.find((entry) => entry.id === worldState.season);
  return {
    seasonName: season?.name ?? worldState.season,
    weatherName: weather?.name ?? worldState.weather,
    effect: weather?.effect ?? '',
    forecast: worldState.forecast,
  };
}

function buildForecast(day) {
  return Array.from({ length: 7 }, (_, index) => {
    const forecastDay = day + index;
    return {
      day: forecastDay,
      weather: weatherRotation[(forecastDay - 1) % weatherRotation.length],
    };
  });
}
