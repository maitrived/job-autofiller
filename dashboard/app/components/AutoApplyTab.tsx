'use client';

import { useState, useEffect } from 'react';
import { SearchProfile, UserProfile, AutoApplyStatus } from '../types/profile';
import JobDiscoveryList from './JobDiscoveryList';

interface AutoApplyTabProps {
    searchProfiles: SearchProfile[];
    professionalProfiles: UserProfile[];
    autoApplyStatuses: AutoApplyStatus[];
    onStartAutoApply: (searchProfileId: string) => void;
    onStopAutoApply: (searchProfileId: string) => void;
}

export default function AutoApplyTab({
    searchProfiles,
    professionalProfiles,
    autoApplyStatuses,
    onStartAutoApply,
    onStopAutoApply
}: AutoApplyTabProps) {
    const getStatus = (searchProfileId: string): AutoApplyStatus | undefined => {
        return autoApplyStatuses.find(s => s.searchProfileId === searchProfileId);
    };

    const getStatusColor = (status?: AutoApplyStatus) => {
        if (!status || status.status === 'idle') return 'var(--text-muted)';
        switch (status.status) {
            case 'running': return '#10b981'; // green
            case 'paused': return '#f59e0b'; // orange
            case 'completed': return '#6366f1'; // primary
            case 'error': return '#ef4444'; // red
            default: return 'var(--text-muted)';
        }
    };

    const getStatusIcon = (status?: AutoApplyStatus) => {
        if (!status || status.status === 'idle') return '⚪';
        switch (status.status) {
            case 'running': return '🟢';
            case 'paused': return '🟡';
            case 'completed': return '✅';
            case 'error': return '🔴';
            default: return '⚪';
        }
    };

    const getStatusLabel = (status?: AutoApplyStatus) => {
        if (!status || status.status === 'idle') return 'Ready';
        switch (status.status) {
            case 'running': return 'Running';
            case 'paused': return 'Paused';
            case 'completed': return 'Completed';
            case 'error': return 'Error';
            default: return 'Ready';
        }
    };

    return (
        <div className="fade-in-up">
            <h2 className="section-header" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🚀</span> Auto-Apply to Jobs
            </h2>

            {searchProfiles.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No Search Configurations Yet</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        Create a job search configuration in the "Job Search" tab to get started with automated applications.
                    </p>
                </div>
            ) : (
                <>
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                            Your Search Configurations
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                            {searchProfiles.map(profile => {
                                const status = getStatus(profile.id);
                                const isRunning = status?.status === 'running';
                                const linkedProfile = professionalProfiles.find(p => p.id === profile.targetProfileId);

                                return (
                                    <div key={profile.id} className="glass-card" style={{ position: 'relative' }}>
                                        {/* Status Badge */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '0.75rem',
                                            right: '0.75rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            padding: '0.3rem 0.6rem',
                                            borderRadius: '1rem',
                                            background: 'rgba(0, 0, 0, 0.2)',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            color: getStatusColor(status)
                                        }}>
                                            <span>{getStatusIcon(status)}</span>
                                            {getStatusLabel(status)}
                                        </div>

                                        {/* Config Details */}
                                        <div style={{ marginTop: '0.5rem' }}>
                                            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', paddingRight: '5rem' }}>
                                                {profile.name}
                                            </h4>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                                Profile: <strong style={{ color: 'var(--text-secondary)' }}>{linkedProfile?.name || 'Unknown'}</strong>
                                            </div>

                                            {/* Keywords */}
                                            {profile.config.keywords.length > 0 && (
                                                <div style={{ marginBottom: '0.5rem' }}>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Keywords:</div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                                        {profile.config.keywords.slice(0, 3).map(kw => (
                                                            <span key={kw} style={{
                                                                background: 'rgba(99, 102, 241, 0.15)',
                                                                padding: '0.15rem 0.5rem',
                                                                borderRadius: '0.75rem',
                                                                fontSize: '0.7rem',
                                                                color: 'var(--primary)'
                                                            }}>
                                                                {kw}
                                                            </span>
                                                        ))}
                                                        {profile.config.keywords.length > 3 && (
                                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                                +{profile.config.keywords.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Locations */}
                                            {profile.config.locations.length > 0 && (
                                                <div style={{ marginBottom: '0.5rem' }}>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Locations:</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        {profile.config.locations.slice(0, 2).join(', ')}
                                                        {profile.config.locations.length > 2 && ` +${profile.config.locations.length - 2} more`}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Config Summary */}
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                                {profile.config.remote !== 'any' && <span style={{ marginRight: '0.5rem' }}>📍 {profile.config.remote}</span>}
                                                <span style={{ marginRight: '0.5rem' }}>📊 {profile.config.dailyLimit}/day</span>
                                                {profile.config.requiresSponsorship && <span>🌍 Sponsorship</span>}
                                            </div>
                                        </div>

                                        {/* Progress Bar (if running) */}
                                        {status && status.status === 'running' && (
                                            <div style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                                                    <span>Applying to jobs...</span>
                                                    <span>{status.progress.applicationsSubmitted} / {status.progress.applicationsTarget}</span>
                                                </div>
                                                <div style={{
                                                    background: 'rgba(0, 0, 0, 0.2)',
                                                    borderRadius: '1rem',
                                                    height: '6px',
                                                    overflow: 'hidden',
                                                    marginBottom: '0.4rem'
                                                }}>
                                                    <div style={{
                                                        background: 'var(--gradient-primary)',
                                                        height: '100%',
                                                        width: `${(status.progress.applicationsSubmitted / status.progress.applicationsTarget) * 100}%`,
                                                        transition: 'width 0.3s ease'
                                                    }} />
                                                </div>
                                                {status.progress.currentJobUrl && (
                                                    <div style={{
                                                        fontSize: '0.65rem',
                                                        color: 'var(--text-muted)',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        Current: <span style={{ color: 'var(--primary)' }}>{status.progress.currentJobUrl}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                            {!isRunning ? (
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ flex: 1, padding: '0.6rem', fontSize: '0.9rem' }}
                                                    onClick={() => onStartAutoApply(profile.id)}
                                                >
                                                    🚀 Start Auto-Apply
                                                </button>
                                            ) : (
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{ flex: 1, padding: '0.6rem', fontSize: '0.9rem', color: '#ef4444' }}
                                                    onClick={() => onStopAutoApply(profile.id)}
                                                >
                                                    ⏹️ Stop
                                                </button>
                                            )}
                                        </div>

                                        {/* Error Display */}
                                        {status?.lastError && (
                                            <div style={{
                                                marginTop: '0.75rem',
                                                padding: '0.5rem',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                borderRadius: '0.5rem',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                fontSize: '0.75rem',
                                                color: '#ef4444'
                                            }}>
                                                <strong>Error:</strong> {status.lastError}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Discovered Jobs Section */}
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '2rem 0' }} />
                    <JobDiscoveryList />
                </>
            )}
        </div>
    );
}
