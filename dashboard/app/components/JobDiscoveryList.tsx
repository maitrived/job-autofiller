import { useState, useEffect } from 'react';

interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    salary: string;
    platform: string;
    easyApply: boolean;
    matchScore: number;
    url: string;
    status: 'new' | 'applied' | 'saved' | 'viewed' | 'interviewing' | 'rejected' | 'offer';
    reasoning?: string;
    matchingSkills?: string[];
    missingSkills?: string[];
}

export default function JobDiscoveryList() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === 'JOBS_DATA') {
                setJobs(event.data.jobs);
            }
        };

        window.addEventListener('message', handleMessage);

        // Initial fetch
        window.postMessage({ type: 'GET_JOBS' }, '*');

        // Poll every 5 seconds for updates
        const interval = setInterval(() => {
            window.postMessage({ type: 'GET_JOBS' }, '*');
        }, 5000);

        return () => {
            window.removeEventListener('message', handleMessage);
            clearInterval(interval);
        };
    }, []);

    const startSearch = async () => {
        setIsLoading(true);
        // In production, this would message the extension to start scraping
        alert('Instructing extension to start job search based on your preferences...');
        setTimeout(() => setIsLoading(false), 2000);
    };

    const exportToCSV = () => {
        if (jobs.length === 0) return;

        const headers = ['Title', 'Company', 'Location', 'Salary', 'Platform', 'Match Score', 'URL', 'Status', 'Date Discovered'];
        const csvRows = [
            headers.join(','),
            ...jobs.map(job => [
                `"${job.title}"`,
                `"${job.company}"`,
                `"${job.location}"`,
                `"${job.salary}"`,
                `"${job.platform}"`,
                job.matchScore,
                `"${job.url}"`,
                `"${job.status}"`,
                `"${new Date().toLocaleDateString()}"`
            ].join(','))
        ];

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `job-applications-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fade-in-up" style={{ marginTop: '2rem' }}>
            <div className="flex-between mb-6">
                <h2 className="section-header" style={{ marginBottom: 0 }}>Discovered Jobs</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={exportToCSV}
                        disabled={jobs.length === 0}
                    >
                        📊 Export to CSV (Excel)
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={() => window.postMessage({ type: 'CHECK_STATUS' }, '*')}
                    >
                        🔄 Check Status
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={startSearch}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Searching...' : '🔍 Start New Search'}
                    </button>
                </div>
            </div>

            <div className="grid-2">
                {jobs.map((job) => (
                    <div key={job.id} className="glass-card" style={{ padding: '1.5rem' }}>
                        <div className="flex-between mb-4">
                            <span style={{
                                background: 'var(--gradient-primary)',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: 'white'
                            }}>
                                {job.matchScore}% Match
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{job.platform}</span>
                        </div>

                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{job.title}</h3>
                        <p style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: '0.25rem' }}>{job.company}</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                            📍 {job.location} • 💰 {job.salary}
                        </p>

                        {(job.reasoning || job.matchingSkills) && (
                            <div style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                                {job.reasoning && (
                                    <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                                        " {job.reasoning} "
                                    </p>
                                )}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                    {job.matchingSkills?.slice(0, 3).map((s, i) => (
                                        <span key={i} style={{ color: '#10b981', background: '#ecfdf5', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>✓ {s}</span>
                                    ))}
                                    {job.missingSkills?.slice(0, 2).map((s, i) => (
                                        <span key={i} style={{ color: '#ef4444', background: '#fef2f2', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>× {s}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                                onClick={() => {
                                    const baseUrl = job.url === '#' ? 'https://www.indeed.com' : job.url;
                                    const url = new URL(baseUrl);
                                    url.searchParams.set('autofill', 'true');
                                    window.open(url.toString(), '_blank');
                                }}
                            >
                                {job.easyApply ? '🚀 Auto-Apply' : '🔗 Apply on Site'}
                            </button>
                            <button className="btn btn-secondary" title="Save for later">⭐</button>
                        </div>
                    </div>
                ))}
            </div>

            {jobs.length === 0 && !isLoading && (
                <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No jobs discovered yet. Start a search to find opportunities!</p>
                </div>
            )}
        </div>
    );
}
