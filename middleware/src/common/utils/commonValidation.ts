import { z } from "zod";

export const commonValidations = {
	hex: z.string().regex(/[0-9A-Fa-f]+/g, "Challenge must be a hex value"),
	idString: z.string().regex(/[0-9A-Za-z_-]+/g, "IDs must have no spaces and no special characters"),
};
