import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Plus, Edit2, Trash2, X, ChevronRight, ChevronDown, Layers, Search, CheckCircle, XCircle } from 'lucide-react';
import * as api from './api';

// Import extracted components
import { Navbar, Breadcrumb, PerformanceGauge, LoadingSpinner } from './components/common';
import { ProjectCard, CandidateCard } from './components/dashboard';
import { DailyLogModal, CandidateModal, DeleteConfirmModal, SectionModal, AssignCandidateModal, KpiModal, PhotoModal, ProjectModal, SettingsModal } from './components/modals';
import { LoginPage } from './views';

// Import utilities and constants  
import { riskOptions, emptyDailyLog, emptyMonthlyKPIs, dailyLogTaskFields } from './utils/constants';
import { useDarkMode } from './hooks';

export default function App() {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(api.isLoggedIn());
  const [currentUser, setCurrentUser] = useState(api.getCurrentUser());
  const [loginError, setLoginError] = useState('');

  // UI state
  const [projects, setProjects] = useState([]);
  const [view, setView] = useState('home');
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const getLocalDate = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getLocalDate());
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useDarkMode();
  const [showSettings, setShowSettings] = useState(false);

  const [projectChartRange, setProjectChartRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [candidateSearch, setCandidateSearch] = useState('');

  // Sections state
  const [projectTab, setProjectTab] = useState('candidates');
  const [sections, setSections] = useState([]);
  const [hiddenSections, setHiddenSections] = useState(new Set());
  const [selectedSection, setSelectedSection] = useState(null);
  const [sectionForm, setSectionForm] = useState({});
  const [sectionModal, setSectionModal] = useState(null);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [photoCandidate, setPhotoCandidate] = useState(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deletePin, setDeletePin] = useState('');
  const [deletePinError, setDeletePinError] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);

  const getPerformanceColor = (pct) => {
    if (pct >= 80) return '#0284C7'; // Darker Sky Blue (Excellent)
    if (pct >= 60) return '#0EA5E9'; // Main Sky Blue (Good)
    if (pct >= 40) return '#7DD3FC'; // Light Sky Blue (Fair)
    return '#BAE6FD'; // Pale Sky Blue (Poor)
  };


  const fetchTeam = useCallback(async () => {
    try {
      const data = await api.getUsers();
      setTeamMembers(data);
    } catch (error) {
      console.error('Error fetching team:', error);
    }
  }, []);

  const handleLogin = async (username, password) => {
    setLoginError('');
    setLoading(true);
    try {
      const data = await api.login(username, password);
      setIsLoggedIn(true);
      setCurrentUser(data.user);
    } catch (error) {
      const msg = error.message || 'Invalid username or password';
      if (msg.toLowerCase().includes('fetch')) {
        setLoginError(`${msg} (Attempted URL: ${api.API_BASE})`);
      } else {
        setLoginError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (userData) => {
    setLoginError('');
    setLoading(true);
    try {
      const data = await api.signup(userData);
      setIsLoggedIn(true);
      setCurrentUser(data.user);
    } catch (error) {
      setLoginError(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setProjects([]);
    setView('home');
  };

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getProjects();
      const projectsWithCandidates = await Promise.all(
        data.map(async (project) => {
          const candidates = await api.getCandidatesByProject(project.id);
          return { ...project, candidates };
        })
      );
      setProjects(projectsWithCandidates);
      return projectsWithCandidates; // Return for manual sync
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies - stable function

  // Separate sync function that updates selected states
  const syncSelectedData = useCallback(async () => {
    const projectsWithCandidates = await fetchProjects();
    if (!projectsWithCandidates) return;

    if (selectedProject) {
      const updatedProject = projectsWithCandidates.find(p => p.id === selectedProject.id);
      if (updatedProject) {
        setSelectedProject(updatedProject);
        if (selectedCandidate) {
          const updatedCandidate = updatedProject.candidates?.find(c => c.id === selectedCandidate.id);
          if (updatedCandidate) setSelectedCandidate(updatedCandidate);
        }
      }
    }
  }, [fetchProjects, selectedProject, selectedCandidate]);

  const fetchSections = useCallback(async () => {
    if (!selectedProject?.id) return;
    try {
      const data = await api.getSectionsByProject(selectedProject.id);
      setSections(data);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  }, [selectedProject?.id]);

  // Initial load only - runs once on login
  useEffect(() => {
    if (isLoggedIn) {
      fetchProjects();
      fetchTeam();
    }
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedProject?.id && projectTab === 'sections') {
      fetchSections();
    }
  }, [selectedProject?.id, projectTab, fetchSections]);

  // Handlers
  const saveProject = async () => {
    try {
      setLoading(true);
      const projectData = {
        name: form.name,
        location: form.location,
        company: form.company,
        hseLeadName: form.hseLeadName,
        hseLeadPhoto: form.hseLeadPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.hseLeadName)}&size=150&background=1e3a8a&color=fff`,
        manpower: form.manpower,
        manHours: form.manHours,
        newInductions: form.newInductions,
        highRisk: form.highRisk || [],
        deletePin: form.deletePin || null,
        assignedLeadIds: form.assignedLeadIds || []
      };

      if (form.id) {
        await api.updateProject(form.id, projectData);
      } else {
        await api.createProject(projectData);
      }
      await fetchProjects();
      setModal(null);
    } catch (error) {
      alert('Failed to save project: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteProjectHandler = (id) => {
    const project = projects.find(p => p.id === id);
    setDeleteConfirm({ type: 'project', id, name: project?.name, hasPin: !!project?.deletePin });
    setDeletePin('');
    setDeletePinError('');
  };

  const handleDeleteProject = async () => {
    if (!deleteConfirm) return;
    setLoading(true);
    try {
      if (deleteConfirm.hasPin) {
        await api.verifyDeletePin(deleteConfirm.id, deletePin);
      }
      await api.deleteProject(deleteConfirm.id);
      setProjects(projects.filter(p => p.id !== deleteConfirm.id));
      if (selectedProject?.id === deleteConfirm.id) {
        goHome();
      }
      setDeleteConfirm(null);
    } catch (error) {
      setDeletePinError('Action failed or incorrect PIN');
    } finally {
      setLoading(false);
    }
  };

  const saveCandidate = async () => {
    try {
      setLoading(true);
      const candidateData = {
        name: form.name,
        photo: form.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name)}&size=150&background=1e3a8a&color=fff`,
        role: form.role || ''
      };
      if (form.id) {
        await api.updateCandidate(form.id, candidateData, selectedProject.id);
      } else {
        await api.createCandidate(candidateData, selectedProject.id);
      }
      await fetchProjects(true); // Force real-time refresh
      setModal(null);
    } catch (error) {
      alert('Failed to save candidate');
    } finally {
      setLoading(false);
    }
  };

  const deleteCandidateHandler = async (id) => {
    if (!window.confirm('Delete candidate?')) return;
    try {
      setLoading(true);
      await api.deleteCandidate(id);
      await fetchProjects();
      const updatedCandidates = await api.getCandidatesByProject(selectedProject.id);
      setSelectedProject(prev => ({ ...prev, candidates: updatedCandidates }));
      if (selectedCandidate?.id === id) setView('project');
    } catch (error) {
      alert('Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const saveDailyLog = async () => {
    try {
      setLoading(true);
      console.log('📤 Saving log for candidate', selectedCandidate.id, 'date', selectedDate);
      await api.createDailyLog(selectedCandidate.id, selectedDate, form);
      console.log('✅ Log saved successfully');
      setModal(null); // Close immediately on success
      await syncSelectedData(); // Sync and update selected states
    } catch (error) {
      console.error('❌ Save Daily Log Error:', error);
      alert(`Failed to save log: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const saveMonthlyKPIs = async () => {
    try {
      setLoading(true);
      await api.createMonthlyKPI(selectedCandidate.id, new Date().toISOString().split('T')[0], form);
      await fetchProjects(true); // Sync global state
      setModal(null);
    } catch (error) {
      alert('Failed to save stats');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSave = async (base64) => {
    try {
      setLoading(true);
      await api.updateCandidate(photoCandidate.id, { ...photoCandidate, photo: base64 }, selectedProject.id);
      await fetchProjects();
      setPhotoCandidate(null);
    } catch (error) {
      alert('Photo save failed');
    } finally {
      setLoading(false);
    }
  };


  // Helper Stats
  const getOverallPerformance = (candidate) => {
    const logs = Object.values(candidate.dailyLogs || {});
    const taskKeys = dailyLogTaskFields.map(f => f.key);
    let yes = 0, count = 0;
    logs.forEach(log => {
      taskKeys.forEach(k => {
        if (log[k] !== null && log[k] !== undefined) {
          count++;
          if (log[k] === true) yes++;
        }
      });
    });
    return count > 0 ? Math.round((yes / count) * 100) : 0;
  };

  const getCandidatePerformanceForRange = (candidate, from, to) => {
    const logs = Object.entries(candidate.dailyLogs || {}).filter(([d]) => {
      return d >= from && d <= to; // Use string comparison for accuracy
    }).map(([, l]) => l);

    const taskKeys = dailyLogTaskFields.map(f => f.key);
    let yes = 0, count = 0;
    logs.forEach(log => {
      taskKeys.forEach(k => {
        if (log[k] !== null && log[k] !== undefined) {
          count++;
          if (log[k] === true) yes++;
        }
      });
    });
    return count > 0 ? Math.round((yes / count) * 100) : 0;
  };

  const getProjectPerformanceStats = (candidates) => {
    if (!candidates?.length) return { average: 0, distribution: [], candidateScores: [] };
    const scores = candidates.map(c => getCandidatePerformanceForRange(c, projectChartRange.from, projectChartRange.to));
    const validScores = scores.filter(s => s !== null);
    const avg = validScores.length ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
    const distribution = [
      { name: 'Excellent', value: validScores.filter(s => s >= 80).length, color: '#0284C7' },
      { name: 'Good', value: validScores.filter(s => s >= 60 && s < 80).length, color: '#0EA5E9' },
      { name: 'Fair', value: validScores.filter(s => s >= 40 && s < 60).length, color: '#7DD3FC' },
      { name: 'Poor', value: validScores.filter(s => s < 40).length, color: '#BAE6FD' }
    ].filter(d => d.value > 0);
    return { average: avg, distribution, candidateScores: validScores };
  };

  const getCandidatePerformanceData = (candidate) => {
    if (!candidate.dailyLogs) return [];

    const logs = Object.entries(candidate.dailyLogs).filter(([d]) => {
      return d >= projectChartRange.from && d <= projectChartRange.to;
    }).map(([, l]) => l);

    return dailyLogTaskFields.map(f => {
      const answered = logs.filter(l => l[f.key] !== null && l[f.key] !== undefined);
      const yes = answered.filter(l => l[f.key] === true).length;
      return { name: f.label, value: answered.length > 0 ? Math.round((yes / answered.length) * 100) : 0, yes, total: answered.length };
    });
  };

  // Section specific
  const getSectionCandidates = (sid) => (selectedProject?.candidates || []).filter(c => c.section_ids?.includes(sid));
  const toggleSectionVisibility = (sid) => setHiddenSections(p => {
    const ns = new Set(p);
    if (ns.has(sid)) ns.delete(sid); else ns.add(sid);
    return ns;
  });

  const handleAddSection = async (e) => {
    e.preventDefault();
    try {
      await api.createSection(sectionForm, selectedProject.id);
      await fetchSections();
      setSectionModal(null);
    } catch (e) { alert('Add section failed'); }
  };

  const handleEditSection = async (e) => {
    e.preventDefault();
    try {
      await api.updateSection(selectedSection.id, sectionForm);
      await fetchSections();
      setSectionModal(null);
    } catch (e) { alert('Update section failed'); }
  };

  const handleDeleteSection = async (id) => {
    if (!window.confirm('Delete section?')) return;
    try {
      await api.deleteSection(id);
      await fetchSections();
    } catch (e) { alert('Delete section failed'); }
  };

  const handleAssignMultipleCandidates = async (sid, cids) => {
    try {
      setLoading(true);
      await api.syncSectionCandidates(sid, cids);
      await fetchProjects();
      const updatedCandidates = await api.getCandidatesByProject(selectedProject.id);
      setSelectedProject(prev => ({ ...prev, candidates: updatedCandidates }));
      await fetchSections();
      setSectionModal(null);
      setSelectedCandidates([]);
    } catch (e) {
      console.error('Assign failed', e);
      alert('Assign failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignCandidate = async (sid, cid) => {
    try {
      await api.unassignCandidateFromSection(cid, sid);
      const updatedCandidates = await api.getCandidatesByProject(selectedProject.id);
      setSelectedProject(prev => ({ ...prev, candidates: updatedCandidates }));
      await fetchSections();
    } catch (e) { alert('Unassign failed'); }
  };

  const moveCandidate = async (cid, dir) => {
    const candis = [...selectedProject.candidates].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    const idx = candis.findIndex(c => c.id === cid);
    if (dir === 'up' && idx > 0) [candis[idx], candis[idx - 1]] = [candis[idx - 1], candis[idx]];
    if (dir === 'down' && idx < candis.length - 1) [candis[idx], candis[idx + 1]] = [candis[idx + 1], candis[idx]];

    candis.forEach((c, i) => c.displayOrder = i);
    setSelectedProject(prev => ({ ...prev, candidates: candis }));
    await api.reorderCandidates(selectedProject.id, candis.map(c => c.id));
  };

  // Nav actions
  const goHome = () => { setView('home'); setSelectedProject(null); setSelectedCandidate(null); };
  const goToProject = (p) => {
    setSelectedProject(p);
    setSelectedCandidate(null);
    setView('project');
  };
  // Auto-prompt log for missing data when date/candidate changes
  useEffect(() => {
    if (view === 'candidate' && selectedCandidate && modal === null) {
      const logData = selectedCandidate.dailyLogs?.[selectedDate];
      if (!logData) {
        setForm({ ...emptyDailyLog });
        setModal('dailyLog');
      }
    }
    // Removed 'modal' from dependencies to prevent auto-reopening loops
  }, [selectedDate, selectedCandidate?.id, view]); // eslint-disable-line react-hooks/exhaustive-deps

  const goToCandidate = (c) => {
    setSelectedCandidate(c);
    setSelectedDate(getLocalDate()); // Reset to today when entering profile
    setView('candidate');
  };

  // Sub-sections
  const DailyMonitoringSection = ({ data }) => {
    const todayLog = data.dailyLogs?.[selectedDate];

    return (
      <div className="bg-surface rounded-xl border p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold">Daily Monitoring</h2>
          <div className="flex gap-2">
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="border rounded px-2 text-sm" />
            <button onClick={() => { setForm(todayLog || { ...emptyDailyLog }); setModal('dailyLog'); }} className="bg-primary text-white px-3 py-1 rounded text-sm">{todayLog ? 'Edit' : 'Add'}</button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {dailyLogTaskFields.map(f => (
            <div key={f.key} className="p-2 border border-border/50 rounded-lg group hover:border-primary/20 transition-all">
              <p className="text-[10px] text-text-body font-bold uppercase">{f.label}</p>
              <div className="flex items-center gap-1 mt-1">
                {todayLog && todayLog[f.key] !== null ? (
                  todayLog[f.key] ? <CheckCircle size={14} className="text-success" /> : <XCircle size={14} className="text-error" />
                ) : <div className="text-[10px] text-text-body/30">N/A</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const MonthlyKPIsSection = ({ data }) => {
    const kpiEntries = Object.entries(data.monthlyKPIs || {});
    // Extract the latest month's KPIs if it's a map, otherwise fallback
    const kpis = kpiEntries.length > 0
      ? kpiEntries.sort((a, b) => b[0].localeCompare(a[0]))[0][1]
      : emptyMonthlyKPIs;

    return (
      <div className="bg-surface rounded-xl border p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold">Monthly KPIs</h2>
          <button onClick={() => { setForm({ ...kpis }); setModal('kpis'); }} className="text-primary text-sm font-bold font-black uppercase tracking-widest hover:text-primary/70 transition-colors">Update Stats</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {Object.entries(kpis).map(([k, v]) => (
            <div key={k} className="p-3 bg-background rounded-xl border border-border/50 group hover:border-primary/30 transition-all">
              <p className="text-[9px] text-text-body font-black uppercase tracking-tight opacity-50 mb-1 truncate">{k.replace(/([A-Z])/g, ' $1')}</p>
              <p className="font-black text-xl text-text-main leading-none">{v}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!isLoggedIn) return <LoginPage onLogin={handleLogin} onSignup={handleSignup} loading={loading} error={loginError} />;
  if (loading && projects.length === 0) return <LoadingSpinner message="Fetching Workspace..." />;

  return (
    <div className="min-h-screen bg-background text-text-main pb-20">
      <Navbar currentUser={currentUser} darkMode={darkMode} setDarkMode={setDarkMode} onLogout={handleLogout} onSettings={() => setShowSettings(true)} />

      <main className="max-w-6xl mx-auto p-4 md:p-6">
        {view === 'home' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Projects</h1>
              {currentUser?.role !== 'viewer' && (
                <button onClick={() => { setForm({ highRisk: [] }); setModal('project'); }} className="bg-primary text-white p-2 rounded-lg flex items-center gap-2 px-4">
                  <Plus size={20} /> New Project
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map(p => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  performance={Math.round((p.candidates?.reduce((a, c) => a + getOverallPerformance(c), 0) || 0) / (p.candidates?.length || 1))}
                  onView={goToProject}
                  onEdit={p => {
                    setForm({
                      ...p,
                      hseLeadName: p.hseLeadName || p.hseLead?.name,
                      assignedLeadIds: p.assigned_leads?.map(l => l.id) || []
                    });
                    setModal('project');
                  }}
                  onDelete={() => deleteProjectHandler(p.id)}
                  riskOptions={riskOptions}
                  userRole={currentUser?.role}
                />
              ))}
            </div>
          </div>
        )}

        {view === 'project' && selectedProject && (
          <div className="space-y-6">
            <Breadcrumb
              selectedProject={selectedProject}
              onHome={goHome}
              onProjectClick={goToProject}
            />

            {/* Project Performance Overview Toolbar */}
            <div className="bg-surface rounded-xl border p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-black text-text-main uppercase tracking-widest">Performance Overview</h2>
                <p className="text-[10px] text-text-body/60 font-bold uppercase tracking-tight">Select Audit Timeframe</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { label: '7 Days', days: 7 },
                  { label: '30 Days', days: 30 },
                  { label: '3 Months', days: 90 },
                  { label: '6 Months', days: 180 },
                  { label: '1 Year', days: 365 },
                ].map(range => {
                  const fromDate = new Date();
                  fromDate.setDate(fromDate.getDate() - range.days);
                  return (
                    <button
                      key={range.label}
                      onClick={() => setProjectChartRange({
                        from: fromDate.toISOString().split('T')[0],
                        to: getLocalDate()
                      })}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-tight rounded-lg border transition-all ${Math.abs((new Date(projectChartRange.to) - new Date(projectChartRange.from)) / (1000 * 60 * 60 * 24) - range.days) < 2
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                        : 'bg-background hover:border-primary/30 text-text-body'
                        }`}
                    >
                      {range.label}
                    </button>
                  );
                })}

                <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

                <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-2 py-1">
                  <span className="text-[9px] font-black text-text-body/40 uppercase">Custom</span>
                  <input
                    type="date"
                    value={projectChartRange.from}
                    onChange={e => setProjectChartRange(prev => ({ ...prev, from: e.target.value }))}
                    className="bg-transparent text-[10px] font-bold text-text-main outline-none"
                  />
                  <span className="text-text-body/40 text-[10px]">to</span>
                  <input
                    type="date"
                    value={projectChartRange.to}
                    onChange={e => setProjectChartRange(prev => ({ ...prev, to: e.target.value }))}
                    className="bg-transparent text-[10px] font-bold text-text-main outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Performance Stats - Full Width Top Section */}
            <div className="bg-surface rounded-xl border p-6 flex flex-col md:flex-row items-center justify-around gap-8 mb-6">
              <div className="flex flex-col items-center">
                <p className="text-xs font-bold text-text-body/40 uppercase mb-4 tracking-widest">Overall Project Score</p>
                <PerformanceGauge percentage={getProjectPerformanceStats(selectedProject.candidates).average} size="large" />
              </div>

              <div className="h-24 w-px bg-border hidden md:block" />

              <div className="w-full max-w-md flex flex-col items-center">
                <p className="text-xs font-bold text-text-body/40 uppercase mb-4 tracking-widest">Score Distribution</p>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getProjectPerformanceStats(selectedProject.candidates).distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
                          const RADIAN = Math.PI / 180;
                          const radius = outerRadius * 1.25; // Push label further out
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);

                          return (
                            <text
                              x={x}
                              y={y}
                              fill="#0f172a"
                              textAnchor={x > cx ? 'start' : 'end'}
                              dominantBaseline="central"
                              style={{ fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', filter: 'drop-shadow(0px 1px 1px white)' }}
                            >
                              {`${name} ${(percent * 100).toFixed(0)}%`}
                            </text>
                          );
                        }}
                        labelLine={true}
                      >
                        {getProjectPerformanceStats(selectedProject.candidates).distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Sidebar / Filters moved here if needed, or kept simple */}
              <div className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-4">
                    <button
                      onClick={() => setProjectTab('candidates')}
                      className={`text-sm font-black uppercase tracking-widest transition-colors ${projectTab === 'candidates' ? 'text-primary border-b-2 border-primary' : 'text-text-body opacity-40 hover:opacity-100'}`}
                    >
                      Candidates
                    </button>
                    <button
                      onClick={() => setProjectTab('sections')}
                      className={`text-sm font-black uppercase tracking-widest transition-colors ${projectTab === 'sections' ? 'text-primary border-b-2 border-primary' : 'text-text-body opacity-40 hover:opacity-100'}`}
                    >
                      Sections
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-surface border border-border rounded-xl flex items-center px-3 py-2 w-64 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                      <Search size={16} className="text-text-body opacity-40 mr-2" />
                      <input
                        type="text"
                        placeholder="Search candidates..."
                        value={candidateSearch}
                        onChange={(e) => setCandidateSearch(e.target.value)}
                        className="bg-transparent outline-none text-sm font-bold text-text-main placeholder:text-text-body/30 w-full"
                      />
                    </div>
                    {currentUser?.role !== 'viewer' && projectTab === 'candidates' && (
                      <button onClick={() => { setForm({}); setModal('candidate'); }} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90">
                        <Plus size={16} />
                        Add Candidate
                      </button>
                    )}
                  </div>
                </div>


                {projectTab === 'candidates' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {selectedProject.candidates
                      ?.filter(c => c.name.toLowerCase().includes(candidateSearch.toLowerCase()))
                      .sort((a, b) => getOverallPerformance(b) - getOverallPerformance(a))
                      .map((c, i, arr) => (
                        <CandidateCard key={c.id} candidate={c} performance={getOverallPerformance(c)} onView={goToCandidate} onEdit={c => { setForm(c); setModal('candidate'); }} onDelete={() => deleteCandidateHandler(c.id)} onPhotoClick={(e, candidate) => { e.stopPropagation(); setPhotoCandidate(candidate); }} isFirst={i === 0} isLast={i === arr.length - 1} onMoveUp={() => moveCandidate(c.id, 'up')} onMoveDown={() => moveCandidate(c.id, 'down')} userRole={currentUser?.role} />
                      ))}
                  </div>
                )}


                {projectTab === 'sections' && (
                  <div className="space-y-4">
                    {currentUser?.role !== 'viewer' && (
                      <button onClick={() => { setSectionForm({}); setSectionModal('add'); }} className="w-full py-3 border-2 border-dashed rounded-xl text-primary font-bold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
                        <Plus size={18} />
                        Create New Section
                      </button>
                    )}
                    {sections.length === 0 ? (
                      <div className="text-center py-12 bg-background/30 rounded-xl">
                        <Layers size={40} className="mx-auto mb-4 text-text-body/20" />
                        <p className="text-text-body/50 font-bold">No sections created yet</p>
                      </div>
                    ) : (
                      sections.map(s => (
                        <div key={s.id} className="border rounded-xl overflow-hidden">
                          <div className="p-4 bg-background/50 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <button onClick={() => toggleSectionVisibility(s.id)} className="p-1 hover:bg-background rounded">
                                {hiddenSections.has(s.id) ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                              </button>
                              <span className="font-bold">{s.name}</span>
                              <span className="text-xs text-text-body/50">({getSectionCandidates(s.id).length} members)</span>
                            </div>
                            {currentUser?.role !== 'viewer' && (
                              <div className="flex gap-2">
                                <button onClick={() => { setSectionForm(s); setSelectedSection(s); setSectionModal('edit'); }} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                                  <Edit2 size={16} />
                                </button>
                                {currentUser?.role === 'admin' && (
                                  <button onClick={() => handleDeleteSection(s.id)} className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          {!hiddenSections.has(s.id) && (
                            <div className="p-4 bg-surface">
                              {getSectionCandidates(s.id).length === 0 ? (
                                <p className="text-center text-text-body/40 text-sm py-4">No candidates in this section</p>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {getSectionCandidates(s.id).map(c => {
                                    const perf = getOverallPerformance(c);
                                    const perfColor = perf >= 80 ? '#0284C7' : perf >= 60 ? '#0EA5E9' : perf >= 40 ? '#7DD3FC' : '#BAE6FD';
                                    return (
                                      <div key={c.id} className="p-3 border rounded-lg flex justify-between items-center bg-background/50 hover:bg-background transition-colors">
                                        <div className="flex items-center gap-3">
                                          <img src={c.photo} alt={c.name} className="w-10 h-10 rounded-full border-2" style={{ borderColor: perfColor }} />
                                          <div>
                                            <span className="text-sm font-bold block">{c.name}</span>
                                            <span className="text-[10px] text-text-body/60 uppercase">{c.role || 'Team Member'}</span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <div className="text-center">
                                            <div className="text-lg font-black" style={{ color: perfColor }}>{perf}%</div>
                                            <div className="text-[8px] font-bold uppercase" style={{ color: perfColor }}>
                                              {perf >= 80 ? 'Excellent' : perf >= 60 ? 'Good' : perf >= 40 ? 'Fair' : 'Poor'}
                                            </div>
                                          </div>
                                          {currentUser?.role !== 'viewer' && (
                                            <button onClick={() => handleUnassignCandidate(s.id, c.id)} className="text-error hover:bg-error/10 p-1 rounded ml-2">
                                              <X size={14} />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              {currentUser?.role !== 'viewer' && (
                                <button onClick={() => {
                                  setSelectedSection(s);
                                  const alreadyAssigned = getSectionCandidates(s.id).map(c => c.id);
                                  setSelectedCandidates(alreadyAssigned);
                                  setSectionModal('assign');
                                }} className="mt-4 text-xs font-bold text-primary hover:text-primary/70 flex items-center gap-1">
                                  <Plus size={14} />
                                  Assign Candidates
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {view === 'candidate' && selectedCandidate && (
          <div className="space-y-6">
            <Breadcrumb
              selectedProject={selectedProject}
              selectedCandidate={selectedCandidate}
              onHome={goHome}
              onProjectClick={goToProject}
            />
            <div className="bg-surface rounded-xl border p-6 flex flex-col md:flex-row gap-8">
              <div className="flex flex-col items-center gap-4">
                <img src={selectedCandidate.photo} alt={selectedCandidate.name} className="w-32 h-32 rounded-full border-4 border-background shadow-lg" />
                <div className="text-center">
                  <h1 className="text-2xl font-bold">{selectedCandidate.name}</h1>
                  <p className="text-xs font-bold uppercase opacity-50">{selectedCandidate.role}</p>
                </div>
                <PerformanceGauge percentage={getOverallPerformance(selectedCandidate)} />
              </div>
              <div className="flex-1">
                <div className="flex gap-4 mb-6 border-b pb-4">
                  {[
                    { label: 'WEEK', days: 7 },
                    { label: 'MONTH', days: 30 },
                    { label: 'YEAR', days: 365 }
                  ].map(r => {
                    const fromDate = new Date();
                    fromDate.setDate(fromDate.getDate() - r.days);
                    const fromStr = fromDate.toISOString().split('T')[0];
                    const toStr = getLocalDate();
                    const isActive = Math.abs((new Date(projectChartRange.to) - new Date(projectChartRange.from)) / (1000 * 60 * 60 * 24) - r.days) < 2;

                    return (
                      <button
                        key={r.label}
                        onClick={() => setProjectChartRange({ from: fromStr, to: toStr })}
                        className={`text-xs font-black uppercase tracking-widest transition-all ${isActive
                          ? 'border-b-2 border-primary text-primary pb-4 -mb-4'
                          : 'opacity-40 hover:opacity-100'
                          }`}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={getCandidatePerformanceData(selectedCandidate)} margin={{ bottom: 60 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 9, fontWeight: 'bold' }}
                      angle={-45}
                      textAnchor="end"
                      interval={0}
                      height={70}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '10px' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={20}>
                      {getCandidatePerformanceData(selectedCandidate).map((e, i) => (
                        <Cell
                          key={i}
                          fill={e.name === 'Attendance' ? '#0C4A6E' : getPerformanceColor(e.value)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <DailyMonitoringSection data={selectedCandidate} />
            <MonthlyKPIsSection data={selectedCandidate} />
          </div>
        )}
      </main>

      {modal === 'project' && <ProjectModal isOpen={true} onClose={() => setModal(null)} form={form} setForm={setForm} onSave={saveProject} loading={loading} teamMembers={teamMembers} currentUser={currentUser} />}
      {modal === 'candidate' && <CandidateModal isOpen={true} onClose={() => setModal(null)} title={form.id ? 'Edit' : 'Add'} form={form} setForm={setForm} onSave={saveCandidate} loading={loading} />}
      {modal === 'dailyLog' && <DailyLogModal isOpen={true} onClose={() => setModal(null)} title={selectedDate} form={form} setForm={setForm} onSave={saveDailyLog} loading={loading} />}
      {modal === 'kpis' && <KpiModal isOpen={true} onClose={() => setModal(null)} form={form} setForm={setForm} onSave={saveMonthlyKPIs} loading={loading} />}
      {photoCandidate && <PhotoModal isOpen={true} onClose={() => setPhotoCandidate(null)} currentPhoto={photoCandidate.photo} currentName={photoCandidate.name} onSave={handlePhotoSave} loading={loading} />}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentUser={currentUser}
        projects={projects}
        onRefresh={fetchProjects}
      />
      <DeleteConfirmModal
        isOpen={!!deleteConfirm}
        deleteConfirm={deleteConfirm}
        deletePin={deletePin}
        setDeletePin={setDeletePin}
        deletePinError={deletePinError}
        setDeletePinError={setDeletePinError}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteProject}
        loading={loading}
      />
      {(sectionModal === 'add' || sectionModal === 'edit') && (
        <SectionModal
          isOpen={true}
          onClose={() => setSectionModal(null)}
          mode={sectionModal}
          sectionForm={sectionForm}
          setSectionForm={setSectionForm}
          onSubmit={sectionModal === 'add' ? handleAddSection : handleEditSection}
        />
      )}
      {sectionModal === 'assign' && selectedSection && <AssignCandidateModal isOpen={true} onClose={() => setSectionModal(null)} selectedSection={selectedSection} candidates={selectedProject.candidates} selectedCandidates={selectedCandidates} setSelectedCandidates={setSelectedCandidates} onAssign={handleAssignMultipleCandidates} loading={loading} />}
    </div>
  );
}
