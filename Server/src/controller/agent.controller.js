import { User } from "../models/user.model.js";
import { Customer } from "../models/customer.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";

// ─────────────────────────────────────────────
// @route   GET /api/agents
// @desc    List all active agents (for assign dropdown in dashboard)
// @access  Private
// ─────────────────────────────────────────────
const getAgents = asyncHandler(async (req, res) => {
  const agents = await User.find({ isActive: true })
    .select("name email role")
    .sort({ name: 1 })
    .lean();

  res.status(200).json({ success: true, data: agents });
});

// ─────────────────────────────────────────────
// @route   GET /api/customers
// @desc    List all customers (for filter dropdown + create ticket form)
// @access  Private
// ─────────────────────────────────────────────
const getCustomers = asyncHandler(async (req, res) => {
  const { search } = req.query;

  const filter = search ? { $text: { $search: search } } : {};

  const customers = await Customer.find(filter)
    .select("name email")
    .sort({ name: 1 })
    .limit(50)
    .lean();

  res.status(200).json({ success: true, data: customers });
});

// ─────────────────────────────────────────────
// @route   POST /api/customers
// @desc    Create a new customer (when creating a ticket for new customer)
// @access  Private
// ─────────────────────────────────────────────
const createCustomer = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "name , email , password are required.",
    });
  }

  const customer = await Customer.create({
    name,
    email,
    password,
    role: "Customer",
  });

  res.status(201).json({ success: true, data: customer });
});

export { getAgents, getCustomers, createCustomer };
