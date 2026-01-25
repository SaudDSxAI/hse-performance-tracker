const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:8000/api'
  : (window.location.hostname.includes('railway.app')
    ? `https://${window.location.hostname.replace('hse-tracker', 'hse-backend')}/api` // Attempt to guess backend domain
    : 'https://hse-backend.up.railway.app/api');

console.log('🔧 API_BASE:', API_BASE);
console.log('🌍 HOSTNAME:', window.location.hostname);

// Token management
const getToken = () => localStorage.getItem('hse_token');
const setToken = (token) => {
  if (token) {
    localStorage.setItem('hse_token', token);
  } else {
    localStorage.removeItem('hse_token');
  }
};
const removeToken = () => localStorage.removeItem('hse_token');
const getUser = () => {
  try {
    const user = localStorage.getItem('hse_user');
    if (!user || user === 'undefined') return null;
    return JSON.parse(user);
  } catch (e) {
    console.error('Error parsing user from localStorage', e);
    return null;
  }
};
const setUser = (user) => {
  if (user) {
    localStorage.setItem('hse_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('hse_user');
  }
};
const removeUser = () => localStorage.removeItem('hse_user');

// Helper function for fetch with error handling and logging
const fetchAPI = async (url, options = {}, requireAuth = true) => {
  const fullURL = url.startsWith('http') ? url : `${API_BASE}${url}`;

  console.log('🚀 Request:', options.method || 'GET', fullURL);

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token if required and available
  if (requireAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(fullURL, {
      ...options,
      headers,
    });

    console.log('✅ Response:', response.status, fullURL);

    if (response.status === 401 && requireAuth) {
      // Token expired or invalid
      removeToken();
      removeUser();
      window.location.reload();
      throw new Error('Session expired. Please login again.');
    }

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}`;
      try {
        const errData = await response.json();
        errorMsg = errData.detail || errorMsg;
      } catch (e) {
        // Fallback if not JSON
        const text = await response.text();
        errorMsg = text || errorMsg;
      }
      console.error('❌ Error response:', errorMsg);
      throw new Error(errorMsg);
    }

    return response.json();
  } catch (error) {
    console.error('❌ Fetch error:', error.message, fullURL);
    throw error;
  }
};

// ==================== AUTHENTICATION ====================

export const login = async (username, password) => {
  const data = await fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }, false);

  setToken(data.access_token);
  setUser(data.user);
  return data;
};

export const signup = async (userData) => {
  const data = await fetchAPI('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }, false);

  setToken(data.access_token);
  setUser(data.user);
  return data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const data = await fetchAPI('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword
    }),
  });
  return data;
};

export const logout = () => {
  removeToken();
  removeUser();
};

export const isLoggedIn = () => {
  return !!getToken();
};

export const getCurrentUser = () => {
  return getUser();
};

export const verifyDeletePin = async (projectId, pin) => {
  const data = await fetchAPI(`/auth/verify-delete-pin/${projectId}`, {
    method: 'POST',
    body: JSON.stringify({ pin }),
  });
  return data;
};

// ==================== USER MANAGEMENT (Phase 5) ====================

export const getUsers = async () => {
  const data = await fetchAPI('/auth/users');
  return data;
};

export const inviteUser = async (userData) => {
  const data = await fetchAPI('/auth/invite', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  return data;
};

export const deleteUser = async (userId) => {
  const data = await fetchAPI(`/auth/users/${userId}`, {
    method: 'DELETE',
  });
  return data;
};

export const updateUserRole = async (userId, role) => {
  const data = await fetchAPI(`/auth/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
  return data;
};

export const exportData = async () => {
  const token = localStorage.getItem('hse_token');
  const response = await fetch(`${API_BASE}/export/full-backup`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.blob();
};

export const updateUserAssignments = async (userId, projectIds) => {
  const data = await fetchAPI(`/projects/user/${userId}/assignments`, {
    method: 'PUT',
    body: JSON.stringify(projectIds),
  });
  return data;
};


// ==================== DATA TRANSFORMATION ====================

// Transform backend data (snake_case) to frontend (camelCase)
const transformProject = (project) => ({
  id: project.id,
  name: project.name,
  location: project.location,
  company: project.company,
  hseLead: {
    name: project.hse_lead_name,
    photo: project.hse_lead_photo
  },
  manpower: project.manpower,
  manHours: project.man_hours,
  newInductions: project.new_inductions,
  highRisk: project.high_risk || [],
  deletePin: project.delete_pin,
  assignedLeads: project.assigned_leads || [], // ✅ PRESERVE ASSIGNMENTS
  candidates: [],
  monthlyActivities: {
    mockDrill: false,
    campaignType: '',
    campaignCompleted: false,
    inspectionPowerTools: false,
    inspectionPlantEquipment: false,
    inspectionToolsAccessories: false,
    nearMissRecorded: false
  }
});

// Transform frontend data (camelCase) to backend (snake_case)
const transformProjectToBackend = (project) => ({
  name: project.name,
  location: project.location,
  company: project.company,
  hse_lead_name: project.hseLeadName,
  hse_lead_photo: project.hseLeadPhoto,
  manpower: parseInt(project.manpower) || 0,
  man_hours: parseInt(project.manHours) || 0,
  new_inductions: parseInt(project.newInductions) || 0,
  high_risk: project.highRisk || [],
  delete_pin: project.deletePin || null,
  assigned_lead_ids: project.assignedLeadIds || []
});

const transformCandidateToBackend = (candidate, projectId) => ({
  project_id: projectId,
  name: candidate.name,
  photo: candidate.photo,
  role: candidate.role || '',
  display_order: candidate.displayOrder || 0
});

// ==================== PROJECTS ====================

export const getProjects = async () => {
  const data = await fetchAPI('/projects');
  return data.map(transformProject);
};

export const createProject = async (project) => {
  const data = await fetchAPI('/projects', {
    method: 'POST',
    body: JSON.stringify(transformProjectToBackend(project)),
  });
  return transformProject(data);
};

export const updateProject = async (id, project) => {
  const data = await fetchAPI(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(transformProjectToBackend(project)),
  });
  return transformProject(data);
};

export const deleteProject = async (id) => {
  await fetchAPI(`/projects/${id}`, {
    method: 'DELETE',
  });
};

// ==================== CANDIDATES ====================
// ⚠️ IMPORTANT: Backend returns COMPLETE data with dailyLogs and monthlyKPIs
// We do NOT make separate API calls for logs/KPIs anymore

export const getCandidatesByProject = async (projectId) => {
  console.log('📥 Getting candidates for project', projectId, '(with dailyLogs & monthlyKPIs included)');
  const data = await fetchAPI(`/candidates/project/${projectId}`);

  // Backend returns complete data structure:
  // [{
  //   id, name, photo, role, displayOrder,
  //   dailyLogs: { "2024-01-01": {...}, ... },
  //   monthlyKPIs: { observationsOpen, ... }
  // }]

  console.log('✅ Received', data.length, 'candidates with complete data');
  return data;
};

export const getCandidate = async (candidateId) => {
  console.log('📥 Getting candidate', candidateId, '(with dailyLogs & monthlyKPIs included)');
  const data = await fetchAPI(`/candidates/${candidateId}`);

  // Backend returns complete data with dailyLogs and monthlyKPIs already included
  console.log('✅ Received candidate with complete data');
  return data;
};

export const createCandidate = async (candidate, projectId) => {
  const data = await fetchAPI('/candidates', {
    method: 'POST',
    body: JSON.stringify(transformCandidateToBackend(candidate, projectId)),
  });

  // Return with empty logs/KPIs for new candidate
  return {
    id: data.id,
    name: data.name,
    photo: data.photo,
    role: data.role,
    displayOrder: data.display_order || 0,
    dailyLogs: {},
    monthlyKPIs: {
      observationsOpen: 0,
      observationsClosed: 0,
      violations: 0,
      ncrsOpen: 0,
      ncrsClosed: 0,
      weeklyReportsOpen: 0,
      weeklyReportsClosed: 0
    }
  };
};

export const updateCandidate = async (id, candidate, projectId) => {
  const data = await fetchAPI(`/candidates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(transformCandidateToBackend(candidate, projectId)),
  });

  // Return updated candidate while preserving logs/KPIs
  return {
    id: data.id,
    name: data.name,
    photo: data.photo,
    role: data.role,
    displayOrder: data.display_order || 0,
    dailyLogs: candidate.dailyLogs || {},
    monthlyKPIs: candidate.monthlyKPIs || {
      observationsOpen: 0,
      observationsClosed: 0,
      violations: 0,
      ncrsOpen: 0,
      ncrsClosed: 0,
      weeklyReportsOpen: 0,
      weeklyReportsClosed: 0
    }
  };
};

export const deleteCandidate = async (id) => {
  await fetchAPI(`/candidates/${id}`, {
    method: 'DELETE',
  });
};

export const reorderCandidates = async (projectId, candidateIds) => {
  const data = await fetchAPI(`/candidates/project/${projectId}/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ candidate_ids: candidateIds }),
  });
  return data;
};

// ==================== DAILY LOGS ====================
// These endpoints are for CREATING/UPDATING logs, NOT fetching them
// (Logs are fetched as part of getCandidatesByProject)

export const createDailyLog = async (candidateId, date, log) => {
  const data = await fetchAPI('/daily-logs', {
    method: 'POST',
    body: JSON.stringify({
      candidate_id: candidateId,
      log_date: date,
      time_in: log.timeIn || null,
      time_out: log.timeOut || null,
      task_briefing: log.taskBriefing,
      tbt_conducted: log.tbtConducted,
      violation_briefing: log.violationBriefing,
      checklist_submitted: log.checklistSubmitted,
      inductions_covered: log.inductionsCovered,
      barcode_implemented: log.barcodeImplemented,
      attendance_verified: log.attendanceVerified,
      safety_observations_recorded: log.safetyObservationsRecorded,
      sor_ncr_closed: log.sorNcrClosed,
      mock_drill_participated: log.mockDrillParticipated,
      campaign_participated: log.campaignParticipated,
      monthly_inspections_completed: log.monthlyInspectionsCompleted,
      near_miss_reported: log.nearMissReported,
      weekly_training_briefed: log.weeklyTrainingBriefed,
      daily_reports_followup: log.dailyReportsFollowup,
      msra_communicated: log.msraCommunicated,
      consultant_responses: log.consultantResponses,
      weekly_tbt_full_participation: log.weeklyTbtFullParticipation,
      welfare_facilities_monitored: log.welfareFacilitiesMonitored,
      monday_ncr_shared: log.mondayNcrShared,
      safety_walks_conducted: log.safetyWalksConducted,
      training_sessions_conducted: log.trainingSessionsConducted,
      barcode_system_100: log.barcodeSystem100,
      task_briefings_participating: log.taskBriefingsParticipating,
      comment: log.comment || null,
      description: log.description || null
    }),
  });
  return data;
};

// ==================== MONTHLY KPIs ====================
// These endpoints are for CREATING/UPDATING KPIs, NOT fetching them
// (KPIs are fetched as part of getCandidatesByProject)

export const createMonthlyKPI = async (candidateId, month, kpis) => {
  const data = await fetchAPI('/monthly-kpis', {
    method: 'POST',
    body: JSON.stringify({
      candidate_id: candidateId,
      month: month,
      observations_open: kpis.observationsOpen || 0,
      observations_closed: kpis.observationsClosed || 0,
      violations: kpis.violations || 0,
      ncrs_open: kpis.ncrsOpen || 0,
      ncrs_closed: kpis.ncrsClosed || 0,
      weekly_reports_open: kpis.weeklyReportsOpen || 0,
      weekly_reports_closed: kpis.weeklyReportsClosed || 0
    }),
  });
  return data;
};

// ==================== SECTIONS ====================

export const getSectionsByProject = async (projectId) => {
  const data = await fetchAPI(`/sections/project/${projectId}`);
  return data;
};

export const createSection = async (section, projectId) => {
  const data = await fetchAPI('/sections', {
    method: 'POST',
    body: JSON.stringify({
      project_id: projectId,
      name: section.name,
      description: section.description || null,
      display_order: section.displayOrder || 0
    }),
  });
  return data;
};

export const updateSection = async (id, section) => {
  const data = await fetchAPI(`/sections/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: section.name,
      description: section.description || null,
      display_order: section.displayOrder || 0
    }),
  });
  return data;
};

export const deleteSection = async (id) => {
  await fetchAPI(`/sections/${id}`, {
    method: 'DELETE',
  });
};

export const reorderSections = async (projectId, sectionIds) => {
  const data = await fetchAPI(`/sections/project/${projectId}/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ section_ids: sectionIds }),
  });
  return data;
};

export const assignCandidateToSection = async (candidateId, sectionId) => {
  const data = await fetchAPI('/sections/assign', {
    method: 'POST',
    body: JSON.stringify({
      candidate_id: candidateId,
      section_id: sectionId
    }),
  });
  return data;
};

export const syncSectionCandidates = async (sectionId, candidateIds) => {
  const data = await fetchAPI(`/sections/${sectionId}/sync-candidates`, {
    method: 'PUT',
    body: JSON.stringify(candidateIds),
  });
  return data;
};

export const unassignCandidateFromSection = async (candidateId, sectionId) => {
  await fetchAPI(`/sections/unassign/${candidateId}/${sectionId}`, {
    method: 'DELETE',
  });
};

export const getSectionCandidates = async (sectionId) => {
  const data = await fetchAPI(`/sections/${sectionId}/candidates`);
  return data;
};