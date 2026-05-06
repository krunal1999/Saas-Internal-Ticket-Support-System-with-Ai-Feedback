import dotenv from "dotenv";
dotenv.config();
import connectDatabase from "../src/db/index.js";
import app from "../src/app.js";

// this file is for Vercel deployment
let isConnected = false;

async function connect() {
  if (isConnected) return;

  await connectDatabase();
  isConnected = true;

  console.log("MongoDB connected");
}

export default async function handler(req, res) {
  await connect();

  return app(req, res);
}
