import { useState, useEffect } from 'react';
import { SearchProfile, UserProfile, SearchConfig, JobBoard } from '../types/profile';

interface SearchProfileTabProps {
    searchProfiles: SearchProfile[];
    professionalProfiles: UserProfile[];
    activeSearchProfileId: string;
    jobBoards: JobBoard[];
    onSaveProfile: (profile: SearchProfile) => void;
    onDeleteProfile: (id: string) => void;
    onSelectProfile: (id: string) => void;
    onUpdateJobBoards: (jobBoards: JobBoard[]) => void;
}

const defaultSearchConfig: SearchConfig = {
    keywords: [],
    locations: [],
    remote: 'any',
    dailyLimit: 20,
    requiresSponsorship: true,
    maxExperience: 1,
    datePosted: 'any'
};

export default function SearchProfileTab({
    searchProfiles,
    professionalProfiles,
    activeSearchProfileId,
    jobBoards,
    onSaveProfile,
    onDeleteProfile,
    onSelectProfile,
    onUpdateJobBoards
}: SearchProfileTabProps) {
    const [editingProfile, setEditingProfile] = useState<SearchProfile | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [keywordInput, setKeywordInput] = useState('');
    const [locationInput, setLocationInput] = useState('');

    // New state for Global Job Board inputs
    const [newSiteName, setNewSiteName] = useState('');
    const [newSiteUrl, setNewSiteUrl] = useState('');

    // Auto-save effect
    useEffect(() => {
        if (editingProfile && !isCreating) {
            const timer = setTimeout(() => {
                onSaveProfile(editingProfile);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [editingProfile, isCreating, onSaveProfile]);

    const activeSearchProfile = searchProfiles.find(p => p.id === activeSearchProfileId);

    const handleCreate = () => {
        const newProfile: SearchProfile = {
            id: Math.random().toString(36).substr(2, 9),
            name: 'New Search Configuration',
            targetProfileId: professionalProfiles[0]?.id || 'default',
            config: { ...defaultSearchConfig }
        };
        setEditingProfile(newProfile);
        setIsCreating(true);
    };

    const handleSave = () => {
        if (editingProfile) {
            onSaveProfile(editingProfile);
            setEditingProfile(null);
            setIsCreating(false);
        }
    };

    const addKeyword = () => {
        if (keywordInput && editingProfile && !editingProfile.config.keywords.includes(keywordInput)) {
            setEditingProfile({
                ...editingProfile,
                config: { ...editingProfile.config, keywords: [...editingProfile.config.keywords, keywordInput] }
            });
            setKeywordInput('');
        }
    };

    const addLocation = () => {
        if (locationInput && editingProfile && !editingProfile.config.locations.includes(locationInput)) {
            setEditingProfile({
                ...editingProfile,
                config: { ...editingProfile.config, locations: [...editingProfile.config.locations, locationInput] }
            });
            setLocationInput('');
        }
    };

    // Global Job Board Management Functions
    const addJobBoard = () => {
        if (newSiteName && newSiteUrl) {
            const newBoard: JobBoard = {
                id: Math.random().toString(36).substr(2, 9),
                name: newSiteName,
                url: newSiteUrl,
                enabled: true
            };
            onUpdateJobBoards([...jobBoards, newBoard]);
            setNewSiteName('');
            setNewSiteUrl('');
        }
    };

    const toggleJobBoard = (id: string) => {
        const updatedBoards = jobBoards.map(board =>
            board.id === id ? { ...board, enabled: !board.enabled } : board
        );
        onUpdateJobBoards(updatedBoards);
    };

    const deleteJobBoard = (id: string) => {
        const updatedBoards = jobBoards.filter(board => board.id !== id);
        onUpdateJobBoards(updatedBoards);
    };

    const moveJobBoard = (index: number, direction: 'up' | 'down') => {
        const boards = [...jobBoards];
        if (direction === 'up' && index > 0) {
            [boards[index], boards[index - 1]] = [boards[index - 1], boards[index]];
        } else if (direction === 'down' && index < boards.length - 1) {
            [boards[index], boards[index + 1]] = [boards[index + 1], boards[index]];
        }
        onUpdateJobBoards(boards);
    };

    return (
        <div className="fade-in-up">
            <h2 className="section-header" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🔍</span> Job Search Configurations
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 300px) 1fr', gap: '1.5rem' }} className="mb-6">
                {/* Sidebar: List of Search Profiles */}
                <div className="glass-card" style={{ height: 'fit-content' }}>
                    <div className="flex-between mb-4">
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Saved Presets</h3>
                        <button className="btn btn-primary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }} onClick={handleCreate}>+ New</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {searchProfiles.length === 0 && (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem', fontSize: '0.85rem' }}>No presets saved yet.</p>
                        )}
                        {searchProfiles.map(p => (
                            <div
                                key={p.id}
                                className="glass-card"
                                style={{
                                    padding: '0.6rem 0.75rem',
                                    cursor: 'pointer',
                                    borderColor: activeSearchProfileId === p.id ? 'var(--primary)' : 'var(--border-color)',
                                    background: activeSearchProfileId === p.id ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-glass)',
                                    transition: 'all 0.2s ease'
                                }}
                                onClick={() => onSelectProfile(p.id)}
                            >
                                <div className="flex-between">
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            Profile: {professionalProfiles.find(pp => pp.id === p.targetProfileId)?.name || 'Default'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
                                            onClick={(e) => { e.stopPropagation(); setEditingProfile(p); setIsCreating(false); }}
                                            title="Edit Config"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', color: '#ef4444' }}
                                            onClick={(e) => { e.stopPropagation(); onDeleteProfile(p.id); }}
                                            title="Delete Config"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main: Active Editor or Selection View */}
                {editingProfile ? (
                    <div className="glass-card">
                        <div className="flex-between mb-4">
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                {isCreating ? ' ✨ Create New Configuration' : ' ⚙️ Edit Configuration'}
                            </h3>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-primary" style={{ padding: '0.4rem 1.2rem' }} onClick={handleSave}>Save Changes</button>
                                <button className="btn btn-secondary" style={{ padding: '0.4rem 1.2rem' }} onClick={() => setEditingProfile(null)}>Cancel</button>
                            </div>
                        </div>

                        <div className="grid-2">
                            <div className="mb-4">
                                <label className="label">Configuration Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={editingProfile.name}
                                    onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                                    placeholder="e.g. Remote Software Roles"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="label">Link to Professional Profile</label>
                                <select
                                    className="input-field"
                                    value={editingProfile.targetProfileId}
                                    onChange={(e) => setEditingProfile({ ...editingProfile, targetProfileId: e.target.value })}
                                >
                                    {professionalProfiles.map(pp => (
                                        <option key={pp.id} value={pp.id}>{pp.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1rem 0 1.5rem 0' }} />

                        {/* Full Config UI */}
                        <div className="grid-2">
                            <div className="mb-4">
                                <label className="label">Keywords / Job Titles</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g. React Developer"
                                        value={keywordInput}
                                        onChange={(e) => setKeywordInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                                    />
                                    <button className="btn btn-secondary" onClick={addKeyword}>Add</button>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                                    {editingProfile.config.keywords.map((kw) => (
                                        <span key={kw} className="glass-card" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            {kw}
                                            <span style={{ cursor: 'pointer', color: 'var(--secondary)' }} onClick={() => setEditingProfile({ ...editingProfile, config: { ...editingProfile.config, keywords: editingProfile.config.keywords.filter(k => k !== kw) } })}>×</span>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="label">Target Locations</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g. Remote, USA"
                                        value={locationInput}
                                        onChange={(e) => setLocationInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addLocation()}
                                    />
                                    <button className="btn btn-secondary" onClick={addLocation}>Add</button>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                                    {editingProfile.config.locations.map((loc) => (
                                        <span key={loc} className="glass-card" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            {loc}
                                            <span style={{ cursor: 'pointer', color: 'var(--secondary)' }} onClick={() => setEditingProfile({ ...editingProfile, config: { ...editingProfile.config, locations: editingProfile.config.locations.filter(l => l !== loc) } })}>×</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Custom Job Boards Section */}
                        <div className="grid-2">
                            <div className="mb-4">
                                <label className="label">Work Preference</label>
                                <select
                                    className="input-field"
                                    value={editingProfile.config.remote}
                                    onChange={(e) => setEditingProfile({ ...editingProfile, config: { ...editingProfile.config, remote: e.target.value as any } })}
                                >
                                    <option value="any">Any</option>
                                    <option value="remote">Remote Only</option>
                                    <option value="hybrid">Hybrid</option>
                                    <option value="onsite">On-site</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="label">Date Posted</label>
                                <select
                                    className="input-field"
                                    value={editingProfile.config.datePosted || 'any'}
                                    onChange={(e) => setEditingProfile({ ...editingProfile, config: { ...editingProfile.config, datePosted: e.target.value as any } })}
                                >
                                    <option value="any">Any Time</option>
                                    <option value="past_24h">Past 24 Hours</option>
                                    <option value="past_week">Past Week</option>
                                    <option value="past_month">Past Month</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid-2">
                            <div className="mb-4">
                                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '1.5rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={editingProfile.config.requiresSponsorship}
                                        onChange={(e) => setEditingProfile({ ...editingProfile, config: { ...editingProfile.config, requiresSponsorship: e.target.checked } })}
                                        style={{ width: '1.1rem', height: '1.1rem', accentColor: 'var(--primary)' }}
                                    />
                                    Requires Sponsorship (H1-B/OPT)
                                </label>
                                <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <a href="https://h1bgrader.com/" target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: 'var(--primary)', textDecoration: 'none', background: 'rgba(99, 102, 241, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>📊 H1B Grader</a>
                                    <a href="https://github.com/coderQuad/New-Grad-Positions-2025" target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: 'var(--primary)', textDecoration: 'none', background: 'rgba(99, 102, 241, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>💻 2025 Repo</a>
                                    <a href="https://myvisajobs.com" target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: 'var(--primary)', textDecoration: 'none', background: 'rgba(99, 102, 241, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>🌍 MyVisaJobs</a>
                                </div>
                            </div>
                        </div>

                        <div className="grid-2">
                            <div className="mb-4">
                                <label className="label">Max Experience: <strong>{editingProfile.config.maxExperience} yrs</strong></label>
                                <input
                                    type="range"
                                    min="0"
                                    max="15"
                                    step="1"
                                    value={editingProfile.config.maxExperience}
                                    onChange={(e) => setEditingProfile({ ...editingProfile, config: { ...editingProfile.config, maxExperience: parseInt(e.target.value) } })}
                                    style={{ width: '100%', accentColor: 'var(--primary)' }}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="label">Daily Application Limit</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={editingProfile.config.dailyLimit}
                                    onChange={(e) => setEditingProfile({ ...editingProfile, config: { ...editingProfile.config, dailyLimit: parseInt(e.target.value) || 0 } })}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', opacity: 0.8 }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔎</div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {activeSearchProfile ? `Viewing: ${activeSearchProfile.name}` : 'Select a preset to begin search'}
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', maxWidth: '400px', marginTop: '0.5rem' }}>
                            {activeSearchProfile
                                ? "Click the edit icon to modify this preset's filters, or view the discovery list below."
                                : "Choose a saved quest or create a new one to start finding jobs tailored to your professional profiles."}
                        </p>
                        {!activeSearchProfile && (
                            <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={handleCreate}>Create Your First Preset</button>
                        )}
                    </div>
                )}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '3rem 0 2rem 0' }} />

            {/* Global Target Platforms Section */}
            <div className="mb-6 fade-in-up">
                <h2 className="section-header" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>🌐</span> Global Target Platforms
                </h2>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        These websites will be used for <strong>all</strong> job search profiles. Drag to prioritize which sites to search first.
                    </p>

                    <div className="mb-4" style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1fr) 2fr auto', gap: '1rem', alignItems: 'center' }}>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Site Name (e.g. Dice)"
                            value={newSiteName}
                            onChange={(e) => setNewSiteName(e.target.value)}
                        />
                        <input
                            type="url"
                            className="input-field"
                            placeholder="URL (e.g. https://dice.com)"
                            value={newSiteUrl}
                            onChange={(e) => setNewSiteUrl(e.target.value)}
                        />
                        <button className="btn btn-primary" onClick={addJobBoard} disabled={!newSiteName || !newSiteUrl}>+ Add Site</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {jobBoards.map((board, index) => (
                            <div key={board.id} className="glass-card flex-between" style={{ padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.1)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: 'var(--primary)',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.8rem',
                                        fontWeight: 700
                                    }}>
                                        {index + 1}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={board.enabled}
                                        onChange={() => toggleJobBoard(board.id)}
                                        style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)', cursor: 'pointer' }}
                                    />
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 600, fontSize: '1rem', color: board.enabled ? 'var(--text-primary)' : 'var(--text-muted)' }}>{board.name}</span>
                                        <a href={board.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none' }}>{board.url}</a>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button
                                        className="btn btn-secondary"
                                        disabled={index === 0}
                                        onClick={() => moveJobBoard(index, 'up')}
                                        style={{ padding: '0.4rem 0.6rem', opacity: index === 0 ? 0.3 : 1 }}
                                    >
                                        ▲
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        disabled={index === jobBoards.length - 1}
                                        onClick={() => moveJobBoard(index, 'down')}
                                        style={{ padding: '0.4rem 0.6rem', opacity: index === jobBoards.length - 1 ? 0.3 : 1 }}
                                    >
                                        ▼
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => deleteJobBoard(board.id)}
                                        style={{ color: '#ef4444', marginLeft: '0.5rem' }}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                        {jobBoards.length === 0 && (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '2rem', border: '1px dashed var(--border-color)', borderRadius: '1rem' }}>
                                No websites configured. Applications will fail without target sites! Add one above.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {activeSearchProfile && (
                <div className="fade-in-up mt-6">
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '2rem 0' }} />
                </div>
            )}
        </div>
    );
}
