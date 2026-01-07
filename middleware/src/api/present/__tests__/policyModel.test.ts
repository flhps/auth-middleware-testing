import { AuthPolicySchema } from "@/api/present/policyModel";
import policyAcceptAnything from "@/common/__tests__/data/policies/acceptAnything.json";
import policyEmailFromAltme from "@/common/__tests__/data/policies/acceptEmailFromAltme.json";
import policyAcceptEmployeeFromAnyone from "@/common/__tests__/data/policies/acceptEmployeeFromAnyone.json";
import policyFromAltme from "@/common/__tests__/data/policies/acceptFromAltme.json";

describe("Auth Policy Schema", () => {
	it("validates policyAcceptAnything", async () => {
		const result = AuthPolicySchema.safeParse(policyAcceptAnything);
		expect(result.success).toBe(true);
	});

	it("validates policyEmailFromAltme", async () => {
		const result = AuthPolicySchema.safeParse(policyEmailFromAltme);
		expect(result.success).toBe(true);
	});

	it("validates policyFromAltme", async () => {
		const result = AuthPolicySchema.safeParse(policyFromAltme);
		expect(result.success).toBe(true);
	});

	it("validates policyAcceptEmployeeFromAnyone", async () => {
		const result = AuthPolicySchema.safeParse(policyAcceptEmployeeFromAnyone);
		expect(result.success).toBe(true);
	});
});
