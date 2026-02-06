"use client";

import { Cloud, Sun, CloudRain, Snowflake, Wind, Droplets, TrendingUp, TrendingDown, Flag, MapPin, Calendar, Clock } from "lucide-react";
import { WeatherData, StockData, RaceData } from "@/types";

// Weather Icon Helper
function getWeatherIcon(condition?: string) {
    const c = condition?.toLowerCase() || "";
    if (c.includes("rain") || c.includes("drizzle")) return <CloudRain className="h-10 w-10 text-blue-400" />;
    if (c.includes("snow")) return <Snowflake className="h-10 w-10 text-blue-300" />;
    if (c.includes("cloud")) return <Cloud className="h-10 w-10 text-slate-400" />;
    if (c.includes("clear") || c.includes("sun")) return <Sun className="h-10 w-10 text-amber-400" />;
    return <Cloud className="h-10 w-10 text-slate-400" />;
}

// Weather Card Component
export function WeatherCard({ data }: { data: WeatherData }) {
    if (!data || data.error || data.condition === "Unknown Location") {
        return null;
    }

    return (
        <div className="mt-4 p-5 bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30 max-w-sm text-white overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="font-bold text-xl">{data.location}</h3>
                        <p className="text-sm text-white/80 capitalize">{data.condition}</p>
                    </div>
                    {getWeatherIcon(data.condition)}
                </div>

                <div className="text-6xl font-bold mb-4 tracking-tight">
                    {data.temperature}°
                </div>

                <div className="flex gap-6 text-sm">
                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                        <Droplets className="h-4 w-4" />
                        <span>{data.humidity}%</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                        <Wind className="h-4 w-4" />
                        <span>{data.wind} km/h</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Stock Card Component
export function StockCard({ data }: { data: StockData }) {
    if (!data || data.error || !data.price || data.price === "0" || data.price === "0.00") {
        return null;
    }

    const changeNum = parseFloat(data.change || "0");
    const isPositive = changeNum >= 0;

    return (
        <div className={`mt-4 p-5 rounded-2xl shadow-lg max-w-sm overflow-hidden relative ${isPositive
                ? "bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 shadow-green-500/30"
                : "bg-gradient-to-br from-rose-400 via-red-500 to-pink-600 shadow-red-500/30"
            } text-white`}>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />

            <div className="relative">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium bg-white/20 px-2 py-0.5 rounded">STOCK</span>
                        </div>
                        <h3 className="font-bold text-2xl tracking-wide">{data.symbol}</h3>
                    </div>
                    <div className={`p-2 rounded-xl ${isPositive ? "bg-white/20" : "bg-white/20"}`}>
                        {isPositive ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                    </div>
                </div>

                <div className="text-4xl font-bold mb-2 tracking-tight">
                    ${data.price}
                </div>

                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-sm font-medium bg-white/20 px-3 py-1.5 rounded-full">
                        {isPositive ? "+" : ""}{data.change}
                    </span>
                    <span className="text-sm text-white/80">
                        ({data.changePercent})
                    </span>
                </div>
            </div>
        </div>
    );
}

// F1 Card Component
export function F1Card({ data }: { data: RaceData }) {
    if (!data || data.error || data.raceName === "Unknown Race" || data.raceName === "API Error") {
        return null;
    }

    return (
        <div className="mt-4 p-5 bg-gradient-to-br from-red-500 via-rose-500 to-orange-500 rounded-2xl shadow-lg shadow-red-500/30 max-w-sm text-white overflow-hidden relative">
            {/* Racing flag decoration */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />

            <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/20 rounded-xl">
                        <Flag className="h-6 w-6" />
                    </div>
                    <div>
                        <span className="text-xs font-medium bg-white/20 px-2 py-0.5 rounded">ROUND {data.round}</span>
                        <h3 className="font-bold text-lg mt-1">{data.raceName}</h3>
                    </div>
                </div>

                <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-white/70" />
                        <div>
                            <p className="text-white/70 text-xs">Circuit</p>
                            <p className="font-medium">{data.circuit}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="h-4 w-4 flex items-center justify-center text-white/70">🌍</div>
                        <div>
                            <p className="text-white/70 text-xs">Location</p>
                            <p className="font-medium">{data.location}, {data.country}</p>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-2">
                        <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-xl flex-1">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium">{data.date}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-xl flex-1">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">{data.time}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
