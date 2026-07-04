import { Router } from 'express';
import { openApiDocument } from './openapi';

const docsRouter = Router();

docsRouter.get('/openapi.json', (_req, res): void => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.json(openApiDocument);
});

docsRouter.get('/docs', (_req, res): void => {
    res.type('html').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Asset Pilot API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/openapi.json?v=' + Date.now(),
        dom_id: '#swagger-ui',
        deepLinking: true,
        docExpansion: 'list'
      });
    </script>
  </body>
</html>`);
});

export default docsRouter;
