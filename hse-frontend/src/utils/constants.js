import { HardHat, AlertTriangle, Anchor, Flame } from 'lucide-react';

export const riskOptions = [
    { key: 'excavation', label: 'Excavation', icon: HardHat, color: 'bg-blue-100 text-[#0EA5E9]' },
    { key: 'lifting', label: 'Lifting', icon: AlertTriangle, color: 'bg-blue-100 text-[#0EA5E9]' },
    { key: 'marine', label: 'Marine', icon: Anchor, color: 'bg-blue-100 text-[#0EA5E9]' },
    { key: 'hotwork', label: 'Hot Work', icon: Flame, color: 'bg-blue-100 text-[#0EA5E9]' }
];

export const emptyDailyLog = {
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

export const emptyMonthlyKPIs = { observationsOpen: 0, observationsClosed: 0, violations: 0, ncrsOpen: 0, ncrsClosed: 0, weeklyReportsOpen: 0, weeklyReportsClosed: 0 };

export const dailyLogTaskFields = [
    { key: 'attendanceVerified', label: 'Attendance' },
    { key: 'inductionsCovered', label: 'Inductions' },
    { key: 'barcodeImplemented', label: 'Barcode' },
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
    { key: 'dailyReportsFollowup', label: 'Reports F/U' },
    { key: 'msraCommunicated', label: 'MSRA' },
    { key: 'consultantResponses', label: 'Consultant' },
    { key: 'weeklyTbtFullParticipation', label: 'Mass TBT' },
    { key: 'welfareFacilitiesMonitored', label: 'Welfare' },
    { key: 'mondayNcrShared', label: 'Monday Rpt' },
    { key: 'safetyWalksConducted', label: 'Safety Walks' },
    { key: 'trainingSessionsConducted', label: 'Engr Trng' },
    { key: 'barcodeSystem100', label: 'BC System' },
    { key: 'taskBriefingsParticipating', label: 'Brf Verify' }
];
