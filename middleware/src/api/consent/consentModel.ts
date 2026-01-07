import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const GetConsentSchema = z.object({
	query: z.object({ consent_challenge: z.string() }),
});
