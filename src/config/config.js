import dotenv from 'dotenv'
import { MongoSingleton } from '../utils/mongoSingleton.js'

// DB connection
export const connectDB = async () => {
  try {
    MongoSingleton.getInstance(process.env.MONGO_URL)
  } catch (error) {
    console.error(error)
  }
}

dotenv.config()

export default {
  PORT: process.env.PORT,
  mongoUrl: process.env.MONGO_URL,
  secretSession: process.env.SECRET_SESSION,
  tokenKey: process.env.TOKEN_KEY,
}

