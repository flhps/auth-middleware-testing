import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const GetMetadataSchema = z.object({
	params: z.object({ id: z.string() }),
});
