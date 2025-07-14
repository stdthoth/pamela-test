type MACDResult = {
    macd: number;
    signal: number;
    histogram: number;
};

/**
 * Calculates Exponential Moving Average
 */
export const calculateEMA = (
    prices: number[], 
    period: number
): number[] => {
    const multiplier = 2 / (period + 1);
    const sma = prices
        .slice(0, period)
        .reduce((sum, price) => sum + price, 0) / period;
    
    return prices.reduce((ema: number[], price: number, index: number) => {
        if (index < period) {
            return [...ema, sma];
        }
        const prevEMA = ema[ema.length - 1];
        const currentEMA = (price - prevEMA) * multiplier + prevEMA;
        return [...ema, currentEMA];
    }, []);
};

/**
 * Calculates MACD for a given price series
 */
export const calculateMACD = (
    prices: number[],
    shortPeriod: number = 12,
    longPeriod: number = 26,
    signalPeriod: number = 9
): MACDResult[] => {
    if (prices.length < longPeriod) {
        return [];
    }

    // Calculate EMAs
    const shortEMA = calculateEMA(prices, shortPeriod);
    const longEMA = calculateEMA(prices, longPeriod);

    // Calculate MACD line
    const macdLine = shortEMA.map((short, i) => short - longEMA[i]);

    // Calculate Signal line
    const signalLine = calculateEMA(macdLine, signalPeriod);

    // Calculate Histogram
    return macdLine.map((macd, i) => ({
        macd,
        signal: signalLine[i],
        histogram: macd - signalLine[i]
    }));
};

/**
 * Gets the latest MACD values
 */
export const getLatestMACD = (
    prices: number[],
    shortPeriod: number = 12,
    longPeriod: number = 26,
    signalPeriod: number = 9
): MACDResult | null => {
    const results = calculateMACD(prices, shortPeriod, longPeriod, signalPeriod);
    return results.length > 0 ? results[results.length - 1] : null;
};