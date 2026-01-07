import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Request, type Response, type Router } from "express";
import { z } from "zod";
import { createNakedApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { GetMetadataSchema } from "@/api/metadata/metadataModel";

export const metadataRegistry = new OpenAPIRegistry();
export const metadataRouter: Router = express.Router();

metadataRegistry.registerPath({
	method: "get",
	path: "/metadata/{id}",
	tags: ["OID4VP Metadata"],
	request: { params: GetMetadataSchema.shape.params },
	responses: createNakedApiResponse(z.any(), "Success"),
});

metadataRouter.get("/:id", validateRequest(GetMetadataSchema), async (_req: Request, res: Response) => {
	const metadata = {
		vp_formats: {
			ldp_vp: {
				proof_type: ["JsonWebSignature2020", "Ed25519Signature2018", "EcdsaSecp256k1Signature2019", "RsaSignature2018"],
			},
			ldp_vc: {
				proof_type: ["JsonWebSignature2020", "Ed25519Signature2018", "EcdsaSecp256k1Signature2019", "RsaSignature2018"],
			},
		},
	};
	res.status(200).json(metadata);
});
