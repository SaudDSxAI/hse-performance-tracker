import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Edit2, Trash2, X, MapPin, Users, Building2, AlertTriangle, Calendar, Shield, Flame, Anchor, HardHat, ChevronRight, User, CheckCircle, XCircle, Home, Activity, Camera, Upload } from 'lucide-react';
import * as api from './api';

const riskOptions = [
  { key: 'excavation', label: 'Excavation', icon: HardHat, color: 'bg-amber-100 text-amber-700' },
  { key: 'lifting', label: 'Lifting', icon: AlertTriangle, color: 'bg-red-100 text-red-700' },
  { key: 'marine', label: 'Marine', icon: Anchor, color: 'bg-blue-100 text-blue-700' },
  { key: 'hotwork', label: 'Hot Work', icon: Flame, color: 'bg-orange-100 text-orange-700' }
];

const emptyDailyLog = { 
  timeIn: '', 
  timeOut: '', 
  taskBriefing: null, 
  tbtConducted: null, 
  violationBriefing: null, 
  checklistSubmitted: null,
  inductionsCovered: null,
  barcodeImplemented: null,
  attendanceVerified: null,
  safetyObservationsRecorded: null,
  sorNcrClosed: null,
  mockDrillParticipated: null,
  campaignParticipated: null,
  monthlyInspectionsCompleted: null,
  nearMissReported: null,
  weeklyTrainingBriefed: null
};
const emptyMonthlyKPIs = { observationsOpen: 0, observationsClosed: 0, violations: 0, ncrsOpen: 0, ncrsClosed: 0, weeklyReportsOpen: 0, weeklyReportsClosed: 0 };

export default function App() {
  const [projects, setProjects] = useState([]);
  const [view, setView] = useState('home');
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [chartDateRange, setChartDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [photoCandidate, setPhotoCandidate] = useState(null); // For photo upload modal
  const [tempPhoto, setTempPhoto] = useState(null); // For cropping preview
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0, scale: 1 }); // For adjusting photo
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const canvasRef = useRef(null);

  // Fetch projects on load
  useEffect(() => {
    fetchProjects();
  }, []);

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
      alert('Failed to load projects. Make sure backend is running on http://127.0.0.1:8000');
    } finally {
      setLoading(false);
    }
  };

  // Navigation
  const goHome = () => { setView('home'); setSelectedProject(null); setSelectedCandidate(null); };
  const goToProject = (project) => { setSelectedProject(project); setSelectedCandidate(null); setView('project'); };
  const goToCandidate = (candidate) => { setSelectedCandidate(candidate); setView('candidate'); };

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
      hseLeadPhoto: form.hseLeadPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.hseLeadName)}&size=150&background=3B82F6&color=fff`,
      manpower: form.manpower,
      manHours: form.manHours,
      newInductions: form.newInductions,
      highRisk: form.highRisk || []
    };

    console.log('📦 Prepared projectData:', projectData);

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

  const deleteProjectHandler = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    
    try {
      setLoading(true);
      await api.deleteProject(id);
      await fetchProjects();
      if (selectedProject?.id === id) goHome();
      alert('Project deleted successfully!');
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
    } finally {
      setLoading(false);
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

  const toggleRisk = (risk) => {
    const current = form.highRisk || [];
    setForm({ ...form, highRisk: current.includes(risk) ? current.filter(r => r !== risk) : [...current, risk] });
  };

  // Photo upload handler - Step 1: Load image for cropping
  const handlePhotoSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setTempPhoto(reader.result);
      setCropPosition({ x: 0, y: 0, scale: 1 });
    };
    reader.readAsDataURL(file);
    
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  // Photo upload handler - Step 2: Crop and save
  const saveCroppedPhoto = async () => {
    if (!tempPhoto || !photoCandidate) return;

    try {
      setLoading(true);
      
      // Create canvas for cropping
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = async () => {
        // Output size (square)
        const outputSize = 300;
        canvas.width = outputSize;
        canvas.height = outputSize;
        
        // Calculate crop dimensions
        const minDim = Math.min(img.width, img.height);
        const scale = cropPosition.scale;
        const cropSize = minDim / scale;
        
        // Center point with offset
        const centerX = img.width / 2 + (cropPosition.x * img.width / 200);
        const centerY = img.height / 2 + (cropPosition.y * img.height / 200);
        
        // Source coordinates
        const sx = Math.max(0, Math.min(centerX - cropSize / 2, img.width - cropSize));
        const sy = Math.max(0, Math.min(centerY - cropSize / 2, img.height - cropSize));
        
        // Draw cropped image
        ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, outputSize, outputSize);
        
        // Convert to base64
        const croppedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        
        // Update candidate with new photo
        const candidateData = {
          name: photoCandidate.name,
          photo: croppedBase64,
          role: photoCandidate.role || ''
        };

        await api.updateCandidate(photoCandidate.id, candidateData, selectedProject.id);
        
        // Refresh data
        const candidates = await api.getCandidatesByProject(selectedProject.id);
        setSelectedProject({ ...selectedProject, candidates });
        
        setTempPhoto(null);
        setPhotoCandidate(null);
        setCropPosition({ x: 0, y: 0, scale: 1 });
        setLoading(false);
        alert('Photo updated successfully!');
      };
      
      img.src = tempPhoto;
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo');
      setLoading(false);
    }
  };

  const cancelCrop = () => {
    setTempPhoto(null);
    setCropPosition({ x: 0, y: 0, scale: 1 });
  };

  const openPhotoModal = (e, candidate) => {
    e.stopPropagation();
    setPhotoCandidate(candidate);
    setTempPhoto(null);
  };

  // Calculate candidate performance metrics for chart
  const getCandidatePerformanceData = (candidate) => {
    if (!candidate.dailyLogs) return [];
    
    const logs = candidate.dailyLogs;
    const fromDate = new Date(chartDateRange.from);
    const toDate = new Date(chartDateRange.to);
    
    // All task fields to track
    const taskFields = [
      { key: 'inductionsCovered', label: 'Inductions' },
      { key: 'barcodeImplemented', label: 'Barcode' },
      { key: 'attendanceVerified', label: 'Attendance' },
      { key: 'taskBriefing', label: 'Task Brief' },
      { key: 'tbtConducted', label: 'TBT' },
      { key: 'violationBriefing', label: 'Violations' },
      { key: 'safetyObservationsRecorded', label: 'Observations' },
      { key: 'sorNcrClosed', label: 'SOR/NCR' },
      { key: 'mockDrillParticipated', label: 'Mock Drill' },
      { key: 'campaignParticipated', label: 'Campaign' },
      { key: 'monthlyInspectionsCompleted', label: 'Inspections' },
      { key: 'nearMissReported', label: 'Near Miss' },
      { key: 'weeklyTrainingBriefed', label: 'Training' }
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
    
    return taskFields.map(f => ({
      name: f.label,
      value: calcPercentage(counters[f.key]),
      yes: counters[f.key].yes,
      total: counters[f.key].answered
    }));
  };

  // Calculate overall performance percentage for speedometer
  const getOverallPerformance = (candidate) => {
    if (!candidate.dailyLogs) return 0;
    
    const logs = candidate.dailyLogs;
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    
    // All boolean task fields
    const taskKeys = [
      'inductionsCovered', 'barcodeImplemented', 'attendanceVerified', 'taskBriefing',
      'tbtConducted', 'violationBriefing', 'safetyObservationsRecorded', 'sorNcrClosed',
      'mockDrillParticipated', 'campaignParticipated', 'monthlyInspectionsCompleted',
      'nearMissReported', 'weeklyTrainingBriefed'
    ];
    
    let totalYes = 0;
    let totalAnswered = 0;
    
    Object.entries(logs).forEach(([date, log]) => {
      const logDate = new Date(date);
      if (logDate >= sevenDaysAgo) {
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

  // Speedometer Component
  const PerformanceGauge = ({ percentage }) => {
    const getColor = () => {
      if (percentage >= 80) return '#22C55E';
      if (percentage >= 60) return '#EAB308';
      if (percentage >= 40) return '#F97316';
      return '#EF4444';
    };

    const getLabel = () => {
      if (percentage >= 80) return 'Excellent';
      if (percentage >= 60) return 'Good';
      if (percentage >= 40) return 'Fair';
      return 'Needs Work';
    };

    const rotation = -90 + (percentage * 1.8);

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-12">
          <svg className="w-24 h-12" viewBox="0 0 100 50">
            <path d="M 5 45 A 40 40 0 0 1 25 10" fill="none" stroke="#EF4444" strokeWidth="8" opacity="0.3" />
            <path d="M 25 10 A 40 40 0 0 1 40 5" fill="none" stroke="#F97316" strokeWidth="8" opacity="0.3" />
            <path d="M 40 5 A 40 40 0 0 1 60 5" fill="none" stroke="#EAB308" strokeWidth="8" opacity="0.3" />
            <path d="M 60 5 A 40 40 0 0 1 95 45" fill="none" stroke="#22C55E" strokeWidth="8" opacity="0.3" />
            <line x1="50" y1="45" x2="50" y2="15" stroke={getColor()} strokeWidth="2" strokeLinecap="round"
              style={{ transformOrigin: '50px 45px', transform: `rotate(${rotation}deg)`, transition: 'transform 0.3s ease' }} />
            <circle cx="50" cy="45" r="3" fill={getColor()} />
          </svg>
        </div>
        <div className="text-center mt-1">
          <p className="text-xs font-semibold" style={{ color: getColor() }}>{percentage}%</p>
          <p className="text-xs text-gray-500">{getLabel()}</p>
        </div>
      </div>
    );
  };

  // Breadcrumb
  const Breadcrumb = () => (
    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
      <button onClick={goHome} className="hover:text-blue-600 flex items-center gap-1"><Home size={14} />Home</button>
      {selectedProject && (
        <>
          <ChevronRight size={14} />
          <button onClick={() => goToProject(selectedProject)} className={`hover:text-blue-600 ${!selectedCandidate ? 'text-gray-800 font-medium' : ''}`}>{selectedProject.name}</button>
        </>
      )}
      {selectedCandidate && (
        <>
          <ChevronRight size={14} />
          <span className="text-gray-800 font-medium">{selectedCandidate.name}</span>
        </>
      )}
    </div>
  );

  // Daily Monitoring Section
  const DailyMonitoringSection = ({ data }) => {
    const logs = data.dailyLogs || {};
    const todayLog = logs[selectedDate] || null;

    const TaskStatus = ({ value, label }) => {
      if (value === null || value === undefined) {
        return (
          <div className="p-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1 truncate" title={label}>{label}</p>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              Empty
            </span>
          </div>
        );
      }
      return (
        <div className="p-2 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1 truncate" title={label}>{label}</p>
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
            value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
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
      { key: 'safetyObservationsRecorded', label: 'Safety Observations' },
      { key: 'sorNcrClosed', label: 'SOR/NCR Closed' },
      { key: 'mockDrillParticipated', label: 'Mock Drill' },
      { key: 'campaignParticipated', label: 'Campaign' },
      { key: 'monthlyInspectionsCompleted', label: 'Monthly Inspections' },
      { key: 'nearMissReported', label: 'Near Miss Reported' },
      { key: 'weeklyTrainingBriefed', label: 'Weekly Training' }
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
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="font-semibold text-lg flex items-center gap-2"><Calendar size={20} />Daily Monitoring</h2>
          <div className="flex items-center gap-2">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
            <button onClick={() => { setForm(todayLog || { ...emptyDailyLog }); setModal('dailyLog'); }} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700">
              {todayLog ? 'Edit' : 'Add'}
            </button>
          </div>
        </div>
        <div className="p-4">
          {todayLog ? (
            <div>
              {/* Time IN/OUT */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600">Time IN</p>
                  <p className="font-semibold text-blue-700">{todayLog.timeIn || '-'}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600">Time OUT</p>
                  <p className="font-semibold text-blue-700">{todayLog.timeOut || '-'}</p>
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
                <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-700">Daily Score</span>
                  <span className="text-lg font-bold text-blue-700">{score.yes}/{score.total} = {score.percentage}%</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-6">No log for {selectedDate}</p>
          )}
        </div>
      </div>
    );
  };

  // Monthly KPIs Section
  const MonthlyKPIsSection = ({ data }) => {
    const kpis = data.monthlyKPIs || emptyMonthlyKPIs;
    return (
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold text-lg flex items-center gap-2"><Activity size={20} />Monthly KPIs</h2>
          <button onClick={() => { setForm({ ...kpis }); setModal('kpis'); }} className="text-blue-600 text-sm hover:underline">Update Values</button>
        </div>
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

  if (loading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b p-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-bold text-gray-800">HSE Performance Tracker</h1>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-6">
        {/* HOME VIEW */}
        {view === 'home' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Projects</h1>
              <button onClick={() => { setForm({ highRisk: [] }); setModal('project'); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                <Plus size={20} />Add Project
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <Building2 size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Projects Yet</h3>
                <p className="text-gray-500 mb-4">Create your first project to get started</p>
                <button onClick={() => { setForm({ highRisk: [] }); setModal('project'); }} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                  Add Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {projects.map(p => (
                  <div key={p.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition">
                    <div onClick={() => goToProject(p)} className="p-5 cursor-pointer">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{p.name}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin size={14} />{p.location}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1"><Building2 size={14} />{p.company}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                        <img src={p.hseLead.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <p className="text-xs text-gray-500">HSE Lead</p>
                          <p className="font-medium">{p.hseLead.name}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                        <div className="p-2 bg-blue-50 rounded text-center">
                          <p className="font-bold text-blue-700">{p.manpower}</p>
                          <p className="text-xs text-blue-600">Manpower</p>
                        </div>
                        <div className="p-2 bg-green-50 rounded text-center">
                          <p className="font-bold text-green-700">{p.manHours}</p>
                          <p className="text-xs text-green-600">Man-hours</p>
                        </div>
                        <div className="p-2 bg-purple-50 rounded text-center">
                          <p className="font-bold text-purple-700">{p.newInductions}</p>
                          <p className="text-xs text-purple-600">Inductions</p>
                        </div>
                      </div>
                      {p.highRisk && p.highRisk.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {p.highRisk.map(risk => {
                            const r = riskOptions.find(x => x.key === risk);
                            return r ? (
                              <span key={risk} className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${r.color}`}>
                                <r.icon size={12} />{r.label}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                    <div className="border-t px-5 py-3 bg-gray-50 flex justify-between items-center">
                      <span className="text-sm text-gray-500">{p.candidates?.length || 0} Candidate{p.candidates?.length !== 1 ? 's' : ''}</span>
                      <div className="flex gap-2">
                        <button onClick={(e) => { 
                          e.stopPropagation(); 
                          setForm({ 
                            ...p, 
                            hseLeadName: p.hseLead.name, 
                            hseLeadPhoto: p.hseLead.photo,
                            manpower: p.manpower,
                            manHours: p.manHours,
                            newInductions: p.newInductions,
                            highRisk: p.highRisk || []
                          }); 
                          setModal('project'); 
                        }} className="p-2 hover:bg-blue-50 rounded-lg">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); deleteProjectHandler(p.id); }} className="p-2 hover:bg-red-50 rounded-lg text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROJECT VIEW */}
        {view === 'project' && selectedProject && (
          <div className="space-y-6">
            <Breadcrumb />

            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="font-semibold text-lg flex items-center gap-2"><Users size={20} />Candidates</h2>
                <button onClick={() => { setForm({}); setModal('candidate'); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                  <Plus size={16} />Add Candidate
                </button>
              </div>
              {!selectedProject.candidates || selectedProject.candidates.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <User size={32} className="mx-auto mb-2 text-gray-300" />
                  <p>No candidates yet</p>
                  <button onClick={() => { setForm({}); setModal('candidate'); }} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                    Add Your First Candidate
                  </button>
                </div>
              ) : (
                <div className="divide-y">
                  {selectedProject.candidates.map(c => {
                    const performancePercentage = getOverallPerformance(c);
                    return (
                      <div key={c.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => goToCandidate(c)}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex gap-4 min-w-0 items-center">
                            <div 
                              className="relative group flex-shrink-0 cursor-pointer"
                              onClick={(e) => openPhotoModal(e, c)}
                            >
                              <img src={c.photo} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
                              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Camera size={20} className="text-white" />
                              </div>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 text-lg">{c.name}</p>
                              {c.role && <p className="text-sm text-gray-500">{c.role}</p>}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            {Object.keys(c.dailyLogs || {}).length > 0 ? (
                              <PerformanceGauge percentage={performancePercentage} />
                            ) : (
                              <div className="w-24 flex items-center justify-center text-xs text-gray-400">
                                No data
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <button onClick={(e) => { e.stopPropagation(); setForm(c); setModal('candidate'); }} className="p-2 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                              <button onClick={(e) => { e.stopPropagation(); deleteCandidateHandler(c.id); }} className="p-2 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={16} /></button>
                              <ChevronRight size={20} className="text-gray-400" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CANDIDATE VIEW */}
        {view === 'candidate' && selectedCandidate && (
          <div className="space-y-6">
            <Breadcrumb />

            {/* Candidate Overview with Chart */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left: Candidate Info */}
                <div className="flex items-center gap-4">
                  <img src={selectedCandidate.photo} alt="" className="w-16 h-16 rounded-full object-cover" />
                  <div>
                    <h1 className="text-2xl font-bold">{selectedCandidate.name}</h1>
                    {selectedCandidate.role && <p className="text-gray-500">{selectedCandidate.role}</p>}
                  </div>
                </div>

                {/* Right: Performance Chart */}
                <div className="flex-1">
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {[
                        { label: '7 Days', days: 7 },
                        { label: '30 Days', days: 30 },
                        { label: '3 Months', days: 90 },
                        { label: '6 Months', days: 180 },
                        { label: '1 Year', days: 365 }
                      ].map(({ label, days }) => {
                        const fromDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
                        const toDate = new Date().toISOString().split('T')[0];
                        const isActive = chartDateRange.from === fromDate && chartDateRange.to === toDate;
                        return (
                          <button
                            key={label}
                            onClick={() => setChartDateRange({ from: fromDate, to: toDate })}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                              isActive 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                      <span className="text-sm font-medium text-gray-700">Custom:</span>
                      <div className="flex gap-2 items-center">
                        <input 
                          type="date" 
                          value={chartDateRange.from} 
                          onChange={(e) => setChartDateRange({ ...chartDateRange, from: e.target.value })} 
                          className="border rounded px-2 py-1 text-sm"
                        />
                        <span className="text-gray-500">to</span>
                        <input 
                          type="date" 
                          value={chartDateRange.to} 
                          onChange={(e) => setChartDateRange({ ...chartDateRange, to: e.target.value })} 
                          className="border rounded px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  {getCandidatePerformanceData(selectedCandidate).length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={getCandidatePerformanceData(selectedCandidate)}>
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-2 border rounded shadow-sm">
                                  <p className="text-sm font-medium">{data.name}</p>
                                  <p className="text-sm text-blue-600">
                                    {data.value}% ({data.yes}/{data.total} Yes)
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-gray-400">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">{form.id ? 'Edit' : 'Add'} Project</h2>
              <button onClick={() => setModal(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Project Name *</label>
                <input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Enter project name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location *</label>
                <input value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Enter location" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Company Name *</label>
                <input value={form.company || ''} onChange={e => setForm({ ...form, company: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Enter company name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">HSE Lead Name *</label>
                <input value={form.hseLeadName || ''} onChange={e => setForm({ ...form, hseLeadName: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Enter HSE lead name" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Manpower</label>
                  <input type="number" value={form.manpower || ''} onChange={e => setForm({ ...form, manpower: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Man-hours</label>
                  <input type="number" value={form.manHours || ''} onChange={e => setForm({ ...form, manHours: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Inductions</label>
                  <input type="number" value={form.newInductions || ''} onChange={e => setForm({ ...form, newInductions: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">High-Risk Activities</label>
                <div className="flex flex-wrap gap-2">
                  {riskOptions.map(r => (
                    <button key={r.key} type="button" onClick={() => toggleRisk(r.key)} className={`px-3 py-2 rounded-lg border-2 flex items-center gap-2 text-sm ${(form.highRisk || []).includes(r.key) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                      <r.icon size={16} />{r.label}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={saveProject} disabled={!form.name || !form.location || !form.company || !form.hseLeadName || loading} className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Saving...' : (form.id ? 'Update' : 'Create') + ' Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANDIDATE MODAL */}
      {modal === 'candidate' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-xl font-semibold">{form.id ? 'Edit' : 'Add'} Candidate</h2>
              <button onClick={() => setModal(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Enter name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role / Position</label>
                <input value={form.role || ''} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Optional" />
              </div>
              <button onClick={saveCandidate} disabled={!form.name || loading} className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Saving...' : (form.id ? 'Update' : 'Add') + ' Candidate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DAILY LOG MODAL */}
      {modal === 'dailyLog' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">Daily Log - {selectedDate}</h2>
              <button onClick={() => setModal(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Time IN</label>
                  <input type="time" value={form.timeIn || ''} onChange={e => setForm({ ...form, timeIn: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time OUT</label>
                  <input type="time" value={form.timeOut || ''} onChange={e => setForm({ ...form, timeOut: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              
              {[
                { key: 'inductionsCovered', label: 'New inductions covered this week?' },
                { key: 'barcodeImplemented', label: 'Barcode implemented 100%?' },
                { key: 'attendanceVerified', label: 'Time IN/OUT verified?' },
                { key: 'taskBriefing', label: 'Task briefing prepared & submitted this week?' },
                { key: 'tbtConducted', label: 'Toolbox Talk conducted?' },
                { key: 'violationBriefing', label: 'Violation briefing conducted (10 per week)?' },
                { key: 'safetyObservationsRecorded', label: 'At least 2 safety observations recorded today?' },
                { key: 'sorNcrClosed', label: 'Closed 90% SOR/NCRs this week?' },
                { key: 'mockDrillParticipated', label: 'Participated in mock drill this month?' },
                { key: 'campaignParticipated', label: 'Participated in campaign this month?' },
                { key: 'monthlyInspectionsCompleted', label: 'Monthly inspections 100% completed?' },
                { key: 'nearMissReported', label: 'Near miss reported this month?' },
                { key: 'weeklyTrainingBriefed', label: 'Weekly training briefed to supervisors/workers?' }
              ].map(item => (
                <div key={item.key} className="p-3 border rounded-lg">
                  <p className="text-sm font-medium mb-2">{item.label}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, [item.key]: true })}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1 ${
                        form[item.key] === true
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
                      }`}
                    >
                      <CheckCircle size={14} />
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, [item.key]: false })}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1 ${
                        form[item.key] === false
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                      }`}
                    >
                      <XCircle size={14} />
                      No
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, [item.key]: null })}
                      className={`py-1.5 px-2 rounded-lg text-sm font-medium transition ${
                        form[item.key] === null || form[item.key] === undefined
                          ? 'bg-gray-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Empty
                    </button>
                  </div>
                </div>
              ))}
              
              <button onClick={saveDailyLog} disabled={loading} className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 sticky bottom-0">
                {loading ? 'Saving...' : 'Save Log'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPIs MODAL */}
      {modal === 'kpis' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-xl font-semibold">Update Monthly KPIs</h2>
              <button onClick={() => setModal(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Observations Open</label>
                  <input type="number" value={form.observationsOpen || 0} onChange={e => setForm({ ...form, observationsOpen: parseInt(e.target.value) || 0 })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Observations Closed</label>
                  <input type="number" value={form.observationsClosed || 0} onChange={e => setForm({ ...form, observationsClosed: parseInt(e.target.value) || 0 })} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Violations Issued</label>
                <input type="number" value={form.violations || 0} onChange={e => setForm({ ...form, violations: parseInt(e.target.value) || 0 })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">NCRs Open</label>
                  <input type="number" value={form.ncrsOpen || 0} onChange={e => setForm({ ...form, ncrsOpen: parseInt(e.target.value) || 0 })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">NCRs Closed</label>
                  <input type="number" value={form.ncrsClosed || 0} onChange={e => setForm({ ...form, ncrsClosed: parseInt(e.target.value) || 0 })} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Weekly Reports Open</label>
                  <input type="number" value={form.weeklyReportsOpen || 0} onChange={e => setForm({ ...form, weeklyReportsOpen: parseInt(e.target.value) || 0 })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Weekly Reports Closed</label>
                  <input type="number" value={form.weeklyReportsClosed || 0} onChange={e => setForm({ ...form, weeklyReportsClosed: parseInt(e.target.value) || 0 })} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <button onClick={saveMonthlyKPIs} disabled={loading} className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Saving...' : 'Save KPIs'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO UPLOAD MODAL */}
      {photoCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-xl font-semibold">{tempPhoto ? 'Adjust Photo' : 'Update Photo'}</h2>
              <button onClick={() => { setPhotoCandidate(null); setTempPhoto(null); }} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5">
              {!tempPhoto ? (
                <>
                  {/* Current Photo */}
                  <div className="flex justify-center mb-4">
                    <img 
                      src={photoCandidate.photo} 
                      alt={photoCandidate.name} 
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                    />
                  </div>
                  <p className="text-center text-gray-600 mb-6 font-medium">{photoCandidate.name}</p>
                  
                  {/* Hidden file inputs */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                  <input
                    type="file"
                    ref={cameraInputRef}
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                  
                  {/* Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700"
                    >
                      <Camera size={20} />
                      Take Photo
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-3 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200"
                    >
                      <Upload size={20} />
                      Choose from Gallery
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Photo Preview with Crop */}
                  <div className="flex justify-center mb-4">
                    <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-blue-500">
                      <img 
                        src={tempPhoto} 
                        alt="Preview" 
                        className="absolute"
                        style={{
                          width: `${100 * cropPosition.scale}%`,
                          height: `${100 * cropPosition.scale}%`,
                          left: `${50 - (cropPosition.scale * 50) + cropPosition.x}%`,
                          top: `${50 - (cropPosition.scale * 50) + cropPosition.y}%`,
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Adjustment Controls */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Zoom</label>
                      <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.1"
                        value={cropPosition.scale}
                        onChange={(e) => setCropPosition({ ...cropPosition, scale: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Horizontal</label>
                        <input
                          type="range"
                          min="-30"
                          max="30"
                          value={cropPosition.x}
                          onChange={(e) => setCropPosition({ ...cropPosition, x: parseInt(e.target.value) })}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Vertical</label>
                        <input
                          type="range"
                          min="-30"
                          max="30"
                          value={cropPosition.y}
                          onChange={(e) => setCropPosition({ ...cropPosition, y: parseInt(e.target.value) })}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={saveCroppedPhoto}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <CheckCircle size={20} />
                      {loading ? 'Saving...' : 'Save Photo'}
                    </button>
                    <button
                      onClick={cancelCrop}
                      className="w-full text-gray-500 px-4 py-2 hover:text-gray-700"
                    >
                      Choose Different Photo
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}