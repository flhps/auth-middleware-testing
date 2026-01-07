import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";
import { presentController } from "@/api/present/presentController";
import { GetPresentSchema, PostPresentSchema } from "@/api/present/presentModel";
import { createNakedApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";

export const presentRegistry = new OpenAPIRegistry();
export const presentRouter: Router = express.Router();

presentRegistry.registerPath({
	method: "get",
	path: "/present/{id}",
	tags: ["Present Verifiable Presentation"],
	request: { params: GetPresentSchema.shape.params },
	responses: createNakedApiResponse(z.string(), "Success"),
});

presentRouter.get("/:id", validateRequest(GetPresentSchema), presentController.getPresent);

presentRegistry.registerPath({
	method: "post",
	path: "/present/{id}",
	tags: ["Present Verifiable Presentation"],
	request: {
		params: PostPresentSchema.shape.params,
		body: {
			content: {
				"application/json": {
					schema: PostPresentSchema.shape.body,
				},
			},
		},
	},
	responses: createNakedApiResponse(z.null(), "Success"),
});

presentRouter.post("/:id", validateRequest(PostPresentSchema), presentController.postPresent);
