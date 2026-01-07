import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export const GetPresentSchema = z.object({
	params: z.object({ id: commonValidations.hex }),
});

export const PostPresentSchema = z.object({
	params: z.object({ id: commonValidations.hex }),
	body: z
		.object({
			vp_token: z.string(),
		})
		.passthrough(),
});
