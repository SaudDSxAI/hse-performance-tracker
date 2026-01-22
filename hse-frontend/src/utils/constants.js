import { HardHat, AlertTriangle, Anchor, Flame } from 'lucide-react';

export const riskOptions = [
    { key: 'excavation', label: 'Excavation', icon: HardHat, color: 'bg-amber-100 text-amber-700' },
    { key: 'lifting', label: 'Lifting', icon: AlertTriangle, color: 'bg-red-100 text-red-700' },
    { key: 'marine', label: 'Marine', icon: Anchor, color: 'bg-blue-100 text-blue-700' },
    { key: 'hotwork', label: 'Hot Work', icon: Flame, color: 'bg-orange-100 text-orange-700' }
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
