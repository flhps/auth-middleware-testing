import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

/**
 * This schema is not perfect, but a lot better than nothing.
 */

const ContextSchema = z.union([z.string(), z.array(z.union([z.string(), z.record(z.unknown())]))]);

const TypeSchema = z.union([z.string(), z.array(z.string())]);

const ISODateString = z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
	message: "Invalid date string",
});

const ProofSchema = z
	.object({
		type: z.string(),
		created: ISODateString.optional(),
		proofPurpose: z.string().optional(),
		verificationMethod: z.string().optional(),
		jws: z.string().optional(),
		proofValue: z.string().optional(),
		domain: z.string().optional(),
		challenge: z.string().optional(),
		nonce: z.string().optional(),
	})
	.passthrough();

const CredentialSubjectSchema = z.union([z.record(z.unknown()), z.array(z.record(z.unknown()))]);

const CredentialStatusSchema = z
	.object({
		id: z.string(),
		type: z.string(),
	})
	.passthrough();

export const VerifiableCredentialSchema = z
	.object({
		"@context": ContextSchema,
		id: z.string().url().optional(),
		type: TypeSchema,
		issuer: z.union([
			z.string(),
			z
				.object({
					id: z.string(),
				})
				.passthrough(),
		]),
		issuanceDate: ISODateString,
		expirationDate: ISODateString.optional(),
		credentialSubject: CredentialSubjectSchema,
		credentialStatus: CredentialStatusSchema.optional(),
		proof: z.union([ProofSchema, z.array(ProofSchema)]),
	})
	.passthrough();

export type VerifiableCredential = z.infer<typeof VerifiableCredentialSchema>;

export const VerifiablePresentationSchema = z
	.object({
		"@context": ContextSchema,
		type: TypeSchema,
		id: z.string().optional(),
		holder: z.string().optional(),
		verifiableCredential: z.union([VerifiableCredentialSchema, z.array(VerifiableCredentialSchema)]).optional(),
		proof: z.union([ProofSchema, z.array(ProofSchema)]),
	})
	.passthrough();

export type VerifiablePresentation = z.infer<typeof VerifiablePresentationSchema>;
