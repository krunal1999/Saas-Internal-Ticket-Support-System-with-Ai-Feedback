import mongoose from "mongoose";

const aiInsightSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      unique: true,
    },
    summary: {
      type: String,
      required: true,
    },
    sentiment: {
      type: String,
      enum: ["POSITIVE", "NEUTRAL", "FRUSTRATED", "ANGRY"],
      required: true,
    },
    suggestedPriority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      required: true,
    },
    nextAction: {
      type: String,
      required: true,
    },
    responseCode: {
      type: Number,
      default: 200,
    },
    errorResponse: {
      type: String,
      default: "NULL",
    },

    isEdited: {
      type: Boolean,
      default: false,
    },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    editedAt: {
      type: Date,
      default: null,
    },

    generationCount: {
      type: Number,
      default: 1,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },

    modelVersion: {
      type: String,
      default: "NULL",
    },
    tokenUsed: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// aiInsightSchema.index({ ticket: 1 });

export const AIInsight = mongoose.model("AIInsight", aiInsightSchema);
