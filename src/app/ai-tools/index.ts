import { tool } from "ai";
import { z } from "zod";

// Weather Tool - fetches weather data for a location
export const weatherTool = tool({
    description: "Get current weather for a location",
    inputSchema: z.object({
        location: z.string().describe("City name like London or Mumbai"),
    }),
    execute: async ({ location }) => {
        try {
            const apiKey = process.env.OPENWEATHER_API_KEY;
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.cod !== 200) {
                return {
                    location: location,
                    condition: "Unknown Location",
                    error: "Location not found"
                };
            }

            return {
                location: data.name,
                temperature: Math.round(data.main.temp),
                condition: data.weather[0].main,
                humidity: data.main.humidity,
                wind: Math.round(data.wind.speed * 3.6),
            };
        } catch {
            return {
                location: location,
                condition: "Unknown Location",
                error: "Failed to fetch weather"
            };
        }
    },
});

// Stock Price Tool - fetches stock price for a symbol
export const stockTool = tool({
    description: "Get current stock price for a symbol",
    inputSchema: z.object({
        symbol: z.string().describe("Stock symbol like AAPL or GOOGL"),
    }),
    execute: async ({ symbol }) => {
        try {
            const apiKey = process.env.ALPHAVANTAGE_API_KEY;
            const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;

            const response = await fetch(url);
            const data = await response.json();

            const quote = data["Global Quote"];
            if (!quote || !quote["05. price"]) {
                return {
                    symbol: symbol,
                    price: "0",
                    error: "Stock not found"
                };
            }

            return {
                symbol: quote["01. symbol"],
                price: parseFloat(quote["05. price"]).toFixed(2),
                change: parseFloat(quote["09. change"]).toFixed(2),
                changePercent: quote["10. change percent"],
            };
        } catch {
            return {
                symbol: symbol,
                price: "0",
                error: "Failed to fetch stock"
            };
        }
    },
});

// F1 Race Tool - fetches next F1 race info
export const f1Tool = tool({
    description: "Get information about the next F1 race",
    inputSchema: z.object({}),
    execute: async () => {
        try {
            const url = "https://ergast.com/api/f1/current/next.json";

            const response = await fetch(url);
            const data = await response.json();

            const race = data.MRData.RaceTable.Races[0];
            if (!race) {
                return {
                    raceName: "Unknown Race",
                    error: "No upcoming race found"
                };
            }

            return {
                raceName: race.raceName,
                circuit: race.Circuit.circuitName,
                location: race.Circuit.Location.locality,
                country: race.Circuit.Location.country,
                date: race.date,
                time: race.time || "TBA",
                round: race.round,
            };
        } catch {
            return {
                raceName: "API Error",
                error: "Failed to fetch F1 data"
            };
        }
    },
});
