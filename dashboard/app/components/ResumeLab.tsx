'use client';

import { useState, useEffect } from 'react';
import { UserProfile } from '../types/profile';

interface ResumeLabProps {
  profile: UserProfile | null;
  parsedResumeText?: string;
}

export default function ResumeLab({ profile, parsedResumeText }: ResumeLabProps) {
  const [jobDescription, setJobDescription] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('jobAutofill_resumeLab_jd') || '';
    return '';
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'resume' | 'cv'>('resume');
  
  // Undo/Redo History
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [optimizationResult, setOptimizationResult] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jobAutofill_resumeLab_result');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  
  // Tracks state: 'pending', 'accepted', 'rejected'
  const [changeStates, setChangeStates] = useState<{ [key: string]: 'pending' | 'accepted' | 'rejected' }>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jobAutofill_resumeLab_states');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jobAutofill_resumeLab_jd', jobDescription);
      if (optimizationResult) localStorage.setItem('jobAutofill_resumeLab_result', JSON.stringify(optimizationResult));
      else localStorage.removeItem('jobAutofill_resumeLab_result');
      localStorage.setItem('jobAutofill_resumeLab_states', JSON.stringify(changeStates));
    }
  }, [jobDescription, optimizationResult, changeStates]);

  // Only reset the lab if the resume text has significantly changed compared to what was last optimized
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lastSource = localStorage.getItem('jobAutofill_resumeLab_lastSource');
      if (parsedResumeText && lastSource && parsedResumeText !== lastSource) {
        setOptimizationResult(null);
        setChangeStates({});
        setHistory([]);
        setHistoryIndex(-1);
      }
      if (parsedResumeText) localStorage.setItem('jobAutofill_resumeLab_lastSource', parsedResumeText);
    }
  }, [parsedResumeText]);

  const pushToHistory = (newState: any) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newState)));
    if (newHistory.length > 20) newHistory.shift(); // Limit history
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setChangeStates(prev);
      setHistoryIndex(historyIndex - 1);
    } else if (historyIndex === 0) {
        // Return to initial state (all pending)
        setChangeStates({});
        setHistoryIndex(-1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setChangeStates(next);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const clearSession = () => {
    setJobDescription('');
    setOptimizationResult(null);
    setChangeStates({});
    setError('');
  };

  const handleStateChange = (key: string, state: 'accepted' | 'rejected') => {
    const next = { ...changeStates, [key]: state };
    setChangeStates(next);
    pushToHistory(next);
  };

  const acceptAllChanges = () => {
    const updated = { ...changeStates };
    if (optimizationResult?.proposedSummary) updated['summary'] = 'accepted';
    optimizationResult?.experience?.forEach((_: any, idx: number) => {
        updated[`exp-${idx}`] = 'accepted';
    });
    optimizationResult?.projects?.forEach((_: any, idx: number) => {
        updated[`proj-${idx}`] = 'accepted';
    });
    setChangeStates(updated);
    pushToHistory(updated);
  };

  const generatePDF = async (docType: 'resume' | 'cv' = 'resume') => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      // We clone the document so we can strip the UI elements for printing
      const source = document.getElementById('resume-preview-document');
      if (!source) return;
      
      const clone = source.cloneNode(true) as HTMLElement;
      
      // Remove any diff UI from the clone
      const uiElements = clone.querySelectorAll('.review-ui');
      uiElements.forEach(el => el.remove());

      // If document type is resume, remove the projects wrapper from the clone
      if (docType === 'resume') {
          const projSection = clone.querySelector('#projects-section');
          if (projSection) projSection.remove();
      }

      // Configure HTML2PDF
      const personalInfo = profile?.personalInfo || {};
      const name = `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim() || 'Candidate';
      
      const opt = {
        margin:       [0.5, 0.5, 0.5, 0.5],
        filename:     `${name.replace(/\s+/g, '_')}_Optimized_${docType.toUpperCase()}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().from(clone).set(opt).save();

    } catch (e: any) {
      console.error('PDF Generation Error:', e);
      setError('Failed to construct PDF. See console for details.');
    }
  };

  const handleOptimize = async (mode: 'resume' | 'cv' = 'resume') => {
    if (!jobDescription || jobDescription.trim().length < 50) {
      setError('Please provide a valid job description.');
      return;
    }
    if (!profile) {
      setError('Active profile is missing.');
      return;
    }

    const apiKey = localStorage.getItem('openRouterApiKey');
    if (!apiKey) {
      setError('OpenRouter API Key not configured. Please go to Settings to add one.');
      return;
    }

    const model = localStorage.getItem('openRouterModel') || 'meta-llama/llama-3.1-8b-instruct';

    setIsGenerating(true);
    setError('');
    // Keep old result until new one is ready, but mark as loading
    if (mode === 'cv') setViewMode('cv');
    else setViewMode('resume');

    const isCV = mode === 'cv';

    const prompt = `
      You are an expert ${isCV ? 'Curriculum Vitae (CV)' : 'Resume'} writer specializing in ${isCV ? 'academic and comprehensive professional histories' : 'targeted career documents'}.
      
      Task: ${isCV 
        ? 'Construct a COMPREHENSIVE Full CV from scratch. You MUST include every single professional role, project, skill, and educational detail found in the source text. Do not summarize or condense. The goal is a detailed, multi-page capable CV.' 
        : 'Construct a highly targeted 1-page Resume. Tailor experience and project bullets to strongly align with the Job Description.'}
      
      Inject relevant keywords organically. Do NOT fabricate experience.
      
      ${parsedResumeText ? `
      SOURCE DATA:
      --- UPLOADED RESUME/CV TEXT ---
      ${parsedResumeText}
      ---------------------------` 
      : 
      `User Profile Data: ${JSON.stringify(profile)}`
      }

      Job Description: ${jobDescription}
      
      ${isCV ? 'IMPORTANT: For a Full CV, ensure you extract and categorize ALL data. If the user has certifications, publications, or volunteer work in the text, include them in the experience or projects arrays as appropriate.' : ''}
      
      RESPOND EXCLUSIVELY IN THE FOLLOWING JSON FORMAT:
      {
        "beforeScore": (0-100 Integer, representing original match percentage),
        "afterScore": (0-100 Integer, representing optimized match percentage),
        "scoreExplanation": "1-sentence explanation of why the score improved",
        "personalInfo": { "firstName": "Extracted First Name", "lastName": "Extracted Last Name", "email": "Extracted Email", "phone": "Extracted Phone", "location": "Extracted Location", "linkedin": "Extracted Link" },
        "proposedSummary": "3-4 sentence professional summary tailored to the role",
        "education": [
          { "institution": "Extracted Institution Name", "degree": "Extracted Degree", "field": "Extracted Field", "endDate": "Extracted End Date" }
        ],
        "skills": ["Skill 1", "Skill 2"],
        "experience": [
          {
            "company": "Company Name",
            "position": "Targeted Position Name",
            "dates": "Start - End",
            "location": "Location",
            "originalBullets": ["Copy of the original bullet 1", "Copy of original bullet 2"],
            "proposedBullets": ["Tailored/Rewritten bullet 1", "Tailored bullet 2"]
          }
        ],
        "projects": [
          {
            "name": "Project Name",
            "description": "Short explanation",
            "originalBullets": ["Copy original"],
            "proposedBullets": ["Tailored technical details"]
          }
        ],
        "additionalSections": [
          {
            "title": "Certifications / Publications / Awards / etc.",
            "items": ["Item 1", "Item 2"]
          }
        ]
      }
    `;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Job Autofiller Dashboard'
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || "OpenRouter API Error");
      }

      let content = data.choices[0].message.content.trim();
      
      // Robust JSON extraction
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
          content = jsonMatch[0];
      }
      
      const parsedData = JSON.parse(content);
      console.log("Parsed AI Data:", parsedData);

      setOptimizationResult(parsedData);
      
      // Initialize all as pending
      const initialState: { [key: string]: 'pending' } = { summary: 'pending' };
      parsedData.experience?.forEach((_: any, idx: number) => initialState[`exp-${idx}`] = 'pending');
      parsedData.projects?.forEach((_: any, idx: number) => initialState[`proj-${idx}`] = 'pending');
      setChangeStates(initialState);

    } catch (e: any) {
      console.error(e);
      setError('Failed to optimize resume. This usually happens if the AI response was interrupted or the API key is invalid. Details: ' + (e.message || 'Unknown Error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const renderDiffBlock = (idKey: string, originalContent: React.ReactNode, proposedContent: React.ReactNode) => {
      const state = changeStates[idKey] || 'pending';

      if (state === 'accepted') return proposedContent;
      if (state === 'rejected') return originalContent;

      return (
          <div className="review-ui" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem', margin: '0.5rem 0' }}>
              <div style={{ background: '#ffebee', border: '1px solid #ffcdd2', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem' }}>
                  <div style={{ color: '#d32f2f', fontWeight: 'bold', marginBottom: '0.5rem' }}>Original:</div>
                  <div style={{ fontFamily: '"Times New Roman", Times, serif', lineHeight: '1.4' }}>{originalContent}</div>
              </div>
              <div style={{ background: '#e8f5e9', border: '1px solid #c8e6c9', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ color: '#388e3c', fontWeight: 'bold' }}>Suggestion:</div>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', background: '#388e3c', border: 'none' }}
                            onClick={() => handleStateChange(idKey, 'accepted')}
                          >Accept</button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => handleStateChange(idKey, 'rejected')}
                          >Reject</button>
                      </div>
                  </div>
                  <div style={{ fontFamily: '"Times New Roman", Times, serif', lineHeight: '1.4' }}>{proposedContent}</div>
              </div>
          </div>
      );
  };

  return (
    <div className="fade-in-up" style={{ marginTop: '-1rem' }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '480px 1fr', 
          gap: '3rem', 
          alignItems: 'flex-start',
          height: 'calc(100vh - 120px)'
      }}>
        {/* Editor Settings (Sticky Left) */}
        <div style={{ 
            position: 'sticky', 
            top: '40px', 
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
        }}>
            <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Target Job Description</label>
            {optimizationResult && (
              <button 
                onClick={clearSession} 
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
              >
                Reset
              </button>
            )}
          </div>
          <textarea
            className="form-input mb-4"
            style={{ width: '100%', minHeight: '220px', flexGrow: 0, resize: 'none', fontSize: '0.9rem' }}
            placeholder="Paste the target job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          ></textarea>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
                className="btn btn-primary"
                onClick={() => handleOptimize('resume')}
                disabled={isGenerating || !jobDescription}
                style={{ flex: 1, padding: '0.75rem', fontWeight: 600, fontSize: '0.85rem' }}
            >
                {isGenerating ? '...' : '✨ Rewrite Resume'}
            </button>
            <button
                className="btn btn-secondary"
                onClick={() => handleOptimize('cv')}
                disabled={isGenerating || !jobDescription}
                style={{ flex: 1, padding: '0.75rem', fontWeight: 600, fontSize: '0.85rem', background: 'var(--bg-tertiary)' }}
            >
                {isGenerating ? '...' : '✨ Rewrite Full CV'}
            </button>
          </div>

          {error && <div style={{ color: 'var(--danger)', marginTop: '1rem', fontSize: '0.9rem' }}>{error}</div>}

          {optimizationResult && (
              <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                     <div style={{ textAlign: 'center' }}>
                         <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Original</div>
                         <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{optimizationResult.beforeScore}%</div>
                     </div>
                     <div style={{ fontSize: '1.5rem', color: 'var(--primary)', opacity: 0.5 }}>→</div>
                     <div style={{ textAlign: 'center' }}>
                         <div style={{ fontSize: '0.7rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', fontWeight: 700 }}>Optimized</div>
                         <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>{optimizationResult.afterScore}%</div>
                     </div>
                 </div>
                 
                 <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden', marginBottom: '1rem', display: 'flex' }}>
                    <div style={{ width: `${optimizationResult.beforeScore}%`, background: 'var(--text-muted)', height: '100%' }}></div>
                    <div style={{ width: `${optimizationResult.afterScore - optimizationResult.beforeScore}%`, background: 'var(--primary)', height: '100%' }}></div>
                 </div>

                 <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic', marginBottom: '1.5rem' }}>"{optimizationResult.scoreExplanation}"</p>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <button className="btn btn-secondary review-ui" onClick={acceptAllChanges} style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}>✔️ Accept All Changes</button>
                 </div>
              </div>
          )}
            </div>
        </div>

        {/* Live Document Preview (Scrollable Right) */}
        <div style={{ 
            height: '100%', 
            overflowY: 'auto', 
            paddingRight: '1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'var(--bg-tertiary)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            padding: '1rem 2rem',
            paddingTop: '0.5rem'
        }}>
          {/* Document Controls */}
          <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              width: '100%', 
              maxWidth: '850px', 
              marginBottom: '1rem',
              background: 'var(--bg-secondary)',
              padding: '0.4rem 0.6rem',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
             <div style={{ display: 'flex', gap: '0.2rem', background: 'var(--bg-tertiary)', padding: '0.2rem', borderRadius: '6px' }}>
                <button 
                    onClick={() => setViewMode('resume')} 
                    style={{ 
                        padding: '0.35rem 1rem', 
                        fontSize: '0.75rem', 
                        borderRadius: '4px', 
                        border: 'none', 
                        cursor: 'pointer',
                        background: viewMode === 'resume' ? 'var(--primary)' : 'transparent',
                        color: viewMode === 'resume' ? 'white' : 'var(--text-muted)',
                        transition: 'all 0.2s',
                        fontWeight: 600
                    }}
                >Resume</button>
                <button 
                    onClick={() => setViewMode('cv')} 
                    style={{ 
                        padding: '0.35rem 1rem', 
                        fontSize: '0.75rem', 
                        borderRadius: '4px', 
                        border: 'none', 
                        cursor: 'pointer',
                        background: viewMode === 'cv' ? 'var(--primary)' : 'transparent',
                        color: viewMode === 'cv' ? 'white' : 'var(--text-muted)',
                        transition: 'all 0.2s',
                        fontWeight: 600
                    }}
                >Full CV</button>
             </div>
             <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.4rem', borderRight: '1px solid var(--border-color)', paddingRight: '0.6rem' }}>
                    <button 
                        onClick={undo} 
                        disabled={historyIndex < 0}
                        style={{ 
                            background: 'none', 
                            border: '1px solid var(--border-color)', 
                            color: historyIndex >= 0 ? 'var(--text-primary)' : 'var(--text-muted)', 
                            cursor: historyIndex >= 0 ? 'pointer' : 'default', 
                            fontSize: '0.8rem',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem'
                        }}
                    ><span>↩</span> Undo</button>
                    <button 
                        onClick={redo} 
                        disabled={historyIndex >= history.length - 1}
                        style={{ 
                            background: 'none', 
                            border: '1px solid var(--border-color)', 
                            color: historyIndex < history.length - 1 ? 'var(--text-primary)' : 'var(--text-muted)', 
                            cursor: historyIndex < history.length - 1 ? 'pointer' : 'default', 
                            fontSize: '0.8rem',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem'
                        }}
                    >Redo <span>↪</span></button>
                </div>
                <button 
                    className="btn btn-primary" 
                    onClick={() => generatePDF(viewMode)} 
                    style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', fontWeight: 700 }}
                >
                    ⬇️ Download PDF
                </button>
             </div>
          </div>

          <div style={{ 
              zoom: 0.85, 
              width: '100%', 
              display: 'flex', 
              justifyContent: 'center',
              transformOrigin: 'top center',
              position: 'relative'
          }}>
            {isGenerating && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(255,255,255,0.7)',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    backdropFilter: 'blur(2px)'
                }}>
                    <div className="spinner" style={{ border: '4px solid var(--primary)', borderTop: '4px solid transparent', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
                    <p style={{ marginTop: '1rem', color: 'var(--primary)', fontWeight: 600 }}>Optimizing with AI...</p>
                </div>
            )}
            <div 
               id="resume-preview-document"
               style={{ 
                   width: '100%', 
                   maxWidth: '850px', 
                   background: 'white', 
                   color: 'black', 
                   padding: '3rem',
                   boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                   fontFamily: '"Times New Roman", Times, serif',
                   boxSizing: 'border-box',
                   borderRadius: '2px',
                   lineHeight: '1.3'
               }}
            >
               {/* Document Header */}
               <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                   <h1 style={{ margin: '0 0 0.4rem 0', fontSize: '24pt', fontWeight: 'bold', letterSpacing: '-0.02em', color: 'black' }}>
                      {optimizationResult?.personalInfo ? 
                        `${optimizationResult.personalInfo.firstName || ''} ${optimizationResult.personalInfo.lastName || ''}`.trim() :
                        `${profile?.personalInfo?.firstName || ''} ${profile?.personalInfo?.lastName || 'Candidate'}`.trim()}
                   </h1>
                   <div style={{ fontSize: '10.5pt', color: '#333', borderBottom: '1px solid #ddd', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
                       {optimizationResult?.personalInfo ? 
                         [optimizationResult.personalInfo.email, optimizationResult.personalInfo.phone, optimizationResult.personalInfo.location, optimizationResult.personalInfo.linkedin].filter(Boolean).join('  •  ') :
                         [profile?.personalInfo?.email, profile?.personalInfo?.phone, profile?.personalInfo?.location, profile?.personalInfo?.linkedin].filter(Boolean).join('  •  ')}
                   </div>
               </div>

                {/* Summary */}
               {(profile?.personalInfo?.summary || optimizationResult?.proposedSummary || parsedResumeText) && (
                   <div style={{ marginBottom: '1.25rem' }}>
                       <h2 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid #333', margin: '0 0 0.5rem 0', textTransform: 'uppercase', color: 'black', letterSpacing: '0.05em' }}>Summary</h2>
                       
                       {optimizationResult ? (
                           renderDiffBlock(
                               'summary', 
                               <p style={{ margin: 0, fontSize: '11pt', textAlign: 'justify' }}>{profile?.personalInfo?.summary}</p>, 
                               <p style={{ margin: 0, fontSize: '11pt', textAlign: 'justify' }}>{optimizationResult.proposedSummary}</p>
                           )
                       ) : parsedResumeText ? (
                           <div style={{ fontSize: '11pt', fontStyle: 'italic', color: '#666' }}>
                               Summary will be extracted and optimized from your resume text...
                           </div>
                       ) : (
                           <p style={{ margin: 0, fontSize: '11pt', lineHeight: '1.4', textAlign: 'justify' }}>{profile?.personalInfo?.summary}</p>
                       )}
                   </div>
               )}

               {/* Experience */}
               {optimizationResult ? (
                   <div style={{ marginBottom: '1.25rem' }}>
                       <h2 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid #333', margin: '0 0 0.5rem 0', textTransform: 'uppercase', color: 'black', letterSpacing: '0.05em' }}>Professional Experience</h2>
                       {optimizationResult.experience.map((exp: any, i: number) => (
                           <div key={`exp-${i}`} style={{ marginBottom: '1rem' }}>
                               <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '12pt', color: 'black' }}>
                                  <div>{exp.position}, {exp.company}</div>
                                  <div>{exp.dates}</div>
                               </div>
                               {exp.location && <div style={{ fontSize: '11pt', color: 'black', fontStyle: 'italic', marginBottom: '0.25rem' }}>{exp.location}</div>}
                               
                               {renderDiffBlock(
                                   `exp-${i}`,
                                   <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '20px', fontSize: '11pt' }}>
                                       {exp.originalBullets?.map((b: string, j: number) => <li key={j} style={{ marginBottom: '0.2rem' }}>{b}</li>)}
                                   </ul>,
                                   <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '20px', fontSize: '11pt' }}>
                                       {exp.proposedBullets?.map((b: string, j: number) => <li key={j} style={{ marginBottom: '0.2rem' }}>{b}</li>)}
                                   </ul>
                               )}
                           </div>
                       ))}
                   </div>
               ) : parsedResumeText ? (
                   <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f5f5f5', border: '1px dashed #999', borderRadius: '4px', textAlign: 'center' }}>
                      <h2 style={{ fontSize: '11pt', color: '#333', margin: 0 }}>📄 Uploaded Resume Detected</h2>
                      <p style={{ margin: '0.5rem 0 0', fontSize: '10pt', color: '#666', fontFamily: 'sans-serif' }}>Your highly formatted Experience and Projects will be structurally inserted here from your uploaded document instantly upon clicking "Rewrite Resume Content".</p>
                   </div>
               ) : profile?.experience && profile.experience.length > 0 && (
                   <div style={{ marginBottom: '1rem' }}>
                       <h2 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid #333', margin: '0 0 0.5rem 0', textTransform: 'uppercase', color: 'black', letterSpacing: '0.05em' }}>Professional Experience</h2>
                       {profile.experience.map((exp, i) => (
                           <div key={`base-exp-${i}`} style={{ marginBottom: '0.75rem' }}>
                               <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '12pt', color: 'black' }}>
                                  <div>{exp.title}, {exp.company}</div>
                                  <div>{exp.startDate} - {exp.endDate || 'Present'}</div>
                               </div>
                               {exp.location && <div style={{ fontSize: '11pt', color: 'black', fontStyle: 'italic', marginBottom: '0.25rem' }}>{exp.location}</div>}
                               <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '20px', fontSize: '11pt' }}>
                                   {exp.description?.split('\n').filter(Boolean).map((b, j) => <li key={j} style={{ marginBottom: '0.2rem' }}>{b}</li>)}
                               </ul>
                           </div>
                       ))}
                   </div>
               )}

                {/* Projects */}
               {viewMode === 'cv' && (
                <div id="projects-section">
                   {optimizationResult && optimizationResult.projects && optimizationResult.projects.length > 0 ? (
                       <div style={{ marginBottom: '1.25rem' }}>
                           <h2 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid #333', margin: '0 0 0.5rem 0', textTransform: 'uppercase', color: 'black', letterSpacing: '0.05em' }}>Projects</h2>
                           {optimizationResult.projects.map((proj: any, i: number) => (
                               <div key={`proj-${i}`} style={{ marginBottom: '1rem' }}>
                                   <div style={{ fontWeight: 'bold', fontSize: '12pt', color: 'black' }}>{proj.name}</div>
                                   {proj.description && <div style={{ fontSize: '11pt', fontStyle: 'italic', color: 'black', marginBottom: '0.25rem' }}>{proj.description}</div>}
                                   
                                   {renderDiffBlock(
                                       `proj-${i}`,
                                       <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '20px', fontSize: '11pt' }}>
                                           {proj.originalBullets?.map((b: string, j: number) => <li key={j} style={{ marginBottom: '0.2rem' }}>{b}</li>)}
                                       </ul>,
                                       <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '20px', fontSize: '11pt' }}>
                                           {proj.proposedBullets?.map((b: string, j: number) => <li key={j} style={{ marginBottom: '0.2rem' }}>{b}</li>)}
                                       </ul>
                                   )}
                               </div>
                           ))}
                       </div>
                   ) : profile?.projects && profile.projects.length > 0 && (
                       <div style={{ marginBottom: '1rem' }}>
                           <h2 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid #333', margin: '0 0 0.5rem 0', textTransform: 'uppercase', color: 'black', letterSpacing: '0.05em' }}>Projects</h2>
                           {profile.projects.map((proj, i) => (
                               <div key={`base-proj-${i}`} style={{ marginBottom: '0.75rem' }}>
                                   <div style={{ fontWeight: 'bold', fontSize: '12pt', color: 'black' }}>{proj.title || proj.name}</div>
                                   <div style={{ fontSize: '11pt', fontStyle: 'italic', color: 'black', marginBottom: '0.25rem' }}>{proj.description}</div>
                               </div>
                           ))}
                       </div>
                   )}
                </div>
               )}

               {/* Education */}
               {(optimizationResult?.education?.length > 0 || profile?.education?.length > 0) && (
                   <div style={{ marginBottom: '1.25rem' }}>
                       <h2 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid #333', margin: '0 0 0.5rem 0', textTransform: 'uppercase', color: 'black', letterSpacing: '0.05em' }}>Education</h2>
                       {(optimizationResult?.education || profile?.education)?.map((edu: any, i: number) => (
                           <div key={`edu-${i}`} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                               <div>
                                   <strong style={{ fontSize: '11pt', color: 'black' }}>{edu.institution || edu.school}</strong>
                                   <div style={{ fontSize: '11pt', color: 'black' }}>{edu.degree} {edu.field ? `in ${edu.field}` : ''}</div>
                               </div>
                               <div style={{ fontSize: '11pt', color: 'black' }}>{edu.endDate || edu.graduationDate}</div>
                           </div>
                       ))}
                   </div>
               )}

                {/* Additional Sections (Certifications, Awards, etc.) */}
                {optimizationResult?.additionalSections?.map((section: any, i: number) => (
                    <div key={`extra-${i}`} style={{ marginBottom: '1.25rem' }}>
                        <h2 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid #333', margin: '0 0 0.5rem 0', textTransform: 'uppercase', color: 'black', letterSpacing: '0.05em' }}>{section.title}</h2>
                        <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '20px', fontSize: '11pt', color: 'black' }}>
                            {section.items?.map((item: string, j: number) => <li key={j} style={{ marginBottom: '0.2rem' }}>{item}</li>)}
                        </ul>
                    </div>
                ))}

                {/* Skills */}
                {(optimizationResult?.skills?.length > 0 || profile?.skills?.length > 0) && (
                    <div style={{ marginBottom: '1.25rem' }}>
                        <h2 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid #333', margin: '0 0 0.5rem 0', textTransform: 'uppercase', color: 'black', letterSpacing: '0.05em' }}>Skills</h2>
                        <div style={{ fontSize: '11pt', color: 'black', lineHeight: '1.4' }}>
                            {(optimizationResult?.skills || profile?.skills?.map((s:any) => s.name))?.join(' • ')}
                        </div>
                    </div>
                )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
