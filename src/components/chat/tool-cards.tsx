"use client";

import { Cloud, Sun, CloudRain, Snowflake, Wind, Droplets, TrendingUp, TrendingDown, Flag, MapPin, Calendar, Clock } from "lucide-react";
import { WeatherData, StockData, RaceData } from "@/types";

function getWeatherIcon(condition?: string) {
    const c = condition?.toLowerCase() || "";
    if (c.includes("rain") || c.includes("drizzle")) return <CloudRain className="h-6 w-6 text-blue-400" />;
    if (c.includes("snow")) return <Snowflake className="h-6 w-6 text-blue-300" />;
    if (c.includes("cloud")) return <Cloud className="h-6 w-6 text-slate-400" />;
    if (c.includes("clear") || c.includes("sun")) return <Sun className="h-6 w-6 text-amber-400" />;
    return <Cloud className="h-6 w-6 text-slate-400" />;
}

export function WeatherCard({ data }: { data: WeatherData }) {
    if (!data || data.error || data.condition === "Unknown Location") {
        return null;
    }

    return (
        <div className="mt-3 p-3 bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 rounded-xl text-white overflow-hidden">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="font-semibold text-sm">{data.location}</h3>
                    <p className="text-xs text-white/80 capitalize">{data.condition}</p>
                </div>
                {getWeatherIcon(data.condition)}
            </div>

            <div className="text-3xl font-bold mb-2 tracking-tight">
                {data.temperature}°
            </div>

            <div className="flex gap-3 text-xs">
                <div className="flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded-full">
                    <Droplets className="h-3 w-3" />
                    <span>{data.humidity}%</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded-full">
                    <Wind className="h-3 w-3" />
                    <span>{data.wind} km/h</span>
                </div>
            </div>
        </div>
    );
}

export function StockCard({ data }: { data: StockData }) {
    if (!data || data.error || !data.price || data.price === "0" || data.price === "0.00") {
        return null;
    }

    const changeNum = parseFloat(data.change || "0");
    const isPositive = changeNum >= 0;

    return (
        <div className={`mt-3 p-3 rounded-xl overflow-hidden ${isPositive
            ? "bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600"
            : "bg-gradient-to-br from-rose-400 via-red-500 to-pink-600"
            } text-white`}>
            <div className="flex items-center justify-between mb-2">
                <div>
                    <span className="text-[10px] font-medium bg-white/20 px-1.5 py-0.5 rounded">STOCK</span>
                    <h3 className="font-bold text-lg tracking-wide">{data.symbol}</h3>
                </div>
                <div className="p-1.5 rounded-lg bg-white/20">
                    {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                </div>
            </div>

            <div className="text-2xl font-bold mb-1 tracking-tight">
                ${data.price}
            </div>

            <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 font-medium bg-white/20 px-2 py-1 rounded-full">
                    {isPositive ? "+" : ""}{data.change}
                </span>
                <span className="text-white/80">({data.changePercent})</span>
            </div>
        </div>
    );
}

export function F1Card({ data }: { data: RaceData }) {
    if (!data || data.error || data.raceName === "Unknown Race" || data.raceName === "API Error") {
        return null;
    }

    return (
        <div className="mt-3 p-3 bg-gradient-to-br from-red-500 via-rose-500 to-orange-500 rounded-xl text-white overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-white/20 rounded-lg">
                    <Flag className="h-4 w-4" />
                </div>
                <div>
                    <span className="text-[10px] font-medium bg-white/20 px-1.5 py-0.5 rounded">ROUND {data.round}</span>
                    <h3 className="font-semibold text-sm mt-0.5">{data.raceName}</h3>
                </div>
            </div>

            <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-white/70" />
                    <span className="font-medium">{data.circuit}</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-white/70">📍</span>
                    <span>{data.location}, {data.country}</span>
                </div>

                <div className="flex gap-2 pt-1">
                    <div className="flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded-lg flex-1">
                        <Calendar className="h-3 w-3" />
                        <span className="font-medium">{data.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded-lg flex-1">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">{data.time}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
