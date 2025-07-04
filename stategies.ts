interface PriceData {
    timestamp: string;
    open: number;
    high: number;
    close: number;
    volume: number;
}

interface Signal {
    timestamp: string;
    type: 'BUY' | 'SELL' | 'HOLD';
    price: number;
    shortSMA: number;
    longSMA: number;
    strength: number;
}

interface TradeResult {
    entryTime: Date;
    exitTime: Date;
    entryPrice: number;
    type: 'LONG' | 'SHORT';
    pnl:  number;
    pnlPercent: number;
    duration: number; //in milliseconds
}

interface StrategyConfig {
    shortPeriod: number;
    longPeriod: number;
    minSignalStrength: number;
    stopLoss?:number;
    takeProfit?: number;
}

class SimpleMovingAverage {
    private values: number[] = []
    private period: number = 0
    private sum: number = 0;

    constructor(period:number) {
        this.period = period;
    }
    update(value:number): number | null {
        this.values.push(value);
        this.sum += value

        if (this.values.length > this.period) {
            this.sum -= this.values.shift()!;
        }
        return this.values.length >= this.period ? this.sum/ this.period:null
    }

    getCurrentValue(): number | null {
        return this.values.length >= this.period ? this.sum/ this.period:null
    }

    reset(): void {
        this.values = [];
        this.sum = 0;
    }
    // calcuate SMA for historical data 
    static calculate(data:number[], period: number):(number | null)[] {
        const sma = new SimpleMovingAverage(period);
        return data.map(value => sma.update(value));
    }

}

class SMAStrategy {
    private config: StrategyConfig;
    private shortSMA: SimpleMovingAverage;
    private longSMA: SimpleMovingAverage;
    private signals: Signal[] =[];
    private lastSignal: Signal | null = null;
    private priceHistory: PriceData[] = [];

    constructor(config: StrategyConfig) {
        this.config = config;
        this.shortSMA = new SimpleMovingAverage(config.shortPeriod);
        this.longSMA = new SimpleMovingAverage(config.longPeriod);
    }

    update(priceData: PriceData): Signal {
        this.priceHistory.push(priceData);

        const shortValue = this.shortSMA.update(priceData.close)
        const longValue = this.longSMA.update(priceData.close)

        let signal: Signal = {
            timestamp: priceData.timestamp,
            type: 'HOLD',
            price: priceData.close,
            shortSMA: shortValue || 0,
            longSMA: longValue || 0,
            strength: 0,
        };


        // generate signal only if both SMAs are available 
        if (shortValue !== null && longValue !== null) {
            const prevShort = this.getPreviousSMA('SHORT');
            const prevLong = this.getPreviousSMA('LONG');

            if(prevShort !== null && prevLong !== null) {
                signal = this.generateSignal(priceData,shortValue,longValue,prevShort,prevLong);
            }
        }

        this.signals.push(signal);
        this.lastSignal = signal;
        return signal
    }

    private generateSignal(
        priceData: PriceData,
        shortSMA:number,
        longSMA: number,
        prevShortSMA: number,
        prevLongSMA: number,
    ): Signal {
        const currentCross = shortSMA > longSMA;
        const previousCross = prevShortSMA > prevLongSMA;

        let type: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
        let strength = 0

        if (currentCross && !previousCross) {
            type = 'BUY'
            strength = this.calculateSignalStrength(shortSMA,longSMA,'BUY');    
        } else if (!currentCross && previousCross) {
            type = 'SELL'
            strength = this.calculateSignalStrength(shortSMA,longSMA,'SELL'); 
        }

        return {
            timestamp: priceData.timestamp,
            type,
            price: priceData.close,
            shortSMA,
            longSMA,
            strength
        };
    }

    private calculateSignalStrength(
        shortSMA: number,
        longSMA: number,
        signalType: 'BUY' | 'SELL'
    ):number {
        const spread = Math.abs( shortSMA- longSMA);
        const avgPrice = (shortSMA + longSMA)/ 2;
        const spreadPercent = (spread/avgPrice) * 100;

        //normalize strength between 0 and 1
        // Higher spread = stronger signal

        const maxSpread = 5; //5% spread = max strength
        return Math.min(spreadPercent / maxSpread,1)
    }

    private getPreviousSMA(type: 'SHORT' | 'LONG'): number | null {
        if (this.signals.length < 2){
            return null;
        }

        const prevSignal = this.signals[this.signals.length - 2];
        return type === 'SHORT' ? prevSignal.shortSMA: prevSignal.longSMA;
    }

    // backtest

    //pnl drawdown and other statistics

    getCurrentSignal(): Signal | null {
        return this.lastSignal;
    }

    getAllSignals(): Signal[] {
        return this.signals;
    }

    reset(): void {
        this.shortSMA.reset();
        this.longSMA.reset();
        this.signals = [];
        this.lastSignal = null;
        this.priceHistory = [];
    }


    getConfig(): StrategyConfig {
        return {... this.config };
    }

    updateConfig(newConfig: Partial<StrategyConfig>): void {
        this.config = {...this.config, ...newConfig};
        this.shortSMA = new SimpleMovingAverage(this.config.shortPeriod);
        this.longSMA = new SimpleMovingAverage(this.config.longPeriod);
    }




}