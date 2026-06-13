import { Router } from 'express';
import multer from 'multer';
import {
  getSdeModule, getResumeModule, getGovtModule, refreshGovtOrg,
  getTeachModule, getFreelanceModule, getHealth, getStats,
} from '../controllers/modules.controller';
import { uploadResume, getPersonalizedJobs } from '../controllers/resume.controller';
import { scanModule, tailorCVForJob, generateCoverLetterForJob, generateInterviewPrepForJob } from '../controllers/scanner.controller';
import { addApplication, getApplications, updateApplication, deleteApplication, getTrackerStats } from '../controllers/tracker.controller';
import { createAlert, unsubscribeAlert, sendTestAlert } from '../controllers/alerts.controller';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
});

// ── Health & meta ─────────────────────────────────────────────────────────────
router.get('/health', getHealth);
router.get('/stats',  getStats);

// ── Resume ────────────────────────────────────────────────────────────────────
router.post('/resume/upload',      upload.single('resume'), uploadResume);
router.post('/resume/personalize', getPersonalizedJobs);

// ── AI Live Scanner ───────────────────────────────────────────────────────────
router.get('/scan/:moduleId', scanModule);

// ── AI Documents ──────────────────────────────────────────────────────────────
router.post('/documents/tailor-cv',      tailorCVForJob);
router.post('/documents/cover-letter',   generateCoverLetterForJob);
router.post('/documents/interview-prep', generateInterviewPrepForJob);

// ── Application Tracker ───────────────────────────────────────────────────────
router.get('/tracker',           getApplications);
router.get('/tracker/stats',     getTrackerStats);
router.post('/tracker',          addApplication);
router.put('/tracker/:id',       updateApplication);
router.delete('/tracker/:id',    deleteApplication);

// ── Job Alerts ────────────────────────────────────────────────────────────────
router.post('/alerts',            createAlert);
router.post('/alerts/unsubscribe',unsubscribeAlert);
router.post('/alerts/test',       sendTestAlert);

// ── Static module endpoints ───────────────────────────────────────────────────
router.get('/modules/sde',       getSdeModule);
router.get('/modules/resume',    getResumeModule);
router.get('/modules/govt',      getGovtModule);
router.post('/modules/govt/:orgId/refresh', refreshGovtOrg);
router.get('/modules/teach',     getTeachModule);
router.get('/modules/freelance', getFreelanceModule);

export default router;
