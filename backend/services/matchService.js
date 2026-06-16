import { jobDao } from '../database/jobDao.js';
import { profileDao } from '../database/profileDao.js';

const SKILL_KEYWORDS = [
  'react', 'node', 'nodejs', 'node.js', 'javascript', 'typescript', 'python', 'java', 'sql',
  'html', 'css', 'express', 'mongodb', 'mysql', 'aws', 'docker', 'git', 'angular', 'vue',
  'next.js', 'nextjs', 'tailwind', 'rest', 'api', 'graphql', 'redis', 'linux', 'agile',
  'scrum', 'figma', 'photoshop', 'spring', 'django', 'flask', 'kubernetes', 'azure', 'gcp',
  'c++', 'c#', 'go', 'golang', 'rust', 'php', 'laravel', 'ruby', 'rails', 'swift', 'kotlin',
  'machine learning', 'data science', 'tensorflow', 'pytorch', 'excel', 'power bi', 'tableau',
  'communication', 'leadership', 'problem solving', 'testing', 'jest', 'cypress', 'selenium',
];

export function extractSkillsFromText(text = '') {
  const lower = text.toLowerCase();
  return SKILL_KEYWORDS.filter((skill) => lower.includes(skill));
}

export function calculateMatchPercent(candidateSkills, jobText) {
  const jobSkills = extractSkillsFromText(jobText);
  if (jobSkills.length === 0) return 50;

  const normalizedCandidate = candidateSkills.map((s) => s.toLowerCase());
  const matched = jobSkills.filter((skill) =>
    normalizedCandidate.some((c) => c.includes(skill) || skill.includes(c))
  );

  return Math.min(100, Math.round((matched.length / jobSkills.length) * 100));
}

export function suggestSkills(query = '', limit = 8) {
  const q = query.trim().toLowerCase();
  if (!q) {
    return SKILL_KEYWORDS.slice(0, limit).map((s) =>
      s.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    );
  }

  return SKILL_KEYWORDS
    .filter((skill) => skill.includes(q))
    .slice(0, limit)
    .map((s) => s.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
}

export function calculateProfileCompletion(profile) {
  const checks = [
    !!profile?.name && profile.name.trim().length > 2,
    !!profile?.bio && profile.bio.trim().length >= 20,
    Array.isArray(profile?.skills) && profile.skills.length >= 3,
    !!profile?.resumeUrl && !String(profile.resumeUrl).startsWith('blob:'),
    !!profile?.portfolioUrl && profile.portfolioUrl.startsWith('http'),
    Array.isArray(profile?.education) && profile.education.length > 0,
    profile?.experience && Object.keys(profile.experience).length > 0,
  ];

  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

export const matchService = {
  async getCandidateJobMatches(candidateId) {
    const profile = await profileDao.getByUserId(candidateId);
    const skills = Array.isArray(profile?.skills)
      ? profile.skills
      : typeof profile?.skills === 'string'
        ? JSON.parse(profile.skills || '[]')
        : [];

    const jobs = await jobDao.getAllActive();

    return jobs
      .map((job) => {
        const jobText = `${job.title} ${job.description || ''} ${job.requirements || ''}`;
        const matchPercent = calculateMatchPercent(skills, jobText);
        const matchedSkills = extractSkillsFromText(jobText).filter((skill) =>
          skills.some((s) => s.toLowerCase().includes(skill) || skill.includes(s.toLowerCase()))
        );

        return {
          jobId: job.id,
          matchPercent,
          matchedSkills: matchedSkills.slice(0, 6),
          isTopMatch: matchPercent >= 70,
        };
      })
      .sort((a, b) => b.matchPercent - a.matchPercent);
  },

  async rankCandidatesForJob(jobId) {
    const job = await jobDao.getById(jobId);
    if (!job) throw new Error('Job not found');

    const { applicationDao } = await import('../database/applicationDao.js');
    const applications = await applicationDao.getByJob(jobId);
    if (applications.length === 0) return [];

    const jobText = `${job.title} ${job.description || ''} ${job.requirements || ''}`;

    const ranked = await Promise.all(
      applications.map(async (app) => {
        const profile = await profileDao.getByUserId(app.candidateId);
        const skills = Array.isArray(profile?.skills)
          ? profile.skills
          : typeof profile?.skills === 'string'
            ? JSON.parse(profile.skills || '[]')
            : [];

        const candidateText = `${skills.join(' ')} ${profile?.bio || ''} ${app.coverLetter || ''}`;
        const matchPercent = calculateMatchPercent(skills, jobText);
        const matchedSkills = extractSkillsFromText(jobText).filter((skill) =>
          candidateText.toLowerCase().includes(skill)
        );

        return {
          applicationId: app.id,
          candidateId: app.candidateId,
          candidateName: app.candidateName,
          status: app.status,
          matchPercent,
          matchedSkills: matchedSkills.slice(0, 5),
          rankLabel: matchPercent >= 90 ? 'Top 1%' : matchPercent >= 80 ? 'Top 5%' : matchPercent >= 70 ? 'Top 10%' : 'Match',
          reason: matchedSkills.length
            ? `Strong fit on ${matchedSkills.slice(0, 3).join(', ')}`
            : 'Limited skill overlap with job requirements',
        };
      })
    );

    return ranked
      .sort((a, b) => b.matchPercent - a.matchPercent)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  },

  suggestSkills,
  calculateProfileCompletion,
};
