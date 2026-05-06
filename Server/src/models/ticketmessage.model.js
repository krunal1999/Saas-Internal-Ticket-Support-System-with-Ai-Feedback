import mongoose from "mongoose";

const ticketMessageSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },
    senderType: {
      type: String,
      // Must match the exact registered Mongoose model names used in refPath
      enum: ["Customer", "User"],
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "senderType",
      required: true,
    },

    message: {
      type: String,
      required: [true, "Message body is required"],
      trim: true,
    },

    isInternal: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

ticketMessageSchema.index({ ticket: 1, createdAt: 1 });

ticketMessageSchema.index({ sender: 1 });

export const TicketMessage = mongoose.model(
  "TicketMessage",
  ticketMessageSchema
);
