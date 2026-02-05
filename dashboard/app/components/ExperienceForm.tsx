'use client';

import { useState } from 'react';
import { Experience } from '../types/profile';

interface ExperienceFormProps {
    experiences: Experience[];
    onChange: (experiences: Experience[]) => void;
}

export default function ExperienceForm({ experiences, onChange }: ExperienceFormProps) {
    const [editingId, setEditingId] = useState<string | null>(null);

    const addExperience = () => {
        const newExp: Experience = {
            id: Date.now().toString(),
            company: '',
            position: '',
            location: '',
            startDate: '',
            endDate: '',
            current: false,
            description: '',
            achievements: [''],
        };
        onChange([...experiences, newExp]);
        setEditingId(newExp.id);
    };

    const updateExperience = (id: string, field: keyof Experience, value: any) => {
        onChange(
            experiences.map((exp) =>
                exp.id === id ? { ...exp, [field]: value } : exp
            )
        );
    };

    const deleteExperience = (id: string) => {
        onChange(experiences.filter((exp) => exp.id !== id));
    };

    const addAchievement = (id: string) => {
        const exp = experiences.find((e) => e.id === id);
        if (exp) {
            updateExperience(id, 'achievements', [...exp.achievements, '']);
        }
    };

    const updateAchievement = (expId: string, index: number, value: string) => {
        const exp = experiences.find((e) => e.id === expId);
        if (exp) {
            const newAchievements = [...exp.achievements];
            newAchievements[index] = value;
            updateExperience(expId, 'achievements', newAchievements);
        }
    };

    const removeAchievement = (expId: string, index: number) => {
        const exp = experiences.find((e) => e.id === expId);
        if (exp && exp.achievements.length > 1) {
            const newAchievements = exp.achievements.filter((_, i) => i !== index);
            updateExperience(expId, 'achievements', newAchievements);
        }
    };

    return (
        <div className="glass-card fade-in-up">
            <div className="flex-between mb-6">
                <h2 className="section-header" style={{ marginBottom: 0 }}>Work Experience</h2>
                <button onClick={addExperience} className="btn btn-primary">
                    + Add Experience
                </button>
            </div>

            {experiences.length === 0 ? (
                <p className="text-center" style={{ color: 'var(--text-muted)' }}>
                    No experience added yet. Click "Add Experience" to get started.
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {experiences.map((exp) => (
                        <div
                            key={exp.id}
                            style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '12px',
                                padding: '1.5rem',
                            }}
                        >
                            <div className="grid-2">
                                <div className="mb-4">
                                    <label className="label">Company *</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Google"
                                        value={exp.company}
                                        onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="label">Position *</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Software Engineer"
                                        value={exp.position}
                                        onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="label">Location</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Mountain View, CA"
                                    value={exp.location}
                                    onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                                />
                            </div>

                            <div className="grid-2">
                                <div className="mb-4">
                                    <label className="label">Start Date *</label>
                                    <input
                                        type="month"
                                        className="input-field"
                                        value={exp.startDate}
                                        onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="label">End Date</label>
                                    <input
                                        type="month"
                                        className="input-field"
                                        value={exp.endDate}
                                        disabled={exp.current}
                                        onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                                    />
                                    <label style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem', gap: '0.5rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={exp.current}
                                            onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                                        />
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Currently working here</span>
                                    </label>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="label">Description</label>
                                <textarea
                                    className="input-field"
                                    placeholder="Brief description of your role..."
                                    value={exp.description}
                                    onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="label">Key Achievements</label>
                                {exp.achievements.map((achievement, index) => (
                                    <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="Led a team of 5 engineers to deliver..."
                                            value={achievement}
                                            onChange={(e) => updateAchievement(exp.id, index, e.target.value)}
                                        />
                                        {exp.achievements.length > 1 && (
                                            <button
                                                onClick={() => removeAchievement(exp.id, index)}
                                                className="btn btn-secondary"
                                                style={{ minWidth: '40px', padding: '0.5rem' }}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    onClick={() => addAchievement(exp.id)}
                                    className="btn btn-secondary"
                                    style={{ marginTop: '0.5rem' }}
                                >
                                    + Add Achievement
                                </button>
                            </div>

                            <button
                                onClick={() => deleteExperience(exp.id)}
                                className="btn btn-secondary"
                                style={{ width: '100%', color: 'var(--secondary)' }}
                            >
                                Delete Experience
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
