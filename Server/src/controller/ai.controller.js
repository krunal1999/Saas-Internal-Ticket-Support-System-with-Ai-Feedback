import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";

import { Ticket } from "../models/ticket.model.js";
import { TicketMessage } from "../models/ticketMessage.model.js";
import { AIInsight } from "../models/aiInsight.model.js";

import { asyncHandler } from "../middleware/error.middleware.js";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// ─────────────────────────────────────────────
// LangChain Setup
// We use StructuredOutputParser with Zod schema so LangChain
// enforces the JSON shape and we never get partial/malformed AI output
// ─────────────────────────────────────────────

// Define the exact shape we want from the AI
const insightSchema = z.object({
  summary: z
    .string()
    .describe("A 1-2 sentence summary of the customer's issue"),
  sentiment: z
    .enum(["POSITIVE", "NEUTRAL", "FRUSTRATED", "ANGRY"])
    .describe("The customer's emotional tone based on their messages"),
  suggestedPriority: z
    .enum(["LOW", "MEDIUM", "HIGH", "URGENT"])
    .describe("Recommended priority level based on issue severity"),
  nextAction: z
    .string()
    .describe("A specific, actionable next step the support agent should take"),
});

const parser = StructuredOutputParser.fromZodSchema(insightSchema);

const prompt = PromptTemplate.fromTemplate(`
You are a senior customer support analyst. Analyze the following support ticket and provide structured insights to help the support agent.

--- TICKET ---
Title: {title}
Description: {description}
Current Status: {status}
Current Priority: {priority}

--- CONVERSATION THREAD ---
{messages}
--- END ---

Respond ONLY with valid JSON matching this format:
{format_instructions}

Rules:
- Be concise and actionable
- Base sentiment on the customer's actual words, not the issue type
- Suggest a priority upgrade if the issue is production-blocking or the customer is very frustrated
- nextAction must be a specific thing the agent can do right now, not a generic suggestion
`);

// Build LLM instance lazily so app doesn't crash on startup if key is missing
const getOpenAiLLM = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set in environment variables.");
  }
  return new ChatOpenAI({
    modelName: "gpt-4o-mini", // cost-effective, fast enough for support tickets
    temperature: 0.3, // low temperature = consistent, factual output
    maxTokens: 500,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
};

const getGoogleLLM = () => {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY is not set in environment variables.");
  }

  return new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    temperature: 0.3,
    maxOutputTokens: 500,
    apiKey: process.env.GOOGLE_API_KEY,
    maxRetries: 2,
  });
};

// ─────────────────────────────────────────────
// Core generation function — shared by generate + regenerate
// ─────────────────────────────────────────────
const runAIGeneration = async (ticket) => {
  // Fetch last 10 messages (enough context, avoids token waste)
  const messages = await TicketMessage.find({ ticket: ticket._id })
    .populate("sender", "name role")
    .sort({ createdAt: 1 })
    .limit(10)
    .lean();

  // Format messages as readable thread for the prompt
  const formattedMessages = messages
    .map((m) => {
      const sender =
        m.senderType === "User"
          ? `Agent (${m.senderAgent?.name || "Unknown"})`
          : `Customer (${m.senderCustomer?.name || "Unknown"})`;
      const type = m.isInternal ? " [Internal Note]" : "";
      return `${sender}${type}: ${m.message}`;
    })
    .join("\n");

  const formatInstructions = parser.getFormatInstructions();
  // const llm = getGoogleLLM();
  const llm = getOpenAiLLM();

  // Build the chain: prompt → LLM → parser
  const chain = prompt.pipe(llm).pipe(parser);

  const result = await chain.invoke({
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    messages: formattedMessages || "No messages yet.",
    format_instructions: formatInstructions,
  });

  return result; // already parsed and validated by Zod
};

// ─────────────────────────────────────────────
// @route   POST /api/tickets/:id/ai-insight
// @desc    Generate AI insight for a ticket (first time)
// @access  Private
// ─────────────────────────────────────────────
const generateInsight = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket || ticket.isDeleted) {
    return res
      .status(404)
      .json({ success: false, message: "Ticket not found." });
  }

  // Check if insight already exists — use regenerate endpoint instead
  const existing = await AIInsight.findOne({ ticket: ticket._id });
  if (existing) {
    return res.status(400).json({
      success: false,
      message:
        "AI insight already exists. Use PATCH /ai-insight to regenerate.",
    });
  }

  let insightData;
  try {
    insightData = await runAIGeneration(ticket);
  } catch (err) {
    console.error("[AI Generation Error]", err.message);
    return res.status(503).json({
      success: false,
      message: "AI service is currently unavailable. Please try again.",
      // Never expose raw AI errors to the client — they may contain prompt details
    });
  }

  const insight = await AIInsight.create({
    ticket: ticket._id,
    ...insightData,
    isEdited: false,
    generationCount: 1,
    generatedAt: new Date(),
    modelVersion: "ANY",
  });

  res.status(201).json({ success: true, data: insight });
});

// ─────────────────────────────────────────────
// @route   PATCH /api/tickets/:id/ai-insight/regenerate
// @desc    Regenerate AI insight (overwrites previous, resets isEdited)
// @access  Private
// ─────────────────────────────────────────────
const regenerateInsight = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket || ticket.isDeleted) {
    return res
      .status(404)
      .json({ success: false, message: "Ticket not found." });
  }

  let insightData;
  try {
    insightData = await runAIGeneration(ticket);
  } catch (err) {
    console.error("[AI Regeneration Error]", err.message);
    return res.status(503).json({
      success: false,
      message: "AI service is currently unavailable. Please try again.",
    });
  }

  // Upsert: create if doesn't exist, update if it does
  const insight = await AIInsight.findOneAndUpdate(
    { ticket: ticket._id },
    {
      ...insightData,
      isEdited: false, // reset — this is fresh AI output
      editedBy: null,
      editedAt: null,
      generatedAt: new Date(),
      $inc: { generationCount: 1 }, // track how many times AI was called
    },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(200).json({ success: true, data: insight });
});

// ─────────────────────────────────────────────
// @route   PATCH /api/tickets/:id/ai-insight
// @desc    Agent manually edits the AI insight fields
// @access  Private
// Body:    { summary?, sentiment?, suggestedPriority?, nextAction? }
// ─────────────────────────────────────────────
const editInsight = asyncHandler(async (req, res) => {
  const allowedFields = [
    "summary",
    "sentiment",
    "suggestedPriority",
    "nextAction",
  ];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (Object.keys(updates).length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No valid fields to update." });
  }

  const insight = await AIInsight.findOne({ ticket: req.params.id });
  if (!insight) {
    return res.status(404).json({
      success: false,
      message: "No AI insight found. Generate one first.",
    });
  }

  // Apply updates and mark as agent-edited
  Object.assign(insight, updates);
  insight.isEdited = true;
  insight.editedBy = req.user._id;
  insight.editedAt = new Date();

  await insight.save();
  await insight.populate("editedBy", "name");

  res.status(200).json({ success: true, data: insight });
});

// ─────────────────────────────────────────────
// @route   GET /api/tickets/:id/ai-insight
// @desc    Get AI insight for a ticket
// @access  Private
// ─────────────────────────────────────────────
const getInsight = asyncHandler(async (req, res) => {
  const insight = await AIInsight.findOne({ ticket: req.params.id })
    .populate("editedBy", "name avatar")
    .lean();

  if (!insight) {
    return res.status(404).json({
      success: false,
      message: "No AI insight generated yet.",
      data: null,
    });
  }

  res.status(200).json({ success: true, data: insight });
});

export { generateInsight, regenerateInsight, editInsight, getInsight };
