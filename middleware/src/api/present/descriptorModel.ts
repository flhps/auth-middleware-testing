import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const FieldsSchema = z.object({
	path: z.array(z.string()),
	filter: z
		.object({
			type: z.string(),
			pattern: z.string(),
		})
		.optional(),
});
export type Fields = z.infer<typeof FieldsSchema>;

export const ConstraintsSchema = z.object({
	fields: z.array(FieldsSchema).optional(),
});
export type Constraints = z.infer<typeof ConstraintsSchema>;

export const InputDescriptorSchema = z.object({
	id: z.string(),
	purpose: z.string(),
	name: z.string(),
	group: z.array(z.string()).optional(),
	constraints: ConstraintsSchema,
});
export type InputDescriptor = z.infer<typeof InputDescriptorSchema>;

export const InputDescriptorsSchema = z.array(InputDescriptorSchema);
export type InputDescriptors = z.infer<typeof InputDescriptorsSchema>;

export const PresentationDefinitionSchema = z.object({
	id: z.string(),
	name: z.string(),
	purpose: z.string(),
	format: z.object({
		ldp_vc: z.object({
			proof_type: z.string().array(),
		}),
		ldp_vp: z.object({
			proof_type: z.string().array(),
		}),
	}),
	input_descriptors: InputDescriptorsSchema,
	submission_requirements: z
		.array(
			z.object({
				rule: z.string(),
				count: z.number(),
				from: z.string(),
			}),
		)
		.optional(),
});
export type PresentationDefinition = z.infer<typeof PresentationDefinitionSchema>;
