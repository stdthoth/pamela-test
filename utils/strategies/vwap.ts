import * as hl from "@nktkas/hyperliquid"


type OHLCV = {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

type VWAPResult = {
    timestamp: number;
    vwap: number;
    cumulativeVolume: number;
    typicalPrice: number;
};

const transport = new hl.WebSocketTransport({
    url:"wss://api.hyperliquid-testnet.xyz/ws",
});
const infoClient = new hl.InfoClient({ transport });

const getCandles = async(coin: string): Promise<OHLCV[]> => {
    try {
        const getc = await infoClient.candleSnapshot({
        coin: coin,
        interval: "1d",
        startTime: Date.now() - 1000 * 60 * 60 * 24
    })

    return getc.map(candle =>({
        timestamp: candle.t,
        open:Number(candle.o),
        high: Number(candle.h),
        low: Number(candle.l),
        close: Number(candle.c),
        volume: Number(candle.v)
    }))
    } catch (error) {
        console.error('Error fetching candles:', error);
        return [];
    }
    
}



/**
 * Calculates typical price for a single candle
 * Typical Price = (High + Low + Close) / 3
 */
const calculateTypicalPrice = (candle: OHLCV): number => {
    return (candle.high + candle.low + candle.close) / 3;
};

/**
 * Calculates VWAP for a single point
 */
export const calculateVWAP = async (coin: string): Promise<VWAPResult> => {
    let data = await getCandles(coin);
    if (data.length === 0) {
        throw new Error('No data provided for VWAP calculation');
    }

    let cumulativeTPV = 0; // Typical Price * Volume
    let cumulativeVolume = 0;

    for (const candle of data) {
        const typicalPrice = calculateTypicalPrice(candle);
        cumulativeTPV += typicalPrice * candle.volume;
        cumulativeVolume += candle.volume;
    }

    const currentCandle = data[data.length - 1];
    
    return {
        timestamp: currentCandle.timestamp,
        vwap: cumulativeTPV / cumulativeVolume,
        cumulativeVolume: cumulativeVolume,
        typicalPrice: calculateTypicalPrice(currentCandle)
    };
};

const calculateVWAPForData = (data: OHLCV[]): VWAPResult => {
    if (data.length === 0) {
        throw new Error('No data provided for VWAP calculation');
    }

    let cumulativeTPV = 0;
    let cumulativeVolume = 0;

    for (const candle of data) {
        const typicalPrice = calculateTypicalPrice(candle);
        cumulativeTPV += typicalPrice * candle.volume;
        cumulativeVolume += candle.volume;
    }

    const currentCandle = data[data.length - 1];
    
    return {
        timestamp: currentCandle.timestamp,
        vwap: cumulativeTPV / cumulativeVolume,
        cumulativeVolume: cumulativeVolume,
        typicalPrice: calculateTypicalPrice(currentCandle)
    };
};

/**
 * Calculates historical VWAP values
 */
export const calculateVWAPHistory = async(coin:string,interval: string): Promise<VWAPResult[]> => {
    let data = await getCandles(coin)
    if (data.length === 0) return [];

    return data.map((_, index) => {
        const slice = data.slice(0, index + 1);
        return calculateVWAPForData(slice);
    });
};

/**
 * Gets the latest VWAP value
 */
export const getLatestVWAP = async(coin:string): Promise<VWAPResult> => {
    return calculateVWAP(coin);
};

/**
 * Calculates VWAP for a specific timeframe (e.g., daily)
 */
