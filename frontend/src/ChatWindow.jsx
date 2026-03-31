import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { use, useContext, useEffect, useRef, useState } from "react";
import { MyContext } from "./store/MyContext.jsx";
import { ScaleLoader } from "react-spinners";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "./store/AuthContext.jsx";
import { ThemeContext } from "./store/ThemeContext.jsx";
import toast from "react-hot-toast";
import { useAuthenticatedFetch } from "./utils/api.js";
import { logger } from "./utils/logger.js";

function ChatWindow({onToggleSidebar}) {
  const authFetch = useAuthenticatedFetch();

  const {
    reply,
    setReply,
    prompt,
    setPrompt,
    currentThreadId,
    setNewChat,
    setPrevChats,
    setAllThreads,
    isLoading,
    setIsLoading,
  } = useContext(MyContext);

  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);


  const [isOpen, setIsOpen] = useState(false);

  const { theme, toggleTheme } = useContext(ThemeContext);

  // Send the current prompt to the backend and update the UI with the assistant reply.
  async function getReply() {
    if (prompt.trim().length <= 0) {
      toast.error("Please Enter Prompt");
      return;
    }

    const options = {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        message: prompt,
        threadId: currentThreadId,
      }),
    };

    // to set the text of "Where Should We Begin"
    setNewChat(false);

    try {
      setIsLoading(true);
      const response = await authFetch("/api/chat", options);

      if (response.status === 401) {
        toast.error("Log In to Chat");
        return;
      }

      // we get reply for the current prompt from the user
      const data = await response.json();
      logger.debug("Data in getReply chatwindow", data);
      // we set the reply from the gpt api
      setReply(data.reply);
      setIsLoading(false);

      if (textAreaRef.current) {
        textAreaRef.current.style.height = "auto";
      }
    } catch (error) {
      logger.error("Error to chat with the api", error);
    }
  }

  // When we receive a reply, append the user prompt + assistant response to the in-memory transcript.
  useEffect(() => {
    // sets previous chats first when the component loads
    // and then sets the chats when the reply changes

    // this means that there should be a prompt and reply to set the previous chats
    // for new chats preChats remains [] array
    if (prompt && reply) {
      setPrevChats((prevChats) => [
        ...prevChats,
        { role: "user", content: prompt },
        { role: "assistant", content: reply },
      ]);
    }

    // setting prompt to "" so user can enter next prompt
    setPrompt("");

    // Reset textarea height
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
    }

    // if we add prompt in this array the effect will run at every key stroke
  }, [reply]);

  // this function handles opening and closing of profile icon
  function handleProfileClick() {
    setIsOpen(!isOpen);
  }

  // logouts the user by sending post request to logut
  async function handleLogout() {
    const response = await authFetch("/gpt/refresh/logout", {
      credentials: "include",
      method: "POST",
    });

    if (response.ok) {
      toast.success("You are Logged Out");
    }
    setIsLoggedIn(false);
    setIsOpen(false);
    setPrevChats([]);
    setPrompt("");
    setReply(null);
    setAllThreads([]);
    setNewChat(true);
  }

  function handleTheme() {
    toggleTheme();
  }

  const textAreaRef = useRef(null);

  function handleTextareaChange(event) {
    setPrompt(event.target.value);

    const textarea = textAreaRef.current;
    if (textarea) {
      textarea.style.height = "auto"; // Reset height
      textarea.style.height = `${textarea.scrollHeight}px`; // Set to scroll height
    }
  }

  return (
    <div className="chatWindow">
      <div className="navbar">
        <div className="navbar-left">
          <button
          className="menu-btn"
          type="button"
          aria-label="Toggle sidebar"
          onClick={onToggleSidebar}
        >
          <i className="fa-solid fa-bars"></i>
        </button>


        <div className="brand-block">
          <span className="navbar-brand">
            SpeakMind <i className="fa-solid fa-chevron-down"></i>
          </span>
          <div className="brand-tagline">A mind that listens and speaks</div>
        </div>
        </div>

        

        {isLoggedIn ? (
          <div className="userIconDiv" onClick={handleProfileClick}> 
            <span className="userIcon">
              <i className="fa-solid fa-user"></i>
            </span>
          </div>
        ) : (
          <div className="userIconDiv">
            <div className="log-sign-btn">
              <Link to={"/signup"}>
                {" "}
                <button>Signup</button>{" "}
              </Link>
              <Link to={"/login"}>
                {" "}
                <button>LogIn</button>{" "}
              </Link>
            </div>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="dropDown">
          <div className="dropDownItem">
            <i className="fa-solid fa-gear"></i> Settings
          </div>
          <div className="dropDownItem">
            <i className="fa-solid fa-cloud-arrow-up"></i> Upgrade Plan
          </div>
          <div className="dropDownItem" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket"></i>Log Out
          </div>
          <div className="dropDownItem" onClick={handleTheme}>
            Change Theme {theme === "light" ? "🌙" : "☀️"}
          </div>
        </div>
      )}

      <Chat></Chat>

      <ScaleLoader
        loading={isLoading}
        color={theme === "dark" ? "#fff" : "#000"}
      />

      <div className="chatInput">
        <div className="inputBox">
          <textarea
            ref={textAreaRef}
            placeholder="Ask Anything"
            name="prompt"
            value={prompt}
            onChange={handleTextareaChange}
            onKeyDown={(e) => {
              if (e.key == "Enter" && !e.shiftKey) {
                e.preventDefault();
                getReply();
              }
            }}
            disabled={isLoading}
            // rows={1}
            style={{
              resize: "none",
            }}
          />
          <div id="submit" onClick={getReply}>
            <i className="fa-solid fa-paper-plane"></i>
          </div>
        </div>
        <p className="info">
          SpeakMind can make mistakes. Check important info. See Cookie
          Preferences.
        </p>
      </div>
    </div>
  );
}

export default ChatWindow;
