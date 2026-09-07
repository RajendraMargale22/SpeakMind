import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/authentication.js"
import cookieParser from "cookie-parser";

const app = express();
const PORT = process.env.PORT || 8080; // 
const FRONTEND_URL = process.env.FRONTEND_URL;
// const FRONTEND_URL =
//   process.env.NODE_ENV === "production"
//     ? process.env.FRONTEND_URL
//     : "http://localhost:5173";


 
// these are usefull when interacting with the frontend
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));


app.use("/api", chatRoutes);
app.use("/gpt", authRoutes);

// Uptime Robot
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
  connectDB();
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("connected with Database!.")
  } catch (error) {
    console.log("Failed to connect with DB",error);
  }

  
}


// app.post("/test", async (req, res) => {
//   const options = {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer  ${process.env.OPENAI_API_KEY}`,
//     },
//     body: JSON.stringify({
//       model: "gpt-4o-mini",
//       messages: [
//         {
//           role: "user",
//           content: req.body.message,
//         },
//       ],
//     }),
//   };

//   try {
//     const response = await fetch("https://api.openai.com/v1/chat/completions", options);
//     const data = await response.json();
//     console.log(data.choices[0].message.content);
//     res.send(data.choices[0].message.content);
//   } catch (error) {
//     console.log(error);
//   }
// });

// import OpenAI from 'openai';
// import { config } from 'dotenv';
// // config();
// console.log(process.env.OPENAI_API_KEY);
// const client = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY, // This is the default and can be omitted
// });
// const response = await client.responses.create({
//   model: 'gpt-4o-mini',
//   // instructions: 'You are a coding assistant that talks like a pirate',
//   input: 'what was your purpose in humanity answer in one sentence',
// });
// console.log(response.output_text);