/**
 * Calculate overall performance percentage for a candidate
 * @param {Object} candidate - The candidate object with dailyLogs
 * @returns {number} - Performance percentage (0-100)
 */
export const getOverallPerformance = (candidate) => {
    if (!candidate?.dailyLogs) return 0;

    const logs = Object.values(candidate.dailyLogs);
    if (logs.length === 0) return 0;

    const booleanFields = [
        'taskBriefing', 'tbtConducted', 'violationBriefing', 'checklistSubmitted',
        'inductionsCovered', 'barcodeImplemented', 'attendanceVerified',
        'safetyObservationsRecorded', 'sorNcrClosed', 'mockDrillParticipated',
        'campaignParticipated', 'monthlyInspectionsCompleted', 'nearMissReported',
        'weeklyTrainingBriefed', 'dailyReportsFollowup', 'msraCommunicated',
        'consultantResponses', 'weeklyTbtFullParticipation', 'welfareFacilitiesMonitored',
        'mondayNcrShared', 'safetyWalksConducted', 'trainingSessionsConducted',
        'barcodeSystem100', 'taskBriefingsParticipating'
    ];

    let total = 0;
    let yes = 0;

    logs.forEach(log => {
        booleanFields.forEach(field => {
            if (log[field] !== null && log[field] !== undefined) {
                total++;
                if (log[field] === true) yes++;
            }
        });
    });

    return total > 0 ? Math.round((yes / total) * 100) : 0;
};

/**
 * Get NCR/SOR closure rate from monthly KPIs
 * @param {Object} monthlyKPIs - Object containing monthly KPI data keyed by date
 * @returns {number} - Closure rate percentage
 */
export const getNcrSorClosureRate = (monthlyKPIs) => {
    if (!monthlyKPIs || Object.keys(monthlyKPIs).length === 0) return 0;

    const allKpis = Object.values(monthlyKPIs);
    let totalOpen = 0;
    let totalClosed = 0;

    allKpis.forEach(kpi => {
        totalOpen += (kpi.ncrsOpen || 0) + (kpi.observationsOpen || 0);
        totalClosed += (kpi.ncrsClosed || 0) + (kpi.observationsClosed || 0);
    });

    const total = totalOpen + totalClosed;
    return total > 0 ? Math.round((totalClosed / total) * 100) : 0;
};

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date
 */
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

/**
 * Get current date in ISO format (YYYY-MM-DD)
 * @returns {string}
 */
export const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
};

/**
 * Get date N days ago in ISO format
 * @param {number} days - Number of days ago
 * @returns {string}
 */
export const getDateDaysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
};
