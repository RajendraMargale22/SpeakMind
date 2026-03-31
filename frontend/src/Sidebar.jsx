import { useContext, useEffect } from "react";
import "./Sidebar.css";
import logoImage from "../src/assets/logo.ico";
import { MyContext } from "./store/MyContext";
import { v1 as uuidv1 } from "uuid";
import toast from "react-hot-toast";
import { AuthContext } from "./store/AuthContext";
import { useAuthenticatedFetch } from "./utils/api";
import { logger } from "./utils/logger";

export default function Sidebar({ isOpen, onClose }) {
  const authFetch = useAuthenticatedFetch();

  const {
    allThreads,
    setAllThreads,
    currentThreadId,
    setCurrentThreadId,
    prevChats,
    setNewChat,
    setPrompt,
    setReply,
    setPrevChats,
    setIsPrevChatsLoading,
  } = useContext(MyContext);

  const { isLoggedIn } = useContext(AuthContext);

  // get all the available threads and set them to allThreads
  const getAllThreads = async () => {
    try {
      const response = await authFetch("/api/thread");

      if (response.ok) {
        const data = await response.json();

        // threadId, title
        const filteredData = data.map((thread) => ({
          threadId: thread.threadId,
          title: thread.title,
        }));
        setAllThreads(filteredData);
        logger.debug(filteredData);
      }
    } catch (error) {
      logger.error(error);
    }
  };

  // whenever the current thread changes we have to get/refresh the thread history of the sidebar
  useEffect(() => {
    if (isLoggedIn) {
      getAllThreads();
    }
  }, [currentThreadId, isLoggedIn]);

  function startNewChat() {
    // if the prev chat was there then create a new chat otherwise the user is on the new chat
    if (prevChats.length) {
      setNewChat(true);
      setReply(null);
      setPrompt("");
      setPrevChats([]);
      setCurrentThreadId(uuidv1());
    }
  }

  async function changeThread(newThreadId) {
    // set current thread id to load the current     chats of this thread
    setIsPrevChatsLoading(true);
    setCurrentThreadId(newThreadId);

    try {
      const response = await authFetch(`/api/thread/${newThreadId}`);
      const data = await response.json();
      logger.debug(data);

      // set chat of the new current threadId
      setPrevChats(data);
      setNewChat(false);
      // setPrompt("")
      setReply(null);
      setIsPrevChatsLoading(false);
    } catch (error) {
      logger.error(error);
    }
  }

  async function deleteThread(threadId) {
    try {
      const response = await authFetch(`/api/thread/${threadId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
      }
      // remove the deleted thread from the history
      setAllThreads((prev) =>
        prev.filter((thread) => thread.threadId !== threadId),
      );

      if (threadId === currentThreadId) {
        startNewChat();
      }

      logger.debug(data);
    } catch (error) {
      logger.error(error);
    }
  }

  return (
    <section className={`sidebar ${isOpen ? "open" : ""}`}>

      <div className="sidebar-mobile-header">
        {/* <img src={logoImage} alt="chatForge logo" className="logo" /> */}
        <button
          className="sidebar-close"
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      {/* new chat button */}
      <button onClick={startNewChat}>
        <img src={logoImage} alt="SpeakMind logo" className="logo" />
        <span>
          <i className="fa-solid fa-pen-to-square"></i>
        </span>
      </button>

      {/* history */}

      <ul className="history">
        {allThreads?.map((thread) => {
          return (
            <li
              key={thread.threadId}
              onClick={() => changeThread(thread.threadId)}
              className={
                currentThreadId === thread.threadId ? "highlighted" : undefined
              }
            >
              {thread.title}
              <i
                className="fa-solid fa-trash"
                onClick={(e) => {
                  e.stopPropagation(); //prevents event bubbling means event only happens on the trach icon not on the parent li
                  deleteThread(thread.threadId);
                }}
              ></i>
            </li>
          );
        })}
      </ul>

      {/* sign */}

      <div className="sign">
        <p>By Rajendra Margale &hearts; </p>
      </div>
    </section>
  );
}
