'use client';

import { useState } from 'react';
import { PersonalInfo } from '../types/profile';

interface PersonalInfoFormProps {
    data: PersonalInfo;
    onChange: (data: PersonalInfo) => void;
}

export default function PersonalInfoForm({ data, onChange }: PersonalInfoFormProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const handleChange = (field: keyof PersonalInfo, value: any) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="fade-in-up">
            <div
                className="section-header flex-between cursor-pointer hover:bg-white/5 transition-colors rounded-lg p-2 -mx-2"
                onClick={() => setIsExpanded(!isExpanded)}
                style={{ marginBottom: isExpanded ? '1rem' : '0' }}
            >
                <h2 style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <span>👤</span> Personal Information
                </h2>
                <span style={{
                    fontSize: '1.5rem',
                    color: 'var(--text-muted)',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                    display: 'inline-block',
                    width: '24px',
                    height: '24px',
                    lineHeight: '24px',
                    textAlign: 'center'
                }}>
                    ▼
                </span>
            </div>

            {isExpanded && (
                <div className="glass-card animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="grid-2 mb-4">
                        <div>
                            <label className="label">First Name *</label>
                            <input
                                type="text"
                                className="input-field"
                                value={data.firstName}
                                onChange={(e) => handleChange('firstName', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="label">Last Name *</label>
                            <input
                                type="text"
                                className="input-field"
                                value={data.lastName}
                                onChange={(e) => handleChange('lastName', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Preferred Name Section */}
                    <div className="mb-4">
                        <label className="label flex items-center gap-2 cursor-pointer" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <input
                                type="checkbox"
                                checked={!!data.hasPreferredName}
                                onChange={(e) => handleChange('hasPreferredName', e.target.checked)}
                                style={{ width: '1rem', height: '1rem', accentColor: 'var(--primary)' }}
                            />
                            I have a preferred name different from my legal name
                        </label>
                    </div>

                    {data.hasPreferredName && (
                        <div className="grid-2 mb-4 p-4 bg-background/50 rounded-lg border border-border">
                            <div>
                                <label className="label">Preferred First Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={data.preferredFirstName || ''}
                                    onChange={(e) => handleChange('preferredFirstName', e.target.value)}
                                    placeholder="e.g. Alex"
                                />
                            </div>
                            <div>
                                <label className="label">Preferred Last Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={data.preferredLastName || ''}
                                    onChange={(e) => handleChange('preferredLastName', e.target.value)}
                                    placeholder="Optional"
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid-2">
                        <div className="mb-4">
                            <label className="label">Email *</label>
                            <input
                                type="email"
                                className="input-field"
                                value={data.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="label">Phone *</label>
                            <input
                                type="tel"
                                className="input-field"
                                value={data.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="label">Street Address *</label>
                        <input
                            type="text"
                            className="input-field"
                            value={data.address || ''}
                            onChange={(e) => handleChange('address', e.target.value)}
                            placeholder="e.g. 123 Main St"
                        />
                    </div>

                    <div className="grid-2">
                        <div className="mb-4">
                            <label className="label">City *</label>
                            <input
                                type="text"
                                className="input-field"
                                value={data.city || ''}
                                onChange={(e) => handleChange('city', e.target.value)}
                                placeholder="e.g. San Francisco"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="label">State/Province *</label>
                            <input
                                type="text"
                                className="input-field"
                                value={data.state || ''}
                                onChange={(e) => handleChange('state', e.target.value)}
                                placeholder="e.g. CA"
                            />
                        </div>
                    </div>

                    <div className="grid-2">
                        <div className="mb-4">
                            <label className="label">Zip/Postal Code *</label>
                            <input
                                type="text"
                                className="input-field"
                                value={data.zipCode || ''}
                                onChange={(e) => handleChange('zipCode', e.target.value)}
                                placeholder="e.g. 94105"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="label">Country *</label>
                            <input
                                type="text"
                                className="input-field"
                                value={data.country || ''}
                                onChange={(e) => handleChange('country', e.target.value)}
                                placeholder="e.g. United States"
                            />
                        </div>
                    </div>

                    <div className="grid-2">
                        <div className="mb-4">
                            <label className="label">Full Location String (Legacy)</label>
                            <input
                                type="text"
                                className="input-field"
                                value={data.location}
                                onChange={(e) => handleChange('location', e.target.value)}
                                placeholder="e.g. San Francisco, CA"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="label">Date of Birth</label>
                            <input
                                type="date"
                                className="input-field"
                                value={data.dateOfBirth || ''}
                                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid-2">
                        <div className="mb-4">
                            <label className="label">LinkedIn</label>
                            <input
                                type="url"
                                className="input-field"
                                value={data.linkedin || ''}
                                onChange={(e) => handleChange('linkedin', e.target.value)}
                                placeholder="https://linkedin.com/in/..."
                            />
                        </div>

                        <div className="mb-4">
                            <label className="label">GitHub</label>
                            <input
                                type="url"
                                className="input-field"
                                value={data.github || ''}
                                onChange={(e) => handleChange('github', e.target.value)}
                                placeholder="https://github.com/..."
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="label">Portfolio Website</label>
                        <input
                            type="url"
                            className="input-field"
                            value={data.portfolio || ''}
                            onChange={(e) => handleChange('portfolio', e.target.value)}
                            placeholder="https://myportfolio.com"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
