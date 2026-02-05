'use client';

import { useState } from 'react';
import { WorkAuthorization } from '../types/profile';

interface WorkAuthorizationFormProps {
    data: WorkAuthorization;
    onChange: (data: WorkAuthorization) => void;
}

export default function WorkAuthorizationForm({ data, onChange }: WorkAuthorizationFormProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="fade-in-up">
            <div
                className="section-header flex-between cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
                style={{ marginBottom: isExpanded ? '1.5rem' : '0' }}
            >
                <h2 style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <span>🛂</span> Work Authorization
                </h2>
                <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>
                    {isExpanded ? '−' : '+'}
                </span>
            </div>

            {isExpanded && (
                <div className="glass-card animate-in fade-in slide-in-from-top-4 duration-300">
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        Critical for automated applications, specifically for identifying sponsorship needs.
                    </p>

                    <div className="grid-2">
                        <div className="mb-4">
                            <label className="label">Are you legally authorized to work in the US?</label>
                            <select
                                className="input-field"
                                value={data.areYouAuthorized ? 'yes' : 'no'}
                                onChange={(e) => onChange({ ...data, areYouAuthorized: e.target.value === 'yes' })}
                            >
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="label">Will you now or in the future require sponsorship?</label>
                            <select
                                className="input-field"
                                value={data.requireSponsorship ? 'yes' : 'no'}
                                onChange={(e) => onChange({ ...data, requireSponsorship: e.target.value === 'yes' })}
                            >
                                <option value="no">No</option>
                                <option value="yes">Yes</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="label">Current Visa / Citizenship Status</label>
                            <select
                                className="input-field"
                                value={data.currentVisaStatus}
                                onChange={(e) => onChange({ ...data, currentVisaStatus: e.target.value as any })}
                            >
                                <option value="citizen">U.S. Citizen</option>
                                <option value="green_card">Permanent Resident (Green Card)</option>
                                <option value="opt">F-1 OPT</option>
                                <option value="h1b">H-1B</option>
                                <option value="cpt">F-1 CPT</option>
                                <option value="f1">F-1 Student</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {data.requireSponsorship && (
                            <div className="mb-4">
                                <label className="label">Sponsorship Type Needed</label>
                                <select
                                    className="input-field"
                                    value={data.sponsorshipType || 'h1b'}
                                    onChange={(e) => onChange({ ...data, sponsorshipType: e.target.value as any })}
                                >
                                    <option value="h1b">H-1B Only</option>
                                    <option value="stem_opt">STEM OPT Extension</option>
                                    <option value="both">H-1B & STEM OPT</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {(data.currentVisaStatus === 'opt' || data.currentVisaStatus === 'cpt') && (
                        <div className="grid-2 mt-2 p-4 bg-background/50 rounded-lg border border-border">
                            <div className="mb-4">
                                <label className="label">EAD Start Date</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={data.eadStart || ''}
                                    onChange={(e) => onChange({ ...data, eadStart: e.target.value })}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="label">EAD Expiration Date</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={data.eadExpiration || ''}
                                    onChange={(e) => onChange({ ...data, eadExpiration: e.target.value })}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
