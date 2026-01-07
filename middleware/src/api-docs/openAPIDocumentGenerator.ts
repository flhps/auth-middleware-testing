import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { consentRegistry } from "@/api/consent/consentRouter";
import { healthCheckRegistry } from "@/api/healthCheck/healthCheckRouter";
import { metadataRegistry } from "@/api/metadata/metadataRouter";
import { presentRegistry } from "@/api/present/presentRouter";
import { signInRegistry } from "@/api/signIn/signInRouter";

export type OpenAPIDocument = ReturnType<OpenApiGeneratorV3["generateDocument"]>;

export function generateOpenAPIDocument(): OpenAPIDocument {
	const registry = new OpenAPIRegistry([
		healthCheckRegistry,
		signInRegistry,
		presentRegistry,
		consentRegistry,
		metadataRegistry,
	]);
	const generator = new OpenApiGeneratorV3(registry.definitions);

	return generator.generateDocument({
		openapi: "3.0.0",
		info: {
			version: "1.0.0",
			title: "Swagger API",
		},
		externalDocs: {
			description: "View the raw OpenAPI Specification in JSON format",
			url: "/swagger.json",
		},
	});
}
