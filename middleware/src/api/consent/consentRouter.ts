import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";
import { createNakedApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { consentController } from "./consentController";
import { GetConsentSchema } from "./consentModel";

export const consentRegistry = new OpenAPIRegistry();
export const consentRouter: Router = express.Router();

consentRegistry.registerPath({
	method: "get",
	path: "/consent",
	tags: ["OIDC Consent Step"],
	request: { query: GetConsentSchema.shape.query },
	responses: createNakedApiResponse(z.null(), "Success"),
});

consentRouter.get("/", validateRequest(GetConsentSchema), consentController.getConsent);
