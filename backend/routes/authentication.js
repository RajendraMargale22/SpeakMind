import express from "express";
import User from "../models/User.js";
import {
  generateJwtToken,
  generateRefreshToken,
} from "../middlewares/jwtAuth.js";
import { hashedPassword, comparePassword } from "../utils/hash.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger.js";

dotenv.config();

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email });

    // if user does not exist or password do not match return error res
    if (!user) return res.status(404).json({ error: "User not found" });

    const isPasswordCorrect = await comparePassword(password, user.password);
    logger.debug(isPasswordCorrect);

    if (!isPasswordCorrect || !user)
      return res.status(401).json({ error: "Wrong Email or Password" });

    // generate the token
    const payload = { id: user.id, userName: user.userName };
    const token = generateJwtToken(payload);
    const tokenId = uuidv4();
    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenId: tokenId,
    });

    // logger.debug(token)

    user.refreshTokens.push(tokenId);
    await user.save();
    // we will store token in http only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // we will set true in production
      sameSite: "none",
      maxAge: 1000 * 60 * 15,
      path: "/",
    });

    // setting refresh token
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * 4,
      path: "/gpt/refresh",
    });

    res.status(200).json({ message: "You are logged in" });
  } catch (error) {
    logger.error("Error in login route", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/signup", async (req, res) => {
  const { userName, email, password } = req.body;

  const existingUser = await User.findOne({ email: email });

  logger.debug("existing user: ", existingUser);

  if (!userName || !email || !password) {
    return res.status(422).json({ error: "All fields are mandatory" });
  }

  if (existingUser) {
    return res.status(409).json({
      error: "User Already Exist Try to Login",
    });
  }

  try {
    // get the hashed password
    const hashPassword = await hashedPassword(password);
    const user = User({ userName, email, password: hashPassword });
    const newUser = await user.save();
    logger.debug("new user: ", user);

    // generating token using payload as userData
    const payload = {
      id: newUser.id,
      userName: newUser.userName,
    };

    const token = generateJwtToken(payload);
    logger.debug("Token is: ", token);

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 15,
      path: "/",
    });

    const tokenId = uuidv4();
    user.refreshTokens.push(tokenId);
    await user.save();
    const refreshPayload = { tokenId: tokenId, userId: user.id };
    const refreshToken = generateRefreshToken(refreshPayload);
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 4,
      secure: true,
      sameSite: "none",
      path: "/gpt/refresh",
    });

    return res.status(201).json({ message: "new user created successfully" });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// route to verify the jwt token
router.get("/verify", async (req, res) => {
  const token = req.cookies.token;

  // logger.debug(token);

  if (!token) return res.status(401).json({ error: "Not Authenticated" });

  try {
    // we are checking that the token is tamperd or not
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    res.json({ user: decoded });
  } catch (error) {
    logger.error(error);
    res.status(401).json({ message: "Invalid token" });
  }
});

// route to logout user from the frontend
router.post("/refresh/logout", async (req, res) => {
  try {
    const token = req.cookies.token;
    const refreshToken = req.cookies.refreshToken;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    logger.debug(decoded);

    const { id } = decoded;
    const { tokenId } = jwt.verify(refreshToken, process.env.JWT_SECRET);
    await User.findByIdAndUpdate(id, { $pull: { refreshTokens: tokenId } });
    
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/gpt/refresh",
    });

    res.status(200).json({ message: "Log Out" });
  } catch (error) {
    logger.error("Auto logout error", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    logger.debug("refreshToken /refresh: ", refreshToken);
    if (!refreshToken)
      return res.status(401).json({ message: "Session Expired" });

    // verifying refresh token expiry and signature
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const { tokenId, userId } = decoded;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    // check if the token belongs to the user or not
    if (!user.refreshTokens.includes(tokenId)) {
      return res.status(401).json({ error: "Session revoked" });
    }

    const payload = { id: userId, userName: user.userName };
    const token = generateJwtToken(payload);
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 15,
      secure: true,
      path: "/",
      sameSite: "none",
    });
    return res.status(200).json({ message: "Session Refreshed" });
  } catch (error) {
    logger.error(error);
    res.status(401).json({ error: "Session Expired" });
  }
});

export default router;