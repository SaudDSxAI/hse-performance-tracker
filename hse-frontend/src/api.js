const API_BASE = 'https://hse-backend.up.railway.app/api';

console.log('🔧 API_BASE:', API_BASE);

// Helper function for fetch with error handling and logging
const fetchAPI = async (url, options = {}) => {
  const fullURL = url.startsWith('http') ? url : `${API_BASE}${url}`;
  
  console.log('🚀 Request:', options.method || 'GET', fullURL);
  
  try {
    const response = await fetch(fullURL, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    console.log('✅ Response:', response.status, fullURL);

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
  high_risk: project.highRisk || []
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
      checklistSubmitted: log.checklist_submitted
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
    dailyLogs: logsObject,
    monthlyKPIs: kpis
  };
};

const transformCandidateToBackend = (candidate, projectId) => ({
  project_id: projectId,
  name: candidate.name,
  photo: candidate.photo,
  role: candidate.role || ''
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
      checklist_submitted: log.checklistSubmitted
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