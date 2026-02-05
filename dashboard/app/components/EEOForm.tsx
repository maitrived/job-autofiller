'use client';

import { useState } from 'react';
import { Demographics } from '../types/profile';

interface EEOFormProps {
    data: Demographics;
    onChange: (data: Demographics) => void;
}

export default function EEOForm({ data, onChange }: EEOFormProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="fade-in-up">
            <div
                className="section-header flex-between cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
                style={{ marginBottom: isExpanded ? '1.5rem' : '0' }}
            >
                <h2 style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <span>⚖️</span> Equal Employment Opportunity
                </h2>
                <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>
                    {isExpanded ? '−' : '+'}
                </span>
            </div>

            {isExpanded && (
                <div className="glass-card animate-in fade-in slide-in-from-top-4 duration-300">
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        Voluntary demographic disclosures often requested by employers.
                    </p>

                    <div className="grid-2">
                        <div className="mb-4">
                            <label className="label">Gender</label>
                            <select
                                className="input-field"
                                value={data.gender || ''}
                                onChange={(e) => onChange({ ...data, gender: e.target.value })}
                            >
                                <option value="">Select...</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Non-binary">Non-binary</option>
                                <option value="Decline">Decline to self-identify</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="label">Veteran Status</label>
                            <select
                                className="input-field"
                                value={data.veteranStatus || ''}
                                onChange={(e) => onChange({ ...data, veteranStatus: e.target.value })}
                            >
                                <option value="">Select...</option>
                                <option value="No">I am not a protected veteran</option>
                                <option value="Yes">I am a protected veteran</option>
                                <option value="Decline">Decline to self-identify</option>
                            </select>
                        </div>

                        <div className="mb-4" style={{ gridColumn: '1 / -1' }}>
                            <label className="label">Disability Status</label>
                            <select
                                className="input-field"
                                value={data.disabilityStatus || ''}
                                onChange={(e) => onChange({ ...data, disabilityStatus: e.target.value })}
                            >
                                <option value="">Select...</option>
                                <option value="No">No, I do not have a disability</option>
                                <option value="Yes">Yes, I have a disability</option>
                                <option value="Decline">Decline to self-identify</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
