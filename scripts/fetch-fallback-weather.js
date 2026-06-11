const fs = require('fs');
const path = require('path');

const LATITUDE = '43.7892';
const LONGITUDE = '-91.2511';
const URL = `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code&temperature_unit=fahrenheit&timezone=America%2FChicago`;

async function main() {
  try {
    console.log('Fetching Open-Meteo weather data for fallback cache...');
    const res = await fetch(URL);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    
    const data = await res.json();
    const outputData = {
      lastUpdated: new Date().toISOString(),
      current: {
        temp: Math.round(data.current.temperature_2m),
        apparentTemp: Math.round(data.current.apparent_temperature),
        humidity: Math.round(data.current.relative_humidity_2m),
        code: data.current.weather_code
      },
      hourly: {
        time: data.hourly.time,
        temperature_2m: data.hourly.temperature_2m,
        apparent_temperature: data.hourly.apparent_temperature,
        weather_code: data.hourly.weather_code,
        relative_humidity_2m: data.hourly.relative_humidity_2m
      }
    };

    const outputPath = path.join(__dirname, '..', 'assets', 'weather-fallback.json');
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log(`Weather fallback successfully written to ${outputPath}`);
  } catch (error) {
    console.warn('Warning: Failed to fetch fallback weather. Using the existing committed assets/weather-fallback.json instead.', error);
    process.exit(0);
  }
}

main();
