import dotenv from "dotenv"
import * as fs from 'fs';

const data = JSON.parse(fs.readFileSync('./xoog.json','utf8'));

dotenv.config()


export const email = data.client_email || ""
export const privateKey = data.private_key || ""
export const apiKey = process.env.GOOGLE_VERTEX_API_KEY || ""

