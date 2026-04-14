const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
// Import the Candidate model at the very top of routes/jobs.js
const Candidate = require('../models/Candidate');
const HRAdmin = require('../models/HRAdmin');

// 1. Import your bouncer (Middleware)
const verifyToken = require('../middleware/verifyToken'); 

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

function formatJobForClient(jobDoc) {
  const job = typeof jobDoc.toObject === 'function' ? jobDoc.toObject() : jobDoc;
  const owner =
    job.adminId && typeof job.adminId === 'object' && !Array.isArray(job.adminId)
      ? job.adminId
      : null;

  return {
    ...job,
    adminId: owner?._id || job.adminId,
    companyName: job.companyName || owner?.companyName || 'Independent Hiring Team',
    hrEmail: job.hrEmail || owner?.email || null
  };
}

async function getOwnedJob(jobId, adminId) {
  return Job.findOne({ _id: jobId, adminId });
}

// 2. The POST route to create a new job
router.post('/', verifyToken, async (req, res) => {
  try {
    if (!req.body.title || !req.body.description) {
      return res.status(400).json({ error: "Title and description are required." });
    }

    const admin = await HRAdmin.findById(req.admin.adminId).select('companyName email');
    if (!admin) {
      return res.status(404).json({ error: "HR Admin account not found." });
    }

    const newJob = new Job({
      title: req.body.title,
      description: req.body.description,
      requiredSkills: normalizeStringArray(req.body.requiredSkills),
      interviewTopics: normalizeStringArray(req.body.interviewTopics),
      companyName: admin.companyName || null,
      hrEmail: admin.email || null,
      adminId: req.admin.adminId // Safely grabbing from the verified cookie
    });

    await newJob.save();
    res.status(201).json({ message: "Job successfully created!", job: formatJobForClient(newJob) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create job." });
  }
});
// GET /api/jobs - Fetch all active jobs for the public career page
router.get('/', async (req, res) => {
  try {
    // .sort({ createdAt: -1 }) puts the newest jobs at the top
    const jobs = await Job.find()
      .populate('adminId', 'companyName email')
      .sort({ createdAt: -1 });
    res.status(200).json(jobs.map(formatJobForClient));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch jobs." });
  }
});

// GET /api/jobs/stats/dashboard - Get HR Analytics
router.get('/stats/dashboard', verifyToken, async (req, res) => {
  try {
    const adminId = req.admin.adminId;

    // 1. Find all jobs created by this specific HR Admin
    const myJobs = await Job.find({ adminId: adminId }).sort({ createdAt: -1 });
    const jobIds = myJobs.map(job => job._id);
    const jobTitleMap = new Map(
      myJobs.map((job) => [job._id.toString(), { title: job.title, companyName: job.companyName }])
    );

    // 2. Find all candidates who applied to ANY of those jobs
    const candidates = await Candidate.find({ appliedJobId: { $in: jobIds } }).sort({ appliedAt: -1 });

    // 3. Calculate the stats
    const totalJobs = myJobs.length;
    const totalApplicants = candidates.length;
    
    // Calculate average ATS Match Score (ignoring candidates who haven't been scored yet)
    const scoredCandidates = candidates.filter(c => c.atsMatchScore !== null);
    let avgScore = 0;
    if (scoredCandidates.length > 0) {
      const totalScore = scoredCandidates.reduce((sum, c) => sum + c.atsMatchScore, 0);
      avgScore = (totalScore / scoredCandidates.length).toFixed(1);
    }

    res.status(200).json({
      totalJobs,
      totalApplicants,
      averageMatchScore: avgScore,
      recentActivity: candidates.slice(0, 5).map((candidate) => {
        const linkedJob = jobTitleMap.get(candidate.appliedJobId.toString());
        return {
          ...candidate.toObject(),
          jobTitle: linkedJob?.title || null,
          companyName: linkedJob?.companyName || null
        };
      })
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load analytics dashboard." });
  }
});

// GET /api/jobs/mine - Fetch only jobs owned by the logged-in HR admin
router.get('/mine', verifyToken, async (req, res) => {
  try {
    const jobs = await Job.find({ adminId: req.admin.adminId })
      .populate('adminId', 'companyName email')
      .sort({ createdAt: -1 });

    res.status(200).json(jobs.map(formatJobForClient));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch your jobs." });
  }
});

// GET /api/jobs/:jobId - Fetch a single job's details
router.get('/:jobId', async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId).populate('adminId', 'companyName email');
    if (!job) {
      return res.status(404).json({ error: "Job not found." });
    }
    res.status(200).json(formatJobForClient(job));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch job details." });
  }
});
// GET /api/jobs/:jobId/candidates - Fetch the ranked leaderboard
router.get('/:jobId/candidates', verifyToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const ownedJob = await getOwnedJob(jobId, req.admin.adminId);

    if (!ownedJob) {
      return res.status(403).json({ error: "Unauthorized to view candidates for this job." });
    }

    // Find all candidates who applied for this specific job
    // .sort({ atsMatchScore: -1 }) puts the highest scores at the very top!
    const candidates = await Candidate.find({ appliedJobId: jobId })
      .select('-resumeText') // We exclude the massive resume text to make the API faster
      .sort({ atsMatchScore: -1 });

    res.status(200).json(candidates);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch candidates." });
  }
});

// PUT /api/jobs/:jobId - Update a job posting
router.put('/:jobId', verifyToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ error: "Job not found." });

    // Security Check: Make sure this admin actually owns this job
    if (job.adminId.toString() !== req.admin.adminId) {
      return res.status(403).json({ error: "Unauthorized to edit this job." });
    }

    const admin = await HRAdmin.findById(req.admin.adminId).select('companyName email');
    if (!admin) {
      return res.status(404).json({ error: "HR Admin account not found." });
    }

    // Only update fields that were actually submitted.
    const allowedUpdates = {
      companyName: admin.companyName || null,
      hrEmail: admin.email || null
    };

    if (Object.prototype.hasOwnProperty.call(req.body, 'title')) {
      allowedUpdates.title = req.body.title;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'description')) {
      allowedUpdates.description = req.body.description;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'requiredSkills')) {
      allowedUpdates.requiredSkills = normalizeStringArray(req.body.requiredSkills);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'interviewTopics')) {
      allowedUpdates.interviewTopics = normalizeStringArray(req.body.interviewTopics);
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.jobId, 
      { $set: allowedUpdates }, 
      { new: true }
    );
    res.status(200).json({ message: "Job updated!", job: formatJobForClient(updatedJob) });
  } catch (error) {
    res.status(500).json({ error: "Failed to update job." });
  }
});

// DELETE /api/jobs/:jobId - Delete a job posting
router.delete('/:jobId', verifyToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ error: "Job not found." });

    if (job.adminId.toString() !== req.admin.adminId) {
      return res.status(403).json({ error: "Unauthorized to delete this job." });
    }

    await Job.findByIdAndDelete(req.params.jobId);
    res.status(200).json({ message: "Job successfully deleted." });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete job." });
  }
});
// DELETE /api/jobs/:jobId/candidates/:candidateId — Remove a candidate record
router.delete('/:jobId/candidates/:candidateId', verifyToken, async (req, res) => {
  try {
    const { jobId, candidateId } = req.params;
    const ownedJob = await getOwnedJob(jobId, req.admin.adminId);

    if (!ownedJob) {
      return res.status(403).json({ error: "Unauthorized to manage candidates for this job." });
    }

    // Confirm the candidate actually belongs to this job (prevent cross-job deletion)
    const candidate = await Candidate.findOne({ _id: candidateId, appliedJobId: jobId });
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found for this job." });
    }

    await Candidate.findByIdAndDelete(candidateId);
    console.log(`[DB DELETE] Candidate '${candidate.name}' (${candidateId}) deleted by admin ${req.admin.adminId}`);

    res.status(200).json({ message: "Candidate successfully deleted.", candidateId });
  } catch (error) {
    console.error("[DB DELETE] Error deleting candidate:", error.message);
    res.status(500).json({ error: "Failed to delete candidate." });
  }
});

// IMPORTANT: You must export the router so server.js can read it!
module.exports = router;
