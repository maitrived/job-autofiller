'use client';

import { useState, useEffect } from 'react';
import {
  UserProfile,
  MasterProfile,
  defaultProfile,
  defaultMasterProfile,
  SearchProfile,
  AutoApplyStatus
} from './types/profile';
import ProfileHub from './components/ProfileHub';
import SearchProfileTab from './components/SearchProfileTab';
import AutoApplyTab from './components/AutoApplyTab';
import QABankForm from './components/QABankForm';
import ResumeUpload from './components/ResumeUpload';
import Settings from './components/Settings';

declare global {
  interface Window {
    chrome: any;
  }
  var chrome: any;
}

export default function Home() {
  const [master, setMaster] = useState<MasterProfile>(defaultMasterProfile);

  // Initialize activeTab from storage (Lazy Init to prevent flicker)
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jobAutofillActiveTab') || 'profile-hub';
    }
    return 'profile-hub';
  });

  // Persist active tab
  useEffect(() => {
    localStorage.setItem('jobAutofillActiveTab', activeTab);
  }, [activeTab]);

  const [saved, setSaved] = useState(false);

  // Load master profile from localStorage on mount
  useEffect(() => {
    const savedMaster = localStorage.getItem('jobAutofillMaster');
    if (savedMaster) {
      try {
        setMaster(JSON.parse(savedMaster));
      } catch (e) {
        console.error("Failed to parse master profile:", e);
      }
    } else {
      // Migration: Check for old single profile
      const oldProfile = localStorage.getItem('jobAutofillProfile');
      if (oldProfile) {
        try {
          const profile = JSON.parse(oldProfile);
          const newMaster = { ...defaultMasterProfile, profiles: [profile] };
          setMaster(newMaster);
          localStorage.setItem('jobAutofillMaster', JSON.stringify(newMaster));
        } catch (e) {
          console.error("Failed to parse legacy profile:", e);
        }
      }
    }
    // Listen for status updates from extension
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.action === 'autoApplyStatusUpdate') {
        const update: AutoApplyStatus = event.data.status;
        setMaster(prev => {
          const statuses = prev.autoApplyStatuses?.filter(s => s.searchProfileId !== update.searchProfileId) || [];
          return { ...prev, autoApplyStatuses: [...statuses, update] };
        });
      }
    };

    window.addEventListener('message', handleMessage);

    // Also listen for chrome runtime messages if available (for direct extension comms)
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      const runtimeListener = (request: any) => {
        if (request.action === 'autoApplyStatusUpdate') {
          const update: AutoApplyStatus = request.status;
          setMaster(prev => {
            const statuses = prev.autoApplyStatuses?.filter(s => s.searchProfileId !== update.searchProfileId) || [];
            return { ...prev, autoApplyStatuses: [...statuses, update] };
          });
        }
      };
      chrome.runtime.onMessage.addListener(runtimeListener);
      return () => {
        window.removeEventListener('message', handleMessage);
        chrome.runtime.onMessage.removeListener(runtimeListener);
      };
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const saveMaster = (updatedMaster: MasterProfile) => {
    localStorage.setItem('jobAutofillMaster', JSON.stringify(updatedMaster));
    setMaster(updatedMaster);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    // Sync active profile to extension (legacy compatibility)
    const activeProfile = updatedMaster.profiles.find(p => p.id === updatedMaster.activeProfileId);
    if (activeProfile) {
      // Include resumes for AI context
      const profileToSync = {
        ...activeProfile,
        resumes: updatedMaster.resumes,
        qaBank: updatedMaster.qaBank // Also include Q&A bank
      };
      localStorage.setItem('jobAutofillProfile', JSON.stringify(profileToSync));
      window.postMessage({ type: 'UPDATE_PROFILE', profile: profileToSync }, '*');
    }
  };

  const handleUpdateActiveProfile = (profile: UserProfile) => {
    const updatedProfiles = master.profiles.map(p => p.id === profile.id ? profile : p);
    saveMaster({ ...master, profiles: updatedProfiles });
  };

  const handleAddProfile = (name: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newProfile = defaultProfile(id, name);
    saveMaster({
      ...master,
      profiles: [...master.profiles, newProfile],
      activeProfileId: id
    });
  };

  const handleDeleteProfile = (id: string) => {
    if (master.profiles.length <= 1) return;
    const updatedProfiles = master.profiles.filter(p => p.id !== id);
    const newActiveId = updatedProfiles[0].id;
    saveMaster({
      ...master,
      profiles: updatedProfiles,
      activeProfileId: newActiveId
    });
  };

  const handleSaveSearchProfile = (sp: SearchProfile) => {
    const exists = master.searchProfiles.find(p => p.id === sp.id);
    const updated = exists
      ? master.searchProfiles.map(p => p.id === sp.id ? sp : p)
      : [...master.searchProfiles, sp];
    saveMaster({ ...master, searchProfiles: updated, activeSearchProfileId: sp.id });
  };

  const handleDeleteSearchProfile = (id: string) => {
    const updated = master.searchProfiles.filter(p => p.id !== id);
    saveMaster({ ...master, searchProfiles: updated, activeSearchProfileId: updated[0]?.id || '' });
  };

  const importMaster = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          saveMaster(imported);
          alert('Data imported successfully!');
        } catch (error) {
          alert('Error importing data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const tabs = [
    { id: 'profile-hub', label: 'Profile Builder', icon: '👤' },
    { id: 'job-search', label: 'Job Search', icon: '🔍' },
    { id: 'auto-apply', label: 'Auto-Apply', icon: '🚀' },
    { id: 'qa', label: 'Q&A Bank', icon: '💬' },
    { id: 'resume', label: 'Resume', icon: '📄' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const activeProfile = master.profiles.find(p => p.id === master.activeProfileId) || master.profiles[0];

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header
        style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          padding: '0.75rem 1.5rem',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(10px)',
          marginBottom: '0.5rem',
        }}
      >
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Job Autofiller Dashboard
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <label htmlFor="import-master" className="btn btn-secondary">
              📥 Import
            </label>
            <input
              id="import-master"
              type="file"
              accept=".json"
              onChange={importMaster}
              style={{ display: 'none' }}
            />
            <button onClick={() => saveMaster(master)} className="btn btn-primary">
              {saved ? '✓ Saved!' : '💾 Save All'}
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          padding: '0 1rem',
        }}
      >
        <div className="container" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.6rem 1.2rem',
                fontSize: '0.9rem',
                background: activeTab === tab.id ? 'var(--bg-primary)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? 600 : 400,
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ marginRight: '0.5rem' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="container" style={{ paddingTop: '1.75rem', paddingBottom: '3rem' }}>
        {activeTab === 'profile-hub' && (
          <ProfileHub
            profiles={master.profiles}
            activeProfileId={master.activeProfileId}
            onUpdateProfile={handleUpdateActiveProfile}
            onAddProfile={handleAddProfile}
            onDeleteProfile={handleDeleteProfile}
            onSwitchProfile={(id) => saveMaster({ ...master, activeProfileId: id })}
          />
        )}

        {activeTab === 'job-search' && (
          <SearchProfileTab
            searchProfiles={master.searchProfiles}
            professionalProfiles={master.profiles}
            activeSearchProfileId={master.activeSearchProfileId}
            jobBoards={master.jobBoards || []}
            onSaveProfile={handleSaveSearchProfile}
            onDeleteProfile={handleDeleteSearchProfile}
            onSelectProfile={(id) => saveMaster({ ...master, activeSearchProfileId: id })}
            onUpdateJobBoards={(jobBoards) => saveMaster({ ...master, jobBoards })}
          />
        )}

        {activeTab === 'auto-apply' && (
          <AutoApplyTab
            searchProfiles={master.searchProfiles}
            professionalProfiles={master.profiles}
            autoApplyStatuses={master.autoApplyStatuses || []}
            onStartAutoApply={(searchProfileId) => {
              const searchProfile = master.searchProfiles.find(p => p.id === searchProfileId);
              if (searchProfile) {
                // Bridge through content script for localhost -> background communication
                window.postMessage({
                  type: 'START_AUTO_APPLY',
                  searchProfile,
                  jobBoards: master.jobBoards,
                  profile: activeProfile
                }, '*');

                // Optimistically update status
                const newStatus: AutoApplyStatus = {
                  searchProfileId,
                  status: 'running',
                  progress: { applicationsSubmitted: 0, applicationsTarget: searchProfile.config.dailyLimit },
                  startedAt: new Date().toISOString()
                };
                const statuses = master.autoApplyStatuses?.filter(s => s.searchProfileId !== searchProfileId) || [];
                setMaster(prev => ({ ...prev, autoApplyStatuses: [...statuses, newStatus] }));
              }
            }}
            onStopAutoApply={(searchProfileId) => {
              window.postMessage({
                type: 'STOP_AUTO_APPLY',
                searchProfileId
              }, '*');

              // Update status to idle
              const statuses = master.autoApplyStatuses?.filter(s => s.searchProfileId !== searchProfileId) || [];
              setMaster(prev => ({ ...prev, autoApplyStatuses: statuses }));
            }}
          />
        )}

        {activeTab === 'qa' && (
          <QABankForm
            qaBank={master.qaBank}
            onChange={(qaBank) => saveMaster({ ...master, qaBank })}
          />
        )}

        {activeTab === 'resume' && (
          <ResumeUpload
            resume={master.resumes[0]}
            onChange={(resume) => saveMaster({ ...master, resumes: resume ? [resume] : [] })}
          />
        )}

        {activeTab === 'settings' && <Settings />}

        {/* Status Info */}
        <div
          style={{
            marginTop: '2rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
          }}
        >
          Active Profile Context: <strong style={{ color: 'var(--primary)' }}>{activeProfile.name}</strong>
        </div>
      </main>

      {/* Floating Save Button */}
      <button
        onClick={() => saveMaster(master)}
        className="btn btn-primary"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          fontSize: '1.5rem',
          boxShadow: 'var(--shadow-lg)',
        }}
        title="Save Everything"
      >
        {saved ? '✓' : '💾'}
      </button>
    </div>
  );
}
