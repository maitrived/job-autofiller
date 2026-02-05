'use client';

import { useState } from 'react';
import { UserProfile, defaultProfile } from '../types/profile';
import PersonalInfoForm from './PersonalInfoForm';
import ExperienceForm from './ExperienceForm';
import EducationForm from './EducationForm';
import SkillsForm from './SkillsForm';

import WorkAuthorizationForm from './WorkAuthorizationForm';
import EEOForm from './EEOForm';

interface ProfileHubProps {
    profiles: UserProfile[];
    activeProfileId: string;
    onUpdateProfile: (profile: UserProfile) => void;
    onAddProfile: (name: string) => void;
    onDeleteProfile: (id: string) => void;
    onSwitchProfile: (id: string) => void;
}

export default function ProfileHub({
    profiles,
    activeProfileId,
    onUpdateProfile,
    onAddProfile,
    onDeleteProfile,
    onSwitchProfile
}: ProfileHubProps) {
    const [newProfileName, setNewProfileName] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];

    // Ensure backwards compatibility for older profiles
    const safeWorkAuth = activeProfile.workAuthorization || {
        areYouAuthorized: true,
        requireSponsorship: false,
        currentVisaStatus: 'citizen'
    };
    const safeDemographics = activeProfile.demographics || {};

    // Ensure PersonalInfo has the new fields structure if it was empty
    const safePersonalInfo = {
        ...activeProfile.personalInfo,
        hasPreferredName: activeProfile.personalInfo.hasPreferredName || false
    };

    const getProfileIcon = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('software') || lower.includes('dev') || lower.includes('engineer')) return '💻';
        if (lower.includes('data') || lower.includes('analyst') || lower.includes('scientist')) return '📊';
        if (lower.includes('design') || lower.includes('ux') || lower.includes('ui')) return '🎨';
        if (lower.includes('product') || lower.includes('manager')) return '📋';
        return '👤';
    };

    const handleAdd = () => {
        if (newProfileName.trim()) {
            onAddProfile(newProfileName.trim());
            setNewProfileName('');
            setIsAdding(false);
        }
    };

    return (
        <div className="fade-in-up">
            {/* Profile Selector */}
            <div className="glass-card mb-6" style={{ padding: '1rem', borderTop: '4px solid var(--primary)' }}>
                <div className="flex-between">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'var(--gradient-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            {getProfileIcon(activeProfile.name)}
                        </div>
                        <div>
                            <label className="label" style={{ marginBottom: 0, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Identity</label>
                            <select
                                className="input-field"
                                style={{ width: 'auto', padding: '0.2rem 2.5rem 0.2rem 0.5rem', fontSize: '1.1rem', fontWeight: 700, border: 'none', background: 'transparent', cursor: 'pointer' }}
                                value={activeProfileId}
                                onChange={(e) => onSwitchProfile(e.target.value)}
                            >
                                {profiles.map(p => (
                                    <option key={p.id} value={p.id}>{getProfileIcon(p.name)} {p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {isAdding ? (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Profile Name (e.g. Data Scientist)"
                                    style={{ width: '220px', padding: '0.4rem' }}
                                    value={newProfileName}
                                    onChange={(e) => setNewProfileName(e.target.value)}
                                    autoFocus
                                />
                                <button className="btn btn-primary" style={{ padding: '0.4rem 1rem' }} onClick={handleAdd}>Confirm</button>
                                <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem' }} onClick={() => setIsAdding(false)}>Cancel</button>
                            </div>
                        ) : (
                            <>
                                <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem' }} onClick={() => setIsAdding(true)}>+ New Identity</button>
                                {profiles.length > 1 && (
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '0.4rem 1rem', borderColor: '#ef4444', color: '#ef4444' }}
                                        onClick={() => onDeleteProfile(activeProfileId)}
                                    >
                                        Delete
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Consolidated Forms */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <PersonalInfoForm
                    data={safePersonalInfo}
                    onChange={(personalInfo) => onUpdateProfile({ ...activeProfile, personalInfo })}
                />

                <ExperienceForm
                    experiences={activeProfile.experience}
                    onChange={(experience) => onUpdateProfile({ ...activeProfile, experience })}
                />

                <EducationForm
                    education={activeProfile.education}
                    onChange={(education) => onUpdateProfile({ ...activeProfile, education })}
                />

                <SkillsForm
                    skills={activeProfile.skills}
                    onChange={(skills) => onUpdateProfile({ ...activeProfile, skills })}
                />

                <WorkAuthorizationForm
                    data={safeWorkAuth}
                    onChange={(workAuthorization) => onUpdateProfile({ ...activeProfile, workAuthorization })}
                />

                <EEOForm
                    data={safeDemographics}
                    onChange={(demographics) => onUpdateProfile({ ...activeProfile, demographics })}
                />
            </div>
        </div>
    );
}
