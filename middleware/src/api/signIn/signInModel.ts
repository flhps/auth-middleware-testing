import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { string, z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export const GetSignInSchema = z.object({
	query: z.object({ login_challenge: z.string() }),
});
