import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pino } from "pino";
import { consentRouter } from "@/api/consent/consentRouter";
import { healthCheckRouter } from "@/api/healthCheck/healthCheckRouter";
import { metadataRouter } from "@/api/metadata/metadataRouter";
import { presentRouter } from "@/api/present/presentRouter";
import { signInRouter } from "@/api/signIn/signInRouter";
import { openAPIRouter } from "@/api-docs/openAPIRouter";
import errorHandler from "@/common/middleware/errorHandler";
import rateLimiter from "@/common/middleware/rateLimiter";
import requestLogger from "@/common/middleware/requestLogger";
import { env } from "@/common/utils/envConfig";

const logger = pino({ name: "server start" });
const app: Express = express();

// Set the application to trust the reverse proxy
app.set("trust proxy", true);

// Use pug for views
app.set("view engine", "pug");
app.set("views", "./src/views");

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(helmet());
app.use(rateLimiter);

// Request logging
app.use(requestLogger);

// Routes
app.use("/health-check", healthCheckRouter);
app.use("/sign-in", signInRouter);
app.use("/present", presentRouter);
app.use("/consent", consentRouter);
app.use("/metadata", metadataRouter);

// Swagger UI
app.use(openAPIRouter);

// Error handlers
app.use(errorHandler());

export { app, logger };
