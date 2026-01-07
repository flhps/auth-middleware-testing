import { AuthPolicySchema } from "@/api/present/policyModel";
import policyAcceptAnything from "@/common/__tests__/data/policies/acceptAnything.json";
import policyEmailFromAltme from "@/common/__tests__/data/policies/acceptEmailFromAltme.json";
import policyAcceptEmployeeFromAnyone from "@/common/__tests__/data/policies/acceptEmployeeFromAnyone.json";
import policyFromAltme from "@/common/__tests__/data/policies/acceptFromAltme.json";
import ldpVpEmail from "@/common/__tests__/data/presentations/VP_EmailPass.json";
import ldpVpEmployee from "@/common/__tests__/data/presentations/VP_EmployeeCredential.json";
import { applyPolicy } from "@/common/utils/policyApplication";

describe("Policy Application", () => {
	it("accepts a VP with Employee ldp_vc for policyAcceptAnything", async () => {
		const result = applyPolicy(ldpVpEmployee, AuthPolicySchema.parse(policyAcceptAnything));
		expect(result.success).toBe(true);
		expect(result.access_token).toStrictEqual({
			subject: {
				id: "did:key:z6MkkdC46uhBGjMYS2ZDLUwCrTWdaqZdTD3596sN4397oRNd",
				hash: "9ecf754ffdad0c6de238f60728a90511780b2f7dbe2f0ea015115515f3f389cd",
				leiCode: "391200FJBNU0YW987L26",
				hasLegallyBindingName: "deltaDAO AG",
				ethereumAddress: "0x4C84a36fCDb7Bc750294A7f3B5ad5CA8F74C4A52",
				email: "test@test.com",
				hasRegistrationNumber: "DEK1101R.HRB170364",
				name: "Name Surname",
				hasCountry: "GER",
				type: "EmployeeCredential",
				title: "CEO",
				hasJurisdiction: "GER",
				surname: "Surname",
			},
			issuer: "did:tz:tz1NyjrTUNxDpPaqNZ84ipGELAcTWYg6s5Du",
		});
		expect(result.id_token).toStrictEqual({});
	});

	it("accepts a VP with Email ldp_vc for policyEmailFromAltme", async () => {
		const result = applyPolicy(ldpVpEmail, AuthPolicySchema.parse(policyEmailFromAltme));
		expect(result.success).toStrictEqual(true);
		expect(result.access_token).toStrictEqual({
			email: "felix.hoops@tum.de",
			auth_method: "vc",
		});
		expect(result.id_token).toStrictEqual({});
	});

	it("accepts a VP with Email ldp_vc for policyFromAltme", async () => {
		const result = applyPolicy(ldpVpEmail, AuthPolicySchema.parse(policyFromAltme));
		expect(result.success).toStrictEqual(true);
		expect(result.access_token).toStrictEqual({
			subject: {
				id: "did:key:z6MkkdC46uhBGjMYS2ZDLUwCrTWdaqZdTD3596sN4397oRNd",
				email: "felix.hoops@tum.de",
				type: "EmailPass",
				issuedBy: {
					name: "Altme",
				},
			},
		});
		expect(result.id_token).toStrictEqual({});
	});

	it("rejects a VP with Email ldp_vc for policyEmailFromOther", async () => {
		const otherPolicy = JSON.parse(JSON.stringify(policyEmailFromAltme));
		otherPolicy.constraint.b = "did:web:example.com";
		const result = applyPolicy(ldpVpEmail, AuthPolicySchema.parse(otherPolicy));
		expect(result.success).toStrictEqual(false);
	});

	it("accepts a VP with Employee ldp_vc for policyAcceptEmployeeFromAnyone", async () => {
		const result = applyPolicy(ldpVpEmployee, AuthPolicySchema.parse(policyAcceptEmployeeFromAnyone));
		expect(result.success).toBe(true);
		expect(result.access_token).toStrictEqual({
			company: "deltaDAO AG",
			email: "test@test.com",
			name: "Name Surname",
		});
		expect(result.id_token).toStrictEqual({});
	});
});
