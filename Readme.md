````markdown
# SaaS Internal Ticket Support System with AI Feedback

A full-stack SaaS-based internal ticket support platform with AI-powered feedback and ticket analysis.

---

# Tech Stack

## Frontend

- React.js
- Vite8
- Tailwind CSS
- Axios
- React Router DOM

## Backend

- Node.js 18+
- Express.js
- MongoDB
- Mongoose

## AI Integration

- AI-powered feedback generation for support tickets using OpenAI and langchain

---

# Project Structure

```bash
root/
│
├── Frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Application pages
│   │   ├── api/axios.js     # API requests
│   │   ├── context/         # Global state management
│   │   ├── assets/          # Static assets
│   │   └── App.jsx
│   │   └── main.jsx
│   │
│   ├── public/
│   └── package.json
│   └── .env


│
├── Server/
│   ├── src/
│   │   ├── controllers/         # Request handlers
│   │   ├── routes/              # API routes
│   │   ├── models/              # MongoDB schemas
│   │   ├── middleware/          # Auth & validation middleware
│   │   ├── config/              # DB & app configuration
│   │   ├── app.js            # Entry point
│   │   └─
│   │
│   └── server.js
│   └── .env
│   └── package.json
│
└── README.md
```

---

# Installation & Running the Project

## Clone Repository

```bash
git clone https://github.com/krunal1999/Saas-Internal-Ticket-Support-System-with-Ai-Feedback.git
```

---

# Install Dependencies

## Open two terminals

## Frontend

```bash
cd Frontend
npm install
```

## Backend

```bash
cd Server
npm install
```

---

# Environment Variables

Create `.env` files inside both:

```bash
Frontend/.env
Server/.env
```

Add all required environment variables there from .env.sample file
Note that this project uses OpenAI ,so you will need to API KEY and LangChain setup properly.

---

# Run the Project

## Start Frontend

```bash
cd Frontend
npm run dev
```

## Start Backend

```bash
cd Server
npm run dev
```

Both frontend and backend servers must be running simultaneously. Please the port properly for Frontend it is running on port 5173 and for backend it is running on port 8000. this might affect the CORS. You can change the port in .env file if needed.

---

# Frontend Architecture

The frontend follows a component-based architecture using React.

## Structure Overview

- `components/` → Shared reusable UI components
- `pages/` → Main application screens
- `api/` → API communication layer
- `context/` → Global application state

## Responsibilities

- Authentication UI Login Page
- Ticket management interface
- Dashboard rendering
- API integration
- AI feedback visualization
- Role based Authentication with JWT Token

---

# Backend Architecture

The backend follows a modular MVC-style architecture.

## Structure Overview

- `controllers/` → Handles request logic
- `routes/` → API endpoint definitions
- `models/` → MongoDB data schemas
- `middleware/` → Authentication & validation
- `config/` → Database configuration
- `utils/` → Shared helper functions

## Responsibilities

- REST API handling
- Authentication & authorization using JWT token
- Role based authentication
- Ticket CRUD operations
- AI feedback processing
- Database management

---

# Database Schema Explanation

## Seed Database

First Create the Database then Seed the Database using command. Ensure you have filled required env variables in the Server/.env file.

```bash
cd Server
node src/models/seed.model.js
```

## User Schema

Stores:

- User information
- Authentication details
- Roles/permissions

## Ticket Schema

Stores:

- Ticket title
- Description
- Status
- Priority
- Assigned user
- AI-generated feedback
- Timestamps

## Relationships

- One user can create multiple tickets
- Tickets can be assigned to users/admins
- AI feedback is attached to ticket records

---

# API Design Explanation

The backend follows a RESTful API architecture with protected routes using authentication middleware.

> `protect` middleware is used to secure authenticated routes.

---

# Authentication APIs

### Auth

```http
POST /api/v1/auth/login
POST /api/v1/auth/customer-login
GET  /api/v1/auth/me
```

## Description

- `POST /login` → Agent/Admin login
- `POST /customer-login` → Customer login
- `GET /me` → Get authenticated user details

---

# Misc APIs

> All routes below are protected using middleware.

```http
GET  /api/v1/agents
GET  /api/v1/customers
POST /api/v1/customers
```

## Description

### Agents

- `GET /agents`
  - Returns all available agents
  - Used for ticket assignment dropdowns

### Customers

- `GET /customers`
  - Returns customer list
  - Used for filters and forms

- `POST /customers`
  - Create a new customer

---

# Ticket APIs

> All ticket routes require authentication.

---

## Ticket CRUD

```http
GET   /api/v1/tickets
POST  /api/v1/tickets
GET   /api/v1/tickets/:id
PATCH /api/v1/tickets/:id
```

## Description

- `GET /tickets`
  - Get all tickets with filters

- `POST /tickets`
  - Create new ticket

- `GET /tickets/:id`
  - Get single ticket
  - Includes messages, history, and AI insight

- `PATCH /tickets/:id`
  - Update title, priority, tags, etc.

---

## Ticket Status & Assignment

```http
PATCH /api/v1/tickets/:id/status
PATCH /api/v1/tickets/:id/assign
```

## Description

- `PATCH /status`
  - Update ticket status
  - Logs ticket history

- `PATCH /assign`
  - Assign or unassign ticket to an agent

---

## Ticket Messages

```http
GET  /api/v1/tickets/:id/messages
POST /api/v1/tickets/:id/messages
```

## Description

- `GET /messages`
  - Fetch all ticket messages/comments

- `POST /messages`
  - Add customer reply
  - Add internal notes/comments

---

## AI Insight APIs

```http
GET   /api/v1/tickets/:id/ai-insight
POST  /api/v1/tickets/:id/ai-insight
PATCH /api/v1/tickets/:id/ai-insight
PATCH /api/v1/tickets/:id/ai-insight/regenerate
```

## Description

- `GET /ai-insight`
  - Fetch existing AI insight

- `POST /ai-insight`
  - Generate AI insight for first time

- `PATCH /ai-insight`
  - Agent manually edits insight

- `PATCH /ai-insight/regenerate`
  - Regenerate insight using AI

---

# Middleware

## Authentication Middleware

```js
protect;
```

### Responsibilities

- Verifies authenticated users
- Protects private routes
- Attaches user information to requests
- Restricts unauthorized access

---

## API Design Principles

- RESTful routing
- Modular route separation
- Middleware-based authentication
- JSON-based communication
- Centralized error handling

---

# AI Feature Design Explanation

The AI module analyzes support tickets and generates automated feedback/suggestions.

## AI Workflow

```text
User submits ticket
        ↓
Backend processes request
        ↓
Prompts prepare to send to AI model with context of last 10 messages of ticket to improve accuracy and relevant response. Reduce hallucination. used Few-short prompting techniqe. so that AI can understand the context properly.
        ↓
AI service analyzes ticket content
        ↓
AI-generated feedback returned, used zod to validate the AI response. So that AI always return the structured data.So UX remains good and predictable.
        ↓
Feedback stored with aiInsight.model.js one to one relationship with Ticket.model.js
```

## AI Responsibilities

- Ticket analysis
- Suggesting possible resolutions
- Improving support efficiency
- Assisting administrators

---

# Known Limitations

- AI response handling with OpenAI model can be improved with proper prompting techniques.
- No real-time notifications
- No WebSocket/live updates
- Minimal automated testing

---

# Improvements With More Time

- Real-time notifications using Socket.io
- Docker containerization
- CI/CD pipeline setup
- Unit & integration testing
- Advanced AI ticket categorization
- Analytics dashboard
- Files / images upload support
- Email notification system
- Performance optimization & caching
- multi Model AI Integration
- Multi Language Support for AI Insights
- Automated Ai-agents for taking actions on tickets
- Rate Limiting on API calls

---
````
