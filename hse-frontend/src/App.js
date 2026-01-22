import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Plus, Edit2, Trash2, X, MapPin, Users, Building2, AlertTriangle, Calendar, Shield, Flame, Anchor, HardHat, ChevronRight, ChevronDown, Layers, User, CheckCircle, XCircle, Home, Activity, Camera, Upload, Search, Lock, LogOut, Eye, EyeOff, ArrowUp, ArrowDown, UserPlus, Check, Moon, Sun } from 'lucide-react';
import * as api from './api';

// Import extracted components
import { Navbar, Breadcrumb, PerformanceGauge, LoadingSpinner, EmptyState } from './components/common';
import { ProjectCard, CandidateCard } from './components/dashboard';
import { DailyLogModal, CandidateModal, DeleteConfirmModal, SectionModal, AssignCandidateModal, KpiModal, PhotoModal, ProjectModal, SettingsModal } from './components/modals';
import { LoginPage } from './views';

// Import utilities and constants  
import { riskOptions, emptyDailyLog, emptyMonthlyKPIs } from './utils/constants';
import { useDarkMode } from './hooks';


export default function App() {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(api.isLoggedIn());
  const [currentUser, setCurrentUser] = useState(api.getCurrentUser());
  const [loginError, setLoginError] = useState('');

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'project', id: ..., name: ... }
  const [deletePin, setDeletePin] = useState('');
  const [deletePinError, setDeletePinError] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const [projects, setProjects] = useState([]);
  const [view, setView] = useState('home');
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  // Use custom dark mode hook
  const [darkMode, setDarkMode] = useDarkMode();


  const [chartDateRange, setChartDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
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
  const [selectedCandidates, setSelectedCandidates] = useState([]); // For multiple selection
  const [photoCandidate, setPhotoCandidate] = useState(null);

  const getPerformanceColor = (pct) => {
    if (pct >= 80) return '#10B981'; // Emerald 500
    if (pct >= 60) return '#3B82F6'; // Blue 500
    if (pct >= 40) return '#F59E0B'; // Amber 500
    return '#EF4444'; // Red 500
  };



  // Fetch projects on load (only if logged in)
  useEffect(() => {
    if (isLoggedIn) {
      fetchProjects();
    }
  }, [isLoggedIn]);

  const handleLogin = async (username, password) => {
    setLoginError('');
    setLoading(true);

    try {
      const data = await api.login(username, password);
      setIsLoggedIn(true);
      setCurrentUser(data.user);
    } catch (error) {
      setLoginError('Invalid username or password');
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
      setLoginError(error.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    api.logout();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setProjects([]);
    setView('home');
  };

  // Delete with PIN verification
  const handleDeleteProject = async () => {
    if (!deleteConfirm) return;

    setLoading(true);
    setDeletePinError('');

    try {
      // Find the project
      const project = projects.find(p => p.id === deleteConfirm.id);

      // If project has a PIN, verify it
      if (project?.deletePin) {
        await api.verifyDeletePin(deleteConfirm.id, deletePin);
      }

      // Delete the project
      await api.deleteProject(deleteConfirm.id);
      setProjects(projects.filter(p => p.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      setDeletePin('');
      alert('Project deleted successfully');
    } catch (error) {
      if (error.message.includes('403')) {
        setDeletePinError('Incorrect PIN');
      } else {
        alert('Failed to delete project');
        setDeleteConfirm(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await api.getProjects();

      // Fetch candidates for each project
      const projectsWithCandidates = await Promise.all(
        data.map(async (project) => {
          const candidates = await api.getCandidatesByProject(project.id);
          return { ...project, candidates };
        })
      );

      setProjects(projectsWithCandidates);
    } catch (error) {
      console.error('Error fetching projects:', error);
      alert('Failed to load projects. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // ==================== SECTIONS FUNCTIONS ====================

  const fetchSections = useCallback(async () => {
    if (!selectedProject?.id) return;
    try {
      const data = await api.getSectionsByProject(selectedProject.id);
      setSections(data);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  }, [selectedProject?.id]);

  useEffect(() => {
    if (selectedProject?.id && projectTab === 'sections') {
      fetchSections();
    }
  }, [selectedProject?.id, projectTab, fetchSections]);

  const handleAddSection = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.createSection(sectionForm, selectedProject.id);
      await fetchSections();
      await fetchProjects();
      setSectionModal(null);
      setSectionForm({});
    } catch (error) {
      console.error('Error creating section:', error);
      alert('Failed to create section');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSection = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.updateSection(selectedSection.id, sectionForm);
      await fetchSections();
      await fetchProjects();
      setSectionModal(null);
      setSectionForm({});
      setSelectedSection(null);
    } catch (error) {
      console.error('Error updating section:', error);
      alert('Failed to update section');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Are you sure you want to delete this section? All candidate assignments will be removed.')) return;

    try {
      setLoading(true);
      await api.deleteSection(sectionId);
      await fetchSections();
      await fetchProjects();
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Failed to delete section');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignMultipleCandidates = async (sectionId, candidateIds) => {
    try {
      setLoading(true);

      // Assign all candidates
      await Promise.all(
        candidateIds.map(candidateId => api.assignCandidateToSection(candidateId, sectionId))
      );

      // Fetch updated candidates to get new section_ids
      const updatedCandidates = await api.getCandidatesByProject(selectedProject.id);

      // Update selectedProject with new candidate data
      const updatedProject = { ...selectedProject, candidates: updatedCandidates };
      setSelectedProject(updatedProject);

      // Update projects array
      setProjects(projects.map(p => p.id === selectedProject.id ? updatedProject : p));

      // Refresh sections list
      await fetchSections();

      setSectionModal(null);
      setSelectedSection(null);
      setSelectedCandidates([]);
    } catch (error) {
      console.error('Error assigning candidates:', error);
      alert('Failed to assign candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignCandidate = async (sectionId, candidateId) => {
    if (!window.confirm('Remove this candidate from the section?')) return;

    try {
      setLoading(true);
      await api.unassignCandidateFromSection(candidateId, sectionId);

      // Fetch updated candidates to get new section_ids
      const updatedCandidates = await api.getCandidatesByProject(selectedProject.id);

      // Update selectedProject with new candidate data
      const updatedProject = { ...selectedProject, candidates: updatedCandidates };
      setSelectedProject(updatedProject);

      // Update projects array
      setProjects(projects.map(p => p.id === selectedProject.id ? updatedProject : p));

      // Refresh sections list
      await fetchSections();
    } catch (error) {
      console.error('Error unassigning candidate:', error);
      alert('Failed to remove candidate');
    } finally {
      setLoading(false);
    }
  };

  const toggleSectionVisibility = (sectionId) => {
    setHiddenSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const getSectionCandidates = (sectionId) => {
    return (selectedProject.candidates || []).filter(candidate => {
      return candidate.section_ids?.includes(sectionId);
    });
  };

  const getUnassignedCandidates = (sectionId) => {
    return (selectedProject.candidates || []).filter(candidate => {
      return !candidate.section_ids?.includes(sectionId);
    });
  };

  // ==================== END SECTIONS FUNCTIONS ====================

  // Navigation
  const goHome = () => { setView('home'); setSelectedProject(null); setSelectedCandidate(null); };
  const goToProject = (project) => {
    setSelectedProject(project);
    setSelectedCandidate(null);
    setView('project');
  };
  const goToCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setView('candidate');

    // Check if today's log is empty - auto-open daily log modal
    const today = new Date().toISOString().split('T')[0];
    const todayLog = candidate.dailyLogs?.[today];

    // Check if all tasks are empty/null
    const taskKeys = [
      'inductionsCovered', 'barcodeImplemented', 'attendanceVerified', 'taskBriefing',
      'tbtConducted', 'violationBriefing', 'checklistSubmitted', 'safetyObservationsRecorded',
      'sorNcrClosed', 'mockDrillParticipated', 'campaignParticipated', 'monthlyInspectionsCompleted',
      'nearMissReported', 'weeklyTrainingBriefed',
      'dailyReportsFollowup', 'msraCommunicated', 'consultantResponses',
      'weeklyTbtFullParticipation', 'welfareFacilitiesMonitored', 'mondayNcrShared',
      'safetyWalksConducted', 'trainingSessionsConducted', 'barcodeSystem100',
      'taskBriefingsParticipating'
    ];

    const isLogEmpty = !todayLog || taskKeys.every(key => todayLog[key] === null || todayLog[key] === undefined);

    if (isLogEmpty) {
      setSelectedDate(today);
      setForm(todayLog || { ...emptyDailyLog });
      setModal('dailyLog');
    }
  };

  // Project CRUD
  const saveProject = async () => {
    try {
      console.log('📝 saveProject called with form:', form);
      setLoading(true);

      const projectData = {
        name: form.name,
        location: form.location,
        company: form.company,
        hseLeadName: form.hseLeadName,
        hseLeadPhoto: form.hseLeadPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.hseLeadName)}&size=150&background=047857&color=fff`,
        manpower: form.manpower,
        manHours: form.manHours,
        newInductions: form.newInductions,
        highRisk: form.highRisk || [],
        deletePin: form.deletePin || null
      };

      console.log('📦 Prepared projectData:', projectData);
      console.log('🔐 Delete PIN:', projectData.deletePin);

      if (form.id) {
        console.log('🔄 Updating existing project:', form.id);
        await api.updateProject(form.id, projectData);
      } else {
        console.log('➕ Creating new project');
        await api.createProject(projectData);
      }

      console.log('✅ Project saved successfully!');
      await fetchProjects();
      setModal(null);
      alert('Project saved successfully!');
    } catch (error) {
      console.error('❌ Error saving project:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        request: error.request
      });
      alert('Failed to save project: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteProjectHandler = (id) => {
    const project = projects.find(p => p.id === id);
    console.log('Delete project:', project);
    console.log('Project deletePin:', project?.deletePin);
    console.log('Has PIN:', !!project?.deletePin);
    setDeleteConfirm({ type: 'project', id, name: project?.name, hasPin: !!project?.deletePin });
    setDeletePin('');
    setDeletePinError('');
  };

  // Move candidate up/down handlers
  const moveCandidate = async (candidateId, direction) => {
    const candidates = [...selectedProject.candidates].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    const currentIndex = candidates.findIndex(c => c.id === candidateId);

    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === candidates.length - 1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    // Swap positions
    const temp = candidates[currentIndex];
    candidates[currentIndex] = candidates[newIndex];
    candidates[newIndex] = temp;

    // Update displayOrder
    candidates.forEach((c, index) => {
      c.displayOrder = index;
    });

    // Update local state
    const updatedProject = { ...selectedProject, candidates };
    setSelectedProject(updatedProject);
    setProjects(projects.map(p => p.id === selectedProject.id ? updatedProject : p));

    // Save to backend
    try {
      const candidateIds = candidates.map(c => c.id);
      await api.reorderCandidates(selectedProject.id, candidateIds);
    } catch (error) {
      console.error('Failed to save order:', error);
      await fetchProjects();
    }
  };

  // Candidate CRUD
  const saveCandidate = async () => {
    try {
      setLoading(true);
      const candidateData = {
        name: form.name,
        photo: form.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name)}&size=150&background=10B981&color=fff`,
        role: form.role || ''
      };

      if (form.id) {
        await api.updateCandidate(form.id, candidateData, selectedProject.id);
      } else {
        await api.createCandidate(candidateData, selectedProject.id);
      }

      await fetchProjects();
      // Update selectedProject with new candidates
      const updatedProjects = await api.getProjects();
      const updatedProject = updatedProjects.find(p => p.id === selectedProject.id);
      if (updatedProject) {
        const candidates = await api.getCandidatesByProject(updatedProject.id);
        setSelectedProject({ ...updatedProject, candidates });
      }

      setModal(null);
      alert('Candidate saved successfully!');
    } catch (error) {
      console.error('Error saving candidate:', error);
      alert('Failed to save candidate');
    } finally {
      setLoading(false);
    }
  };

  const deleteCandidateHandler = async (id) => {
    if (!window.confirm('Are you sure you want to delete this candidate?')) return;

    try {
      setLoading(true);
      await api.deleteCandidate(id);
      await fetchProjects();

      // Update selectedProject
      const candidates = await api.getCandidatesByProject(selectedProject.id);
      setSelectedProject({ ...selectedProject, candidates });

      if (selectedCandidate?.id === id) setView('project');
      alert('Candidate deleted successfully!');
    } catch (error) {
      console.error('Error deleting candidate:', error);
      alert('Failed to delete candidate');
    } finally {
      setLoading(false);
    }
  };

  // Daily Log Save
  const saveDailyLog = async () => {
    try {
      setLoading(true);
      await api.createDailyLog(selectedCandidate.id, selectedDate, form);

      // Refresh candidate data to show new log
      const updatedCandidate = await api.getCandidate(selectedCandidate.id);
      setSelectedCandidate(updatedCandidate);

      // Also update in selectedProject
      const updatedCandidates = selectedProject.candidates.map(c =>
        c.id === selectedCandidate.id ? updatedCandidate : c
      );
      setSelectedProject({ ...selectedProject, candidates: updatedCandidates });

      setModal(null);
      alert('Daily log saved successfully!');
    } catch (error) {
      console.error('Error saving daily log:', error);
      alert('Failed to save daily log');
    } finally {
      setLoading(false);
    }
  };

  // Monthly KPIs Save
  const saveMonthlyKPIs = async () => {
    try {
      setLoading(true);
      const currentMonth = new Date().toISOString().split('T')[0];
      await api.createMonthlyKPI(selectedCandidate.id, currentMonth, form);

      const updatedCandidate = { ...selectedCandidate, monthlyKPIs: form };
      setSelectedCandidate(updatedCandidate);

      setModal(null);
      alert('Monthly KPIs saved successfully!');
    } catch (error) {
      console.error('Error saving KPIs:', error);
      alert('Failed to save monthly KPIs');
    } finally {
      setLoading(false);
    }
  };



  // Photo upload handler
  const handlePhotoSave = async (croppedBase64) => {
    if (!photoCandidate) return;

    try {
      setLoading(true);

      const candidateData = {
        name: photoCandidate.name,
        photo: croppedBase64,
        role: photoCandidate.role || ''
      };

      await api.updateCandidate(photoCandidate.id, candidateData, selectedProject.id);

      // Refresh data
      const candidates = await api.getCandidatesByProject(selectedProject.id);
      setSelectedProject({ ...selectedProject, candidates });

      // Update selectedCandidate view if applicable
      if (selectedCandidate?.id === photoCandidate.id) {
        setSelectedCandidate(data => ({ ...data, photo: croppedBase64 }));
      }

      setPhotoCandidate(null);
    } catch (error) {
      console.error('Error saving photo:', error);
      alert('Failed to save photo');
    } finally {
      setLoading(false);
    }
  };

  const openPhotoModal = (e, candidate) => {
    e.stopPropagation();
    setPhotoCandidate(candidate);
  };

  // Calculate candidate performance metrics for chart
  const getCandidatePerformanceData = (candidate) => {
    if (!candidate.dailyLogs) return [];

    const logs = candidate.dailyLogs;
    const fromDate = new Date(chartDateRange.from);
    const toDate = new Date(chartDateRange.to);

    // Calculate total days in range
    const totalDays = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;

    // Calculate attendance (days with both timeIn and timeOut)
    let attendanceDays = 0;
    Object.entries(logs).forEach(([date, log]) => {
      const logDate = new Date(date);
      if (logDate >= fromDate && logDate <= toDate) {
        if (log.timeIn && log.timeOut) {
          attendanceDays++;
        }
      }
    });

    const attendancePercentage = totalDays > 0 ? Math.round((attendanceDays / totalDays) * 100) : 0;

    // All task fields to track
    const taskFields = [
      { key: 'inductionsCovered', label: 'Inductions' },
      { key: 'barcodeImplemented', label: 'Barcode' },
      { key: 'attendanceVerified', label: 'Attendance' },
      { key: 'taskBriefing', label: 'Task Brief' },
      { key: 'tbtConducted', label: 'TBT' },
      { key: 'violationBriefing', label: 'Violations' },
      { key: 'checklistSubmitted', label: 'Checklist' },
      { key: 'safetyObservationsRecorded', label: 'Observations' },
      { key: 'sorNcrClosed', label: 'SOR/NCR' },
      { key: 'mockDrillParticipated', label: 'Mock Drill' },
      { key: 'campaignParticipated', label: 'Campaign' },
      { key: 'monthlyInspectionsCompleted', label: 'Inspections' },
      { key: 'nearMissReported', label: 'Near Miss' },
      { key: 'weeklyTrainingBriefed', label: 'Training' },
      // Additional 10 new fields
      { key: 'dailyReportsFollowup', label: 'Daily Reports' },
      { key: 'msraCommunicated', label: 'MSRA' },
      { key: 'consultantResponses', label: 'Consultant' },
      { key: 'weeklyTbtFullParticipation', label: 'Mass TBT' },
      { key: 'welfareFacilitiesMonitored', label: 'Welfare' },
      { key: 'mondayNcrShared', label: 'Monday NCR' },
      { key: 'safetyWalksConducted', label: 'Safety Walks' },
      { key: 'trainingSessionsConducted', label: 'Training Sessions' },
      { key: 'barcodeSystem100', label: 'Barcode 100%' },
      { key: 'taskBriefingsParticipating', label: 'Task Briefings' }
    ];

    // Initialize counters for each field
    const counters = {};
    taskFields.forEach(f => counters[f.key] = { yes: 0, answered: 0 });

    Object.entries(logs).forEach(([date, log]) => {
      const logDate = new Date(date);
      if (logDate >= fromDate && logDate <= toDate) {
        taskFields.forEach(f => {
          if (log[f.key] !== null && log[f.key] !== undefined) {
            counters[f.key].answered++;
            if (log[f.key] === true) counters[f.key].yes++;
          }
        });
      }
    });

    const calcPercentage = (data) => data.answered > 0 ? Math.round((data.yes / data.answered) * 100) : 0;

    // Create the data array with attendance as the FIRST item
    const performanceData = [
      {
        name: 'Attendance',
        value: attendancePercentage,
        yes: attendanceDays,
        total: totalDays,
        isAttendance: true // Flag to identify attendance bar for different styling
      },
      ...taskFields.map(f => ({
        name: f.label,
        value: calcPercentage(counters[f.key]),
        yes: counters[f.key].yes,
        total: counters[f.key].answered,
        isAttendance: false
      }))
    ];

    return performanceData;
  };

  // Calculate overall performance percentage for speedometer
  const getOverallPerformance = (candidate) => {
    if (!candidate.dailyLogs) return 0;

    const logs = candidate.dailyLogs;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    // All boolean task fields
    const taskKeys = [
      'inductionsCovered', 'barcodeImplemented', 'attendanceVerified', 'taskBriefing',
      'tbtConducted', 'violationBriefing', 'checklistSubmitted', 'safetyObservationsRecorded',
      'sorNcrClosed', 'mockDrillParticipated', 'campaignParticipated', 'monthlyInspectionsCompleted',
      'nearMissReported', 'weeklyTrainingBriefed',
      'dailyReportsFollowup', 'msraCommunicated', 'consultantResponses',
      'weeklyTbtFullParticipation', 'welfareFacilitiesMonitored', 'mondayNcrShared',
      'safetyWalksConducted', 'trainingSessionsConducted', 'barcodeSystem100',
      'taskBriefingsParticipating'
    ];

    let totalYes = 0;
    let totalAnswered = 0;

    Object.entries(logs).forEach(([date, log]) => {
      const logDate = new Date(date);
      if (logDate >= thirtyDaysAgo) {
        taskKeys.forEach(key => {
          if (log[key] !== null && log[key] !== undefined) {
            totalAnswered++;
            if (log[key] === true) totalYes++;
          }
        });
      }
    });

    if (totalAnswered === 0) return 0;

    return Math.round((totalYes / totalAnswered) * 100);
  };

  // Calculate candidate performance for a specific date range
  const getCandidatePerformanceForRange = (candidate, fromDate, toDate) => {
    if (!candidate.dailyLogs) return 0;

    const logs = candidate.dailyLogs;
    const from = new Date(fromDate);
    const to = new Date(toDate);

    const taskKeys = [
      'inductionsCovered', 'barcodeImplemented', 'attendanceVerified', 'taskBriefing',
      'tbtConducted', 'violationBriefing', 'checklistSubmitted', 'safetyObservationsRecorded',
      'sorNcrClosed', 'mockDrillParticipated', 'campaignParticipated', 'monthlyInspectionsCompleted',
      'nearMissReported', 'weeklyTrainingBriefed',
      'dailyReportsFollowup', 'msraCommunicated', 'consultantResponses',
      'weeklyTbtFullParticipation', 'welfareFacilitiesMonitored', 'mondayNcrShared',
      'safetyWalksConducted', 'trainingSessionsConducted', 'barcodeSystem100',
      'taskBriefingsParticipating'
    ];

    let totalYes = 0;
    let totalAnswered = 0;

    Object.entries(logs).forEach(([date, log]) => {
      const logDate = new Date(date);
      if (logDate >= from && logDate <= to) {
        taskKeys.forEach(key => {
          if (log[key] !== null && log[key] !== undefined) {
            totalAnswered++;
            if (log[key] === true) totalYes++;
          }
        });
      }
    });

    if (totalAnswered === 0) return null;
    return Math.round((totalYes / totalAnswered) * 100);
  };

  // Calculate project-wide performance stats
  const getProjectPerformanceStats = (candidates) => {
    if (!candidates || candidates.length === 0) return { average: 0, distribution: [], candidateScores: [] };

    const candidateScores = candidates.map(c => {
      const score = getCandidatePerformanceForRange(c, projectChartRange.from, projectChartRange.to);
      return {
        name: c.name,
        score: score,
        role: c.role
      };
    }).filter(c => c.score !== null);

    if (candidateScores.length === 0) return { average: 0, distribution: [], candidateScores: [] };

    const average = Math.round(candidateScores.reduce((sum, c) => sum + c.score, 0) / candidateScores.length);

    // Calculate distribution
    const excellent = candidateScores.filter(c => c.score >= 80).length;
    const good = candidateScores.filter(c => c.score >= 60 && c.score < 80).length;
    const fair = candidateScores.filter(c => c.score >= 40 && c.score < 60).length;
    const needsWork = candidateScores.filter(c => c.score < 40).length;

    const distribution = [
      { name: 'Excellent', value: excellent, color: '#10B981' },
      { name: 'Good', value: good, color: '#3B82F6' },
      { name: 'Fair', value: fair, color: '#F59E0B' },
      { name: 'Poor', value: needsWork, color: '#EF4444' }
    ].filter(d => d.value > 0);

    return { average, distribution, candidateScores };
  };

  // Speedometer Component


  // Calculate NCR/SOR Closure Rate
  const getNcrSorClosureRate = (kpis) => {
    const totalNcrs = (kpis.ncrsOpen || 0) + (kpis.ncrsClosed || 0);

    if (totalNcrs === 0) {
      return {
        percentage: 0,
        closed: 0,
        total: 0,
        message: 'No NCR/SOR assigned',
        color: 'gray',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-600',
        borderColor: 'border-gray-200'
      };
    }

    const percentage = Math.round((kpis.ncrsClosed / totalNcrs) * 100);

    let message, color, bgColor, textColor, borderColor;

    if (percentage >= 90) {
      message = `Excellent! All assigned NCR/SOR are ${percentage}% closed`;
      color = 'green';
      bgColor = 'bg-green-50';
      textColor = 'text-green-700';
      borderColor = 'border-green-200';
    } else if (percentage >= 80) {
      message = `Good! All assigned NCR/SOR are ${percentage}% closed`;
      color = 'lime';
      bgColor = 'bg-lime-50';
      textColor = 'text-lime-700';
      borderColor = 'border-lime-200';
    } else if (percentage >= 70) {
      message = `Fair! All assigned NCR/SOR are ${percentage}% closed`;
      color = 'orange';
      bgColor = 'bg-orange-50';
      textColor = 'text-orange-700';
      borderColor = 'border-orange-200';
    } else {
      message = `Needs attention! Only ${percentage}% of NCR/SOR are closed`;
      color = 'red';
      bgColor = 'bg-red-50';
      textColor = 'text-red-700';
      borderColor = 'border-red-200';
    }

    return {
      percentage,
      closed: kpis.ncrsClosed || 0,
      total: totalNcrs,
      message,
      color,
      bgColor,
      textColor,
      borderColor
    };
  };

  // Breadcrumb


  // Daily Monitoring Section
  const DailyMonitoringSection = ({ data }) => {
    const logs = data.dailyLogs || {};
    const todayLog = logs[selectedDate] || null;

    const TaskStatus = ({ value, label }) => {
      if (value === null || value === undefined) {
        return (
          <div className="p-2 bg-background rounded-lg">
            <p className="text-xs text-text-body mb-1 truncate" title={label}>{label}</p>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-surface text-text-body border border-border">
              Empty
            </span>
          </div>
        );
      }
      return (
        <div className="p-2 bg-background rounded-lg">
          <p className="text-xs text-text-body mb-1 truncate" title={label}>{label}</p>
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${value ? 'bg-success-bg text-success' : 'bg-error-bg text-error'
            }`}>
            {value ? <CheckCircle size={10} /> : <XCircle size={10} />}
            {value ? 'Yes' : 'No'}
          </span>
        </div>
      );
    };


    // All task fields
    const taskFields = [
      { key: 'inductionsCovered', label: 'Inductions Covered' },
      { key: 'barcodeImplemented', label: 'Barcode 100%' },
      { key: 'attendanceVerified', label: 'Attendance Verified' },
      { key: 'taskBriefing', label: 'Task Briefing' },
      { key: 'tbtConducted', label: 'TBT Conducted' },
      { key: 'violationBriefing', label: 'Violation Briefing' },
      { key: 'checklistSubmitted', label: 'Checklist' },
      { key: 'safetyObservationsRecorded', label: 'Safety Observations' },
      { key: 'sorNcrClosed', label: 'SOR/NCR Closed' },
      { key: 'mockDrillParticipated', label: 'Mock Drill' },
      { key: 'campaignParticipated', label: 'Campaign' },
      { key: 'monthlyInspectionsCompleted', label: 'Monthly Inspections' },
      { key: 'nearMissReported', label: 'Near Miss Reported' },
      { key: 'weeklyTrainingBriefed', label: 'Weekly Training' },
      // Additional 10 new fields
      { key: 'dailyReportsFollowup', label: 'Daily Reports' },
      { key: 'msraCommunicated', label: 'MSRA Communicated' },
      { key: 'consultantResponses', label: 'Consultant Responses' },
      { key: 'weeklyTbtFullParticipation', label: 'Mass TBT' },
      { key: 'welfareFacilitiesMonitored', label: 'Welfare Facilities' },
      { key: 'mondayNcrShared', label: 'Monday NCR' },
      { key: 'safetyWalksConducted', label: 'Safety Walks' },
      { key: 'trainingSessionsConducted', label: 'Training Sessions' },
      { key: 'barcodeSystem100', label: 'Barcode System 100%' },
      { key: 'taskBriefingsParticipating', label: 'Task Briefings' }
    ];

    // Calculate score for this log
    const getLogScore = (log) => {
      if (!log) return null;
      const tasks = taskFields.map(f => log[f.key]);
      const answered = tasks.filter(t => t !== null && t !== undefined);
      if (answered.length === 0) return null;
      const yesCount = answered.filter(t => t === true).length;
      return { yes: yesCount, total: answered.length, percentage: Math.round((yesCount / answered.length) * 100) };
    };

    const score = getLogScore(todayLog);

    return (
      <div className="bg-surface rounded-xl shadow-sm border border-border">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="font-semibold text-lg flex items-center gap-2 text-text-main"><Calendar size={20} />Daily Monitoring</h2>
          <div className="flex items-center gap-2">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-main" />
            <button onClick={() => { setForm(todayLog || { ...emptyDailyLog }); setModal('dailyLog'); }} className="bg-primary text-white px-3 py-2 rounded-lg text-sm hover:opacity-90">
              {todayLog ? 'Edit' : 'Add'}
            </button>
          </div>
        </div>
        <div className="p-4">
          {todayLog ? (
            <div>
              {/* Time IN/OUT */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-success-bg rounded-lg">
                  <p className="text-xs text-success">Time IN</p>
                  <p className="font-semibold text-success">{todayLog.timeIn || '-'}</p>
                </div>
                <div className="p-3 bg-success-bg rounded-lg">
                  <p className="text-xs text-success">Time OUT</p>
                  <p className="font-semibold text-success">{todayLog.timeOut || '-'}</p>
                </div>
              </div>

              {/* Task Status Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {taskFields.map(f => (
                  <TaskStatus key={f.key} value={todayLog[f.key]} label={f.label} />
                ))}
              </div>

              {/* Daily Score */}
              {score && (
                <div className="mt-4 p-3 bg-success-bg rounded-lg flex items-center justify-between">
                  <span className="text-sm font-medium text-success">Daily Score</span>
                  <span className="text-lg font-bold text-success">{score.yes}/{score.total} = {score.percentage}%</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-text-body text-center py-6">No log for {selectedDate}</p>
          )}
        </div>
      </div>
    );

  };

  // Monthly KPIs Section
  const MonthlyKPIsSection = ({ data }) => {
    const kpis = data.monthlyKPIs || emptyMonthlyKPIs;
    const closureRate = getNcrSorClosureRate(kpis);

    return (
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold text-lg flex items-center gap-2"><Activity size={20} />Monthly KPIs</h2>
          <button onClick={() => { setForm({ ...kpis }); setModal('kpis'); }} className="text-primary text-sm font-bold hover:underline">Update Values</button>

        </div>

        {/* NCR/SOR Closure Rate - Prominent Display */}
        <div className="p-4 border-b">
          <div className={`p-4 rounded-lg border-2 ${closureRate.bgColor} ${closureRate.borderColor}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">NCR/SOR Closure Performance</h3>
              <span className={`text-2xl font-bold ${closureRate.textColor}`}>
                {closureRate.percentage}%
              </span>
            </div>
            <p className={`text-sm font-medium ${closureRate.textColor} mb-2`}>
              {closureRate.message}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="font-medium">Details:</span>
              <span>{closureRate.closed} closed / {closureRate.total} total NCR/SOR</span>
            </div>
          </div>
        </div>

        {/* Existing KPI Grid */}
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
            <p className="text-xs text-amber-600">Observations Open</p>
            <p className="text-xl font-bold text-amber-700">{kpis.observationsOpen}</p>
          </div>
          <div className="p-3 rounded-lg bg-green-50 border border-green-100">
            <p className="text-xs text-green-600">Observations Closed</p>
            <p className="text-xl font-bold text-green-700">{kpis.observationsClosed}</p>
          </div>
          <div className="p-3 rounded-lg bg-red-50 border border-red-100">
            <p className="text-xs text-red-600">Violations</p>
            <p className="text-xl font-bold text-red-700">{kpis.violations}</p>
          </div>
          <div className="p-3 rounded-lg bg-orange-50 border border-orange-100">
            <p className="text-xs text-orange-600">NCRs Open</p>
            <p className="text-xl font-bold text-orange-700">{kpis.ncrsOpen}</p>
          </div>
          <div className="p-3 rounded-lg bg-teal-50 border border-teal-100">
            <p className="text-xs text-teal-600">NCRs Closed</p>
            <p className="text-xl font-bold text-teal-700">{kpis.ncrsClosed}</p>
          </div>
          <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
            <p className="text-xs text-purple-600">Reports Open</p>
            <p className="text-xl font-bold text-purple-700">{kpis.weeklyReportsOpen}</p>
          </div>
          <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100">
            <p className="text-xs text-indigo-600">Reports Closed</p>
            <p className="text-xl font-bold text-indigo-700">{kpis.weeklyReportsClosed}</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading && projects.length === 0 && isLoggedIn) {
    return <LoadingSpinner message="Loading projects..." />;
  }


  // Login Page
  if (!isLoggedIn) {
    return (
      <LoginPage
        onLogin={handleLogin}
        onSignup={handleSignup}
        loading={loading}
        error={loginError}
      />
    );
  }



  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        currentUser={currentUser}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onLogout={handleLogout}
        onSettings={() => setShowSettings(true)}
      />


      <main className="max-w-6xl mx-auto p-4 md:p-6">
        {/* HOME VIEW */}
        {view === 'home' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Projects</h1>
              <button onClick={() => { setForm({ highRisk: [] }); setModal('project'); }} className="flex items-center gap-2 bg-emerald-700 text-white px-4 py-2 rounded-lg hover:bg-emerald-800">
                <Plus size={20} />Add Project
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="bg-surface rounded-xl shadow-sm border border-border p-12 text-center">
                <Building2 size={48} className="mx-auto mb-4 text-text-body/30" />
                <h3 className="text-lg font-medium text-text-main mb-2">No Projects Yet</h3>
                <p className="text-text-body mb-4">Create your first project to get started</p>
                <button onClick={() => { setForm({ highRisk: [] }); setModal('project'); }} className="bg-primary text-white px-6 py-2 rounded-lg hover:opacity-90">
                  Add Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {projects.map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    performance={(() => {
                      if (!p.candidates || p.candidates.length === 0) return 0;
                      const scores = p.candidates.map(c => getOverallPerformance(c));
                      return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
                    })()}
                    riskOptions={riskOptions}
                    onView={(project) => {
                      setSelectedProject(project);
                      setView('project');
                    }}
                    onEdit={(project) => {
                      setForm({
                        ...project,
                        hseLeadName: project.hseLead.name,
                        hseLeadPhoto: project.hseLead.photo,
                        manpower: project.manpower,
                        manHours: project.manHours,
                        newInductions: project.newInductions,
                        highRisk: project.highRisk || [],
                        deletePin: project.deletePin || ''
                      });
                      setModal('project');
                    }}
                    onDelete={() => deleteProjectHandler(p.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROJECT VIEW */}
        {view === 'project' && selectedProject && (
          <div className="space-y-6">
            <Breadcrumb
              selectedProject={selectedProject}
              selectedCandidate={selectedCandidate}
              onHome={goHome}
              onProjectClick={goToProject}
            />

            {/* Project Performance Overview */}
            {selectedProject.candidates && selectedProject.candidates.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Activity size={20} />Project Performance Overview
                </h2>

                {/* Time Filter Buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { label: '7 Days', days: 7 },
                    { label: '30 Days', days: 30 },
                    { label: '3 Months', days: 90 },
                    { label: '6 Months', days: 180 },
                    { label: '1 Year', days: 365 }
                  ].map(({ label, days }) => {
                    const fromDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
                    const toDate = new Date().toISOString().split('T')[0];
                    const isActive = projectChartRange.from === fromDate && projectChartRange.to === toDate;
                    return (
                      <button
                        key={label}
                        onClick={() => setProjectChartRange({ from: fromDate, to: toDate })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${isActive
                          ? 'bg-primary text-white shadow-lg shadow-primary/20'
                          : 'bg-background text-text-body hover:bg-surface border border-border'
                          }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2 mb-6 items-center">
                  <span className="text-sm text-text-body">Custom:</span>
                  <input
                    type="date"
                    value={projectChartRange.from}
                    onChange={(e) => setProjectChartRange({ ...projectChartRange, from: e.target.value })}
                    className="bg-background border border-border rounded px-2 py-1 text-sm text-text-main"
                  />
                  <span className="text-text-body/50">to</span>
                  <input
                    type="date"
                    value={projectChartRange.to}
                    onChange={(e) => setProjectChartRange({ ...projectChartRange, to: e.target.value })}
                    className="bg-background border border-border rounded px-2 py-1 text-sm text-text-main"
                  />
                </div>

                {/* Gauge + Donut Charts */}
                {(() => {
                  const stats = getProjectPerformanceStats(selectedProject.candidates);
                  if (stats.candidateScores.length === 0) {
                    return (
                      <div className="text-center text-text-body/40 py-12 bg-surface rounded-2xl border border-dashed border-border mb-8">
                        No performance data for selected period
                      </div>
                    );
                  }



                  return (
                    <div className="flex flex-col lg:flex-row items-stretch justify-center gap-6 mb-10">
                      {/* Overall Score Card */}
                      <div className="flex-1 bg-surface rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
                        <h3 className="text-[10px] font-black tracking-[0.2em] text-text-body/40 uppercase mb-6">Overall Performance</h3>
                        <div className="scale-150 mb-4 origin-center">
                          <PerformanceGauge percentage={stats.average} />
                        </div>
                        <div className="text-center mt-6">
                          <p className="text-xs font-black text-text-body/60 uppercase tracking-widest leading-none">Project Health</p>
                        </div>
                      </div>

                      {/* Performance Distribution Card */}
                      {stats.distribution.length > 0 && (
                        <div className="flex-1 bg-surface rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col group">
                          <h3 className="text-[10px] font-black tracking-[0.2em] text-text-body/40 uppercase mb-4 text-center">Score distribution</h3>
                          <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8">
                            <div className="relative w-40 h-40">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={stats.distribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={75}
                                    dataKey="value"
                                    paddingAngle={4}
                                    stroke="none"
                                  >
                                    {stats.distribution.map((entry, index) => (
                                      <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                        className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                                      />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    content={({ active, payload }) => {
                                      if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                          <div className="bg-surface/90 backdrop-blur-md p-3 border border-border rounded-xl shadow-2xl">
                                            <p className="text-xs font-black text-text-main uppercase tracking-widest mb-1">{data.name}</p>
                                            <p className="text-lg font-black" style={{ color: data.color }}>{data.value} <span className="text-[10px] text-text-body/60 font-bold ml-1">CANDIDATES</span></p>
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-black text-text-main leading-none">{selectedProject.candidates.length}</span>
                                <span className="text-[8px] font-black text-text-body/40 uppercase tracking-tighter">TOTAL</span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 justify-center">
                              {stats.distribution.map((d, i) => (
                                <div key={i} className="flex items-center gap-3 group/item cursor-default">
                                  <div className="w-2.5 h-2.5 rounded-full shadow-lg" style={{ backgroundColor: d.color }}></div>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-text-body uppercase tracking-tight group-hover/item:text-text-main transition-colors">{d.name}</span>
                                    <span className="text-[9px] font-bold text-text-body/40 -mt-1">{d.value} Member{d.value !== 1 ? 's' : ''}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>
            )}

            {/* Candidates/Sections Tabs */}
            <div className="bg-white rounded-xl shadow-sm border">
              {/* Tab Navigation */}
              <div className="border-b">
                <div className="flex">
                  <button
                    onClick={() => setProjectTab('candidates')}
                    className={`px-6 py-3 font-medium border-b-2 transition ${projectTab === 'candidates'
                      ? 'border-emerald-700 text-emerald-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <Users size={18} />
                      Candidates
                    </div>
                  </button>
                  <button
                    onClick={() => setProjectTab('sections')}
                    className={`px-6 py-3 font-medium border-b-2 transition ${projectTab === 'sections'
                      ? 'border-emerald-700 text-emerald-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <Layers size={18} />
                      Sections
                    </div>
                  </button>
                </div>
              </div>

              {/* Candidates Tab Content */}
              {projectTab === 'candidates' && (
                <>
                  <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h2 className="font-semibold text-lg flex items-center gap-2"><Users size={20} />Candidates</h2>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {/* Search Box */}
                      <div className="relative flex-1 sm:flex-initial">
                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search candidates..."
                          value={candidateSearch}
                          onChange={(e) => setCandidateSearch(e.target.value)}
                          className="pl-9 pr-3 py-2 border rounded-lg text-sm w-full sm:w-48"
                        />
                      </div>
                      <button onClick={() => { setForm({}); setModal('candidate'); }} className="flex items-center gap-2 bg-emerald-700 text-white px-4 py-2 rounded-lg hover:bg-emerald-800 text-sm whitespace-nowrap">
                        <Plus size={16} />Add
                      </button>
                    </div>
                  </div>
                  {!selectedProject.candidates || selectedProject.candidates.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <User size={32} className="mx-auto mb-2 text-gray-300" />
                      <p>No candidates yet</p>
                      <button onClick={() => { setForm({}); setModal('candidate'); }} className="mt-4 bg-emerald-700 text-white px-6 py-2 rounded-lg hover:bg-emerald-800">
                        Add Your First Candidate
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                      {selectedProject.candidates
                        .filter(c => c.name.toLowerCase().includes(candidateSearch.toLowerCase()))
                        .sort((a, b) => {
                          const perfA = getOverallPerformance(a) || 0;
                          const perfB = getOverallPerformance(b) || 0;
                          if (perfB !== perfA) return perfB - perfA;
                          return (a.displayOrder || 0) - (b.displayOrder || 0);
                        })
                        .map((c, index, arr) => {
                          const performancePercentage = getOverallPerformance(c);
                          const isFirst = index === 0;
                          const isLast = index === arr.length - 1;
                          return (
                            <CandidateCard
                              key={c.id}
                              candidate={c}
                              performance={performancePercentage}
                              isFirst={isFirst}
                              isLast={isLast}
                              onView={goToCandidate}
                              onEdit={(candidate) => { setForm(candidate); setModal('candidate'); }}
                              onDelete={() => deleteCandidateHandler(c.id)}
                              onPhotoClick={(e, candidate) => openPhotoModal(e, candidate)}
                              onMoveUp={() => moveCandidate(c.id, 'up')}
                              onMoveDown={() => moveCandidate(c.id, 'down')}
                            />
                          );
                        })}
                      {selectedProject.candidates.filter(c => c.name.toLowerCase().includes(candidateSearch.toLowerCase())).length === 0 && (
                        <div className="col-span-full p-8 text-center text-text-body/50">
                          No candidates found matching "{candidateSearch}"
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Sections Tab Content */}
              {projectTab === 'sections' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-text-main">Sections</h2>
                      <p className="text-sm text-text-body">Organize candidates into sections</p>
                    </div>
                    <button
                      onClick={() => { setSectionForm({}); setSectionModal('add'); }}
                      className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-all font-medium"
                    >
                      <Plus size={18} />
                      Add Section
                    </button>
                  </div>
                  {sections.length === 0 ? (
                    <div className="text-center py-20 bg-background rounded-2xl border-2 border-dashed border-border group hover:border-primary/50 transition-all duration-300">
                      <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-border group-hover:scale-110 transition-transform">
                        <Layers size={40} className="text-text-body opacity-20" />
                      </div>
                      <h3 className="text-xl font-bold text-text-main mb-2">Initialize Your Layout</h3>
                      <p className="text-text-body mb-8 max-w-xs mx-auto">Create sections to categorize your team members by work groups or specializations.</p>
                      <button
                        onClick={() => { setSectionForm({}); setSectionModal('add'); }}
                        className="bg-primary text-white px-8 py-3 rounded-xl hover:opacity-90 font-bold transition-all shadow-lg shadow-primary/30 flex items-center gap-2 mx-auto"
                      >
                        <Plus size={20} />
                        Define First Section
                      </button>
                    </div>
                  ) : (

                    <div className="space-y-4">
                      {sections.map(section => {
                        const isHidden = hiddenSections.has(section.id);
                        const sectionCandidates = getSectionCandidates(section.id);
                        return (
                          <div key={section.id} className="border border-border rounded-2xl bg-surface shadow-sm overflow-hidden group">
                            <div className={`flex items-center justify-between p-5 transition-colors ${isHidden ? 'bg-background/50 opacity-60' : 'bg-background/20'}`}>
                              <div className="flex items-center gap-4 flex-1">
                                <button
                                  onClick={() => toggleSectionVisibility(section.id)}
                                  className={`p-2 rounded-lg transition-all ${isHidden ? 'bg-border/50 text-text-body' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                                >
                                  {isHidden ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                                </button>
                                <div className="flex-1">
                                  <h3 className="font-bold text-text-main text-lg">{section.name}</h3>
                                  {section.description && <p className="text-xs text-text-body font-medium">{section.description}</p>}
                                  <div className="flex items-center gap-2 mt-1">
                                    <Users size={12} className="text-text-body" />
                                    <p className="text-[10px] text-text-body uppercase font-bold tracking-wider">{sectionCandidates.length} Candidates Enrolled</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => toggleSectionVisibility(section.id)} className="p-2.5 hover:bg-background rounded-xl text-text-body transition-colors" title={isHidden ? 'Show section' : 'Hide section'}>
                                  {isHidden ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>
                                <button onClick={() => { setSectionForm({ name: section.name, description: section.description }); setSelectedSection(section); setSectionModal('edit'); }} className="p-2.5 hover:bg-primary/10 rounded-xl text-primary transition-colors">
                                  <Edit2 size={18} />
                                </button>
                                <button onClick={() => handleDeleteSection(section.id)} className="p-2.5 hover:bg-error/10 rounded-xl text-error transition-colors">
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                            {!isHidden && (
                              <div className="p-6 bg-surface">
                                {sectionCandidates.length === 0 ? (
                                  <div className="text-center py-10 bg-background/30 rounded-xl border border-dashed border-border">
                                    <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-border">
                                      <Users size={20} className="text-text-body opacity-40" />
                                    </div>
                                    <p className="text-xs font-bold text-text-body uppercase tracking-wider mb-4">No active candidates in this section</p>
                                    <button onClick={() => { setSelectedSection(section); setSectionModal('assign'); }} className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:scale-105 transition-transform bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                                      <Plus size={14} />
                                      ASSIGN CANDIDATES
                                    </button>
                                  </div>
                                ) : (

                                  <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-3">
                                      {sectionCandidates.map(candidate => {
                                        const performancePercentage = getOverallPerformance(candidate);
                                        return (
                                          <div
                                            key={candidate.id}
                                            className="border border-border rounded-xl p-4 bg-background/40 hover:bg-background hover:shadow-xl transition-all duration-300 cursor-pointer relative group/card"
                                            onClick={() => goToCandidate(candidate)}
                                          >
                                            <button
                                              onClick={(e) => { e.stopPropagation(); handleUnassignCandidate(section.id, candidate.id); }}
                                              className="absolute top-2 right-2 p-1.5 bg-surface/50 hover:bg-error hover:text-white rounded-lg text-text-body opacity-0 group-hover/card:opacity-100 transition-all z-10"
                                              title="Remove from section"
                                            >
                                              <X size={12} />
                                            </button>

                                            <div className="flex justify-center mb-4 mt-2">
                                              <div
                                                className="relative group/photo cursor-pointer"
                                                onClick={(e) => { e.stopPropagation(); openPhotoModal(e, candidate); }}
                                              >
                                                <img src={candidate.photo} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-surface shadow-md group-hover/photo:border-primary transition-colors" />
                                                <div className="absolute inset-0 bg-primary/40 rounded-full opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                                                  <Camera size={14} className="text-white" />
                                                </div>
                                              </div>
                                            </div>

                                            <div className="text-center mb-4">
                                              <p className="font-bold text-text-main text-sm truncate">{candidate.name}</p>
                                              {candidate.role && <p className="text-[10px] text-text-body truncate uppercase font-bold tracking-tighter opacity-70">{candidate.role}</p>}
                                            </div>


                                            {/* Performance Gauge - Centered */}
                                            <div className="flex justify-center">
                                              {Object.keys(candidate.dailyLogs || {}).length > 0 ? (
                                                <PerformanceGauge percentage={performancePercentage} />
                                              ) : (
                                                <div className="text-xs text-gray-400">No data</div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <button onClick={() => { setSelectedSection(section); setSectionModal('assign'); }} className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/70 transition-colors mt-4 p-2 bg-primary/5 rounded-lg border border-primary/10">
                                      <Plus size={14} strokeWidth={3} />
                                      ENROLL MORE CANDIDATES
                                    </button>

                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CANDIDATE VIEW */}
        {view === 'candidate' && selectedCandidate && (
          <div className="space-y-6">
            <Breadcrumb
              selectedProject={selectedProject}
              selectedCandidate={selectedCandidate}
              onHome={goHome}
              onProjectClick={goToProject}
            />

            {/* Candidate Overview with Chart */}
            <div className="bg-surface rounded-2xl shadow-xl border border-border p-6">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left: Candidate Info */}
                <div className="flex flex-col items-center sm:items-start gap-5 shrink-0">
                  <div className="relative">
                    <img src={selectedCandidate.photo} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg" />
                    <div className="absolute -bottom-1 -right-1 bg-success rounded-full p-2 border-4 border-surface shadow-sm text-white">
                      <Shield size={16} />
                    </div>
                  </div>
                  <div className="text-center sm:text-left">
                    <h1 className="text-3xl font-extrabold text-text-main tracking-tight leading-none mb-2">{selectedCandidate.name}</h1>
                    {selectedCandidate.role && <p className="text-text-body font-bold uppercase tracking-widest text-xs opacity-70 mb-4">{selectedCandidate.role}</p>}
                    <div className="flex justify-center sm:justify-start -ml-2">
                      <PerformanceGauge percentage={getCandidatePerformanceForRange(selectedCandidate, chartDateRange.from, chartDateRange.to) || 0} />
                    </div>
                  </div>
                </div>


                <div className="flex-1 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'WEEK', days: 7 },
                        { label: 'MONTH', days: 30 },
                        { label: 'QUARTER', days: 90 },
                        { label: 'YEAR', days: 365 }
                      ].map(({ label, days }) => {
                        const fromDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
                        const toDate = new Date().toISOString().split('T')[0];
                        const isActive = chartDateRange.from === fromDate && chartDateRange.to === toDate;
                        return (
                          <button
                            key={label}
                            onClick={() => setChartDateRange({ from: fromDate, to: toDate })}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${isActive
                              ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                              : 'bg-background text-text-body hover:bg-border border border-border'
                              }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2 bg-background p-1 rounded-xl border border-border shadow-inner">
                      <div className="flex items-center bg-surface px-3 py-1.5 rounded-lg shadow-sm border border-border">
                        <input
                          type="date"
                          value={chartDateRange.from}
                          onChange={(e) => setChartDateRange({ ...chartDateRange, from: e.target.value })}
                          className="bg-transparent text-xs font-bold text-text-main outline-none"
                        />
                      </div>
                      <span className="text-[10px] font-black text-text-body opacity-30">TO</span>
                      <div className="flex items-center bg-surface px-3 py-1.5 rounded-lg shadow-sm border border-border">
                        <input
                          type="date"
                          value={chartDateRange.to}
                          onChange={(e) => setChartDateRange({ ...chartDateRange, to: e.target.value })}
                          className="bg-transparent text-xs font-bold text-text-main outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {getCandidatePerformanceData(selectedCandidate).length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={getCandidatePerformanceData(selectedCandidate)} margin={{ top: 10, right: 10, left: 0, bottom: 80 }}>
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="currentColor" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="currentColor" stopOpacity={0.3} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10, fontWeight: '900', fill: 'currentColor', opacity: 0.5 }}
                          axisLine={false}
                          tickLine={false}
                          angle={-45}
                          textAnchor="end"
                          interval={0}
                          height={80}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fontWeight: 'bold', fill: 'currentColor', opacity: 0.5 }}
                          axisLine={false}
                          tickLine={false}
                          domain={[0, 100]}
                        />
                        <Tooltip
                          cursor={{ fill: 'currentColor', opacity: 0.05 }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-surface/90 backdrop-blur-md p-3 border border-border rounded-xl shadow-2xl">
                                  <p className="text-[10px] font-black text-text-body uppercase tracking-widest mb-1 opacity-60">{data.name}</p>
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-xl font-black" style={{ color: getPerformanceColor(data.value) }}>{data.value}%</span>
                                    <span className="text-[10px] font-bold text-text-body uppercase opacity-40">{data.yes} / {data.total} SCORE</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />

                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                          {getCandidatePerformanceData(selectedCandidate).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getPerformanceColor(entry.value)} className="transition-all duration-500" />
                          ))}
                        </Bar>

                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-gray-400">
                      <p>No performance data for selected period</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DailyMonitoringSection data={selectedCandidate} />
            <MonthlyKPIsSection data={selectedCandidate} />
          </div>
        )}
      </main>

      {/* PROJECT MODAL */}
      {modal === 'project' && (
        <ProjectModal
          isOpen={true}
          onClose={() => setModal(null)}
          form={form}
          setForm={setForm}
          onSave={saveProject}
          loading={loading}
        />
      )}

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentUser={currentUser}
      />


      {/* CANDIDATE MODAL */}
      {modal === 'candidate' && (
        <CandidateModal
          isOpen={true}
          onClose={() => setModal(null)}
          title={form.id ? 'Edit Candidate' : 'Add New Candidate'}
          form={form}
          setForm={setForm}
          onSave={saveCandidate}
          loading={loading}
        />
      )}

      {/* DAILY LOG MODAL */}
      {modal === 'dailyLog' && (
        <DailyLogModal
          isOpen={true}
          onClose={() => setModal(null)}
          title={`Daily Log - ${selectedDate}`}
          form={form}
          setForm={setForm}
          onSave={saveDailyLog}
          loading={loading}
        />
      )}


      {/* KPIs MODAL */}
      {modal === 'kpis' && (
        <KpiModal
          isOpen={true}
          onClose={() => setModal(null)}
          form={form}
          setForm={setForm}
          onSave={saveMonthlyKPIs}
          loading={loading}
        />
      )}

      {/* PHOTO UPLOAD MODAL */}
      {photoCandidate && (
        <PhotoModal
          isOpen={true}
          onClose={() => setPhotoCandidate(null)}
          currentPhoto={photoCandidate.photo}
          currentName={photoCandidate.name}
          onSave={handlePhotoSave}
          loading={loading}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => { setDeleteConfirm(null); setDeletePin(''); setDeletePinError(''); }}
        title="Delete Project"
        message={deleteConfirm ? `Are you sure you want to delete "${deleteConfirm.name}"?` : ''}
        confirmText="Delete"
        onConfirm={handleDeleteProject}
        loading={loading}
        securityPin={deleteConfirm?.hasPin}
        pin={deletePin}
        setPin={(val) => { setDeletePin(val); setDeletePinError(''); }}
        error={deletePinError}
      />

      {/* Add/Edit Section Modal */}
      {(sectionModal === 'add' || sectionModal === 'edit') && (
        <SectionModal
          isOpen={true}
          onClose={() => { setSectionModal(null); setSectionForm({}); setSelectedSection(null); }}
          title={sectionModal === 'add' ? 'Add Section' : 'Edit Section'}
          form={sectionForm}
          setForm={setSectionForm}
          onSave={sectionModal === 'add' ? handleAddSection : handleEditSection}
          loading={loading}
        />
      )}

      {/* Assign Candidate Modal */}
      {sectionModal === 'assign' && selectedSection && (
        <AssignCandidateModal
          isOpen={true}
          onClose={() => { setSectionModal(null); setSelectedSection(null); setSelectedCandidates([]); }}
          title={`Assign to ${selectedSection.name}`}
          candidates={getUnassignedCandidates(selectedSection.id)}
          selectedCandidates={selectedCandidates}
          setSelectedCandidates={setSelectedCandidates}
          onAssign={() => handleAssignMultipleCandidates(selectedSection.id, selectedCandidates)}
          loading={loading}
        />
      )}


    </div>
  );
}
