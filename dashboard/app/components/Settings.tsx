'use client';

import { useState, useEffect } from 'react';

export default function Settings() {
    const [apiKey, setApiKey] = useState('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');
    const [model, setModel] = useState('meta-llama/llama-3.1-8b-instruct');
    const [saved, setSaved] = useState(false);

    // Default Application Credentials
    const [appEmail, setAppEmail] = useState('');
    const [appPassword, setAppPassword] = useState('');

    useEffect(() => {
        const savedKey = localStorage.getItem('openRouterApiKey');
        if (savedKey) setApiKey(savedKey);

        const savedModel = localStorage.getItem('openRouterModel');
        if (savedModel) setModel(savedModel);

        const savedEmail = localStorage.getItem('appDefaultEmail');
        if (savedEmail) setAppEmail(savedEmail);

        const savedPassword = localStorage.getItem('appDefaultPassword');
        if (savedPassword) setAppPassword(savedPassword);
    }, []);

    const handleSave = () => {
        localStorage.setItem('openRouterApiKey', apiKey);
        localStorage.setItem('openRouterModel', model);
        localStorage.setItem('appDefaultEmail', appEmail);
        localStorage.setItem('appDefaultPassword', appPassword);

        setSaved(true);
        setTimeout(() => setSaved(false), 2000);

        // Notify extension of the new key and model
        window.postMessage({
            type: 'UPDATE_AI_CONFIG',
            apiKey,
            model,
            appEmail,
            appPassword
        }, '*');
    };

    return (
        <div className="fade-in-up">
            <h2 className="section-header">System Settings</h2>

            <div className="glass-card" style={{ padding: '2rem' }}>
                <div className="mb-6">
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>AI Integration (OpenRouter)</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Connect to your preferred AI models via OpenRouter.
                        Get your key from <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>OpenRouter.ai</a>.
                    </p>

                    <div className="form-group mb-4">
                        <label className="form-label">OpenRouter API Key</label>
                        <input
                            type="password"
                            className="form-input"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="sk-or-v1-..."
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div className="form-group mb-6">
                        <label className="form-label">AI Model</label>
                        <select
                            className="form-input"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            style={{ width: '100%' }}
                        >
                            <option value="meta-llama/llama-3.1-8b-instruct">Llama 3.1 8B Instruct (Balanced)</option>
                            <option value="mistralai/mistral-7b-instruct">Mistral 7B Instruct (Fast)</option>
                        </select>
                    </div>

                    <button
                        onClick={handleSave}
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={!apiKey}
                    >
                        {saved ? '✓ Config Saved' : 'Save Configuration'}
                    </button>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Automation Preferences</h3>

                    {/* Default Application Credentials */}
                    <div className="mb-6">
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Default Application Credentials</label>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                            The automation will try these credentials if you are logged out and the browser doesn't autofill.
                            <strong> Ideally, save your passwords in your browser (e.g. Google Password Manager) for best results.</strong>
                        </p>
                        <div className="grid-2">
                            <div className="form-group mb-4">
                                <label className="form-label">Email (Login)</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={appEmail}
                                    onChange={(e) => setAppEmail(e.target.value)}
                                    placeholder="e.g. mved1@asu.edu"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div className="form-group mb-4">
                                <label className="form-label">Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={appPassword}
                                    onChange={(e) => setAppPassword(e.target.value)}
                                    placeholder="••••••••"
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <input type="checkbox" id="auto-scroll" defaultChecked />
                        <label htmlFor="auto-scroll">Enable human-like scrolling during auto-apply</label>
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <input type="checkbox" id="notifications" defaultChecked />
                        <label htmlFor="notifications">Show browser notifications for new jobs</label>
                    </div>
                </div>
            </div>
        </div>
    );
}
