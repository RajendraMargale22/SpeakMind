import Thread from "../models/Thread.js";
  

export default async function getContextArray(thread) {
  const msg = [];
  const N = 10;
//   const thread = await Thread.findById(threadId);
  const messages = thread.messages;

  //   pushing the system prompt in the array
  msg.push({
    role: "system",
    content:
      "You are a helpful assistant helping a developer build a chat app.",
  });

  //   pushing the summary of last n messages
  if (thread.summary) {
    msg.push({
      role: "system",
      content: `Conversation summary: ${thread.summary}`,
    });
  }

  //   push the N messages to the array (context)
  messages.slice(thread.summarizedUntil).forEach((message) => {
    msg.push({
      role: message.role, // user or assistant
      content: message.content,
    });
  });

  return msg;
}