export const weatherDesign = {
  daysPerSeason: 28,
  seasons: [
    { id: 'spring', name: 'Spring', commonWeather: ['Mild sun', 'Rain'], bestCrops: ['Strawberry', 'Carrot', 'Tulip'], effect: 'Crops grow 20% faster' },
    { id: 'summer', name: 'Summer', commonWeather: ['Hot sun', 'Heat'], bestCrops: ['Cucumber', 'Chili', 'Sunflower'], effect: 'Some crops need watering twice per day' },
    { id: 'autumn', name: 'Autumn', commonWeather: ['Cool wind', 'Fog'], bestCrops: ['Pumpkin', 'Grape', 'Chrysanthemum'], effect: 'Yield income +30%' },
    { id: 'winter', name: 'Winter', commonWeather: ['Snow', 'Ice'], bestCrops: ['White Turnip', 'Mushroom', 'Pine'], effect: 'Normal crops die without greenhouse' },
  ],
  weatherTypes: [
    { id: 'sunny', name: 'Sunny', effect: 'Sun rays, birds, more NPCs outside' },
    { id: 'drizzle', name: 'Drizzle', effect: 'Auto-water crops, yield +10%' },
    { id: 'storm', name: 'Storm', effect: 'Weak crops may break, lightning animation' },
    { id: 'fog', name: 'Fog', effect: 'Reduced vision, hidden NPCs, special mushrooms' },
    { id: 'snow', name: 'Snow', effect: 'Snow cover, frozen water, winter festival' },
    { id: 'rainbow', name: 'Rainbow', effect: 'Rare after rain, surprise gifts, luck +50%' },
  ],
  forecastSources: ['Home TV: 3 days', 'Ba Linh folk forecast', 'Farmer Almanac: 7 days'],
};
