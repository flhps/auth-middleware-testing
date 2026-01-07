import ldpVpEmail from "@/common/__tests__/data/presentations/VP_EmailPass.json";
import ldpVpEmployee from "@/common/__tests__/data/presentations/VP_EmployeeCredential.json";
import { verifyPresentation } from "@/common/utils/credentialVerification";

describe("Credential and Presentation Verification", () => {
	it("verifies a valid VP with Employee ldp_vc", async () => {
		const result = await verifyPresentation(ldpVpEmployee);
		expect(result).toBe(true);
	});

	it("verifies a valid VP with Email ldp_vc", async () => {
		const result = await verifyPresentation(ldpVpEmail);
		expect(result).toBe(true);
	});
});
