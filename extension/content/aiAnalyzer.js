/**
 * AI Analyzer - Integrates with OpenRouter for job matching and tailoring
 */

const AIAnalyzer = {
    /**
     * Calculate match score using OpenRouter
     */
    async calculateMatchScore(profile, jobDescription, preferences = {}) {
        const apiKey = await this.getApiKey();
        if (!apiKey) return this.fallbackMatchScore(profile, jobDescription);

        try {
            const { requiresSponsorship, maxExperience } = preferences;
            const prompt = `
        Compare this user profile with the job description.
        User Profile: ${JSON.stringify(profile)}
        Job Description: ${jobDescription}
        
        CRITICAL EVALUATION:
        ${requiresSponsorship ? "- User REQUIRES visa sponsorship (H1-B/OPT). Scan description for 'sponsorship', 'H1B', 'visa'. If they explicitly state 'No sponsorship provided' or 'Must be US Citizen/GC', set score to 0." : ""}
        ${maxExperience !== undefined ? `- User is looking for jobs requiring ~${maxExperience} years or less. Deduct points heavily if role is 'Senior' or requires > ${maxExperience + 2} years.` : ""}

        Return ONLY a JSON object with:
        {
          "score": (0-100),
          "reasoning": "Brief 1-sentence explanation focusing on fit and sponsorship if applicable",
          "matchingSkills": ["skill1", "skill2"],
          "missingSkills": ["skill1", "skill2"]
        }
      `;

            const response = await this.callAI(apiKey, prompt);
            return JSON.parse(response);
        } catch (error) {
            console.error('AI Match Error:', error);
            return this.fallbackMatchScore(profile, jobDescription);
        }
    },

    /**
     * Generate tailored cover letter using OpenRouter
     */
    async generateTailoredCoverLetter(profile, jobDetails) {
        const apiKey = await this.getApiKey();
        if (!apiKey) return null;

        try {
            const prompt = `
        Generate a professional, tailored cover letter for this job.
        Job: ${jobDetails.title} at ${jobDetails.company}
        User Resume/Profile: ${JSON.stringify(profile)}
        Tone: Professional, enthusiastic, concise.
        Length: 200-300 words.
      `;

            return await this.callAI(apiKey, prompt);
        } catch (error) {
            console.error('AI Cover Letter Error:', error);
            return null;
        }
    },

    /**
     * Generate answer for a specific form question
     */
    async generateAnswer(question, profile, jobDescription = '') {
        const apiKey = await this.getApiKey();
        if (!apiKey) return null;

        try {
            // 1. Resolve Job Description (passed vs stored)
            let finalJD = jobDescription;
            if (!finalJD || finalJD.length < 100) {
                const storedJD = await chrome.storage.local.get('activeJobContext');
                if (storedJD.activeJobContext && storedJD.activeJobContext.text) {
                    finalJD = storedJD.activeJobContext.text;
                }
            }

            // 2. Extract relevant context
            const resumeObj = profile.resumes?.[0];
            const resumeText = resumeObj?.parsedText || '';
            const coverLetter = resumeObj?.coverLetter || '';
            const formatting = resumeObj?.coverLetterFormat || '';

            const fullProfileContext = JSON.stringify({
                personalInfo: profile.personalInfo,
                skills: profile.skills,
                experience: profile.experience,
                education: profile.education,
                resumeExcerpts: resumeText.substring(0, 2000),
                coverLetterStyle: coverLetter.substring(0, 1000)
            });

            const prompt = `
        You are an expert candidate filling out a job application.
        
        CONTEXT:
        1. Candidate Profile: ${fullProfileContext}
        2. Job Description: "${finalJD.substring(0, 2000)}..."
        ${formatting ? `3. CUSTOM FORMATTING/INSTRUCTIONS: ${formatting}` : ""}
        
        QUESTION: "${question}"
        
        INSTRUCTIONS:
        - Answer TRUTHFULLY based on the Candidate Profile.
        - Tailor the answer to the Job Description if relevant.
        ${formatting ? `- Strictly follow these instructions for the response: ${formatting}` : ""}
        - If the question asks for a specific number (years of experience), provide JUST the number.
        - If it's a Yes/No question, answer "Yes" or "No".
        - For open-ended questions, write a concise, professional response.
        - Do not include "Here is the answer" or quotes. Just the raw value.
      `;

            return await this.callAI(apiKey, prompt);
        } catch (error) {
            console.error('AI Answer Error:', error);
            return null;
        }
    },

    /**
     * Call OpenRouter API
     */
    async callAI(apiKey, prompt) {
        const url = "https://openrouter.ai/api/v1/chat/completions";
        const modelRes = await chrome.storage.local.get('openRouterModel');
        const model = modelRes.openRouterModel || "meta-llama/llama-3.1-8b-instruct";

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'Job Autofiller'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "user", content: prompt }
                ]
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || "OpenRouter API Error");
        }

        const content = data.choices[0].message.content;
        return content.trim().replace(/^```json/, '').replace(/```$/, '');
    },

    async getApiKey() {
        const result = await chrome.storage.local.get('openRouterApiKey');
        return result.openRouterApiKey;
    },

    fallbackMatchScore(profile, jobDescription) {
        // Basic keyword matching fallback
        const skills = profile.skills || [];
        const desc = jobDescription.toLowerCase();
        const matched = skills.filter(s => desc.includes(s.name.toLowerCase()));
        const score = Math.min(100, Math.round((matched.length / Math.max(1, skills.length)) * 100));

        return {
            score,
            reasoning: "Calculated via basic keyword matching (AI API Key not set)",
            matchingSkills: matched.map(s => s.name),
            missingSkills: []
        };
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIAnalyzer;
}
