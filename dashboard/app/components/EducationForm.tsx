'use client';

import { useState } from 'react';
import { Education } from '../types/profile';

interface EducationFormProps {
    education: Education[];
    onChange: (education: Education[]) => void;
}

export default function EducationForm({ education, onChange }: EducationFormProps) {
    const addEducation = () => {
        const newEdu: Education = {
            id: Date.now().toString(),
            institution: '',
            degree: '',
            field: '',
            startDate: '',
            endDate: '',
            gpa: '',
            achievements: [''],
        };
        onChange([...education, newEdu]);
    };

    const updateEducation = (id: string, field: keyof Education, value: any) => {
        onChange(
            education.map((edu) =>
                edu.id === id ? { ...edu, [field]: value } : edu
            )
        );
    };

    const deleteEducation = (id: string) => {
        onChange(education.filter((edu) => edu.id !== id));
    };

    const addAchievement = (id: string) => {
        const edu = education.find((e) => e.id === id);
        if (edu && edu.achievements) {
            updateEducation(id, 'achievements', [...edu.achievements, '']);
        }
    };

    const updateAchievement = (eduId: string, index: number, value: string) => {
        const edu = education.find((e) => e.id === eduId);
        if (edu && edu.achievements) {
            const newAchievements = [...edu.achievements];
            newAchievements[index] = value;
            updateEducation(eduId, 'achievements', newAchievements);
        }
    };

    const removeAchievement = (eduId: string, index: number) => {
        const edu = education.find((e) => e.id === eduId);
        if (edu && edu.achievements && edu.achievements.length > 1) {
            const newAchievements = edu.achievements.filter((_, i) => i !== index);
            updateEducation(eduId, 'achievements', newAchievements);
        }
    };

    return (
        <div className="glass-card fade-in-up">
            <div className="flex-between mb-6">
                <h2 className="section-header" style={{ marginBottom: 0 }}>Education</h2>
                <button onClick={addEducation} className="btn btn-primary">
                    + Add Education
                </button>
            </div>

            {education.length === 0 ? (
                <p className="text-center" style={{ color: 'var(--text-muted)' }}>
                    No education added yet. Click "Add Education" to get started.
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {education.map((edu) => (
                        <div
                            key={edu.id}
                            style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '12px',
                                padding: '1.5rem',
                            }}
                        >
                            <div className="mb-4">
                                <label className="label">Institution *</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Stanford University"
                                    value={edu.institution}
                                    onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                                />
                            </div>

                            <div className="grid-2">
                                <div className="mb-4">
                                    <label className="label">Degree *</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Bachelor of Science"
                                        value={edu.degree}
                                        onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="label">Field of Study *</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Computer Science"
                                        value={edu.field}
                                        onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid-2">
                                <div className="mb-4">
                                    <label className="label">Start Date *</label>
                                    <input
                                        type="month"
                                        className="input-field"
                                        value={edu.startDate}
                                        onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="label">End Date *</label>
                                    <input
                                        type="month"
                                        className="input-field"
                                        value={edu.endDate}
                                        onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="label">GPA (Optional)</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="3.8/4.0"
                                    value={edu.gpa || ''}
                                    onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="label">Achievements / Honors</label>
                                {edu.achievements?.map((achievement, index) => (
                                    <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="Dean's List, Summa Cum Laude, etc."
                                            value={achievement}
                                            onChange={(e) => updateAchievement(edu.id, index, e.target.value)}
                                        />
                                        {edu.achievements && edu.achievements.length > 1 && (
                                            <button
                                                onClick={() => removeAchievement(edu.id, index)}
                                                className="btn btn-secondary"
                                                style={{ minWidth: '40px', padding: '0.5rem' }}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    onClick={() => addAchievement(edu.id)}
                                    className="btn btn-secondary"
                                    style={{ marginTop: '0.5rem' }}
                                >
                                    + Add Achievement
                                </button>
                            </div>

                            <button
                                onClick={() => deleteEducation(edu.id)}
                                className="btn btn-secondary"
                                style={{ width: '100%', color: 'var(--secondary)' }}
                            >
                                Delete Education
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
