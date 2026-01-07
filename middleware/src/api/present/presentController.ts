import { keyToDID, keyToVerificationMethod } from "@spruceid/didkit-wasm-node";
import type { Request, RequestHandler, Response } from "express";
import * as jose from "jose";
import { verifyPresentation } from "@/common/utils/credentialVerification";
import { env } from "@/common/utils/envConfig";
import { hydraAdmin } from "@/common/utils/hydraAdmin";
import { applyPolicy } from "@/common/utils/policyApplication";
import { presentationDefinition } from "@/common/utils/presentationDefinition";
import { getSignInPolicy } from "@/common/utils/signInPolicy";
import { getKeyValue, setKeyValue } from "@/common/utils/redisClient";

class PresentController {
	public getPresent: RequestHandler = async (req: Request, res: Response) => {
		const challenge = req.params.id;
		//TODO: see if there is a policy in redis, indicating it is incremental auth
		const policy = getSignInPolicy();
		const pd = presentationDefinition(policy);
		const did = keyToDID("key", env.DID_KEY_JWK);
		const verificationMethod = await keyToVerificationMethod("key", env.DID_KEY_JWK);
		const payload = {
			client_id: did,
			client_id_scheme: "did",
			client_metadata_uri: `${env.GLOBAL_URL}/metadata/${challenge}`,
			nonce: challenge,
			presentation_definition: pd,
			response_mode: "direct_post",
			response_type: "vp_token",
			response_uri: `${env.GLOBAL_URL}/present/${challenge}`,
			state: challenge,
		};
		const privateKey = await jose.importJWK(JSON.parse(env.DID_KEY_JWK), "EdDSA");
		const token = await new jose.SignJWT(payload)
			.setProtectedHeader({
				alg: "EdDSA",
				kid: verificationMethod,
				typ: "oauth-authz-req+jwt",
			})
			.setIssuedAt()
			.setIssuer(did)
			.setAudience("https://self-issued.me/v2") // by definition
			.setExpirationTime("1 hour")
			.sign(privateKey)
			.catch((_err) => {
				res.status(500).end();
			});
		res.status(200).send(token);
	};

	public postPresent: RequestHandler = async (req: Request, res: Response) => {
		const presentationString = req.body.vp_token;
		const presentation = JSON.parse(presentationString);
		const verified = await verifyPresentation(presentation);
		if (!verified) {
			res.status(401).end();
			return;
		}
		const policy = getSignInPolicy();
		const tokens = applyPolicy(presentation, policy);
		if (!tokens.success) {
			res.status(401).end();
			return;
		}
		const subject = presentation.proof.verificationMethod;
		let challenge;
		if (env.NODE_ENV === "development" && env.UNSAFE_IGNORE_VP_CHALLENGE) {
			// testing flow that ignores the challenge in the VP
			challenge = req.params.id as string;
		} else {
			// standard flow
			challenge = presentation.proof.challenge;
			if (challenge !== (req.params.id as string)) {
				res.status(401).end();
				return;
			}
		}
		const hydraChallenge = await getKeyValue(challenge);
		if (!hydraChallenge) {
			res.status(401).end();
			return;
		}

		await hydraAdmin
			.getOAuth2LoginRequest({ loginChallenge: hydraChallenge })
			.then(() =>
				hydraAdmin
					.acceptOAuth2LoginRequest({
						loginChallenge: hydraChallenge,
						acceptOAuth2LoginRequest: {
							// Subject is an alias for user ID. A subject can be a random string, a UUID, an email address, ....
							subject,
							// This tells hydra to remember the browser and automatically authenticate the user in future requests. This will
							// set the "skip" parameter in the other route to true on subsequent requests!
							remember: Boolean(false),
							// When the session expires, in seconds. Set this to 0 so it will never expire.
							remember_for: 3600,
							// Sets which "level" (e.g. 2-factor authentication) of authentication the user has. The value is really arbitrary
							// and optional. In the context of OpenID Connect, a value of 0 indicates the lowest authorization level.
							// acr: '0',
							//
							// If the environment variable CONFORMITY_FAKE_CLAIMS is set we are assuming that
							// the app is built for the automated OpenID Connect Conformity Test Suite. You
							// can peak inside the code for some ideas, but be aware that all data is fake
							// and this only exists to fake a login system which works in accordance to OpenID Connect.
							//
							// If that variable is not set, the ACR value will be set to the default passed here ('0')
							acr: "0",
						},
					})
					.then(({ data: body }) => {
						// save the user claims to redis
						setKeyValue(subject, JSON.stringify(tokens));

						// save the redirect address to redis for the browser
						setKeyValue(hydraChallenge, String(body.redirect_to));

						// phone just gets a 200 ok
						res.status(200).end();
					}),
			)
			// This will handle any error that happens when making HTTP calls to hydra
			.catch((_error) => {
				res.status(401).end();
			});
	};
}

export const presentController = new PresentController();
