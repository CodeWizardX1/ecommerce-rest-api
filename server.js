// server.js  (ESM)
import dotenv from 'dotenv';
dotenv.config();

import express, { json } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Routers (CJS modules work via default import interop) ---
import authRouter from './src/routes/auth.js';
import usersRouter from './src/routes/users.js';
import productsRouter from './src/routes/products.js';
import cartRouter from './src/routes/cart.js';
import ordersRouter from './src/routes/orders.js';

const app = express();
app.use(json());

// Resolve openapi.yaml relative to this file so it works regardless of CWD
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDocument = YAML.load(path.join(__dirname, 'openapi.yaml'));

// Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/docs.json', (_req, res) => res.json(swaggerDocument));

// Health (quick db-less ping)
app.get('/health', (_req, res) => res.json({ ok: true, now: new Date().toISOString() }));

// API base
const api = express.Router();
app.use('/api/v1', api);

// Mount feature routers
api.use('/auth', authRouter);
api.use('/users', usersRouter);
api.use('/products', productsRouter);
api.use('/cart', cartRouter);
api.use('/orders', ordersRouter);

// Debug route to confirm base is mounted
api.get('/_whoami', (_req, res) => res.json({ base: '/api/v1', routes: ['auth','users','products','cart','orders'] }));

// Root
app.get('/', (_req, res) => res.send('API is running'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
