# SpeakMind

SpeakMind is a full-stack AI chat application built using the **MERN stack** that allows users to interact with an AI assistant in real time. The system manages conversations using thread-based storage, maintains conversational context using sliding window techniques, and implements secure authentication using JWT access and refresh tokens.

SpeakMind helps you think clearly with thread-based AI conversations. This project demonstrates **secure backend architecture, scalable chat storage, efficient AI context management, and production-ready deployment practices.**

---

## Live Demo

Frontend: 
Backend API: 

Repository: 

---

## Project Features

### AI Chat Interface
- ChatGPT-like chat interface
- Thread-based conversations
- Dynamic textarea input
- Auto-expanding input field
- Sidebar with chat history
- Dark / Light theme toggle
- Toast notifications

### Conversation Management
- Thread-based message storage
- Automatic chat title generation
- Efficient context handling for AI responses
- Incremental summarization for long conversations

### Secure Authentication
- JWT based authentication
- Access Token + Refresh Token architecture
- HTTP-only cookies for security
- Cross-domain authentication support

### Session Management
- Each refresh token includes a unique **tokenId**
- Multiple device sessions supported
- Secure logout with session revocation

### Production Deployment
- Frontend deployed on **Vercel**
- Backend deployed on **Render**
- Database hosted on **MongoDB Atlas**

---

## Architecture Overview
React (Vite Frontend)
|
| HTTPS Requests
|
Node.js / Express Backend
|
| REST APIs
|
MongoDB Atlas
|
| AI Request Proxy
|
OpenAI API (gpt-4o-mini)


The backend acts as a **secure proxy** between the frontend and the OpenAI API.  
This prevents exposure of API keys and enables server-side control of AI requests.

---

## Tech Stack

### Frontend
- React
- Vite
- React Router
- Context API
- Custom Hooks
- CSS / Flexbox
- React Hot Toast

### Backend
- Node.js
- Express.js
- REST APIs
- JWT Authentication

### Database
- MongoDB Atlas
- Mongoose ODM

### AI Integration
- OpenAI API
- gpt-4o-mini model

### Deployment
- Vercel (Frontend)
- Render (Backend)

---

## Authentication Architecture

SpeakMind implements a **secure authentication system using access and refresh tokens.**

### Access Token

- Short-lived (~5–15 minutes)
- Stored in **HTTP-only cookie**
- Automatically sent with API requests
- Used for authenticating protected routes

### Refresh Token

- Longer lifetime (~4 hours)
- Stored in **HTTP-only cookie**
- Used to generate new access tokens

Each refresh token contains a **unique tokenId** which enables:

- session tracking
- session revocation
- multiple device login support

---

## Refresh Token Flow

1. Client sends request to protected API
2. If access token expired → server returns **401**
3. Frontend attempts token refresh using `/refresh`
4. If refresh token is valid → new access token issued
5. Original request is retried automatically

This process is handled by a custom React hook.

---

## Custom Auth Fetch Hook

Frontend uses a custom hook:

useAuthenticatedFetch()

Flow:

1. Send request to protected endpoint
2. If response status is **401**
3. Attempt refresh using `/refresh`
4. Retry original request
5. If refresh fails → logout user

This enables **silent authentication refresh without interrupting the user experience.**

---

## Chat System Architecture

Chats are organized as **threads**.

### User Schema
User
├── id
├── email
├── password
├── refreshTokens[]
└── chats[{ threadId }]


### Thread Schema
Thread
├── threadId
├── title
├── messages[]
├── summary
├── summarizedUntil
├── createdAt
└── updatedAt


### Message Structure
{
role: "user" | "assistant",
content: String,
timestamp: Date
}


Thread data is stored separately to avoid redundancy and improve scalability.

---

## Conversation Context Handling

OpenAI APIs are **stateless**, meaning they do not remember previous messages.  
SpeakMind manages context manually using two techniques.

### Sliding Window Context

Only the most recent messages are sent to the model.

Example:
thread.messages.slice(-N)


This prevents excessive token usage and keeps responses fast.

---

### Incremental Summarization

For long conversations, older messages are summarized.

Thread fields used:
summary
summarizedUntil

Logic:

1. Detect unsummarized messages
2. Summarize older messages
3. Append summary to existing summary
4. Send summary + recent messages to the model

This allows **long conversations without exceeding token limits.**

---

## Chat Title Generation

The first user message is used to generate a thread title.

AI prompt constraints:

- maximum **6 words**
- no punctuation
- title only

This produces clean titles for the sidebar chat list.

---

## Installation

### Clone the Repository

git clone https://github.com/YOUR_GITHUB_USERNAME/SpeakMind.git


---

### Backend Setup
cd backend
npm install
npm run dev


---

### Frontend Setup
cd frontend
npm install
npm run dev


---

## Environment Variables
Create a `.env` file in the backend directory (see `backend/.env.example` for placeholders).

OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=your_jwt_secret
MONGODB_URI=your_mongodb_connection_string
FRONTEND_URL=http://localhost:5173

Also create a `.env` file in the frontend directory (see `frontend/.env.example` for placeholders).
VITE_API_URL=http://localhost:8080


---

## Deployment

### Frontend

Deployed on **Vercel**
https://vercel.com

### Backend

Deployed on **Render**
https://render.com


### Database

Hosted on **MongoDB Atlas**
https://mongodb.com/atlas


---

## Preventing Render Cold Start

Render free tier instances go to sleep after inactivity.

To keep the backend active, a health endpoint is implemented.

GET /api/health

This endpoint is pinged every few minutes using **UptimeRobot** to prevent server sleep.

---

## Future Improvements

Planned improvements include:

- Streaming AI responses
- Message editing and regeneration
- Chat export functionality
- Message virtualization for performance
- Token usage tracking
- Rate limiting
- Improved mobile UI

---

## Author

**Rajendra Margale**

Contact: [GitHub](https://github.com/RajendraMargale22)  
        [LinkedIn](https://www.linkedin.com/in/rajendra-margale-803484343/)
Email: rajendramargale2211@gmail.com

---

## License

This project is developed for **learning and portfolio purposes.**
