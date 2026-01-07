import type { DcqlQueryResult, DcqlW3cVcCredential } from "dcql";
import { DcqlQuery } from "dcql";
import type { VerifiableCredential, VerifiablePresentation } from "@/api/present/credentialModel";
import type {
	AuthPolicy,
	ClaimQueryRef,
	PolicyResult,
	PresentationConstraint,
	PresentationRef,
	StaticClaim,
} from "@/api/present/policyModel";

export const applyPolicy = (vp: VerifiablePresentation, policy: AuthPolicy): PolicyResult => {
	const parsedQuery = DcqlQuery.parse(policy.query as DcqlQuery);
	DcqlQuery.validate(parsedQuery);

	// APPLY AND VALIDATE DCQL

	let credentials = vp.verifiableCredential;
	if (!credentials) {
		return {
			success: false,
		};
	} else if (!Array.isArray(credentials)) {
		credentials = [credentials];
	}

	const parsedCredentials = parseForLibrary(credentials);

	const queryResult = DcqlQuery.query(parsedQuery, parsedCredentials);
	if (!queryResult.can_be_satisfied) {
		return {
			success: false,
			message: "DCQL query could not be satisfied",
		};
	}

	// PARSE AND MAP CLAIMS

	// biome-ignore lint/suspicious/noExplicitAny: Can be anything
	const accessToken: any = {};
	// biome-ignore lint/suspicious/noExplicitAny: Can be anything
	const idToken: any = {};
	let hasParsingError = false;
	for (const mapping of policy.mappings) {
		// biome-ignore lint/suspicious/noExplicitAny: Can be anything
		let value: any;
		if (Object.hasOwn(mapping.claim, "credentialQuery")) {
			// PATH A: value is reference to a dcql claim
			const claim = mapping.claim as ClaimQueryRef;
			value = resolveOperand(claim, queryResult, vp, policy.query);
			if (!value) {
				hasParsingError = true;
				break;
			}
		} else {
			// PATH B: value is static
			const claim = mapping.claim as StaticClaim;
			value = claim.static;
		}

		if (!value) {
			hasParsingError = true;
			break;
		}

		if (Object.hasOwn(mapping, "token") && mapping.token === "id_token") {
			idToken[mapping.out.join(".")] = value;
		} else {
			accessToken[mapping.out.join(".")] = value;
		}
	}

	if (hasParsingError) {
		return {
			success: false,
			message: "Failed parsing and mapping claims",
		};
	}

	// ENFORCE CONSTRAINT

	if (Object.hasOwn(policy, "constraint") && policy.constraint) {
		const constraint = policy.constraint as PresentationConstraint;
		const vpOnly = JSON.parse(JSON.stringify(vp));
		delete vpOnly.verifiableCredential;
		const satisfiesConstraint = checkConstraintHelper(constraint, queryResult, vpOnly, policy.query);
		if (!satisfiesConstraint) {
			return {
				success: false,
				message: "Failed to satisfy constraint",
			};
		}
	}

	return {
		success: true,
		id_token: idToken,
		access_token: accessToken,
	};
};

// This is not ideal, but good enough for testing.
// The dcql library apparently expects some non-standard pre parsed input.
const parseForLibrary = (credentials: VerifiableCredential[]): DcqlW3cVcCredential[] => {
	const parsed = [];
	for (const vc of credentials) {
		parsed.push({
			credential_format: "ldp_vc",
			type: Array.isArray(vc.type) ? vc.type : [vc.type],
			// just dropping in everything so we can have constraints on meta fields like issuer
			claims: vc,
			cryptographic_holder_binding: false, // policy constraints enforce bindings here
		});
	}
	return parsed as unknown as DcqlW3cVcCredential[];
};

const checkConstraintHelper = (
	constraint: PresentationConstraint,
	queryResult: DcqlQueryResult,
	vp: VerifiablePresentation,
	dcql: DcqlQuery,
): boolean => {
	switch (constraint.op) {
		case "and":
		case "or": {
			const clauses = constraint.clauses;
			const results = clauses.map((clause) => checkConstraintHelper(clause, queryResult, vp, dcql));
			return results.reduce((acc, res) => (constraint.op === "and" ? acc && res : acc || res), true);
		}
		case "not":
			return checkConstraintHelper(constraint.clause, queryResult, vp, dcql);
		case "equals":
		case "equalsDID":
		case "matches": {
			const a = resolveOperand(constraint.a, queryResult, vp, dcql);
			const b = resolveOperand(constraint.b, queryResult, vp, dcql);
			if (!a || !b) {
				return false;
			}
			switch (constraint.op) {
				case "equals":
					return a === b;
				case "equalsDID":
					return equalsDID(a, b);
				case "matches":
					return a.match(b) !== null;
			}
		}
	}
};

const resolveOperand = (
	operand: ClaimQueryRef | PresentationRef | string,
	queryResult: DcqlQueryResult,
	vp: VerifiablePresentation,
	dcql: DcqlQuery,
) => {
	const matches = queryResult.credential_matches;
	if (typeof operand === "string") {
		return operand;
	} else if (Object.hasOwn(operand, "credentialQuery")) {
		const ref = operand as ClaimQueryRef;
		const validCredentials = matches[ref.credentialQuery]?.valid_credentials;
		if (!validCredentials) {
			return null;
		}

		const validClaims = validCredentials[0].claims.valid_claims;
		if (!validClaims) {
			return null;
		}

		const output = validClaims.find((obj) => Object.hasOwn(obj, "claim_id") && obj.claim_id === ref.claimQuery)?.output;
		if (!output) {
			return null;
		}

		// biome-ignore lint/suspicious/noExplicitAny: Can be anything
		let value: any = output;
		const dcqlClaim = dcql.credentials
			// biome-ignore lint/suspicious/noExplicitAny: Temporary
			.find((obj: any) => obj.id === ref.credentialQuery)
			// biome-ignore lint/suspicious/noExplicitAny: Temporary
			?.claims?.find((obj: any) => obj.id === ref.claimQuery);
		if (!dcqlClaim || !Object.hasOwn(dcqlClaim, "path")) {
			return null;
		}
		const path = (dcqlClaim as { path: string[] }).path;
		for (const field of path) {
			value = value[field];
		}
		return value;
	} else if (Array.isArray(operand) && !operand.some((value) => typeof value !== "string")) {
		const path = operand as PresentationRef;
		// biome-ignore lint/suspicious/noExplicitAny: Can be anything
		let value: any = vp;
		for (const field of path) {
			value = value[field];
		}
		return value;
	} else {
		return null;
	}
};

const equalsDID = (a: string, b: string) => {
	const whiteList = ["key", "web", "pkh"];
	if (!whiteList.includes(a.split(":")[1])) {
		return false;
	}
	if (!whiteList.includes(b.split(":")[1])) {
		return false;
	}
	const stripDID = (s: string) => {
		s = s.split(":").slice(2).join(":");
		if (s.includes("#")) {
			return s.split("#")[0];
		}
		return s;
	};
	return stripDID(a) === stripDID(b);
};
