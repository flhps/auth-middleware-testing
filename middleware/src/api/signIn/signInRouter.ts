import crypto from "node:crypto";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { keyToDID } from "@spruceid/didkit-wasm-node";
import express, { type Request, type Response, type Router } from "express";
import QRCode from "qrcode";
import { z } from "zod";
import { createApiResponse, createNakedApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { env } from "@/common/utils/envConfig";
import { validateRequest } from "@/common/utils/httpHandlers";
import { GetSignInSchema } from "./signInModel";
import { setKeyValue, getKeyValue } from "@/common/utils/redisClient";

export const signInRegistry = new OpenAPIRegistry();
export const signInRouter: Router = express.Router();

signInRegistry.registerPath({
	method: "get",
	path: "/sign-in",
	tags: ["Sign In"],
	request: { query: GetSignInSchema.shape.query },
	responses: createApiResponse(z.null(), "Success"),
});

signInRouter.get("/", validateRequest(GetSignInSchema), async (req: Request, res: Response) => {
	const loginChallenge = req.query.login_challenge as string;

	if (!loginChallenge) {
		res.status(400).send("Missing login challenge");
		return;
	}

	// Create a shorter 256-bit token from the login challenge
	const token = crypto.createHash("sha256").update(loginChallenge).digest("hex");
	const succ = setKeyValue(token, loginChallenge);
	if (!succ) {
		res.status(500).end();
		return;
	}

	const did = keyToDID("key", env.DID_KEY_JWK);

	const qrCodeContent = `openid-vc://?client_id=${did}&request_uri=${encodeURIComponent(`${env.GLOBAL_URL}/present/${token}`)}`;
	const qrCodeDataUrl = await QRCode.toDataURL(qrCodeContent);
	const continueUrl = "/sign-in/continue?login_challenge=" + loginChallenge;

	res.render("signIn", {
		pageTitle: "Sign In",
		qrCodeContent,
		qrCodeImage: qrCodeDataUrl,
		continueUrl,
	});
});

signInRegistry.registerPath({
	method: "get",
	path: "/sign-in/continue",
	tags: ["Sign In"],
	request: { query: GetSignInSchema.shape.query },
	responses: createNakedApiResponse(z.null(), "redirect"),
});

signInRouter.get("/continue", validateRequest(GetSignInSchema), async (req: Request, res: Response) => {
	const loginChallenge = req.query.login_challenge as string;

	if (!loginChallenge) {
		return res.status(400).send("Missing login challenge");
	}

	const redirect = await getKeyValue(loginChallenge);
	if (!redirect) {
		const serviceResponse = ServiceResponse.failure("Sign-in incomplete", null);
		res.status(serviceResponse.statusCode).send(serviceResponse);
		return;
	}

	res.redirect(redirect);
});
