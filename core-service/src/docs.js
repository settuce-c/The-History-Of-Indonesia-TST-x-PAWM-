'use strict';
const fs = require('fs');
const path = require('path');

const SPEC_PATH = path.resolve(__dirname, '../openapi.yaml');

/** Swagger UI di /api/docs dan spesifikasi mentah di /api/openapi.yaml. */
function mountDocs(app) {
  if (!fs.existsSync(SPEC_PATH)) return;
  const YAML = require('yaml');
  const swaggerUi = require('swagger-ui-express');
  const raw = fs.readFileSync(SPEC_PATH, 'utf8');
  const spec = YAML.parse(raw);

  app.get('/api/openapi.yaml', (req, res) => res.type('text/yaml').send(raw));
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      customSiteTitle: 'TheHistoryOfIndonesia API',
      swaggerOptions: { persistAuthorization: true },
    })
  );
}

module.exports = { mountDocs };
