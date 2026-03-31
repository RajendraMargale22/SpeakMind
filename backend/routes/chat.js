import express from "express";
import Thread from "../models/Thread.js";
import getOpenAiApiResponse from "../utils/openai.js";
import { jwtAuthMiddleware } from "../middlewares/jwtAuth.js";
import User from "../models/User.js";
import summarizer from "../utils/summarizer.js";
import getContextArray from "../utils/buildContext.js";
import { logger } from "../utils/logger.js";

const router = express.Router();

// test
router.post("/test", async (req, res) => {
  try {
    const thread = new Thread({
      threadId: "you are cat",
      title: "as you wish you will be",
    });

    const response = await thread.save();
    res.send(response);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: "Failed to save in db!" });
  }
});

// get all threads
router.get("/thread", jwtAuthMiddleware, async (req, res) => {
  const { id } = req.userPayload;

  try {
    // we need threads in decending order of updatedAt i.e most recent chat will show on the top
    const user = await User.findById(id);
    const threadIds = user.chats.map((chat) => chat.threadId);
    // const threads = await Thread.find({}).sort({ updatedAt: -1 });

    // we are sorting only the users threads stored in chats array
    const threads = await Thread.find({
      threadId: { $in: threadIds },
    }).sort({ updatedAt: -1 });

    res.json(threads);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: "Failed to fetch threads" });
  }
});

// get a specific thread
router.get("/thread/:threadId", jwtAuthMiddleware, async (req, res) => {
  const threadId = req.params.threadId;
  const { id } = req.userPayload;

  try {
    // checking if the thread actually belongs to the user or not
    // it returns the _id of the user if satisfied or null
    const ownsThread = await User.exists({
      _id: id,
      "chats.threadId": threadId,
    });

    // if thread not belongs to the user
    if (!ownsThread) return res.status(403).json({ error: "Forbidden" });

    const thread = await Thread.findOne({ threadId: threadId });

    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    // sending all the  messages of the specific chat
    res.json(thread.messages);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: "Failed to fetch thread" });
  }
});

// delete a specific thread
router.delete("/thread/:threadId", jwtAuthMiddleware, async (req, res) => {
  const { threadId } = req.params;
  const { id } = req.userPayload;

  try {
    // chack if user owns the thread he wants to delete
    const ownsThread = await User.exists({
      _id: id,
      "chats.threadId": threadId,
    });

    if (!ownsThread) return res.status(403).json({ error: "Forbidden" });

    const deletedThread = await Thread.findOneAndDelete({ threadId });

    // we need to also delete the thread from the user's chat
    await User.findByIdAndUpdate(id, { $pull: { chats: { threadId } } });

    if (!deletedThread) {
      return res.status(404).json({ error: "thread dosn't exist" });
    }

    res.status(200).json({ message: "Thread Deleted Successfully" });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: "Failed to delete the thread" });
  }
});

// route to create new chat or continue the previous one
router.post("/chat", jwtAuthMiddleware, async (req, res) => {
  const { threadId, message } = req.body;

  const { id } = req.userPayload;

  if (!threadId || !message) {
    res.status(400).json({ error: "Missing Required Fields" });
  }

  try {
    let thread = await Thread.findOne({ threadId });

    const user = await User.findById(id);

    // thread is not in the db means it is a new chat
    // and if this is new chat thread id should be stored in the user's chats
    if (!thread) {
      // hence we create a new thread in the db
      thread = new Thread({
        threadId: threadId,
        messages: [{ role: "user", content: message }],
      });
      const title = await summarizer(thread, message);
      console.log(title);
      thread.title = title;
      user.chats.push({ threadId });
      await user.save();
    } else {
      // if the chat exist we push the message in the thread
      thread.messages.push({ role: "user", content: message });
    }

    const N = 10;
    // check the unsummarized count
    const unSummarizedCount = thread.messages.length - thread.summarizedUntil;
    // first time we will summarize 0-9 messages 
    // then for next time we will summarize 10-19 msgs 
    // we will move window across the chats 
    // but the first summ. happens late we allow backlog to grow 2N
    if (unSummarizedCount > N * 2) {
      const summary = await summarizer(thread);
      thread.summary = thread.summary ? thread.summary + " " + summary : summary;
      thread.summarizedUntil = thread.summarizedUntil + N;
    }

    const context = await getContextArray(thread);

    const assistantReply = await getOpenAiApiResponse(message, context);
    thread.messages.push({ role: "assistant", content: assistantReply });

    thread.updatedAt = new Date();

    await thread.save();
    res.json({ reply: assistantReply });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: "something went wrong" });
  }
});

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
})

export default router;