import type { Request, RequestHandler, Response } from "express";
import { env } from "@/common/utils/envConfig";
import { hydraAdmin } from "@/common/utils/hydraAdmin";
import { getKeyValue } from "@/common/utils/redisClient";

class ConsentController {
	public getConsent: RequestHandler = async (req: Request, res: Response) => {
		const challenge = req.query.consent_challenge as string;

		const { data: body } = await hydraAdmin.getOAuth2ConsentRequest({
			consentChallenge: challenge,
		});

		// get user identity and fetch user claims from redis
		const subject = body.subject as string;
		const userClaimsString = await getKeyValue(subject);
		if (!userClaimsString) {
			res.status(401).end();
			return;
		}
		const userClaims = JSON.parse(userClaimsString);

		hydraAdmin
			.acceptOAuth2ConsentRequest({
				consentChallenge: challenge,
				acceptOAuth2ConsentRequest: {
					// We can grant all scopes that have been requested - hydra already checked for us that no additional scopes
					// are requested accidentally.
					grant_scope: body.requested_scope,

					session: {
						access_token: userClaims.access_token,
						id_token: userClaims.id_token,
					},

					// ORY Hydra checks if requested audiences are allowed by the client, so we can simply echo this.
					grant_access_token_audience: body.requested_access_token_audience,

					// This tells hydra to remember this consent request and allow the same client to request the same
					// scopes from the same user, without showing the UI, in the future.
					remember: Boolean(false),

					// When this "remember" sesion expires, in seconds. Set this to 0 so it will never expire.
					remember_for: 3600,
				},
			})
			.then(({ data: body }) => {
				// All we need to do now is to redirect the user back to hydra!
				res.redirect(String(body.redirect_to));
			})
			// This will handle any error that happens when making HTTP calls to hydra
			.catch((_error) => {
				res.status(401).end();
			});
	};
}

export const consentController = new ConsentController();
