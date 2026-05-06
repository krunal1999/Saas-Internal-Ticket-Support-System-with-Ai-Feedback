import { Ticket } from "../models/ticket.model.js";
import { TicketMessage } from "../models/ticketMessage.model.js";
import { StatusHistory } from "../models/statusHistory.model.js";
import { Customer } from "../models/customer.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";
import { AIInsight } from "../models/aiInsight.model.js";
import { User } from "../models/user.model.js";

// ─────────────────────────────────────────────
// @route   GET /api/tickets
// @desc    List all tickets with filters + search + pagination
// @access  Private
// @query   status, priority, assignedAgent, customer, search, page, limit, sortBy, sortOrder
// ─────────────────────────────────────────────
const getTickets = asyncHandler(async (req, res) => {
  const {
    status,
    priority,
    assignedAgent,
    customer,
    search,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build filter object dynamically — only add fields that were actually sent
  const filter = { isDeleted: false };

  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  // "unassigned" is a special value — filter tickets with no agent
  if (assignedAgent === "unassigned") {
    filter.assignedAgent = null;
  } else if (assignedAgent) {
    filter.assignedAgent = assignedAgent;
  }

  if (customer) filter.customer = customer;

  // Full-text search on title + description (uses the text index we defined)
  if (search) {
    filter.$text = { $search: search };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sortObj = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  // Run count + data query in parallel for performance
  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .populate("customer", "name email")
      .populate("assignedAgent", "name email")
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Ticket.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: tickets,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

// ─────────────────────────────────────────────
// @route   GET /api/tickets/:id
// @desc    Get single ticket with messages + status history + AI insight
// @access  Private
// ─────────────────────────────────────────────
const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate("customer", "name email")
    .populate("assignedAgent", "name email  role");

  if (!ticket || ticket.isDeleted) {
    return res
      .status(404)
      .json({ success: false, message: "Ticket not found." });
  }

  // Fetch messages for this ticket
  // Internal notes are shown only to agents
  const messageFilter = { ticket: ticket._id };
  if (req.user.role === "Customer") {
    messageFilter.isInternal = false;
  }

  const messages = await TicketMessage.find(messageFilter)
    .populate("sender", "name email role")
    .sort({ createdAt: 1 }) // oldest first = chronological thread
    .lean();

  // Fetch status change history
  const statusHistory = await StatusHistory.find({ ticket: ticket._id })
    .populate("changedBy", "name")
    .sort({ createdAt: 1 })
    .lean();

  // Fetch AI insight if it exists — don't throw if it doesn't
  const aiInsight = await AIInsight.findOne({ ticket: ticket._id })
    .populate("editedBy", "name")
    .lean();

  res.status(200).json({
    success: true,
    data: {
      ticket,
      messages,
      statusHistory,
      aiInsight: aiInsight || null, // null tells frontend to show "Generate" button
    },
  });
});

// ─────────────────────────────────────────────
// @route   POST /api/tickets
// @desc    Create a new ticket (with first message)
// @access  Private
// ─────────────────────────────────────────────
const createTicket = asyncHandler(async (req, res) => {
  const { title, description, priority, customerId, tags } = req.body;

  if (!title || !description || !customerId) {
    return res.status(400).json({
      success: false,
      message: "title, description, and customerId are required.",
    });
  }

  // Create ticket
  const ticket = await Ticket.create({
    title,
    description,
    priority: priority || "medium",
    customer: customerId,
    tags: tags || [],
    // assignedAgent starts as null (unassigned)
  });

  // Create the first message from the customer's description
  // This seeds the conversation thread
  await TicketMessage.create({
    ticket: ticket._id,
    senderType: "Customer",
    sender: customerId,
    message: description,
    isInternal: false,
  });

  const populated = await ticket.populate([
    { path: "customer", select: "name email" },
    { path: "assignedAgent", select: "name email" },
  ]);

  res.status(201).json({ success: true, data: populated });
});

// ─────────────────────────────────────────────
// @route   PATCH /api/tickets/:id/status
// @desc    Update ticket status + log to StatusHistory
// @access  Private
// ─────────────────────────────────────────────
const updateTicketStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;

  const validStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `status must be one of: ${validStatuses.join(", ")}`,
    });
  }

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket || ticket.isDeleted) {
    return res
      .status(404)
      .json({ success: false, message: "Ticket not found." });
  }

  // Don't allow re-setting to the same status
  if (ticket.status === status) {
    return res.status(400).json({
      success: false,
      message: `Ticket is already in '${status}' status.`,
    });
  }

  const previousStatus = ticket.status;

  // Update ticket status
  ticket.status = status;
  await ticket.save();

  // Log the status change — this is the audit trail
  await StatusHistory.create({
    ticket: ticket._id,
    fromStatus: previousStatus,
    toStatus: status,
    changedBy: req.user._id,
    reason: reason || null,
  });

  res.status(200).json({
    success: true,
    message: `Status updated from '${previousStatus}' to '${status}'.`,
    data: { ticketId: ticket._id, status: ticket.status },
  });
});

// ─────────────────────────────────────────────
// @route   PATCH /api/tickets/:id/assign
// @desc    Assign or reassign ticket to an agent
// @access  Private
// ─────────────────────────────────────────────
const assignTicket = asyncHandler(async (req, res) => {
  const { agentId } = req.body;

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket || ticket.isDeleted) {
    return res
      .status(404)
      .json({ success: false, message: "Ticket not found." });
  }

  // agentId: null = unassign the ticket
  if (agentId) {
    const agent = await User.findById(agentId);
    if (!agent || !agent.isActive) {
      return res
        .status(404)
        .json({ success: false, message: "Agent not found or inactive." });
    }
  }

  ticket.assignedAgent = agentId || null;
  await ticket.save();

  await ticket.populate("assignedAgent", "name email avatar");

  res.status(200).json({
    success: true,
    message: agentId ? "Ticket assigned successfully." : "Ticket unassigned.",
    data: { ticketId: ticket._id, assignedAgent: ticket.assignedAgent },
  });
});

// ─────────────────────────────────────────────
// @route   PATCH /api/tickets/:id
// @desc    Update ticket fields (title, priority, tags)
// @access  Private
// ─────────────────────────────────────────────
const updateTicket = asyncHandler(async (req, res) => {
  // Whitelist updatable fields — never let clients update status/customer directly here
  const allowedFields = ["title", "description", "priority", "tags"];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (Object.keys(updates).length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No valid fields to update." });
  }

  const ticket = await Ticket.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  })
    .populate("customer", "name email")
    .populate("assignedAgent", "name email");

  if (!ticket) {
    return res
      .status(404)
      .json({ success: false, message: "Ticket not found." });
  }

  res.status(200).json({ success: true, data: ticket });
});

export {
  getTickets,
  getTicketById,
  createTicket,
  updateTicketStatus,
  assignTicket,
  updateTicket,
};
