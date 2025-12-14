
export interface WeatherForecast {
    summary: string;
    highC?: number;
    lowC?: number;
    highF?: number;
    lowF?: number;
    precipitation?: boolean;
}

export async function getWeatherForecast(
    lat: number,
    lon: number,
    date: Date
): Promise<WeatherForecast | null> {
    try {
        // Open-Meteo takes YYYY-MM-DD
        // Note: It typically offers forecast for ~7-14 days. If the date is far future, 
        // we might need to fallback or just return generic seasonal info.
        // For this simple implementation, if the date is >10 days out, we return null.

        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 14 || diffDays < -1) {
            // Too far in future or past
            return null;
        }

        const isoDate = date.toISOString().split('T')[0];

        // Fetch daily forecast
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&start_date=${isoDate}&end_date=${isoDate}`;

        const res = await fetch(url);
        if (!res.ok) return null;

        const data = await res.json();
        if (!data.daily || !data.daily.time || data.daily.time.length === 0) {
            return null;
        }

        const code = data.daily.weathercode[0];
        const maxC = data.daily.temperature_2m_max[0];
        const minC = data.daily.temperature_2m_min[0];
        const precip = data.daily.precipitation_sum[0] || 0;

        const maxF = Math.round(maxC * 1.8 + 32);
        const minF = Math.round(minC * 1.8 + 32);

        const condition = getWeatherCondition(code);
        const summary = `${condition}, highs ${maxF}°F (${Math.round(maxC)}°C), lows ${minF}°F (${Math.round(minC)}°C).`;

        return {
            summary,
            highC: maxC,
            lowC: minC,
            highF: maxF,
            lowF: minF,
            precipitation: precip > 0 || code >= 50, // simple check
        };
    } catch (err) {
        console.error('Weather fetch error:', err);
        return null;
    }
}

function getWeatherCondition(code: number): string {
    // WMO Weather interpretation codes (WW)
    // https://open-meteo.com/en/docs
    if (code === 0) return "Clear skies";
    if (code === 1 || code === 2 || code === 3) return "Partly cloudy";
    if (code === 45 || code === 48) return "Foggy conditions";
    if (code >= 51 && code <= 55) return "Light drizzle";
    if (code >= 56 && code <= 57) return "Freezing drizzle";
    if (code >= 61 && code <= 65) return "Rain showers";
    if (code >= 66 && code <= 67) return "Freezing rain";
    if (code >= 71 && code <= 75) return "Snow showers";
    if (code === 77) return "Snow flurries";
    if (code >= 80 && code <= 82) return "Rain showers";
    if (code >= 85 && code <= 86) return "Snow showers";
    if (code >= 95) return "Thunderstorms";
    return "Cloudy";
}
