import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.get("/", (req, res) => {
  res.send("hello server");
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(express.static("public"));

app.use(
  express.json({
    limit: "16kb",
  })
);

// import { userRouter } from "./routes/users.routes.js";
import authRouter from "./routes/auth.routes.js";
import ticketRoutes from "./routes/ticket.routes.js";
import miscRouter from "./routes/misc.routes.js";

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/tickets", ticketRoutes);
app.use("/api/v1/misc", miscRouter);

export default app;
