import { VerifiablePresentationSchema } from "@/api/present/credentialModel";
import ldpVpEmail from "@/common/__tests__/data/presentations/VP_EmailPass.json";
import ldpVpEmployee from "@/common/__tests__/data/presentations/VP_EmployeeCredential.json";
import ldpVpTriple from "@/common/__tests__/data/presentations/VP_IdEmployeeEmail.json";

describe("Credential and Presentation Schema", () => {
	it("validates a VP with Employee ldp_vc", async () => {
		const result = VerifiablePresentationSchema.safeParse(ldpVpEmployee);
		expect(result.success).toBe(true);
	});

	it("validates a VP with Email ldp_vc", async () => {
		const result = VerifiablePresentationSchema.safeParse(ldpVpEmail);
		expect(result.success).toBe(true);
	});

	it("validates a VP with ID, Employee, and Email ldp_vc", async () => {
		const result = VerifiablePresentationSchema.safeParse(ldpVpTriple);
		expect(result.success).toBe(true);
	});
});
