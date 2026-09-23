import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import reviewRoutes from "./routes/review.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import visualSearchRoutes from "./routes/visualSearch.routes.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "ReLoop API is running",
  });
});

app.use("/api/auth", authRoutes);

app.use("/api/products", productRoutes);

app.use("/api/wishlist", wishlistRoutes);

app.use("/api/users", userRoutes);

app.use(
  "/api/uploads",
  uploadRoutes
);

app.use(
  "/api/conversations",
  conversationRoutes
);

app.use("/api/reviews", reviewRoutes);

app.use(
  "/api/notifications",
  notificationRoutes
);

app.use("/api/ai", aiRoutes);

app.use("/api/visual-search", visualSearchRoutes);

export default app;