/**
 * Resume Optimizer - Generates Tailored PDF Resumes dynamically
 * Relies on jsPDF being loaded
 */

const ResumeOptimizer = {
    /**
     * Generate a tailored PDF resume blob
     * @param {Object} profile - User profile
     * @param {Object} jobDetails - Fetched job details or JD text
     * @returns {Promise<Blob>}
     */
    async generateOptimizedPdf(profile, jobDetails) {
        if (typeof window.jspdf === 'undefined') {
            console.error('jsPDF not loaded');
            return null;
        }

        // 1. Get optimized content from AI
        console.log('[ResumeOptimizer] Generating optimized outline via AI...');
        const optimizedContent = await AIAnalyzer.generateTailoredResume(profile, jobDetails);
        
        if (!optimizedContent) {
             console.error('[ResumeOptimizer] Failed to get AI content. Falling back.');
             return null;
        }

        // 2. Generate PDF using jsPDF
        console.log('[ResumeOptimizer] Creating PDF...');
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const margin = 15;
        const width = doc.internal.pageSize.getWidth();
        const height = doc.internal.pageSize.getHeight();
        let y = margin;
        
        const personalInfo = profile.personalInfo || {};
        const name = `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim() || 'Candidate';
        const contactLine = [personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedin].filter(Boolean).join(' | ');

        // Utility to handle text wrapping and page breaks
        const addText = (text, x, isTitle = false, isSubtitle = false, isBullet = false) => {
            if (!text) return;
            const maxWidth = width - (margin * 2) - (isBullet ? 5 : 0);
            
            if (isTitle) {
                doc.setFontSize(18);
                doc.setFont('helvetica', 'bold');
            } else if (isSubtitle) {
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
            } else {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
            }

            const lines = doc.splitTextToSize(text, maxWidth);
            
            if (y + (lines.length * 5) > height - margin) {
                doc.addPage();
                y = margin;
            }

            doc.text(lines, x, y);
            y += lines.length * (isTitle ? 8 : (isSubtitle ? 6 : 5));
        };

        // Header
        addText(name, margin, true);
        addText(contactLine, margin);
        y += 5; // Extra spacing

        // Summary
        if (optimizedContent.summary) {
            addText('PROFESSIONAL SUMMARY', margin, false, true);
            addText(optimizedContent.summary, margin);
            y += 3;
        }

        // Experience
        if (optimizedContent.experience && optimizedContent.experience.length > 0) {
            addText('EXPERIENCE', margin, false, true);
            optimizedContent.experience.forEach(exp => {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text(`${exp.position} - ${exp.company}`, margin, y);
                doc.setFont('helvetica', 'normal');
                const dateLocation = `${exp.dates} | ${exp.location || ''}`;
                const textWidth = doc.getTextWidth(dateLocation);
                doc.text(dateLocation, width - margin - textWidth, y);
                y += 5;
                
                if (exp.bullets && Array.isArray(exp.bullets)) {
                    exp.bullets.forEach(bullet => {
                        addText(`• ${bullet}`, margin + 5, false, false, true);
                    });
                }
                y += 3;
            });
        }

        // Education
        if (profile.education && profile.education.length > 0) {
            addText('EDUCATION', margin, false, true);
            profile.education.forEach(edu => {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text(`${edu.degree} in ${edu.field}`, margin, y);
                doc.setFont('helvetica', 'normal');
                const gradDate = edu.endDate || '';
                const textWidth = doc.getTextWidth(gradDate);
                doc.text(gradDate, width - margin - textWidth, y);
                y += 5;
                addText(edu.institution, margin);
            });
            y += 3;
        }

        // Skills
        if (optimizedContent.skills) {
             addText('SKILLS', margin, false, true);
             addText(optimizedContent.skills, margin);
        }

        return doc.output('blob');
    }
};

if (typeof window !== 'undefined') {
    window.ResumeOptimizer = ResumeOptimizer;
}
