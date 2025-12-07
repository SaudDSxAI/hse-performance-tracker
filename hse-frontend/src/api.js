import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000/api';

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
      checklistSubmitted: log.checklist_submitted,
      observationsCount: log.observations_count
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

// Projects
export const getProjects = async () => {
  const response = await axios.get(`${API_BASE}/projects`);
  return response.data.map(transformProject);
};

export const createProject = async (project) => {
  const response = await axios.post(`${API_BASE}/projects`, transformProjectToBackend(project));
  return transformProject(response.data);
};

export const updateProject = async (id, project) => {
  const response = await axios.put(`${API_BASE}/projects/${id}`, transformProjectToBackend(project));
  return transformProject(response.data);
};

export const deleteProject = async (id) => {
  await axios.delete(`${API_BASE}/projects/${id}`);
};

// Candidates
export const getCandidatesByProject = async (projectId) => {
  const response = await axios.get(`${API_BASE}/candidates/project/${projectId}`);
  
  // Fetch daily logs and KPIs for each candidate
  const candidatesWithData = await Promise.all(
    response.data.map(async (candidate) => {
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
  const response = await axios.get(`${API_BASE}/candidates/${candidateId}`);
  const [dailyLogs, monthlyKPIs] = await Promise.all([
    getDailyLogsByCandidate(candidateId),
    getMonthlyKPIsByCandidate(candidateId)
  ]);
  return transformCandidate(response.data, dailyLogs, monthlyKPIs);
};

export const createCandidate = async (candidate, projectId) => {
  const response = await axios.post(`${API_BASE}/candidates`, transformCandidateToBackend(candidate, projectId));
  return transformCandidate(response.data, [], []);
};

export const updateCandidate = async (id, candidate, projectId) => {
  const response = await axios.put(`${API_BASE}/candidates/${id}`, transformCandidateToBackend(candidate, projectId));
  return transformCandidate(response.data, [], []);
};

export const deleteCandidate = async (id) => {
  await axios.delete(`${API_BASE}/candidates/${id}`);
};

// Daily Logs
export const createDailyLog = async (candidateId, date, log) => {
  const response = await axios.post(`${API_BASE}/daily-logs`, {
    candidate_id: candidateId,
    log_date: date,
    time_in: log.timeIn || null,
    time_out: log.timeOut || null,
    task_briefing: log.taskBriefing || false,
    tbt_conducted: log.tbtConducted || false,
    violation_briefing: log.violationBriefing || false,
    checklist_submitted: log.checklistSubmitted || false,
    observations_count: log.observationsCount || 0
  });
  return response.data;
};

export const getDailyLogsByCandidate = async (candidateId) => {
  const response = await axios.get(`${API_BASE}/candidates/${candidateId}/daily-logs`);
  return response.data;
};

// Monthly KPIs
export const createMonthlyKPI = async (candidateId, month, kpis) => {
  const response = await axios.post(`${API_BASE}/monthly-kpis`, {
    candidate_id: candidateId,
    month: month,
    observations_open: kpis.observationsOpen || 0,
    observations_closed: kpis.observationsClosed || 0,
    violations: kpis.violations || 0,
    ncrs_open: kpis.ncrsOpen || 0,
    ncrs_closed: kpis.ncrsClosed || 0,
    weekly_reports_open: kpis.weeklyReportsOpen || 0,
    weekly_reports_closed: kpis.weeklyReportsClosed || 0
  });
  return response.data;
};

export const getMonthlyKPIsByCandidate = async (candidateId) => {
  const response = await axios.get(`${API_BASE}/candidates/${candidateId}/monthly-kpis`);
  return response.data;
};
