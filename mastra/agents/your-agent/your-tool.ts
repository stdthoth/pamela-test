import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import * as hl from "@nktkas/hyperliquid";

/*
// Simple async function that conforms to input and output schema
const getInfo = async (ctx: string) =>
  Promise.resolve({ bar: ctx.length, baz: "baz" });

// Define your tool using the `createtool`
export const yourTool = createTool({
  id: "tool-name",
  description: "Used to get the Simple Moving Average of a cryptocurrency",
  inputSchema: z.object({
    foo: z.string().describe("Foo name"),
  }),
  outputSchema: z.object({
    bar: z.number(),
    baz: z.string(),
  }),
  execute: async ({ context }) => {
    return await getInfo(context.foo);
  },
});
*/




const transport = new hl.HttpTransport({
    isTestnet: true
});
const infoClient = new hl.InfoClient({ transport });


export const CheckOrders = createTool({
    id: "check-orders",
    description: "used to check open orders on hyperliquid",
    inputSchema: z.object({
        user: z.string().describe("user address to check open orders for")
    }),
    outputSchema: z.array(
        z.object({
                coin: z.string().describe("The coin used in the transaction"),
                side: z.string().describe("price at which the order was placed"),
                limitPrice: z.string().describe("Limit price of the order"),
                size: z.string().describe("size of the order"),
                orderId: z.number().describe("order Id of the order"),
                timestamp: z.number().describe("timestamp of the order in milliseconds since epoch").nonnegative(),
                originalSize: z.string().describe("original size of the order")
        })),
    execute: async ({context}) => {
        return await getOrders(context.user);
    } 
})

// this will execute trades on hyperliquid !!!!!
export const TradeExecutor = createTool({
    id: "buy-tool",
    description: "used to execute trades on hyperliquid",
    inputSchema: z.object({
        currencyPair: z.string().describe("currency pair you want to trade, i.e ETH-USD"),
        price: z.number().describe("bidding price").nonnegative(),
        leverage: z.string().describe("leverage that you want to use for this trade, i.e 5x, 10x, 50x"),
        stopLoss: z.number().describe(`"this is the stop loss price for the trade, 
            it will typically get you out of a trade if you are 50% below your buying price"`),
        takeProfit: z.number().describe(""),
    }),
    outputSchema: z.object({
        result: z.object({
            status: z.string().describe("status of the trade execution"),
            price: z.number().describe("this id the price at which the trade was executed").nonnegative()
        })
    }),
    
});

const executeTrade = async (pair: string, price: number, leverage: string,stopLoss: number, takeProfit: number) => {
    
}

const getOrders = async (user: hl.Hex) => {
    const orders = await infoClient.openOrders({
        user: user,
    });

    return orders.map(order => ({
        coin: order.coin,
        side: order.side,
        limitPrice: order.limitPx,
        size: order.sz,
        orderId: order.oid,
        timestamp: order.timestamp,
        originalSize: order.origSz
    }));
   
}
/*export const RiskManager = async() => {
    
}*/



