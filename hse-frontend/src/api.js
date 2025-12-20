const API_BASE = 'https://hse-backend.up.railway.app/api';

console.log('🔧 API_BASE:', API_BASE);

// Token management
const getToken = () => localStorage.getItem('hse_token');
const setToken = (token) => localStorage.setItem('hse_token', token);
const removeToken = () => localStorage.removeItem('hse_token');
const getUser = () => {
  const user = localStorage.getItem('hse_user');
  return user ? JSON.parse(user) : null;
};
const setUser = (user) => localStorage.setItem('hse_user', JSON.stringify(user));
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

    if (response.status === 401) {
      // Token expired or invalid
      removeToken();
      removeUser();
      window.location.reload();
      throw new Error('Session expired. Please login again.');
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
  delete_pin: project.deletePin || null
});

const transformCandidate = (candidate, dailyLogs = [], monthlyKPIs = []) => {
  // Transform daily logs array to object keyed by date
  const logsObject = {};
  dailyLogs.forEach(log => {
    logsObject[log.log_date] = {
      timeIn: log.time_in,
      timeOut: log.time_out,
      taskBriefing: log.task_briefing,
      tbtConducted: log.tbt_conducted,
      violationBriefing: log.violation_briefing,
      checklistSubmitted: log.checklist_submitted,
      // New fields
      inductionsCovered: log.inductions_covered,
      barcodeImplemented: log.barcode_implemented,
      attendanceVerified: log.attendance_verified,
      safetyObservationsRecorded: log.safety_observations_recorded,
      sorNcrClosed: log.sor_ncr_closed,
      mockDrillParticipated: log.mock_drill_participated,
      campaignParticipated: log.campaign_participated,
      monthlyInspectionsCompleted: log.monthly_inspections_completed,
      nearMissReported: log.near_miss_reported,
      weeklyTrainingBriefed: log.weekly_training_briefed
    };
  });

  // Get latest monthly KPI
  const latestKPI = monthlyKPIs.length > 0 ? monthlyKPIs[0] : null;
  const kpis = latestKPI ? {
    observationsOpen: latestKPI.observations_open,
    observationsClosed: latestKPI.observations_closed,
    violations: latestKPI.violations,
    ncrsOpen: latestKPI.ncrs_open,
    ncrsClosed: latestKPI.ncrs_closed,
    weeklyReportsOpen: latestKPI.weekly_reports_open,
    weeklyReportsClosed: latestKPI.weekly_reports_closed
  } : {
    observationsOpen: 0,
    observationsClosed: 0,
    violations: 0,
    ncrsOpen: 0,
    ncrsClosed: 0,
    weeklyReportsOpen: 0,
    weeklyReportsClosed: 0
  };

  return {
    id: candidate.id,
    name: candidate.name,
    photo: candidate.photo,
    role: candidate.role,
    displayOrder: candidate.display_order || 0,
    dailyLogs: logsObject,
    monthlyKPIs: kpis
  };
};

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

export const getCandidatesByProject = async (projectId) => {
  const data = await fetchAPI(`/candidates/project/${projectId}`);
  
  // Fetch daily logs and KPIs for each candidate
  const candidatesWithData = await Promise.all(
    data.map(async (candidate) => {
      try {
        const [dailyLogs, monthlyKPIs] = await Promise.all([
          getDailyLogsByCandidate(candidate.id),
          getMonthlyKPIsByCandidate(candidate.id)
        ]);
        return transformCandidate(candidate, dailyLogs, monthlyKPIs);
      } catch (error) {
        console.error(`Error fetching data for candidate ${candidate.id}:`, error);
        return transformCandidate(candidate, [], []);
      }
    })
  );
  
  return candidatesWithData;
};

export const getCandidate = async (candidateId) => {
  const data = await fetchAPI(`/candidates/${candidateId}`);
  const [dailyLogs, monthlyKPIs] = await Promise.all([
    getDailyLogsByCandidate(candidateId),
    getMonthlyKPIsByCandidate(candidateId)
  ]);
  return transformCandidate(data, dailyLogs, monthlyKPIs);
};

export const createCandidate = async (candidate, projectId) => {
  const data = await fetchAPI('/candidates', {
    method: 'POST',
    body: JSON.stringify(transformCandidateToBackend(candidate, projectId)),
  });
  return transformCandidate(data, [], []);
};

export const updateCandidate = async (id, candidate, projectId) => {
  const data = await fetchAPI(`/candidates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(transformCandidateToBackend(candidate, projectId)),
  });
  return transformCandidate(data, [], []);
};

export const deleteCandidate = async (id) => {
  await fetchAPI(`/candidates/${id}`, {
    method: 'DELETE',
  });
};

// ==================== DAILY LOGS ====================

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
      // New fields
      inductions_covered: log.inductionsCovered,
      barcode_implemented: log.barcodeImplemented,
      attendance_verified: log.attendanceVerified,
      safety_observations_recorded: log.safetyObservationsRecorded,
      sor_ncr_closed: log.sorNcrClosed,
      mock_drill_participated: log.mockDrillParticipated,
      campaign_participated: log.campaignParticipated,
      monthly_inspections_completed: log.monthlyInspectionsCompleted,
      near_miss_reported: log.nearMissReported,
      weekly_training_briefed: log.weeklyTrainingBriefed
    }),
  });
  return data;
};

export const getDailyLogsByCandidate = async (candidateId) => {
  const data = await fetchAPI(`/candidates/${candidateId}/daily-logs`);
  return data;
};

// ==================== MONTHLY KPIs ====================

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

export const getMonthlyKPIsByCandidate = async (candidateId) => {
  const data = await fetchAPI(`/candidates/${candidateId}/monthly-kpis`);
  return data;
};

// ==================== CANDIDATE REORDER ====================

export const reorderCandidates = async (projectId, candidateIds) => {
  const data = await fetchAPI(`/candidates/project/${projectId}/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ candidate_ids: candidateIds }),
  });
  return data;
};