"use client";

import { Cloud, Sun, CloudRain, Snowflake, Wind, Droplets } from "lucide-react";
import { WeatherData, StockData, RaceData } from "@/types";

// Weather Icon Helper
function getWeatherIcon(condition?: string) {
    const c = condition?.toLowerCase() || "";
    if (c.includes("rain") || c.includes("drizzle")) return <CloudRain className="h-8 w-8 text-blue-500" />;
    if (c.includes("snow")) return <Snowflake className="h-8 w-8 text-blue-200" />;
    if (c.includes("cloud")) return <Cloud className="h-8 w-8 text-gray-400" />;
    if (c.includes("clear") || c.includes("sun")) return <Sun className="h-8 w-8 text-yellow-500" />;
    return <Cloud className="h-8 w-8 text-gray-400" />;
}

// Weather Card Component
export function WeatherCard({ data }: { data: WeatherData }) {
    if (!data || data.error || data.condition === "Unknown Location") {
        return null; // Self-hide on failure
    }

    return (
        <div className="mt-3 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 max-w-sm">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="font-semibold text-blue-900">{data.location}</h3>
                    <p className="text-sm text-blue-600">{data.condition}</p>
                </div>
                {getWeatherIcon(data.condition)}
            </div>
            <div className="text-4xl font-bold text-blue-900 mb-3">
                {data.temperature}°C
            </div>
            <div className="flex gap-4 text-sm text-blue-700">
                <div className="flex items-center gap-1">
                    <Droplets className="h-4 w-4" />
                    <span>{data.humidity}%</span>
                </div>
                <div className="flex items-center gap-1">
                    <Wind className="h-4 w-4" />
                    <span>{data.wind} km/h</span>
                </div>
            </div>
        </div>
    );
}

// Stock Card Component
export function StockCard({ data }: { data: StockData }) {
    if (!data || data.error || !data.price || data.price === "0" || data.price === "0.00") {
        return null; // Self-hide on failure
    }

    const changeNum = parseFloat(data.change || "0");
    const isPositive = changeNum >= 0;

    return (
        <div className="mt-3 p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200 max-w-sm">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg text-green-900">{data.symbol}</h3>
                <span className={`text-sm font-medium px-2 py-1 rounded ${isPositive ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                    }`}>
                    {isPositive ? "▲" : "▼"} {data.changePercent}
                </span>
            </div>
            <div className="text-3xl font-bold text-green-900">
                ${data.price}
            </div>
            <div className={`text-sm mt-1 ${isPositive ? "text-green-600" : "text-red-600"}`}>
                {isPositive ? "+" : ""}{data.change} today
            </div>
        </div>
    );
}

// F1 Card Component
export function F1Card({ data }: { data: RaceData }) {
    if (!data || data.error || data.raceName === "Unknown Race" || data.raceName === "API Error") {
        return null; // Self-hide on failure
    }

    return (
        <div className="mt-3 p-4 bg-gradient-to-br from-red-50 to-orange-100 rounded-xl border border-red-200 max-w-sm">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🏎️</span>
                <div>
                    <h3 className="font-bold text-red-900">{data.raceName}</h3>
                    <p className="text-sm text-red-600">Round {data.round}</p>
                </div>
            </div>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-600">Circuit:</span>
                    <span className="font-medium text-gray-900">{data.circuit}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium text-gray-900">{data.location}, {data.country}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium text-gray-900">{data.date}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium text-gray-900">{data.time}</span>
                </div>
            </div>
        </div>
    );
}
