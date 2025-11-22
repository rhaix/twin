import yahooFinance from 'yahoo-finance2';
import { EMA, RSI } from 'technicalindicators';

interface StockData {
    ticker: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    ema20?: number;
    ema50?: number;
    rsi?: number;
}

interface CryptoData {
    symbol: string;
    price: number;
    change24h: number;
    volume24h?: number;
}

/**
 * Fetch real-time stock data with technical indicators
 */
export async function getStockData(ticker: string): Promise<StockData> {
    try {
        console.log(`[Market Data] Fetching stock data for ${ticker}`);

        // Get current quote
        const quote = await yahooFinance.quote(ticker);

        // Get historical data for technical indicators (last 60 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 60);

        const history = await yahooFinance.historical(ticker, {
            period1: startDate,
            period2: endDate,
            interval: '1d'
        });

        // Extract closing prices for indicators
        const closePrices = history.map(h => h.close);

        // Calculate technical indicators
        let ema20, ema50, rsi;

        if (closePrices.length >= 50) {
            const ema20Values = EMA.calculate({ period: 20, values: closePrices });
            ema20 = ema20Values[ema20Values.length - 1];

            const ema50Values = EMA.calculate({ period: 50, values: closePrices });
            ema50 = ema50Values[ema50Values.length - 1];
        }

        if (closePrices.length >= 14) {
            const rsiValues = RSI.calculate({ period: 14, values: closePrices });
            rsi = rsiValues[rsiValues.length - 1];
        }

        const result: StockData = {
            ticker: ticker.toUpperCase(),
            price: quote.regularMarketPrice || 0,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            volume: quote.regularMarketVolume || 0,
            ema20,
            ema50,
            rsi
        };

        console.log(`[Market Data] ${ticker}: $${result.price} (${result.changePercent.toFixed(2)}%)`);
        return result;

    } catch (error) {
        console.error(`[Market Data Error] Failed to fetch ${ticker}:`, error);
        throw new Error(`Failed to fetch stock data for ${ticker}`);
    }
}

/**
 * Fetch real-time cryptocurrency data
 */
export async function getCryptoData(symbol: string): Promise<CryptoData> {
    try {
        console.log(`[Market Data] Fetching crypto data for ${symbol}`);

        // Map common crypto symbols to Yahoo Finance format
        const symbolMap: Record<string, string> = {
            'BTC': 'BTC-USD',
            'ETH': 'ETH-USD',
            'SOL': 'SOL-USD'
        };

        const yahooSymbol = symbolMap[symbol.toUpperCase()] || `${symbol.toUpperCase()}-USD`;

        // Get current quote
        const quote = await yahooFinance.quote(yahooSymbol);

        const result: CryptoData = {
            symbol: symbol.toUpperCase(),
            price: quote.regularMarketPrice || 0,
            change24h: quote.regularMarketChangePercent || 0,
            volume24h: quote.regularMarketVolume
        };

        console.log(`[Market Data] ${symbol}: $${result.price} (${result.change24h.toFixed(2)}%)`);
        return result;

    } catch (error) {
        console.error(`[Market Data Error] Failed to fetch ${symbol}:`, error);
        throw new Error(`Failed to fetch crypto data for ${symbol}`);
    }
}

/**
 * Execute a function call from Gemini
 */
export async function executeFunction(functionName: string, args: any): Promise<string> {
    try {
        if (functionName === "get_stock_data") {
            const data = await getStockData(args.ticker);
            return JSON.stringify(data, null, 2);
        } else if (functionName === "get_crypto_data") {
            const data = await getCryptoData(args.symbol);
            return JSON.stringify(data, null, 2);
        } else {
            throw new Error(`Unknown function: ${functionName}`);
        }
    } catch (error) {
        console.error(`[Function Execution Error]`, error);
        return JSON.stringify({ error: (error as Error).message });
    }
}
