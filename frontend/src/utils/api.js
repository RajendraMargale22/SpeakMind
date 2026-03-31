import { useContext } from "react";
import { AuthContext } from "../store/AuthContext";
import toast from "react-hot-toast";
import { MyContext } from "../store/MyContext";
import { useNavigate } from "react-router-dom";
import { logger } from "./logger.js";

export function useAuthenticatedFetch() {
  const { setIsLoggedIn } = useContext(AuthContext);

  const navigate = useNavigate();

  const {
    setAllThreads,
    setNewChat,
    setPrevChats,
    setPrompt,
    setReply,
    setIsLoading,
  } = useContext(MyContext);

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

  const authenticatedFetch = async (url, options = {}) => {
    let response = await fetch(API_BASE_URL + url, {
      ...options,
      credentials: "include",
    });

    // If the backend says the access token is expired (401),
    // try to silently refresh using the refresh-token cookie and retry the original request.
    if (response.status === 401) {
      logger.debug("Access token expired, attempting refresh...");
      const refreshResponse = await fetch(`${API_BASE_URL ? API_BASE_URL : "http://localhost:8080"}/gpt/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (refreshResponse.ok) {
        logger.debug("Token refreshed successfully!");

        response = await fetch(API_BASE_URL + url, { ...options, credentials: "include" });
        return response;
      } else {
        // Automatically logout
        logger.debug("Refresh token expired, logging out...");
        const logoutResponse = await fetch(
          `${API_BASE_URL ? API_BASE_URL : "http://localhost:8080"}/gpt/refresh/logout`,
          {
            method: "POST",
            credentials: "include",
          },
        );

        logger.error(logoutResponse);
        setIsLoading(false);
        setIsLoggedIn(false);
        setPrevChats([]);
        setPrompt("");
        setReply(null);
        setAllThreads([]);
        setNewChat(true);
        // Optional: Show toast or redirect
        toast.error("Session expired. Please login again.");
        navigate("/");
      }
    }

    return response;
  };

  return authenticatedFetch;
}
