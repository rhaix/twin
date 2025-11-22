export const stockMarketTools = [
    {
        name: "get_stock_data",
        description: "Get real-time stock price, volume, and technical indicators (EMA, RSI) for a given ticker symbol. Use this for stocks like TSLA, NVDA, AMD, PLTR, MSTR, etc.",
        parameters: {
            type: "object",
            properties: {
                ticker: {
                    type: "string",
                    description: "Stock ticker symbol (e.g., TSLA, NVDA, AAPL, AMD, PLTR, MSTR)"
                }
            },
            required: ["ticker"]
        }
    },
    {
        name: "get_crypto_data",
        description: "Get real-time cryptocurrency price and 24-hour change. Use this for crypto symbols like BTC, ETH, SOL on weekends or when analyzing crypto markets.",
        parameters: {
            type: "object",
            properties: {
                symbol: {
                    type: "string",
                    description: "Cryptocurrency symbol (e.g., BTC, ETH, SOL)"
                }
            },
            required: ["symbol"]
        }
    }
];
