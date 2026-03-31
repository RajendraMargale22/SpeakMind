import { useContext, useEffect, useRef, useState } from "react";
import "./Chat.css";
import { MyContext } from "./store/MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import {ClipLoader} from "react-spinners"
import { ThemeContext } from "./store/ThemeContext";

// react-markdown
// rehype-highlight

function Chat() {
  const [latestReply, setLatestReply] = useState("");
  const {theme} = useContext(ThemeContext);
  const { newChat, prevChats, reply, isPrevChatsLoading } = useContext(MyContext);
  const chatsRef = useRef(null);

  useEffect(() => {

    // when we switch the thread or create a new chat,  we set reply to null
    // if we don't do this we will do null.split(" ") and hit a error
    if (reply === null) {
      setLatestReply(null);
      return;
    }

    // if there are no prevChats we can't add the typing effect so just return
    if (!prevChats?.length) return;

    const content = reply.split(" "); //individual words are stored
    // const content = reply; // character by character output

    let idx = 0;
    const interval = setInterval(() => {
      setLatestReply(content.slice(0, idx + 1).join(" ")); // individual word output

      // setLatestReply(content.slice(0, idx+1)); // character by character output
      idx++;
      if (idx >= content.length) {
        clearInterval(interval);
      }
    }, 40);

    // this is the cleanup function in the effect hook
    return () => clearInterval(interval);

    //every time the reply changes or prevChats changes the effect re-runs
  }, [prevChats, reply]);

  // Keep the transcript pinned to the newest messages when the user
  // hasn't scrolled away from the bottom.
  useEffect(() => {
    const el = chatsRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNearBottom = distanceFromBottom < 200;

    if (isNearBottom && latestReply !== null) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [latestReply, isPrevChatsLoading]);

  return (
    <>
      {newChat && <h1>Where Should We Begin</h1>}
      <div className="chats" ref={chatsRef}>
        <ClipLoader loading={isPrevChatsLoading} color={theme === "dark" ? "#fff": "#000"} />
        {/* remove the last reply from the chat so we can print it with typing effect */}
        {prevChats?.slice(0, -1).map((chat, idx) => {
          const markdown = chat.content;

          return (
            <div
              className={chat.role === "user" ? "userDiv" : "gptDiv"}
              key={idx}
            >
              {chat.role === "user" ? (
                <p className="userMessage">{chat.content}</p>
              ) : (
                <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                  {markdown}
                </ReactMarkdown>
              )}
            </div>
          );
        })}

        {/* there should exist chat and latest reply should not be null so it can be print by typing effect */}
        {prevChats?.length > 0 &&
          (latestReply !== null ? (
            // if there is latest reply then print it with effect
            <div className="gptDiv typingReply" key={"typing"}>
              <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                {latestReply}
              </ReactMarkdown>
            </div>
          ) : (
            // if user has come again to the chat and doesn't have any latest reply yet just print the last msg from the prevChats
            <div className="gptDiv" key={"non-typing"}>
              <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                {prevChats[prevChats.length - 1].content}
              </ReactMarkdown>
            </div>
          ))}
      </div>
    </>
  );
}

export default Chat;
