import { TicketMessage } from "../models/ticketMessage.model.js";
import { Ticket } from "../models/ticket.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";

// ─────────────────────────────────────────────
// @route   POST /api/tickets/:id/messages
// @desc    Add a message or internal note to a ticket
// @access  Private
// Body:    { message: string, isInternal: boolean }
// ─────────────────────────────────────────────
const addMessage = asyncHandler(async (req, res) => {
  const { message, isInternal = false } = req.body;

  if (!message || message.trim().length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Message body is required." });
  }

  // Verify ticket exists
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket || ticket.isDeleted) {
    return res
      .status(404)
      .json({ success: false, message: "Ticket not found." });
  }

  const senderType = req.user.role === "Customer" ? "Customer" : "User";
  const newMessage = await TicketMessage.create({
    ticket: ticket._id,
    senderType,
    sender: req.user._id,
    message: message.trim(),
    isInternal: req.user.role === "Customer" ? false : Boolean(isInternal),
  });

  await newMessage.populate("sender", "name role");

  res.status(201).json({ success: true, data: newMessage });
});

// ─────────────────────────────────────────────
// @route   GET /api/tickets/:id/messages
// @desc    Get all messages for a ticket
// @access  Private
// ─────────────────────────────────────────────
const getMessages = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket || ticket.isDeleted) {
    return res
      .status(404)
      .json({ success: false, message: "Ticket not found." });
  }

  const messages = await TicketMessage.find({ ticket: req.params.id })
    .populate("senderAgent", "name role")
    .populate("senderCustomer", "name email")
    .sort({ createdAt: 1 })
    .lean();

  res.status(200).json({ success: true, data: messages });
});

export { addMessage, getMessages };
