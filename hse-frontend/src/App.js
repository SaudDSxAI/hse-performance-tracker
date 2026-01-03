import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Plus, Edit2, Trash2, X, MapPin, Users, Building2, AlertTriangle, Calendar, Shield, Flame, Anchor, HardHat, ChevronRight, ChevronDown, Layers, User, CheckCircle, XCircle, Home, Activity, Camera, Upload, Search, Lock, LogOut, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
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
  weeklyTrainingBriefed: null,
  // Additional 10 new fields
  dailyReportsFollowup: null,
  msraCommunicated: null,
  consultantResponses: null,
  weeklyTbtFullParticipation: null,
  welfareFacilitiesMonitored: null,
  mondayNcrShared: null,
  safetyWalksConducted: null,
  trainingSessionsConducted: null,
  barcodeSystem100: null,
  taskBriefingsParticipating: null,
  comment: '',
  description: ''
};
const emptyMonthlyKPIs = { observationsOpen: 0, observationsClosed: 0, violations: 0, ncrsOpen: 0, ncrsClosed: 0, weeklyReportsOpen: 0, weeklyReportsClosed: 0 };

export default function App() {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(api.isLoggedIn());
  const [currentUser, setCurrentUser] = useState(api.getCurrentUser());
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'project', id: ..., name: ... }
  const [deletePin, setDeletePin] = useState('');
  const [deletePinError, setDeletePinError] = useState('');

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
  
  const [photoCandidate, setPhotoCandidate] = useState(null); // For photo upload modal
  const [tempPhoto, setTempPhoto] = useState(null); // For cropping preview
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0, scale: 1 }); // For adjusting photo
  const [hseLeadTempPhoto, setHseLeadTempPhoto] = useState(null); // For HSE Lead photo cropping
  const [hseLeadCropPosition, setHseLeadCropPosition] = useState({ x: 0, y: 0, scale: 1 });
  const [showHseLeadPhotoCrop, setShowHseLeadPhotoCrop] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const hseLeadFileInputRef = useRef(null);
  const hseLeadCameraInputRef = useRef(null);

  // Fetch projects on load (only if logged in)
  useEffect(() => {
    if (isLoggedIn) {
      fetchProjects();
    }
  }, [isLoggedIn]);

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    
    try {
      const data = await api.login(loginForm.username, loginForm.password);
      setIsLoggedIn(true);
      setCurrentUser(data.user);
      setLoginForm({ username: '', password: '' });
    } catch (error) {
      setLoginError('Invalid username or password');
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
        
        // Image dimensions
        const imgWidth = img.width;
        const imgHeight = img.height;
        
        // Calculate the visible area based on object-fit: cover
        // This means the image fills the container, cropping excess
        const imgAspect = imgWidth / imgHeight;
        let srcWidth, srcHeight, srcX, srcY;
        
        if (imgAspect > 1) {
          // Landscape image - height fits, width crops
          srcHeight = imgHeight;
          srcWidth = imgHeight;
          srcX = (imgWidth - srcWidth) / 2;
          srcY = 0;
        } else {
          // Portrait image - width fits, height crops
          srcWidth = imgWidth;
          srcHeight = imgWidth;
          srcX = 0;
          srcY = (imgHeight - srcHeight) / 2;
        }
        
        // Apply zoom (scale)
        const scale = cropPosition.scale;
        const zoomedSize = Math.min(srcWidth, srcHeight) / scale;
        
        // Apply position offset (x, y are percentages from -50 to 50)
        const offsetX = (cropPosition.x / 100) * zoomedSize;
        const offsetY = (cropPosition.y / 100) * zoomedSize;
        
        // Calculate final source rectangle
        const finalSrcX = srcX + (srcWidth - zoomedSize) / 2 + offsetX;
        const finalSrcY = srcY + (srcHeight - zoomedSize) / 2 + offsetY;
        
        // Clamp to image bounds
        const clampedSrcX = Math.max(0, Math.min(finalSrcX, imgWidth - zoomedSize));
        const clampedSrcY = Math.max(0, Math.min(finalSrcY, imgHeight - zoomedSize));
        
        // Draw cropped image
        ctx.drawImage(
          img, 
          clampedSrcX, clampedSrcY, zoomedSize, zoomedSize,
          0, 0, outputSize, outputSize
        );
        
        // Convert to base64
        const croppedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        
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

  // HSE Lead Photo Handlers
  const handleHseLeadPhotoSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setHseLeadTempPhoto(reader.result);
      setHseLeadCropPosition({ x: 0, y: 0, scale: 1 });
      setShowHseLeadPhotoCrop(true);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const saveHseLeadCroppedPhoto = () => {
    if (!hseLeadTempPhoto) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const outputSize = 300;
      canvas.width = outputSize;
      canvas.height = outputSize;
      
      const imgWidth = img.width;
      const imgHeight = img.height;
      const imgAspect = imgWidth / imgHeight;
      let srcWidth, srcHeight, srcX, srcY;
      
      if (imgAspect > 1) {
        srcHeight = imgHeight;
        srcWidth = imgHeight;
        srcX = (imgWidth - srcWidth) / 2;
        srcY = 0;
      } else {
        srcWidth = imgWidth;
        srcHeight = imgWidth;
        srcX = 0;
        srcY = (imgHeight - srcHeight) / 2;
      }
      
      const scale = hseLeadCropPosition.scale;
      const zoomedSize = Math.min(srcWidth, srcHeight) / scale;
      const offsetX = (hseLeadCropPosition.x / 100) * zoomedSize;
      const offsetY = (hseLeadCropPosition.y / 100) * zoomedSize;
      
      const finalSrcX = srcX + (srcWidth - zoomedSize) / 2 + offsetX;
      const finalSrcY = srcY + (srcHeight - zoomedSize) / 2 + offsetY;
      
      const clampedSrcX = Math.max(0, Math.min(finalSrcX, imgWidth - zoomedSize));
      const clampedSrcY = Math.max(0, Math.min(finalSrcY, imgHeight - zoomedSize));
      
      ctx.drawImage(img, clampedSrcX, clampedSrcY, zoomedSize, zoomedSize, 0, 0, outputSize, outputSize);
      
      const croppedBase64 = canvas.toDataURL('image/jpeg', 0.85);
      setForm({ ...form, hseLeadPhoto: croppedBase64 });
      setHseLeadTempPhoto(null);
      setShowHseLeadPhotoCrop(false);
      setHseLeadCropPosition({ x: 0, y: 0, scale: 1 });
    };
    
    img.src = hseLeadTempPhoto;
  };

  const cancelHseLeadCrop = () => {
    setHseLeadTempPhoto(null);
    setShowHseLeadPhotoCrop(false);
    setHseLeadCropPosition({ x: 0, y: 0, scale: 1 });
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
      { name: 'Good', value: good, color: '#F59E0B' },
      { name: 'Fair', value: fair, color: '#F97316' },
      { name: 'Needs Work', value: needsWork, color: '#EF4444' }
    ].filter(d => d.value > 0);
    
    return { average, distribution, candidateScores };
  };

  // Speedometer Component
  const PerformanceGauge = ({ percentage }) => {
    const getColor = () => {
      if (percentage >= 80) return '#10B981'; // Vibrant green
      if (percentage >= 60) return '#F59E0B'; // Vibrant amber/yellow
      if (percentage >= 40) return '#F97316'; // Vibrant orange
      return '#EF4444'; // Vibrant red
    };

    const getLabel = () => {
      if (percentage >= 80) return 'Excellent';
      if (percentage >= 60) return 'Good';
      if (percentage >= 40) return 'Fair';
      return 'Needs Work';
    };

    const rotation = -90 + (percentage * 1.8);
    
    // Generate unique ID for this gauge instance
    const uniqueId = `gauge-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-16">
          <svg className="w-24 h-16" viewBox="0 0 100 60">
            <defs>
              <linearGradient id={uniqueId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="40%" stopColor="#EF4444" />
                <stop offset="40%" stopColor="#F97316" />
                <stop offset="60%" stopColor="#F97316" />
                <stop offset="60%" stopColor="#F59E0B" />
                <stop offset="80%" stopColor="#F59E0B" />
                <stop offset="80%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>
            {/* Single continuous arc with gradient */}
            <path 
              d="M 5 55 A 40 40 0 0 1 95 55" 
              fill="none" 
              stroke={`url(#${uniqueId})`}
              strokeWidth="8"
              strokeLinecap="butt"
            />
            <line x1="50" y1="55" x2="50" y2="20" stroke={getColor()} strokeWidth="2" strokeLinecap="round"
              style={{ transformOrigin: '50px 55px', transform: `rotate(${rotation}deg)`, transition: 'transform 0.3s ease' }} />
            <circle cx="50" cy="55" r="3" fill={getColor()} />
          </svg>
        </div>
        <div className="text-center mt-1">
          <p className="text-xs font-semibold" style={{ color: getColor() }}>{percentage}%</p>
          <p className="text-xs text-gray-500">{getLabel()}</p>
        </div>
      </div>
    );
  };

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
  const Breadcrumb = () => (
    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
      <button onClick={goHome} className="hover:text-emerald-700 flex items-center gap-1"><Home size={14} />Home</button>
      {selectedProject && (
        <>
          <ChevronRight size={14} />
          <button onClick={() => goToProject(selectedProject)} className={`hover:text-emerald-700 ${!selectedCandidate ? 'text-gray-800 font-medium' : ''}`}>{selectedProject.name}</button>
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
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="font-semibold text-lg flex items-center gap-2"><Calendar size={20} />Daily Monitoring</h2>
          <div className="flex items-center gap-2">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
            <button onClick={() => { setForm(todayLog || { ...emptyDailyLog }); setModal('dailyLog'); }} className="bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-800">
              {todayLog ? 'Edit' : 'Add'}
            </button>
          </div>
        </div>
        <div className="p-4">
          {todayLog ? (
            <div>
              {/* Time IN/OUT */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <p className="text-xs text-emerald-700">Time IN</p>
                  <p className="font-semibold text-emerald-700">{todayLog.timeIn || '-'}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <p className="text-xs text-emerald-700">Time OUT</p>
                  <p className="font-semibold text-emerald-700">{todayLog.timeOut || '-'}</p>
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
                <div className="mt-4 p-3 bg-emerald-50 rounded-lg flex items-center justify-between">
                  <span className="text-sm font-medium text-emerald-700">Daily Score</span>
                  <span className="text-lg font-bold text-emerald-700">{score.yes}/{score.total} = {score.percentage}%</span>
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
    const closureRate = getNcrSorClosureRate(kpis);
    
    return (
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold text-lg flex items-center gap-2"><Activity size={20} />Monthly KPIs</h2>
          <button onClick={() => { setForm({ ...kpis }); setModal('kpis'); }} className="text-emerald-700 text-sm hover:underline">Update Values</button>
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Login Page
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-700 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">HSE Performance Tracker</h1>
            <p className="text-gray-500 mt-2">Sign in to continue</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {loginError}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter username"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full border rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 text-white py-3 rounded-lg hover:bg-emerald-800 font-medium disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-700 rounded-lg flex items-center justify-center">
              <Shield className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-bold text-gray-800">HSE Performance Tracker</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:block">Hi, {currentUser?.username}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

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
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <Building2 size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Projects Yet</h3>
                <p className="text-gray-500 mb-4">Create your first project to get started</p>
                <button onClick={() => { setForm({ highRisk: [] }); setModal('project'); }} className="bg-emerald-700 text-white px-6 py-2 rounded-lg hover:bg-emerald-800">
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
                        <div className="p-2 bg-emerald-50 rounded text-center">
                          <p className="font-bold text-emerald-700">{p.manpower}</p>
                          <p className="text-xs text-emerald-700">Manpower</p>
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
                            highRisk: p.highRisk || [],
                            deletePin: p.deletePin || ''
                          }); 
                          setModal('project'); 
                        }} className="p-2 hover:bg-emerald-50 rounded-lg">
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
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                          isActive 
                            ? 'bg-emerald-700 text-white' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2 mb-6 items-center">
                  <span className="text-sm text-gray-600">Custom:</span>
                  <input 
                    type="date" 
                    value={projectChartRange.from} 
                    onChange={(e) => setProjectChartRange({ ...projectChartRange, from: e.target.value })} 
                    className="border rounded px-2 py-1 text-sm"
                  />
                  <span className="text-gray-500">to</span>
                  <input 
                    type="date" 
                    value={projectChartRange.to} 
                    onChange={(e) => setProjectChartRange({ ...projectChartRange, to: e.target.value })} 
                    className="border rounded px-2 py-1 text-sm"
                  />
                </div>

                {/* Gauge + Donut Charts */}
                {(() => {
                  const stats = getProjectPerformanceStats(selectedProject.candidates);
                  if (stats.candidateScores.length === 0) {
                    return (
                      <div className="text-center text-gray-400 py-8">
                        No performance data for selected period
                      </div>
                    );
                  }
                  
                  const getColor = (pct) => {
                    if (pct >= 80) return '#10B981'; // Vibrant green
                    if (pct >= 60) return '#F59E0B'; // Vibrant amber/yellow
                    if (pct >= 40) return '#F97316'; // Vibrant orange
                    return '#EF4444'; // Vibrant red
                  };
                  
                  const getLabel = (pct) => {
                    if (pct >= 80) return 'Excellent';
                    if (pct >= 60) return 'Good';
                    if (pct >= 40) return 'Fair';
                    return 'Needs Work';
                  };

                  return (
                    <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
                      {/* Big Gauge */}
                      <div className="flex flex-col items-center">
                        <div className="relative w-40 h-24">
                          <svg className="w-40 h-24" viewBox="0 0 100 60">
                            <defs>
                              <linearGradient id="largeGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#EF4444" />
                                <stop offset="40%" stopColor="#EF4444" />
                                <stop offset="40%" stopColor="#F97316" />
                                <stop offset="60%" stopColor="#F97316" />
                                <stop offset="60%" stopColor="#F59E0B" />
                                <stop offset="80%" stopColor="#F59E0B" />
                                <stop offset="80%" stopColor="#10B981" />
                                <stop offset="100%" stopColor="#10B981" />
                              </linearGradient>
                            </defs>
                            {/* Single continuous arc with gradient */}
                            <path 
                              d="M 5 55 A 40 40 0 0 1 95 55" 
                              fill="none" 
                              stroke="url(#largeGaugeGradient)" 
                              strokeWidth="8"
                              strokeLinecap="butt"
                            />
                            <line x1="50" y1="55" x2="50" y2="15" stroke={getColor(stats.average)} strokeWidth="3" strokeLinecap="round"
                              style={{ transformOrigin: '50px 55px', transform: `rotate(${-90 + (stats.average * 1.8)}deg)`, transition: 'transform 0.5s ease' }} />
                            <circle cx="50" cy="55" r="5" fill={getColor(stats.average)} />
                          </svg>
                        </div>
                        <div className="text-center mt-2">
                          <p className="text-3xl font-bold" style={{ color: getColor(stats.average) }}>{stats.average}%</p>
                          <p className="text-sm text-gray-500">{getLabel(stats.average)}</p>
                          <p className="text-xs text-gray-400 mt-1">Project Average</p>
                        </div>
                      </div>

                      {/* Donut Chart */}
                      {stats.distribution.length > 0 && (
                        <div className="flex flex-col items-center">
                          <ResponsiveContainer width={180} height={180}>
                            <PieChart>
                              <Pie
                                data={stats.distribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                dataKey="value"
                                paddingAngle={2}
                              >
                                {stats.distribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip 
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-white p-2 border rounded shadow-sm">
                                        <p className="text-sm font-medium">{data.name}</p>
                                        <p className="text-sm">{data.value} candidate{data.value !== 1 ? 's' : ''}</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex flex-wrap justify-center gap-3 mt-2">
                            {stats.distribution.map((d, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                                <span className="text-xs text-gray-600">{d.name}: {d.value}</span>
                              </div>
                            ))}
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
                    className={`px-6 py-3 font-medium border-b-2 transition ${
                      projectTab === 'candidates'
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
                    className={`px-6 py-3 font-medium border-b-2 transition ${
                      projectTab === 'sections'
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
                          <div 
                            key={c.id} 
                            className="border rounded-lg p-4 hover:bg-gray-50 hover:shadow-md transition cursor-pointer"
                            onClick={() => goToCandidate(c)}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); moveCandidate(c.id, 'up'); }}
                                  disabled={isFirst}
                                  className={`p-1 rounded ${isFirst ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                >
                                  <ArrowUp size={14} />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); moveCandidate(c.id, 'down'); }}
                                  disabled={isLast}
                                  className={`p-1 rounded ${isLast ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                >
                                  <ArrowDown size={14} />
                                </button>
                              </div>
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <button onClick={(e) => { e.stopPropagation(); setForm(c); setModal('candidate'); }} className="p-1 hover:bg-emerald-50 rounded-lg"><Edit2 size={14} /></button>
                                <button onClick={(e) => { e.stopPropagation(); deleteCandidateHandler(c.id); }} className="p-1 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={14} /></button>
                              </div>
                            </div>
                            <div className="flex justify-center mb-3">
                              <div 
                                className="relative group cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); openPhotoModal(e, c); }}
                              >
                                <img src={c.photo} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
                                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Camera size={18} className="text-white" />
                                </div>
                              </div>
                            </div>
                            <div className="text-center mb-3">
                              <p className="font-semibold text-gray-900 text-base truncate">{c.name}</p>
                              {c.role && <p className="text-xs text-gray-500 truncate">{c.role}</p>}
                            </div>
                            <div className="flex justify-center">
                              {Object.keys(c.dailyLogs || {}).length > 0 ? (
                                <PerformanceGauge percentage={performancePercentage} />
                              ) : (
                                <div className="text-xs text-gray-400">No data</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {selectedProject.candidates.filter(c => c.name.toLowerCase().includes(candidateSearch.toLowerCase())).length === 0 && (
                        <div className="col-span-full p-8 text-center text-gray-400">
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
                      <h2 className="text-2xl font-bold text-gray-900">Sections</h2>
                      <p className="text-sm text-gray-500">Organize candidates into sections</p>
                    </div>
                    <button
                      onClick={() => { setSectionForm({}); setSectionModal('add'); }}
                      className="flex items-center gap-2 bg-emerald-700 text-white px-4 py-2 rounded-lg hover:bg-emerald-800"
                    >
                      <Plus size={18} />
                      Add Section
                    </button>
                  </div>
                  {sections.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <Layers size={48} className="mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">No sections yet</h3>
                      <p className="text-gray-500 mb-4">Create sections to organize your candidates</p>
                      <button
                        onClick={() => { setSectionForm({}); setSectionModal('add'); }}
                        className="bg-emerald-700 text-white px-6 py-2 rounded-lg hover:bg-emerald-800"
                      >
                        Create Your First Section
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sections.map(section => {
                        const isHidden = hiddenSections.has(section.id);
                        const sectionCandidates = getSectionCandidates(section.id);
                        return (
                          <div key={section.id} className="border rounded-lg bg-white shadow-sm">
                            <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
                              <div className="flex items-center gap-3 flex-1">
                                <button onClick={() => toggleSectionVisibility(section.id)} className="p-1 hover:bg-gray-200 rounded">
                                  {isHidden ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                                </button>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900">{section.name}</h3>
                                  {section.description && <p className="text-sm text-gray-500">{section.description}</p>}
                                  <p className="text-xs text-gray-400 mt-1">{sectionCandidates.length} candidate{sectionCandidates.length !== 1 ? 's' : ''}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => toggleSectionVisibility(section.id)} className="p-2 hover:bg-gray-200 rounded-lg text-gray-600" title={isHidden ? 'Show section' : 'Hide section'}>
                                  {isHidden ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>
                                <button onClick={() => { setSectionForm({ name: section.name, description: section.description }); setSelectedSection(section); setSectionModal('edit'); }} className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600">
                                  <Edit2 size={18} />
                                </button>
                                <button onClick={() => handleDeleteSection(section.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-600">
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                            {!isHidden && (
                              <div className="p-4">
                                {sectionCandidates.length === 0 ? (
                                  <div className="text-center py-8 text-gray-400">
                                    <Users size={32} className="mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm">No candidates in this section</p>
                                    <button onClick={() => { setSelectedSection(section); setSectionModal('assign'); }} className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                                      + Assign Candidates
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
                                            className="border rounded-lg p-4 hover:bg-gray-50 hover:shadow-md transition cursor-pointer relative"
                                            onClick={() => goToCandidate(candidate)}
                                          >
                                            {/* Remove from section button - top right */}
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); handleUnassignCandidate(section.id, candidate.id); }} 
                                              className="absolute top-2 right-2 p-1 hover:bg-red-50 rounded-lg text-red-500"
                                              title="Remove from section"
                                            >
                                              <X size={14} />
                                            </button>

                                            {/* Photo - Centered */}
                                            <div className="flex justify-center mb-3 mt-2">
                                              <div 
                                                className="relative group cursor-pointer"
                                                onClick={(e) => { e.stopPropagation(); openPhotoModal(e, candidate); }}
                                              >
                                                <img src={candidate.photo} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
                                                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                  <Camera size={18} className="text-white" />
                                                </div>
                                              </div>
                                            </div>

                                            {/* Name & Role - Centered */}
                                            <div className="text-center mb-3">
                                              <p className="font-semibold text-gray-900 text-base truncate">{candidate.name}</p>
                                              {candidate.role && <p className="text-xs text-gray-500 truncate">{candidate.role}</p>}
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
                                    <button onClick={() => { setSelectedSection(section); setSectionModal('assign'); }} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                                      + Assign More Candidates
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
                                ? 'bg-emerald-700 text-white' 
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
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={getCandidatePerformanceData(selectedCandidate)} margin={{ top: 10, right: 10, left: 0, bottom: 80 }}>
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 11, fontWeight: 'bold' }}
                          angle={-45}
                          textAnchor="end"
                          interval={0}
                          height={80}
                        />
                        <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-2 border rounded shadow-sm">
                                  <p className="text-sm font-medium">{data.name}</p>
                                  <p className="text-sm text-emerald-700">
                                    {data.isAttendance 
                                      ? `${data.value}% (${data.yes}/${data.total} days)`
                                      : `${data.value}% (${data.yes}/${data.total} Yes)`
                                    }
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {getCandidatePerformanceData(selectedCandidate).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.isAttendance ? '#065f46' : '#047857'} />
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
              
              {/* HSE Lead Photo Section */}
              <div>
                <label className="block text-sm font-medium mb-2">HSE Lead Photo *</label>
                {!showHseLeadPhotoCrop ? (
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img 
                        src={form.hseLeadPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.hseLeadName || 'HSE')}&size=150&background=047857&color=fff`} 
                        alt="HSE Lead" 
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                      />
                      {form.hseLeadPhoto && form.hseLeadPhoto.startsWith('data:') && (
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1">
                          <CheckCircle size={14} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="file"
                        ref={hseLeadFileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleHseLeadPhotoSelect}
                      />
                      <input
                        type="file"
                        ref={hseLeadCameraInputRef}
                        accept="image/*"
                        capture="user"
                        className="hidden"
                        onChange={handleHseLeadPhotoSelect}
                      />
                      <button
                        type="button"
                        onClick={() => hseLeadCameraInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-700 text-white px-3 py-2 rounded-lg hover:bg-emerald-800 text-sm"
                      >
                        <Camera size={16} />
                        {form.hseLeadPhoto && form.hseLeadPhoto.startsWith('data:') ? 'Retake Photo' : 'Take Photo'}
                      </button>
                      <button
                        type="button"
                        onClick={() => hseLeadFileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 text-sm"
                      >
                        <Upload size={16} />
                        {form.hseLeadPhoto && form.hseLeadPhoto.startsWith('data:') ? 'Change Photo' : 'Upload'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Photo Preview with Crop */}
                    <div className="flex justify-center">
                      <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-emerald-600 bg-gray-900">
                        <img 
                          src={hseLeadTempPhoto} 
                          alt="Preview" 
                          className="absolute w-full h-full"
                          style={{
                            objectFit: 'cover',
                            objectPosition: `${50 + hseLeadCropPosition.x}% ${50 + hseLeadCropPosition.y}%`,
                            transform: `scale(${hseLeadCropPosition.scale})`,
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Adjustment Controls */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                          <span>Zoom</span>
                          <span>{hseLeadCropPosition.scale.toFixed(1)}x</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="2.5"
                          step="0.1"
                          value={hseLeadCropPosition.scale}
                          onChange={(e) => setHseLeadCropPosition({ ...hseLeadCropPosition, scale: parseFloat(e.target.value) })}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-sm font-medium text-gray-700">← Left / Right →</span>
                          <input
                            type="range"
                            min="-50"
                            max="50"
                            value={hseLeadCropPosition.x}
                            onChange={(e) => setHseLeadCropPosition({ ...hseLeadCropPosition, x: parseInt(e.target.value) })}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">↑ Up / Down ↓</span>
                          <input
                            type="range"
                            min="-50"
                            max="50"
                            value={hseLeadCropPosition.y}
                            onChange={(e) => setHseLeadCropPosition({ ...hseLeadCropPosition, y: parseInt(e.target.value) })}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHseLeadCropPosition({ x: 0, y: 0, scale: 1 })}
                        className="w-full text-sm text-emerald-700 hover:text-emerald-800"
                      >
                        Reset to Center
                      </button>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={saveHseLeadCroppedPhoto}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-700 text-white px-3 py-2 rounded-lg hover:bg-emerald-800"
                      >
                        <CheckCircle size={16} />
                        Save Photo
                      </button>
                      <button
                        type="button"
                        onClick={cancelHseLeadCrop}
                        className="flex-1 text-gray-500 px-3 py-2 hover:text-gray-700 border rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
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
                    <button key={r.key} type="button" onClick={() => toggleRisk(r.key)} className={`px-3 py-2 rounded-lg border-2 flex items-center gap-2 text-sm ${(form.highRisk || []).includes(r.key) ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200'}`}>
                      <r.icon size={16} />{r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Lock size={16} />
                  Delete Protection PIN
                  {form.id && form.deletePin && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">PIN Set</span>
                  )}
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={form.deletePin || ''} 
                    onChange={e => setForm({ ...form, deletePin: e.target.value })} 
                    className="w-full border rounded-lg px-3 py-2" 
                    placeholder={form.id ? "Enter new PIN to change" : "Set a PIN (required)"}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {form.id 
                    ? "Leave empty to keep current PIN, or enter new PIN to change it" 
                    : "Required - this PIN will be asked when deleting the project"}
                </p>
              </div>
              <button 
                onClick={saveProject} 
                disabled={
                  !form.name || 
                  !form.location || 
                  !form.company || 
                  !form.hseLeadName || 
                  (!form.id && !form.deletePin) ||
                  (!form.id && (!form.hseLeadPhoto || !form.hseLeadPhoto.startsWith('data:'))) ||
                  loading
                } 
                className="w-full bg-emerald-700 text-white px-4 py-2 rounded-lg hover:bg-emerald-800 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (form.id ? 'Update' : 'Create') + ' Project'}
              </button>
              {!form.id && (
                <p className="text-xs text-center text-gray-500">
                  {!form.hseLeadPhoto || !form.hseLeadPhoto.startsWith('data:') ? '⚠️ HSE Lead Photo required' : ''}
                  {(!form.hseLeadPhoto || !form.hseLeadPhoto.startsWith('data:')) && !form.deletePin ? ' • ' : ''}
                  {!form.deletePin ? '⚠️ Delete PIN required' : ''}
                </p>
              )}
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
              <button onClick={saveCandidate} disabled={!form.name || loading} className="w-full bg-emerald-700 text-white px-4 py-2 rounded-lg hover:bg-emerald-800 disabled:opacity-50">
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
      { key: 'checklistSubmitted', label: 'Checklist' },
      { key: 'safetyObservationsRecorded', label: 'At least 2 safety observations recorded today?' },
                { key: 'sorNcrClosed', label: 'Closed 90% SOR/NCRs this week?' },
                { key: 'mockDrillParticipated', label: 'Participated in mock drill this month?' },
                { key: 'campaignParticipated', label: 'Participated in campaign this month?' },
                { key: 'monthlyInspectionsCompleted', label: 'Monthly inspections 100% completed?' },
                { key: 'nearMissReported', label: 'Near miss reported this month?' },
                { key: 'weeklyTrainingBriefed', label: 'Weekly training briefed to supervisors/workers?' },
                // Additional 10 new fields
                { key: 'dailyReportsFollowup', label: 'Daily reports follow-up & coordination done from the team?' },
                { key: 'msraCommunicated', label: 'MSRA communicated to all key personnel prior to commencement?' },
                { key: 'consultantResponses', label: 'Immediate responses provided to the Consultant in WhatsApp?' },
                { key: 'weeklyTbtFullParticipation', label: 'Weekly mass TBT conducted for entire workforce with full participation?' },
                { key: 'welfareFacilitiesMonitored', label: 'Workforce welfare facilities (rest areas, toilets, water) monitored?' },
                { key: 'mondayNcrShared', label: 'Monday shared all pending NCRs/SORs, Weekly/ESLT report & follow up?' },
                { key: 'safetyWalksConducted', label: 'HSE Engineers performed two site safety walks daily (7:00 AM & 2:00 PM)?' },
                { key: 'trainingSessionsConducted', label: 'Engineers conducted minimum two (2) HSE training sessions per month?' },
                { key: 'barcodeSystem100', label: 'Bar Code system implemented 100% for Plant/Equipment/PTW?' },
                { key: 'taskBriefingsParticipating', label: 'Engineers participating in task briefings & verifying?' }
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
              
              {/* Comment and Description */}
              <div className="p-3 border rounded-lg bg-gray-50">
                <label className="block text-sm font-medium mb-2">Comment (optional)</label>
                <input 
                  type="text" 
                  value={form.comment || ''} 
                  onChange={e => setForm({ ...form, comment: e.target.value })} 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="Short comment..."
                  maxLength={255}
                />
              </div>
              
              <div className="p-3 border rounded-lg bg-gray-50">
                <label className="block text-sm font-medium mb-2">Description (optional)</label>
                <textarea 
                  value={form.description || ''} 
                  onChange={e => setForm({ ...form, description: e.target.value })} 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="Detailed notes..."
                  rows={3}
                />
              </div>
              
              <button onClick={saveDailyLog} disabled={loading} className="w-full bg-emerald-700 text-white px-4 py-2 rounded-lg hover:bg-emerald-800 disabled:opacity-50 sticky bottom-0">
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
              <button onClick={saveMonthlyKPIs} disabled={loading} className="w-full bg-emerald-700 text-white px-4 py-2 rounded-lg hover:bg-emerald-800 disabled:opacity-50">
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
                      className="w-full flex items-center justify-center gap-3 bg-emerald-700 text-white px-4 py-3 rounded-lg hover:bg-emerald-800"
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
                    <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-emerald-600 bg-gray-900">
                      <img 
                        src={tempPhoto} 
                        alt="Preview" 
                        className="absolute w-full h-full"
                        style={{
                          objectFit: 'cover',
                          objectPosition: `${50 + cropPosition.x}% ${50 + cropPosition.y}%`,
                          transform: `scale(${cropPosition.scale})`,
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Adjustment Controls */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                        <span>Zoom</span>
                        <span>{cropPosition.scale.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="2.5"
                        step="0.1"
                        value={cropPosition.scale}
                        onChange={(e) => setCropPosition({ ...cropPosition, scale: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                          <span>← Left / Right →</span>
                        </div>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          value={cropPosition.x}
                          onChange={(e) => setCropPosition({ ...cropPosition, x: parseInt(e.target.value) })}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                          <span>↑ Up / Down ↓</span>
                        </div>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          value={cropPosition.y}
                          onChange={(e) => setCropPosition({ ...cropPosition, y: parseInt(e.target.value) })}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => setCropPosition({ x: 0, y: 0, scale: 1 })}
                      className="w-full text-sm text-emerald-700 hover:text-emerald-700"
                    >
                      Reset to Center
                    </button>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={saveCroppedPhoto}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-700 text-white px-4 py-3 rounded-lg hover:bg-emerald-800 disabled:opacity-50"
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

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm">
            <div className="p-5 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-red-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Delete Project</h2>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete <strong>"{deleteConfirm.name}"</strong>?
              </p>
              <p className="text-sm text-red-600 mb-4">This action cannot be undone.</p>
              
              {deleteConfirm.hasPin && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enter Delete PIN</label>
                  <input
                    type="password"
                    value={deletePin}
                    onChange={(e) => { setDeletePin(e.target.value); setDeletePinError(''); }}
                    className={`w-full border rounded-lg px-4 py-2 text-center text-lg tracking-widest ${deletePinError ? 'border-red-500' : ''}`}
                    placeholder="••••"
                  />
                  {deletePinError && (
                    <p className="text-red-500 text-sm mt-1">{deletePinError}</p>
                  )}
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => { setDeleteConfirm(null); setDeletePin(''); setDeletePinError(''); }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProject}
                  disabled={loading || (deleteConfirm.hasPin && !deletePin)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Section Modal */}
      {(sectionModal === 'add' || sectionModal === 'edit') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {sectionModal === 'add' ? 'Add Section' : 'Edit Section'}
              </h3>
              <button onClick={() => { setSectionModal(null); setSectionForm({}); setSelectedSection(null); }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={sectionModal === 'add' ? handleAddSection : handleEditSection}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Section Name *</label>
                  <input
                    type="text"
                    value={sectionForm.name || ''}
                    onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="e.g., Civil Works, MEP, Safety Team"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={sectionForm.description || ''}
                    onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    rows="3"
                    placeholder="Optional description"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => { setSectionModal(null); setSectionForm({}); setSelectedSection(null); }}
                  className="flex-1 border rounded-lg px-4 py-2 hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-700 text-white rounded-lg px-4 py-2 hover:bg-emerald-800 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (sectionModal === 'add' ? 'Create' : 'Update')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Candidate Modal */}
      {sectionModal === 'assign' && selectedSection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                Assign Candidates to "{selectedSection.name}"
              </h3>
              <button onClick={() => { setSectionModal(null); setSelectedSection(null); setSelectedCandidates([]); }}>
                <X size={20} />
              </button>
            </div>
            
            {getUnassignedCandidates(selectedSection.id).length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                All candidates are already assigned to this section
              </p>
            ) : (
              <>
                {/* Select All / Deselect All */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => {
                      const allIds = getUnassignedCandidates(selectedSection.id).map(c => c.id);
                      setSelectedCandidates(allIds);
                    }}
                    className="flex-1 px-3 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 text-sm font-medium"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedCandidates([])}
                    className="flex-1 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium"
                  >
                    Deselect All
                  </button>
                </div>

                {/* Candidates List with Checkboxes */}
                <div className="space-y-2 mb-4">
                  {getUnassignedCandidates(selectedSection.id).map(candidate => {
                    const isSelected = selectedCandidates.includes(candidate.id);
                    return (
                      <div 
                        key={candidate.id} 
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                          isSelected ? 'bg-emerald-50 border-emerald-500' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedCandidates(selectedCandidates.filter(id => id !== candidate.id));
                          } else {
                            setSelectedCandidates([...selectedCandidates, candidate.id]);
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                        />
                        <img src={candidate.photo} alt={candidate.name} className="w-12 h-12 rounded-full object-cover" />
                        <div className="flex-1">
                          <p className="font-medium">{candidate.name}</p>
                          {candidate.role && <p className="text-sm text-gray-500">{candidate.role}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Assign Button */}
                <button
                  onClick={() => {
                    if (selectedCandidates.length > 0) {
                      handleAssignMultipleCandidates(selectedSection.id, selectedCandidates);
                    }
                  }}
                  disabled={loading || selectedCandidates.length === 0}
                  className="w-full bg-emerald-700 text-white px-4 py-3 rounded-lg hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Assigning...
                    </span>
                  ) : (
                    `Assign ${selectedCandidates.length} Candidate${selectedCandidates.length !== 1 ? 's' : ''}`
                  )}
                </button>
              </>
            )}
            
            <div className="mt-4">
              <button
                onClick={() => { setSectionModal(null); setSelectedSection(null); setSelectedCandidates([]); }}
                className="w-full border rounded-lg px-4 py-2 hover:bg-gray-50"
                disabled={loading}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}