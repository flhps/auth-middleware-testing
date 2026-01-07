import { promises as fs } from "node:fs";
import { type AuthPolicy, AuthPolicySchema } from "@/api/present/policyModel";
import { env } from "@/common/utils/envConfig";

let signInPolicy: AuthPolicy | undefined;

try {
	fs.readFile(env.SIGN_IN_POLICY as string, "utf8").then((file) => {
		const policy = JSON.parse(file);
		signInPolicy = AuthPolicySchema.parse(policy);
	});
} catch (_error) {
	throw new Error(`Failed loading sign in policy from file: ${process.env.LOGIN_POLICY}`);
}

export const getSignInPolicy = (): AuthPolicy => {
	if (!signInPolicy) {
		throw new Error("No configured sign in policy");
	}
	return signInPolicy;
};
