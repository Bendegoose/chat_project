# Real-Time Chat

A secure, invite-only real-time messaging application built with React and Express. The project focuses on private communication, JWT-based authentication, and real-time messaging, with support for disappearing messages.

## Features

- **User Authentication** — JWT-based authentication for protected access.
- **Invite-Only Access** — Registration and access are designed around an invitation-based model.
- **Real-Time Messaging** — Instant message delivery using Socket.IO.
- **Disappearing Messages** — Support for messages that automatically expire.
- **Responsive Interface** — A Messenger-inspired layout with a conversation list and a central chat interface.
- **Protected Routes** — Separate access for authenticated and unauthenticated users.

## Tech Stack

| Technology | Purpose |
|---|---|
| React | Frontend user interface |
| React Router | Client-side routing |
| Reactstrap / Bootstrap | UI components and styling |
| Node.js | Backend runtime |
| Express | REST API |
| Socket.IO | Real-time communication |
| JSON Web Tokens (JWT) | Authentication |

## Architecture

The application follows a client-server architecture:

- **Frontend:** React application responsible for the user interface, navigation, and chat experience.
- **Backend:** Express server responsible for API endpoints, authentication, and application logic.
- **Real-Time Layer:** Socket.IO enables bidirectional communication between connected clients.

## Getting Started

### Prerequisites

- Node.js
- npm
- Git

### Installation

Clone the repository:

```bash
git clone <repository-url>
cd <repository-directory>
```

Install the dependencies for the frontend and backend:

```bash
cd frontend
npm install
```

```bash
cd ../backend
npm install
```

### Configuration

Create the required environment files for the frontend and backend.

Configure the necessary environment variables, including the authentication secret and server settings.

Do not commit `.env` files or other secrets to version control.

### Running the Application

Start the backend using the available development script:

```bash
cd backend
npm run dev
```

Start the frontend in a separate terminal:

```bash
cd frontend
npm run dev
```

The exact commands and configuration may vary depending on the current project setup and the scripts defined in each `package.json`.

## Security

The application is designed with privacy and access control in mind.

- JWT-based authentication.
- Invitation-based access model.
- Protected application resources.
- Environment-based configuration for sensitive values.
- Disappearing messages to support temporary communication.

Disappearing messages should not be considered a guarantee that message contents cannot be copied, screenshotted, or otherwise retained by recipients.

## Project Goals

This project explores the development of a modern web application with a focus on:

- Full-stack JavaScript development.
- Client-server communication.
- Real-time event-driven systems.
- Authentication and access control.
- Component-based frontend architecture.
- Privacy-conscious messaging features.

## License

No license has been specified yet.
