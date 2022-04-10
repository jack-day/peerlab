import { Router } from 'express';
import fs from 'fs';
import YAML from 'yaml';
import { serve, setup, JsonObject, SwaggerUiOptions } from 'swagger-ui-express';

/** Assign values to an Object, but combine any values that are both objects */
function objectComine(target: JsonObject, source: JsonObject): void {
    for (const [key, value] of Object.entries(source)) {
        if (target[key] && typeof target[key] === 'object' && typeof value === 'object') {
            objectComine(target[key], value);
        } else {
            target[key] = value;
        }
    }
}

/**
 * Apply custom YAML file imports
 * - Identify $import properites
 * - Import yaml at same depth level as $import
 * - Delete $import property
 * 
 * Custom import properties have the key '$import' and hold the import filename(s) as their value,
 * for example: $import: example/swagger.yml
 * 
 * @param yml Parsed YAML file object
 */
function applyImports(yml: JsonObject): void {
    /* eslint-disable-next-line prefer-const */
    for (let [key, value] of Object.entries(yml)) {
        if (typeof value === 'object' && !Array.isArray(value)) {
            applyImports(value);
        } else if (key === '$import') {
            if (typeof value === 'string') value = [value];

            for (const file of value) {
                const importedYml = YAML.parse(fs.readFileSync('src/' + file, 'utf8'));
                applyImports(importedYml);
                objectComine(yml, importedYml);
            }

            delete(yml[key]);
        }
    }
}

const router = Router();
const swaggerDocument: JsonObject = YAML.parse(fs.readFileSync('src/swagger/index.yml', 'utf8'));
const options: SwaggerUiOptions = {
    customJs: '/js/swagger.js',
};

applyImports(swaggerDocument);
router.use('/', serve, setup(swaggerDocument, options));

export default router;
