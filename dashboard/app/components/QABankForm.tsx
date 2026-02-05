'use client';

import { useState } from 'react';
import { QAPair } from '../types/profile';

interface QABankFormProps {
    qaBank: QAPair[];
    onChange: (qaBank: QAPair[]) => void;
}

export default function QABankForm({ qaBank, onChange }: QABankFormProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const commonQuestions = [
        "Why do you want to work here?",
        "What are your greatest strengths?",
        "What are your weaknesses?",
        "Where do you see yourself in 5 years?",
        "Why are you leaving your current job?",
        "Tell me about a time you faced a challenge",
        "What motivates you?",
        "Why should we hire you?",
    ];

    const addQA = (question: string = '') => {
        const newQA: QAPair = {
            id: Date.now().toString(),
            question,
            answer: '',
            category: 'General',
            tags: [],
        };
        onChange([...qaBank, newQA]);
        setExpandedId(newQA.id);
    };

    const updateQA = (id: string, field: keyof QAPair, value: any) => {
        onChange(
            qaBank.map((qa) =>
                qa.id === id ? { ...qa, [field]: value } : qa
            )
        );
    };

    const deleteQA = (id: string) => {
        onChange(qaBank.filter((qa) => qa.id !== id));
    };

    const addTag = (id: string, tag: string) => {
        const qa = qaBank.find((q) => q.id === id);
        if (qa && tag.trim() && !qa.tags.includes(tag.trim())) {
            updateQA(id, 'tags', [...qa.tags, tag.trim()]);
        }
    };

    const removeTag = (id: string, tag: string) => {
        const qa = qaBank.find((q) => q.id === id);
        if (qa) {
            updateQA(id, 'tags', qa.tags.filter((t) => t !== tag));
        }
    };

    return (
        <div className="glass-card fade-in-up">
            <div className="flex-between mb-6">
                <h2 className="section-header" style={{ marginBottom: 0 }}>Q&A Bank</h2>
                <button onClick={() => addQA()} className="btn btn-primary">
                    + Add Custom Q&A
                </button>
            </div>

            {/* Common Questions Quick Add */}
            <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--bg-card)', borderRadius: '12px' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '1rem' }}>
                    Quick Add Common Questions
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {commonQuestions.map((q) => (
                        <button
                            key={q}
                            onClick={() => addQA(q)}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                        >
                            + {q}
                        </button>
                    ))}
                </div>
            </div>

            {/* Q&A List */}
            {qaBank.length === 0 ? (
                <p className="text-center" style={{ color: 'var(--text-muted)' }}>
                    No Q&A pairs added yet. Click "Add Custom Q&A" or select a common question above.
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {qaBank.map((qa) => (
                        <div
                            key={qa.id}
                            style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '12px',
                                padding: '1.5rem',
                            }}
                        >
                            <div className="mb-4">
                                <label className="label">Question *</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Enter the question..."
                                    value={qa.question}
                                    onChange={(e) => updateQA(qa.id, 'question', e.target.value)}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="label">Your Answer *</label>
                                <textarea
                                    className="input-field"
                                    placeholder="Write your answer here..."
                                    value={qa.answer}
                                    onChange={(e) => updateQA(qa.id, 'answer', e.target.value)}
                                    style={{ minHeight: '120px' }}
                                />
                            </div>

                            <div className="grid-2">
                                <div className="mb-4">
                                    <label className="label">Category</label>
                                    <select
                                        className="input-field"
                                        value={qa.category}
                                        onChange={(e) => updateQA(qa.id, 'category', e.target.value)}
                                    >
                                        <option value="General">General</option>
                                        <option value="Behavioral">Behavioral</option>
                                        <option value="Technical">Technical</option>
                                        <option value="Culture Fit">Culture Fit</option>
                                        <option value="Career Goals">Career Goals</option>
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="label">Tags</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        {qa.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    padding: '0.25rem 0.75rem',
                                                    background: 'var(--primary)',
                                                    borderRadius: '12px',
                                                    fontSize: '0.85rem',
                                                }}
                                            >
                                                {tag}
                                                <button
                                                    onClick={() => removeTag(qa.id, tag)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: 'white',
                                                        cursor: 'pointer',
                                                        padding: 0,
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Add tag and press Enter"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                addTag(qa.id, e.currentTarget.value);
                                                e.currentTarget.value = '';
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => deleteQA(qa.id)}
                                className="btn btn-secondary"
                                style={{ width: '100%', color: 'var(--secondary)' }}
                            >
                                Delete Q&A
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
