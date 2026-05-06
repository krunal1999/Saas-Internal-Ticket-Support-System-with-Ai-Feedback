import { Router } from "express";
const ticketRouter = Router();

import {
  getTicketById,
  getTickets,
  createTicket,
  updateTicketStatus,
  assignTicket,
  updateTicket,
} from "../controller/ticket.controller.js";

import { addMessage, getMessages } from "../controller/message.controller.js";

import {
  generateInsight,
  regenerateInsight,
  editInsight,
  getInsight,
} from "../controller/ai.controller.js";

import { protect } from "../middleware/auth.middleware.js";

// All ticket routes require authentication
ticketRouter.use(protect);

// ── Ticket CRUD ───────────────────────────── DONE
// GET  /api/tickets          → list with filters
// POST /api/tickets          → create ticket
ticketRouter.route("/").get(getTickets).post(createTicket);

// GET   /api/tickets/:id     → get single ticket (with messages, history, insight)
// PATCH /api/tickets/:id     → update title/priority/tags
ticketRouter.route("/:id").get(getTicketById).patch(updateTicket);

//---------------------------------------------------------------------------
// ── Status + Assignment ────────────────────── DONE
// PATCH /api/tickets/:id/status  → change status + log history
ticketRouter.patch("/:id/status", updateTicketStatus);

// PATCH /api/tickets/:id/assign  → assign/unassign to agent
ticketRouter.patch("/:id/assign", assignTicket);

//---------------------------------------------------------------------------
// ── Messages / Comments ────────────────────── DONE
// GET  /api/tickets/:id/messages  → get all messages for ticket
// POST /api/tickets/:id/messages  → add message or internal note
ticketRouter.route("/:id/messages").get(getMessages).post(addMessage);

//---------------------------------------------------------------------------
// ── AI Insight ─────────────────────────────── DONE
// GET   /api/tickets/:id/ai-insight             → get current insight
// POST  /api/tickets/:id/ai-insight             → generate (first time)
// PATCH /api/tickets/:id/ai-insight             → agent edits insight
// PATCH /api/tickets/:id/ai-insight/regenerate  → regenerate from AI
ticketRouter
  .route("/:id/ai-insight")
  .get(getInsight)
  .post(generateInsight)
  .patch(editInsight);
ticketRouter.patch("/:id/ai-insight/regenerate", regenerateInsight);

export default ticketRouter;
