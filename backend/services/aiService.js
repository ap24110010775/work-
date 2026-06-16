import { applicationDao } from '../database/applicationDao.js';
import { jobDao } from '../database/jobDao.js';
import { profileDao } from '../database/profileDao.js';
import { aiTransformer } from '../transformations/aiTransformer.js';
import { matchService } from './matchService.js';

export const aiService = {
  async getAtsScore(jobId, applicationId) {
    const job = await jobDao.getById(jobId);
    if (!job) throw new Error('Job not found');

    const app = await applicationDao.getById(applicationId);
    if (!app) throw new Error('Application not found');

    // Fetch the candidate's profile to get skills and bio
    const profile = await profileDao.getByUserId(app.candidateId);
    const candidateData = `
      Cover Letter: ${app.coverLetter || 'None'}
      Bio: ${profile ? profile.bio : 'None'}
      Skills: ${profile && profile.skills ? JSON.stringify(profile.skills) : 'None'}
      Experience: ${profile && profile.experience ? JSON.stringify(profile.experience) : 'None'}
    `;

    const jobData = `
      Title: ${job.title}
      Description: ${job.description}
      Requirements: ${job.requirements || 'None'}
    `;

    const prompt = `
      You are an expert ATS (Applicant Tracking System) built for HR professionals.
      Analyze the following candidate profile against the job description.
      Provide a strict JSON response containing:
      1. "score": An integer from 0 to 100 representing the match percentage.
      2. "matches": An array of strings highlighting the candidate's matching skills/experience.
      3. "improvements": An array of strings highlighting missing skills or weaknesses.
      4. "summary": A 2-sentence summary of why this candidate is or isn't a good fit.

      Candidate Data:
      ${candidateData}

      Job Data:
      ${jobData}

      Return ONLY the JSON. No markdown formatting outside of the JSON block.
    `;

    return this.callGeminiApi(prompt, aiTransformer.toAtsScoreResponse);
  },

  async getRecommendations(jobId) {
    const job = await jobDao.getById(jobId);
    if (!job) throw new Error('Job not found');

    const ranked = await matchService.rankCandidatesForJob(jobId);
    return ranked.map(({ applicationId, rank, matchPercent, reason, rankLabel, candidateName }) => ({
      applicationId,
      rank,
      matchPercent,
      rankLabel,
      candidateName,
      reason,
    }));
  },

  async callGeminiApi(prompt, transformerFunc) {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      console.warn('AI_API_KEY is not set. Returning mock AI data.');
      return this.generateLocalScore(prompt, transformerFunc);
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 }
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error(`Gemini API error ${response.status}:`, errBody);
        console.warn('Falling back to local AI scoring...');
        return this.generateLocalScore(prompt, transformerFunc);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return transformerFunc(rawText);
    } catch (error) {
      console.error('Gemini API call failed:', error.message);
      console.warn('Falling back to local AI scoring...');
      return this.generateLocalScore(prompt, transformerFunc);
    }
  },

  // Smart local scoring engine — works without any API key
  generateLocalScore(prompt, transformerFunc) {
    const promptLower = prompt.toLowerCase();

    // Extract skills from the prompt text
    const allSkills = ['react', 'node', 'javascript', 'typescript', 'python', 'java', 'sql', 'html', 'css', 
      'express', 'mongodb', 'mysql', 'aws', 'docker', 'git', 'angular', 'vue', 'next.js', 'tailwind',
      'rest', 'api', 'graphql', 'redis', 'linux', 'agile', 'scrum', 'figma', 'photoshop'];
    
    const candidateSection = promptLower.split('job data:')[0] || '';
    const jobSection = promptLower.split('job data:')[1] || '';
    
    const candidateSkills = allSkills.filter(s => candidateSection.includes(s));
    const jobSkills = allSkills.filter(s => jobSection.includes(s));
    
    const matchedSkills = candidateSkills.filter(s => jobSkills.includes(s));
    const missingSkills = jobSkills.filter(s => !candidateSkills.includes(s));
    
    const score = jobSkills.length > 0 
      ? Math.round((matchedSkills.length / jobSkills.length) * 100) 
      : Math.floor(Math.random() * 30) + 50; // Random 50-80 if no skills found

    const result = JSON.stringify({
      score: Math.min(score, 100),
      matches: matchedSkills.length > 0 ? matchedSkills.map(s => `Has ${s.toUpperCase()} experience`) : ['Candidate profile available'],
      improvements: missingSkills.length > 0 ? missingSkills.map(s => `Missing ${s.toUpperCase()} skill`) : ['Complete your profile for better scoring'],
      strengths: matchedSkills.length > 0 ? matchedSkills.map(s => `Has ${s.toUpperCase()} experience`) : ['Candidate profile available'],
      weaknesses: missingSkills.length > 0 ? missingSkills.map(s => `Missing ${s.toUpperCase()} skill`) : ['Complete your profile for better scoring'],
      summary: `Candidate matches ${matchedSkills.length} out of ${jobSkills.length} required skills. ${score >= 70 ? 'Strong candidate worth interviewing.' : 'May need additional training or experience.'}`
    });

    return transformerFunc(result);
  }
};
