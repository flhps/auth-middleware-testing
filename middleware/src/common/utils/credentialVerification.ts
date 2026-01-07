import { verifyCredential as verifyVC, verifyPresentation as verifyVP } from "@spruceid/didkit-wasm-node";
import type { VerifiableCredential, VerifiablePresentation } from "@/api/present/credentialModel";

const verifyJustPresentation = async (vp: VerifiablePresentation): Promise<boolean> => {
	const res = JSON.parse(await verifyVP(JSON.stringify(vp), "{}"));
	return res.errors.length === 0;
};

const verifyJustCredential = async (vc: VerifiableCredential): Promise<boolean> => {
	const res = JSON.parse(await verifyVC(JSON.stringify(vc), "{}"));
	return res.errors.length === 0;
};

export const verifyPresentation = async (vp: VerifiablePresentation) => {
	try {
		if (!(await verifyJustPresentation(vp))) {
			return false;
		}

		if (!vp.verifiableCredential) {
			throw new Error("Verifiable Presentation without credentials is legal but nonsensical");
		}
		const creds = Array.isArray(vp.verifiableCredential) ? vp.verifiableCredential : [vp.verifiableCredential];

		for (const cred of creds) {
			if (!(await verifyJustCredential(cred))) {
				return false;
			}
		}

		return true;
	} catch (_error) {
		return false;
	}
};
