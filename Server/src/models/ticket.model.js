import mongoose from "mongoose";

const TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Ticket title is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: TICKET_STATUSES,
      default: "OPEN",
    },
    priority: {
      type: String,
      enum: TICKET_PRIORITIES,
      default: "LOW",
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },

    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --- Indexes ---
ticketSchema.index({ status: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ assignedAgent: 1 });
ticketSchema.index({ customer: 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ title: "text", description: "text" });

export const Ticket = mongoose.model("Ticket", ticketSchema);
