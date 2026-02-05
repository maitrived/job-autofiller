'use client';

import { useState } from 'react';
import { Resume } from '../types/profile';

interface ResumeUploadProps {
    resume?: Resume;
    onChange: (resume: Resume | undefined) => void;
}

export default function ResumeUpload({ resume, onChange }: ResumeUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const handleFileUpload = async (file: File) => {
        if (file.type !== 'application/pdf') {
            alert('Please upload a PDF file');
            return;
        }

        setUploading(true);

        // Simulate file upload and text extraction
        // In a real app, you'd upload to a server and use a PDF parser
        const reader = new FileReader();
        reader.onload = async (e) => {
            const newResume: Resume = {
                fileName: file.name,
                fileUrl: e.target?.result as string,
                uploadDate: new Date().toISOString(),
                parsedText: 'Resume text would be extracted here using a PDF parser library',
            };

            onChange(newResume);
            setUploading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
        }
    };

    return (
        <div className="glass-card fade-in-up">
            <h2 className="section-header">Resume Upload</h2>

            {!resume ? (
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    style={{
                        border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--border-color)'}`,
                        borderRadius: '12px',
                        padding: '3rem 2rem',
                        textAlign: 'center',
                        background: dragActive ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-card)',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                    }}
                >
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
                    <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                        {uploading ? 'Uploading...' : 'Upload Your Resume'}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        Drag and drop your PDF resume here, or click to browse
                    </p>
                    <label htmlFor="resume-upload" className="btn btn-primary" style={{ display: 'inline-block' }}>
                        Choose File
                    </label>
                    <input
                        id="resume-upload"
                        type="file"
                        accept=".pdf"
                        onChange={handleChange}
                        style={{ display: 'none' }}
                    />
                </div>
            ) : (
                <div
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '2rem' }}>📄</div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                                {resume.fileName}
                            </h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                Uploaded on {new Date(resume.uploadDate).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {resume.parsedText && (
                        <div
                            style={{
                                background: 'var(--bg-tertiary)',
                                padding: '1rem',
                                borderRadius: '8px',
                                marginBottom: '1rem',
                            }}
                        >
                            <label className="label">Extracted Text Preview</label>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                {resume.parsedText.substring(0, 200)}...
                            </p>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <label htmlFor="resume-replace" className="btn btn-secondary" style={{ flex: 1 }}>
                            Replace Resume
                        </label>
                        <input
                            id="resume-replace"
                            type="file"
                            accept=".pdf"
                            onChange={handleChange}
                            style={{ display: 'none' }}
                        />
                        <button
                            onClick={() => onChange(undefined)}
                            className="btn btn-secondary"
                            style={{ flex: 1, color: 'var(--secondary)' }}
                        >
                            Remove Resume
                        </button>
                    </div>
                </div>
            )}

            {/* Cover Letter Section */}
            <div className="glass-card" style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>📝</span> Standard Cover Letter
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Paste your standard cover letter here. The AI will use this style and content to generate tailored answers and cover letters for specific jobs.
                </p>
                <textarea
                    className="input-field"
                    style={{ minHeight: '200px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                    placeholder="Dear Hiring Manager, I am writing to express my interest..."
                    value={resume?.coverLetter || ''}
                    onChange={(e) => {
                        const updatedResume: Resume = resume || {
                            fileName: 'No PDF Uploaded',
                            fileUrl: '',
                            uploadDate: new Date().toISOString(),
                            parsedText: ''
                        };
                        onChange({ ...updatedResume, coverLetter: e.target.value });
                    }}
                />
            </div>

            {/* Cover Letter Format Section */}
            <div className="glass-card" style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>📐</span> Cover Letter Format/Template
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Provide a specific format or instructions for your cover letter (e.g., "Use 3 short paragraphs: Intro, Skills, Closing. Mention my interest in remote work.").
                </p>
                <textarea
                    className="input-field"
                    style={{ minHeight: '120px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                    placeholder="Example: Keep it under 250 words. Use a professional but friendly tone. Highlight my React experience..."
                    value={resume?.coverLetterFormat || ''}
                    onChange={(e) => {
                        const updatedResume: Resume = resume || {
                            fileName: 'No PDF Uploaded',
                            fileUrl: '',
                            uploadDate: new Date().toISOString(),
                            parsedText: ''
                        };
                        onChange({ ...updatedResume, coverLetterFormat: e.target.value });
                    }}
                />
            </div>


            <div
                style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid var(--primary)',
                    borderRadius: '8px',
                }}
            >
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    💡 <strong>Tip:</strong> Upload your resume to automatically extract information and improve autofill accuracy.
                </p>
            </div>
        </div>
    );
}
