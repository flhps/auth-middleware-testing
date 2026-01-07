import { DcqlQuery } from "dcql";
import { z } from "zod";
import { commonValidations } from "@/common/utils/commonValidation";

// for referencing things in vcs based on already dcql selected claims
export const ClaimQueryRefSchema = z.object({
	credentialQuery: commonValidations.idString, // id of the dcql credential entry
	claimQuery: commonValidations.idString,
});
export type ClaimQueryRef = z.infer<typeof ClaimQueryRefSchema>;

// for injecting static data into tokens as part of mappings
export const StaticClaimSchema = z.object({
	static: z.string(),
});
export type StaticClaim = z.infer<typeof StaticClaimSchema>;

// for referencing anything in the vp
export const PresentationRefSchema = z.string().array();
export type PresentationRef = z.infer<typeof PresentationRefSchema>;

export type LogicalConstraint = {
	op: "and" | "or";
	clauses: Array<PresentationConstraint>;
};

export type NotConstraint = {
	op: "not";
	clause: PresentationConstraint;
};

export type ComparisonConstraint = {
	op: "equals" | "equalsDID" | "matches";
	a: ClaimQueryRef | PresentationRef;
	b: ClaimQueryRef | PresentationRef | string;
};

export type PresentationConstraint = LogicalConstraint | NotConstraint | ComparisonConstraint;
export const PresentationConstraintSchema: z.ZodType<PresentationConstraint> = z.lazy(() =>
	z.union([
		z.object({
			op: z.enum(["and", "or"]),
			clauses: PresentationConstraintSchema.array(),
		}),
		z.object({
			op: z.literal("not"),
			clause: PresentationConstraintSchema,
		}),
		z.object({
			op: z.enum(["equals", "equalsDID", "matches"]),
			a: z.union([ClaimQueryRefSchema, PresentationRefSchema]),
			b: z.union([ClaimQueryRefSchema, PresentationRefSchema, z.string()]),
		}),
	]),
);

export const ClaimMappingSchema = z.object({
	// first resolved one is mapped (compensates for different possible credentials selected by dcql in more complex queries)
	claim: z.union([ClaimQueryRefSchema, ClaimQueryRefSchema.array(), StaticClaimSchema]),
	out: z.string().array(),
	token: z.enum(["id_token", "access_token"]).optional(),
});
export type ClaimMapping = z.infer<typeof ClaimMappingSchema>;

export const AuthPolicySchema = z.object({
	version: z.number(),
	description: z.string().optional(),
	query: z.any().refine((dcql) => {
		try {
			DcqlQuery.validate(DcqlQuery.parse(dcql as DcqlQuery));
			// TODO: validate that all claims have ids (we are stricter than spec)
		} catch (_err) {
			return false;
		}
		return true;
	}),
	mappings: z.array(ClaimMappingSchema),
	constraint: PresentationConstraintSchema.optional(),
});
export type AuthPolicy = z.infer<typeof AuthPolicySchema>;

export const PolicyResultSchema = z.object({
	success: z.boolean(),
	id_token: z.any().optional(),
	access_token: z.any().optional(),
	message: z.string().optional(),
});
export type PolicyResult = z.infer<typeof PolicyResultSchema>;
