import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import * as hl from "@nktkas/hyperliquid";
import { privateKeyToAccount } from "viem/accounts";
import { privateKey } from "../config";
import { size } from "viem";

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

interface OrderResponse {
    status: "ok";
    response: {
        type: "order";
        data: {
            statuses: Array<{
                resting?: {
                    oid: number;
                    cloid?: string;
                };
                filled?: {
                    totalSz: string;
                    avgPx: string;
                    oid: number;
                    cloid?: string;
                };
                error?: string;
            }>;
        };
    };
}

const getCoinByAssetID = (coin: string): number => {
    const fooling: Record<number, string> = {
        0:"BTC",
        1:"ETH",
        5:"SOL",
    }
    return Object.keys(fooling).find(key => fooling[key] === coin) as unknown as number;
}





const transport = new hl.WebSocketTransport({
    url:"wss://api.hyperliquid-testnet.xyz/ws",
});
const infoClient = new hl.InfoClient({ transport });
const wallet = privateKeyToAccount(privateKey)
const exchangeClient = new hl.ExchangeClient({wallet:wallet, transport})


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
        asset: z.string().describe("assetID you want to trade, i.e BTC,ETH, e.t.c "),
        price: z.string().describe("bidding price"),
        size: z.string().describe("size of the order, i.e 0.1 stands for 10% of current margin")
    }),
    outputSchema: z.object({
        status: z.string().describe("status of the order, i.e ok, err"),
        data: z.object({
            resting: z.object({
                oid: z.number().describe("order ID"),
                cloid: z.string().optional().describe("client order ID")
            }).optional(),
            filled: z.object({
                totalSz: z.string().describe("total size filled"),
                avgPx: z.string().describe("average price of fill"),
                oid: z.number().describe("order ID"),
                cloid: z.string().optional().describe("client order ID")
            }).optional(),
            error: z.string().optional()
        }),
        type: z.string().describe("type of the response, i.e order")
    }),
    
    execute: async ({context}) => {
        return await executeTrade(context.asset, context.price,context.size)
    }
});

// vault works

// Perps to spot transfer

// maybe launch shit 





















const executeTrade = async (asset: string, price: string, size: string) => {
    const createOrder = await exchangeClient.order({
        orders:[{
            a: getCoinByAssetID(asset),
            b: true,
            p: price,
            s: size,
            r: false,
            t: {
                limit:{
                    tif:"Gtc"
                }
            }

        }],
        grouping: "na",
    })

    return {
        status: createOrder.status,
        data: createOrder.response.data.statuses[0],
        type: createOrder.response.type,
    }
}
const cancelOrder = async () => {

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



