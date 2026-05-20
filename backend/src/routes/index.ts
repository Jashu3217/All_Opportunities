import { Router } from 'express';
import {
  getSdeModule, getResumeModule, getGovtModule, refreshGovtOrg,
  getTeachModule, getFreelanceModule, getHealth, getStats,
} from '../controllers/modules.controller';

const router = Router();

// ── Health & meta ─────────────────────────────────────────────────────────────
router.get('/health',        getHealth);
router.get('/stats',         getStats);

// ── Module endpoints ──────────────────────────────────────────────────────────
// GET /api/modules/sde?location=hyderabad
router.get('/modules/sde',       getSdeModule);
// GET /api/modules/resume?location=hyderabad
router.get('/modules/resume',    getResumeModule);
// GET /api/modules/govt?refresh=true
router.get('/modules/govt',      getGovtModule);
// POST /api/modules/govt/:orgId/refresh  — refresh a single org
router.post('/modules/govt/:orgId/refresh', refreshGovtOrg);
// GET /api/modules/teach
router.get('/modules/teach',     getTeachModule);
// GET /api/modules/freelance
router.get('/modules/freelance', getFreelanceModule);

export default router;
