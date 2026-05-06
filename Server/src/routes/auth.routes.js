import { Router } from "express";
import { login, customerLogin, getMe } from "../controller/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const authRouter = Router();

authRouter.post("/login", login);
authRouter.post("/customer-login", customerLogin);
authRouter.get("/me", protect, getMe);

export default authRouter;
