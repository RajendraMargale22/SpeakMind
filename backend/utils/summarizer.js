import "dotenv/config";

export default async function summarizer(thread, message) {
  const N = 10;

  if (thread.summarizedUntil >= thread.messages.length) return;

  const start = thread.summarizedUntil;
  const end = start + N;
  const firstNMessages = thread.messages.slice(start, start + N);

  let instructions = [
    {
      role: "system",
      content: "You are summarizing a conversation for long-term memory.",
    },
    {
      role: "user",
      content:
        "Summarize the following conversation, preserving key facts, decisions, and goals.",
    },
    ...firstNMessages,
  ];

  if (message) {
    instructions = [
      {
        role: "system",
        content:
          "You are a title generator for chat conversations. Generate a concise title based only on the user's first message. The title must be no more than 6 words. Do not include quotes, punctuation at the end, explanations, or any extra text. Return only the title.",
      },
      {
        role: "user",
        content: `Generate a short and meaningful title for the following message:\n\n "${message}"`,
      },
    ];
  }

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer  ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: instructions,
    }),
  };

  try {
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      options,
    );

    const data = await response.json();

    // console.log(data.choices[0].message.content);
    return data.choices[0].message.content; // reply we are returning
  } catch (error) {
    console.log(error);
  }
}