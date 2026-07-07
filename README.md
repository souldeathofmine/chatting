# Firebase Chat

A production-ready real-time chat application built with React, Node.js, Socket.IO, Firebase Authentication, and MongoDB.

## Tech Stack

**Frontend:** React (Vite), Tailwind CSS, Zustand, Socket.IO Client, Firebase Auth/Storage, React Router, Axios, Emoji Picker

**Backend:** Node.js, Express.js, Mongoose, Socket.IO, Firebase Admin SDK, Helmet, Rate Limiting

**Database:** MongoDB Atlas

**Hosting:** Render (Backend + Frontend Static)

## Features

- Google & Email/Password authentication via Firebase
- Real-time messaging with Socket.IO
- Typing indicators, seen receipts, delivery status
- Image & file sharing with Firebase Storage
- Edit & delete messages
- Emoji picker
- Online/offline status with last seen
- Dark mode UI (Discord/WhatsApp-inspired)
- Browser push notifications
- Responsive design (mobile + desktop)
- Profile editing & photo upload

## Project Structure

```
project/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Route pages
│       ├── hooks/          # Custom React hooks
│       ├── services/       # Firebase, API, Socket configs
│       ├── store/          # Zustand state management
│       └── utils/          # Helper functions
├── server/                 # Express backend
│   ├── config/             # DB & Firebase config
│   ├── controllers/        # Route handlers
│   ├── middleware/          # Auth & error handling
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API routes
│   ├── socket/             # Socket.IO events
│   └── utils/
├── render.yaml             # Render deployment config
└── package.json            # Root scripts
```

## Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Firebase project with Authentication & Storage enabled
- Render account (for deployment)

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com) and create a new project.
2. Enable **Authentication** -> Sign-in methods:
   - Email/Password
   - Google
3. Enable **Storage** (start in test mode, configure rules later).
4. Register a **Web app** and copy the Firebase config values.
5. Go to **Project Settings** -> **Service Accounts** -> **Generate new private key** (JSON) for Admin SDK.

## MongoDB Atlas Setup

1. Create a [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (free tier).
2. Create a database user and get your connection string.
3. Whitelist IP `0.0.0.0/0` (allow all) for Render deployment.

## Environment Variables

### Server (`server/.env`)

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/chat-app?retryWrites=true&w=majority
JWT_SECRET=your-random-secret-string
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
CLIENT_URL=http://localhost:5173
```

### Client (`client/.env`)

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_API_URL=http://localhost:5000
```

## Running Locally

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd firebase-chat
npm run install:all
```

### 2. Set up environment variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Fill in the values from your Firebase project and MongoDB Atlas.

### 3. Start the server

```bash
npm run dev:server
```

Server runs on `http://localhost:5000`.

### 4. Start the client

```bash
npm run dev:client
```

Client runs on `http://localhost:5173`.

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/sync-user` | Create/update user in MongoDB after Firebase login |
| POST | `/api/auth/verify-token` | Verify Firebase ID token |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| GET | `/api/users/search?q=` | Search users by username/email |
| PUT | `/api/users/profile` | Update profile (username, bio, photoURL) |
| GET | `/api/users/:id` | Get user by ID |

### Chats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chats` | Get user's chats with unread counts |
| POST | `/api/chats` | Create or get existing chat |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/:chatId` | Get messages (paginated) |
| POST | `/api/messages` | Send a message |
| PUT | `/api/messages/:id` | Edit a message |
| DELETE | `/api/messages/:id` | Delete a message |

## Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `connection` | Client -> Server | Socket connected |
| `disconnect` | Client -> Server | Socket disconnected |
| `join_chat` | Client -> Server | Join user room with userId |
| `send_message` | Client -> Server | Send a new message |
| `receive_message` | Server -> Client | Receive new message |
| `message_seen` | Bidirectional | Mark messages as seen |
| `typing` | Client -> Server | User is typing |
| `stop_typing` | Client -> Server | User stopped typing |
| `user_online` | Server -> Client | User came online |
| `user_offline` | Server -> Client | User went offline |

## Deploy to Render

### Backend (Web Service)

1. Push your code to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), create a **New Web Service**.
3. Connect your GitHub repository.
4. Set:
   - **Name:** `firebase-chat-server`
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add all environment variables from `server/.env`.
6. Deploy.

### Frontend (Static Site)

1. Create a **New Static Site** in Render.
2. Connect your GitHub repository.
3. Set:
   - **Name:** `firebase-chat-client`
   - **Root Directory:** `client`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Add all environment variables from `client/.env`.
5. Deploy.

### Update CORS & API URLs

After deployment:
1. Set `CLIENT_URL` in server env to your frontend URL (e.g., `https://firebase-chat-client.onrender.com`).
2. Set `VITE_API_URL` in client env to your backend URL (e.g., `https://firebase-chat-server.onrender.com`).

## Security

- All API routes (except auth sync) require Firebase ID token verification.
- Helmet adds security headers.
- Rate limiting: 100 requests per 15 minutes per IP.
- CORS restricted to client origin.
- Input sanitization via Mongoose.
- File upload size limit: 10MB.

## License

MIT
