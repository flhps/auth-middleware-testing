import { type Checked, type IPresentationDefinition, PEX } from "@sphereon/pex";
import { AuthPolicySchema } from "@/api/present/policyModel";
import policyAcceptAnything from "@/common/__tests__/data/policies/acceptAnything.json";
import policyEmailFromAltme from "@/common/__tests__/data/policies/acceptEmailFromAltme.json";
import vpEmail from "@/common/__tests__/data/presentations/VP_EmailPass.json";
import { presentationDefinition } from "@/common/utils/presentationDefinition";

describe("Presentation Definition Generation from Policy", () => {
	it("runs without error", async () => {
		expect(presentationDefinition(AuthPolicySchema.parse(policyAcceptAnything))).not.toBe(undefined);
	});

	it("produces a valid definition for policyAcceptAnything", () => {
		const def = presentationDefinition(AuthPolicySchema.parse(policyAcceptAnything));
		const checkArray = PEX.validateDefinition(def as IPresentationDefinition) as Array<Checked>;
		const problemCount = checkArray.filter((check) => check.status !== "info").length;
		expect(problemCount).toBe(0);
	});

	it("produces a valid definition for policyEmailFromAltme", () => {
		const def = presentationDefinition(AuthPolicySchema.parse(policyEmailFromAltme));
		const checkArray = PEX.validateDefinition(def as IPresentationDefinition) as Array<Checked>;
		const problemCount = checkArray.filter((check) => check.status !== "info").length;
		expect(problemCount).toBe(0);
	});

	it("produces a definition that accepts a test ldp_vp for anything", () => {
		const pex = new PEX();
		const def = presentationDefinition(AuthPolicySchema.parse(policyAcceptAnything));
		const modVP = JSON.parse(JSON.stringify(vpEmail));
		modVP.verifiableCredential = [vpEmail.verifiableCredential];
		const { warnings, errors } = pex.evaluatePresentation(def as IPresentationDefinition, modVP);
		expect(warnings?.length).toBe(0);
		expect(errors?.length).toBe(0);
	});

	it("produces a definition that accepts a test ldp_vp for emailFromAltme", () => {
		const pex = new PEX();
		const def = presentationDefinition(AuthPolicySchema.parse(policyEmailFromAltme));
		const modVP = JSON.parse(JSON.stringify(vpEmail));
		modVP.verifiableCredential = [vpEmail.verifiableCredential];
		const { warnings, errors } = pex.evaluatePresentation(def as IPresentationDefinition, modVP);
		expect(warnings?.length).toBe(0);
		expect(errors?.length).toBe(0);
	});
});
