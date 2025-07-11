import dotenv from "dotenv"

dotenv.config()


export const email = process.env.GOOGLE_EMAIL || ""
export const privateKey = process.env.GOOGLE_API_CREDENTIALS_KEY || ""

