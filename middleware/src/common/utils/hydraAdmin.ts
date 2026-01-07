import { Configuration, OAuth2ApiFactory } from "@ory/hydra-client";

type HydraAdmin = {
	getOAuth2LoginRequest: (params: { loginChallenge: string }) => Promise<any>;

	acceptOAuth2LoginRequest: (params: {
		loginChallenge: string;
		acceptOAuth2LoginRequest: {
			subject: string;
			remember: boolean;
			remember_for: number;
			acr: string;
		};
	}) => Promise<any>;

	getOAuth2ConsentRequest: (params: { consentChallenge: string }) => Promise<any>;

	acceptOAuth2ConsentRequest: (params: {
		consentChallenge: string;
		acceptOAuth2ConsentRequest: {
			grant_scope: any;
			session: {
				access_token: any;
				id_token: any;
			};
			grant_access_token_audience: any;
			remember: boolean;
			remember_for: number;
		};
	}) => Promise<any>;
};

// biome-ignore lint/suspicious/noExplicitAny: Temporary
const baseOptions: any = {};

if (process.env.MOCK_TLS_TERMINATION) {
	baseOptions.headers = { "X-Forwarded-Proto": "https" };
}

const configuration = new Configuration({
	basePath: process.env.HYDRA_ADMIN_URL,
	baseOptions,
});

const hydraAdmin: HydraAdmin = OAuth2ApiFactory(configuration);

export { hydraAdmin };
