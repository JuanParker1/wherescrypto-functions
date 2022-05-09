export interface SignalExchanges extends Array<string> {
  [index: number]:
    | "Binance"
    | "KuCoin"
    | "Huobi"
    | "UniSwap"
    | "MEXC"
    | "FTX"
    | "Hoo.com"
    | "Ascendex"
    | "Bittrex"
    | "Raydium"
    | "Gate.io"
    | "Coinbase"
    | "PancakeSwap"
    | "Kraken";
}

export interface SignalMargin {
  hasMargin?: boolean;
  margin?: number;
}

export interface SignalStopLoss {
  price?: string;
  currency?: "USD" | "BTC" | "USDT";
  isValid?: boolean;
  tbd?: boolean;
}

export interface SignalTarget {
  id?: number;
  price?: string;
  currency?: "USD" | "BTC" | "USDT";
  quantity?: number;
  tbd?: boolean;
}

export interface SignalEntry {
  orderType?: "buy-limit" | "buy-market" | "sell-limit" | "sell-market";
  price?: string;
  currency?: "USD" | "BTC" | "USDT";
}

export interface SignalSetup {
  pair?: string;
  entry?: SignalEntry;
  safeEntry?: SignalEntry;
  aggressiveEntry?: SignalEntry;
  currency?: "USD" | "BTC" | "USDT";
  targets?: SignalTarget[];
  shadTargets?: SignalTarget[];
  position?: number;
  stopLoss?: SignalStopLoss;
  risk?: number;
  margin?: SignalMargin;
  exchanges?: SignalExchanges;
}

export interface Signal {
  id?: number;
  signalType?:
    | "update"
    | "investment"
    | "ma-investment"
    | "shad-strategy"
    | "mt-trading"
    | "general-analysis"
    | "signal";
  author: "futures-signals" | "crypto-alerts" | "undefined";
  notes?: string;
  setup?: SignalSetup;
  isValid: boolean;
}
