import { Router } from 'express';
import multer from 'multer';
import {
  getSdeModule, getResumeModule, getGovtModule, refreshGovtOrg,
  getTeachModule, getFreelanceModule, getHealth, getStats,
} from '../controllers/modules.controller';
import { uploadResume, getPersonalizedJobs } from '../controllers/resume.controller';
import {
  scanModule, tailorCVForJob, generateCoverLetterForJob, generateInterviewPrepForJob,
} from '../controllers/scanner.controller';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// ── Health & meta ─────────────────────────────────────────────────────────────
router.get('/health', getHealth);
router.get('/stats',  getStats);

// ── Resume upload & personalization ──────────────────────────────────────────
router.post('/resume/upload',      upload.single('resume'), uploadResume);
router.post('/resume/personalize', getPersonalizedJobs);

// ── AI Live Scanner ───────────────────────────────────────────────────────────
// GET /api/scan/:moduleId?location=hyderabad&refresh=true
router.get('/scan/:moduleId', scanModule);

// ── AI Document Generation ────────────────────────────────────────────────────
router.post('/documents/tailor-cv',        tailorCVForJob);
router.post('/documents/cover-letter',     generateCoverLetterForJob);
router.post('/documents/interview-prep',   generateInterviewPrepForJob);

// ── Static module endpoints (fallback when no API key) ───────────────────────
router.get('/modules/sde',       getSdeModule);
router.get('/modules/resume',    getResumeModule);
router.get('/modules/govt',      getGovtModule);
router.post('/modules/govt/:orgId/refresh', refreshGovtOrg);
router.get('/modules/teach',     getTeachModule);
router.get('/modules/freelance', getFreelanceModule);

export default router;
