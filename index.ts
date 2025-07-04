// i want to get hyperliquid data and use it to trade coin
/**
 * So i want tot first get the simple moving average of the last 20 days
 * and then compare it to the current price of the coin
 * if the current price is above the simple moving average then i want to buy the coin
 * if the current price is below the simple moving average then i want to sell the coin.
 * Other features will include :
 * portifolio management
 * risk management
 * stop loss
 * take profit
 * trailing stop loss
 * 
 */

import * as hl from "@nktkas/hyperliquid";

const transport = new hl.HttpTransport({
    isTestnet: true
});
const infoClient = new hl.InfoClient({ transport });

const openOrders = await infoClient.openOrders({ user: "0x..." });