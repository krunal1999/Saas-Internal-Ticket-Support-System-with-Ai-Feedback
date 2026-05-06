import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { User } from "./user.model.js";
import { Customer } from "./customer.model.js";
import { Ticket } from "./ticket.model.js";
import { TicketMessage } from "./ticketMessage.model.js";
import { StatusHistory } from "./statusHistory.model.js";
import { AIInsight } from "./aiInsight.model.js";

const MONGO_URI = `${process.env.MONGO_URL}/${process.env.DB_NAME}`;

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  // Clear existing data
  await Promise.all([
    User.deleteMany(),
    Customer.deleteMany(),
    Ticket.deleteMany(),
    TicketMessage.deleteMany(),
    StatusHistory.deleteMany(),
    AIInsight.deleteMany(),
  ]);
  console.log("Cleared existing data");

  // --- Agents ---
  const hashedPassword = await bcrypt.hash("password123", 10);

  const [agent1, agent2, agent3] = await User.insertMany([
    {
      name: "Admin User",
      email: "admin@support.com",
      password: hashedPassword,
      role: "Agent",
    },
    {
      name: "Priya Sharma",
      email: "priya@support.com",
      password: hashedPassword,
      role: "Agent",
    },
    {
      name: "Rahul Mehta",
      email: "rahul@support.com",
      password: hashedPassword,
      role: "Agent",
    },
  ]);

  // --- Customers ---
  const [c1, c2, c3] = await Customer.insertMany([
    {
      name: "Amit Verma",
      email: "amit@acmecorp.com",
      password: hashedPassword,
      role: "Customer",
    },
    {
      name: "Sneha Patil",
      email: "sneha@techstart.io",
      password: hashedPassword,
      role: "Customer",
    },
    {
      name: "Rohan Joshi",
      email: "rohan@freelancer.com",
      password: hashedPassword,
      role: "Customer",
    },
  ]);

  // --- Tickets ---
  const [t1, t2, t3, t4, t5] = await Ticket.insertMany([
    {
      title: "Cannot access billing invoices after plan upgrade",
      description:
        "I upgraded to the Pro plan yesterday but now I can't find my past invoices. The billing section just shows a blank page.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      customer: c1._id,
      assignedAgent: agent1._id,
    },
    {
      title: "API rate limit hit even on paid plan",
      description:
        "We are on the Business plan and we keep getting 429 errors. Our usage is well within the documented limits.",
      status: "OPEN",
      priority: "URGENT",
      customer: c2._id,
      assignedAgent: null,
    },
    {
      title: "Password reset email not arriving",
      description:
        "I've requested a password reset 3 times but no email comes. Checked spam folder as well.",
      status: "RESOLVED",
      priority: "MEDIUM",
      customer: c3._id,
      assignedAgent: agent2._id,
    },
    {
      title: "Dashboard loading very slowly",
      description:
        "Since yesterday, the main dashboard takes 15-20 seconds to load. Everything else seems fine.",
      status: "OPEN",
      priority: "MEDIUM",
      customer: c1._id,
      assignedAgent: agent1._id,
    },
    {
      title: "Feature request: export data as CSV",
      description:
        "It would be very helpful if we could export our usage reports as CSV files for our internal reporting.",
      status: "CLOSED",
      priority: "LOW",
      customer: c2._id,
      assignedAgent: agent2._id,
    },
  ]);

  // --- Ticket Messages ---
  await TicketMessage.insertMany([
    // Ticket 1 thread
    {
      ticket: t1._id,
      senderType: "Customer",
      sender: c1._id,
      message:
        "I upgraded to the Pro plan yesterday but now I can't find my past invoices. The billing section just shows a blank page.",
      isInternal: false,
    },
    {
      ticket: t1._id,
      senderType: "User",
      sender: agent1._id,
      message:
        "Hi Amit, thanks for reaching out. I can see your account was upgraded. Let me check the billing service logs.",
      isInternal: false,
    },
    {
      ticket: t1._id,
      senderType: "User",
      sender: agent1._id,
      message:
        "Internal note: Looks like the invoice migration job failed for accounts upgraded after 2024-12-01. Escalating to backend team.",
      isInternal: true,
    },
    // Ticket 2
    {
      ticket: t2._id,
      senderType: "Customer",
      sender: c2._id,
      message:
        "We are on the Business plan and we keep getting 429 errors. Our usage is well within documented limits. This is causing production issues!",
      isInternal: false,
    },
    // Ticket 3
    {
      ticket: t3._id,
      senderType: "Customer",
      sender: c3._id,
      message:
        "I've requested a password reset 3 times but no email comes. Checked spam folder as well.",
      isInternal: false,
    },
    {
      ticket: t3._id,
      senderType: "User",
      sender: agent2._id,
      message:
        "Hi Rohan, we found an issue with our email provider for certain domains. We've manually sent a reset link to your registered email.",
      isInternal: false,
    },
  ]);

  // --- Status History ---
  await StatusHistory.insertMany([
    {
      ticket: t1._id,
      fromStatus: "OPEN",
      toStatus: "IN_PROGRESS",
      changedBy: agent1._id,
      reason: "Investigating billing logs",
    },
    {
      ticket: t3._id,
      fromStatus: "OPEN",
      toStatus: "IN_PROGRESS",
      changedBy: agent2._id,
    },
    {
      ticket: t3._id,
      fromStatus: "IN_PROGRESS",
      toStatus: "RESOLVED",
      changedBy: agent2._id,
      reason: "Reset link manually sent",
    },
    {
      ticket: t5._id,
      fromStatus: "OPEN",
      toStatus: "IN_PROGRESS",
      changedBy: agent2._id,
    },
    {
      ticket: t5._id,
      fromStatus: "IN_PROGRESS",
      toStatus: "CLOSED",
      changedBy: agent3._id,
      reason: "Feature logged in product backlog",
    },
  ]);

  // --- AI Insights (pre-seeded for resolved/closed tickets) ---
  await AIInsight.insertMany([
    {
      ticket: t3._id,
      summary:
        "Customer was unable to receive password reset emails due to an email provider issue affecting certain domains.",
      sentiment: "NEUTRAL",
      suggestedPriority: "MEDIUM",
      nextAction:
        "Confirm the customer has received the manual reset link and can log in successfully.",
      isEdited: false,
      generatedAt: new Date(),
    },
    {
      ticket: t5._id,
      summary:
        "Customer requested CSV export functionality for usage reports. This is a feature gap, not a bug.",
      sentiment: "POSITIVE",
      suggestedPriority: "LOW",
      nextAction:
        "Log feature request in the product backlog and inform customer of the timeline.",
      isEdited: true,
      editedBy: agent2._id,
      editedAt: new Date(),
      generationCount: 1,
    },
  ]);

  console.log("Seed complete:");
  console.log(`  Users: 3 (1 admin, 2 agents)`);
  console.log(`  Customers: 3`);
  console.log(`  Tickets: 5`);
  console.log(`  Messages: 6`);
  console.log(`  Status history: 5`);
  console.log(`  AI Insights: 2`);
  console.log("\nAgent credentials (all passwords: password123):");
  console.log("  admin@support.com  — Admin");
  console.log("  priya@support.com  — Agent");
  console.log("  rahul@support.com  — Agent");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
