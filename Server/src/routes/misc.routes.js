import { Router } from "express";
const miscRouter = Router();

import { getAgents } from "../controller/agent.controller.js";
import {
  getCustomers,
  createCustomer,
} from "../controller/agent.controller.js";
import { protect } from "../middleware/auth.middleware.js";

miscRouter.use(protect);

// GET  /api/v1/agents       → list agents for assign dropdown
miscRouter.get("/agents", getAgents);

// GET  /api/v1/customers    → list customers for filter/create form
// POST /api/v1/customers    → create a new customer
miscRouter.route("/customers").get(getCustomers).post(createCustomer);

export default miscRouter;
