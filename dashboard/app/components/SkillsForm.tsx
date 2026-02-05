'use client';

import { useState } from 'react';
import { Skill } from '../types/profile';

interface SkillsFormProps {
    skills: Skill[];
    onChange: (skills: Skill[]) => void;
}

export default function SkillsForm({ skills, onChange }: SkillsFormProps) {
    const [newSkill, setNewSkill] = useState({ name: '', category: 'technical' as const, proficiency: 'intermediate' as const });

    const addSkill = () => {
        if (newSkill.name.trim()) {
            const skill: Skill = {
                id: Date.now().toString(),
                ...newSkill,
            };
            onChange([...skills, skill]);
            setNewSkill({ name: '', category: 'technical', proficiency: 'intermediate' });
        }
    };

    const deleteSkill = (id: string) => {
        onChange(skills.filter((skill) => skill.id !== id));
    };

    const skillsByCategory = {
        technical: skills.filter(s => s.category === 'technical'),
        soft: skills.filter(s => s.category === 'soft'),
        language: skills.filter(s => s.category === 'language'),
        tool: skills.filter(s => s.category === 'tool'),
    };

    const renderSkillBadge = (skill: Skill) => {
        const proficiencyColors = {
            beginner: '#94a3b8',
            intermediate: '#14b8a6',
            advanced: '#6366f1',
            expert: '#ec4899',
        };

        return (
            <div
                key={skill.id}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'var(--bg-card)',
                    border: `1px solid ${proficiencyColors[skill.proficiency]}`,
                    borderRadius: '20px',
                    margin: '0.25rem',
                }}
            >
                <span style={{ fontWeight: 500 }}>{skill.name}</span>
                <span
                    style={{
                        fontSize: '0.75rem',
                        padding: '0.125rem 0.5rem',
                        background: proficiencyColors[skill.proficiency],
                        borderRadius: '10px',
                        color: 'white',
                    }}
                >
                    {skill.proficiency}
                </span>
                <button
                    onClick={() => deleteSkill(skill.id)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '0 0.25rem',
                    }}
                >
                    ✕
                </button>
            </div>
        );
    };

    return (
        <div className="glass-card fade-in-up">
            <h2 className="section-header">Skills</h2>

            {/* Add New Skill */}
            <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--bg-card)', borderRadius: '12px' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Add New Skill</h3>
                <div className="grid-2" style={{ gridTemplateColumns: '2fr 1fr 1fr auto' }}>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Skill name (e.g., React, Python)"
                        value={newSkill.name}
                        onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                    />
                    <select
                        className="input-field"
                        value={newSkill.category}
                        onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value as any })}
                    >
                        <option value="technical">Technical</option>
                        <option value="soft">Soft Skill</option>
                        <option value="language">Language</option>
                        <option value="tool">Tool</option>
                    </select>
                    <select
                        className="input-field"
                        value={newSkill.proficiency}
                        onChange={(e) => setNewSkill({ ...newSkill, proficiency: e.target.value as any })}
                    >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                    </select>
                    <button onClick={addSkill} className="btn btn-primary">
                        Add
                    </button>
                </div>
            </div>

            {/* Skills by Category */}
            {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
                categorySkills.length > 0 && (
                    <div key={category} style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            marginBottom: '0.75rem',
                            color: 'var(--text-secondary)',
                            textTransform: 'capitalize'
                        }}>
                            {category === 'technical' ? 'Technical Skills' :
                                category === 'soft' ? 'Soft Skills' :
                                    category === 'language' ? 'Languages' : 'Tools & Technologies'}
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {categorySkills.map(renderSkillBadge)}
                        </div>
                    </div>
                )
            ))}

            {skills.length === 0 && (
                <p className="text-center" style={{ color: 'var(--text-muted)', marginTop: '2rem' }}>
                    No skills added yet. Add your first skill above!
                </p>
            )}
        </div>
    );
}
