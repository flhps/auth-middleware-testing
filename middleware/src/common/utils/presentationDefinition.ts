import crypto from "node:crypto";
import type { DcqlQuery } from "dcql";
import type { InputDescriptor, PresentationDefinition } from "@/api/present/descriptorModel";
import type { AuthPolicy } from "@/api/present/policyModel";

export const presentationDefinition = (policy: AuthPolicy): PresentationDefinition => {
	if (policy === undefined) {
		throw new Error("A policy must be specified to generate a presentation definition");
	}
	const dcql = policy.query as DcqlQuery;

	var pd: PresentationDefinition = {
		id: crypto.randomUUID(),
		name: "SSI Auth Middleware",
		purpose: "Authentication & Authorization",
		format: {
			ldp_vp: {
				proof_type: ["JsonWebSignature2020", "Ed25519Signature2018", "EcdsaSecp256k1Signature2019", "RsaSignature2018"],
			},
			ldp_vc: {
				proof_type: ["JsonWebSignature2020", "Ed25519Signature2018", "EcdsaSecp256k1Signature2019", "RsaSignature2018"],
			},
		},
		input_descriptors: [] as InputDescriptor[],
	};

	for (const cred of dcql.credentials) {
		const descr: InputDescriptor = {
			id: cred.id,
			purpose: "Sign-in",
			name: `Automatically generated input descriptor for ${cred.id}`,
			constraints: {
				fields: cred.claims
					?.filter((claim) => {
						// we filter out generic credentialSubject paths because Altme does not accept them
						// may need to extend this to any path that is not just referring to a single value, but how would we know?
						// waiting for adoption of DCQL seems to make more sense
						let path = (claim as any).path as string[];
						return !(path.length === 1 && path[0] === "credentialSubject");
					})
					.map((claim) => {
						// biome-ignore lint/suspicious/noExplicitAny: Temporary
						let path = (claim as any).path as string[];
						return {
							path: [`$.${path.join(".")}`],
						};
					}),
				//TODO: also map type_values field to a constraint
			},
		};
		pd.input_descriptors.push(descr);
	}

	if (dcql.credential_sets) {
		for (let i = 0; i < dcql.credential_sets.length; i++) {
			const credSet = dcql.credential_sets[i];
			const credSetId = `set_${i}`;
			const req = {
				name: `Group ${credSetId}`,
				rule: "pick",
				count: !Object.hasOwn(credSet, "required") || credSet.required === true ? 1 : 0,
				// biome-ignore lint/suspicious/noExplicitAny: Temporary
				from_nested: [] as any[],
			};
			for (let j = 0; j < credSet.options.length; j++) {
				const credSetOption = credSet.options[j];
				const credSetOptionId = `${credSetId}_${j}`;
				req.from_nested.push({
					name: `Subgroup ${credSetOptionId}`,
					rule: "all",
					from: credSetOptionId,
				});
				for (const cred of credSetOption) {
					const descr = pd.input_descriptors.find((d) => d.id === cred);
					if (!descr) {
						throw new Error("Failed generating submission requirements");
					}
					descr.group = [credSetOptionId];
				}
			}
		}
	}

	return pd;
};
