-- Complete SQL file with 3 projects, 6 candidates, and 15 days of comprehensive data

-- Insert 3 Test Projects
INSERT INTO projects (name, location, company, hse_lead_name, hse_lead_photo, manpower, man_hours, new_inductions, high_risk) VALUES
('Test Project Alpha', 'Dubai, UAE', 'Alpha Construction LLC', 'Omar Abdullah', 'https://ui-avatars.com/api/?name=Omar+Abdullah&size=150&background=3B82F6&color=fff', 75, 5200, 18, '["excavation", "lifting"]'),
('Test Project Beta', 'Abu Dhabi, UAE', 'Beta Engineering Co', 'Fatima Hassan', 'https://ui-avatars.com/api/?name=Fatima+Hassan&size=150&background=EC4899&color=fff', 52, 3800, 12, '["hotwork", "marine"]'),
('Test Project Gamma', 'Sharjah, UAE', 'Gamma Builders Ltd', 'Ahmed Ali', 'https://ui-avatars.com/api/?name=Ahmed+Ali&size=150&background=10B981&color=fff', 68, 4500, 15, '["excavation", "hotwork"]');

-- Insert candidates for Project Alpha
INSERT INTO candidates (project_id, name, photo, role)
SELECT id, 'Youssef Mohammed', 'https://ui-avatars.com/api/?name=Youssef+Mohammed&size=150&background=F59E0B&color=fff', 'Site Safety Officer'
FROM projects WHERE name = 'Test Project Alpha';

INSERT INTO candidates (project_id, name, photo, role)
SELECT id, 'Layla Ibrahim', 'https://ui-avatars.com/api/?name=Layla+Ibrahim&size=150&background=8B5CF6&color=fff', 'Safety Coordinator'
FROM projects WHERE name = 'Test Project Alpha';

-- Insert 15 days of daily logs for Youssef Mohammed
INSERT INTO daily_logs (candidate_id, log_date, time_in, time_out, task_briefing, tbt_conducted, violation_briefing, checklist_submitted, observations_count)
SELECT 
    (SELECT id FROM candidates WHERE name = 'Youssef Mohammed' LIMIT 1),
    CURRENT_DATE - generate_series * INTERVAL '1 day',
    '07:00',
    '16:30',
    CASE WHEN generate_series IN (5) THEN false ELSE true END,
    CASE WHEN generate_series IN (3, 10) THEN false ELSE true END,
    CASE WHEN generate_series IN (2, 11) THEN false ELSE true END,
    CASE WHEN generate_series IN (6) THEN false ELSE true END,
    CASE 
        WHEN generate_series = 0 THEN 4
        WHEN generate_series = 1 THEN 3
        WHEN generate_series = 2 THEN 2
        WHEN generate_series = 3 THEN 5
        WHEN generate_series = 4 THEN 3
        WHEN generate_series = 5 THEN 1
        WHEN generate_series = 6 THEN 4
        WHEN generate_series = 7 THEN 6
        WHEN generate_series = 8 THEN 2
        WHEN generate_series = 9 THEN 5
        WHEN generate_series = 10 THEN 3
        WHEN generate_series = 11 THEN 4
        WHEN generate_series = 12 THEN 7
        WHEN generate_series = 13 THEN 3
        ELSE 5
    END
FROM generate_series(0, 14) AS generate_series;

-- Insert 15 days of daily logs for Layla Ibrahim
INSERT INTO daily_logs (candidate_id, log_date, time_in, time_out, task_briefing, tbt_conducted, violation_briefing, checklist_submitted, observations_count)
SELECT 
    (SELECT id FROM candidates WHERE name = 'Layla Ibrahim' LIMIT 1),
    CURRENT_DATE - generate_series * INTERVAL '1 day',
    '06:30',
    '15:30',
    CASE WHEN generate_series IN (3) THEN false ELSE true END,
    CASE WHEN generate_series IN (1, 11) THEN false ELSE true END,
    CASE WHEN generate_series IN (5) THEN false ELSE true END,
    CASE WHEN generate_series IN (2, 13) THEN false ELSE true END,
    CASE 
        WHEN generate_series = 0 THEN 3
        WHEN generate_series = 1 THEN 2
        WHEN generate_series = 2 THEN 4
        WHEN generate_series = 3 THEN 1
        WHEN generate_series = 4 THEN 5
        WHEN generate_series = 5 THEN 2
        WHEN generate_series = 6 THEN 6
        WHEN generate_series = 7 THEN 3
        WHEN generate_series = 8 THEN 4
        WHEN generate_series = 9 THEN 2
        WHEN generate_series = 10 THEN 7
        WHEN generate_series = 11 THEN 3
        WHEN generate_series = 12 THEN 5
        WHEN generate_series = 13 THEN 4
        ELSE 6
    END
FROM generate_series(0, 14) AS generate_series;

-- Insert Monthly KPIs for Youssef and Layla
INSERT INTO monthly_kpis (candidate_id, month, observations_open, observations_closed, violations, ncrs_open, ncrs_closed, weekly_reports_open, weekly_reports_closed) VALUES
((SELECT id FROM candidates WHERE name = 'Youssef Mohammed' LIMIT 1), DATE_TRUNC('month', CURRENT_DATE), 8, 22, 3, 2, 5, 0, 4),
((SELECT id FROM candidates WHERE name = 'Layla Ibrahim' LIMIT 1), DATE_TRUNC('month', CURRENT_DATE), 5, 18, 1, 1, 4, 1, 3);

-- Insert candidates for Project Beta
INSERT INTO candidates (project_id, name, photo, role)
SELECT id, 'Hassan Khalid', 'https://ui-avatars.com/api/?name=Hassan+Khalid&size=150&background=06B6D4&color=fff', 'HSE Engineer'
FROM projects WHERE name = 'Test Project Beta';

INSERT INTO candidates (project_id, name, photo, role)
SELECT id, 'Mariam Saeed', 'https://ui-avatars.com/api/?name=Mariam+Saeed&size=150&background=EF4444&color=fff', 'Environmental Officer'
FROM projects WHERE name = 'Test Project Beta';

-- Insert 15 days of daily logs for Hassan Khalid
INSERT INTO daily_logs (candidate_id, log_date, time_in, time_out, task_briefing, tbt_conducted, violation_briefing, checklist_submitted, observations_count)
SELECT 
    (SELECT id FROM candidates WHERE name = 'Hassan Khalid' LIMIT 1),
    CURRENT_DATE - generate_series * INTERVAL '1 day',
    '08:00',
    '17:00',
    CASE WHEN generate_series IN (6) THEN false ELSE true END,
    CASE WHEN generate_series IN (4, 13) THEN false ELSE true END,
    CASE WHEN generate_series IN (3) THEN false ELSE true END,
    CASE WHEN generate_series IN (7) THEN false ELSE true END,
    CASE 
        WHEN generate_series = 0 THEN 5
        WHEN generate_series = 1 THEN 4
        WHEN generate_series = 2 THEN 6
        WHEN generate_series = 3 THEN 3
        WHEN generate_series = 4 THEN 4
        WHEN generate_series = 5 THEN 7
        WHEN generate_series = 6 THEN 2
        WHEN generate_series = 7 THEN 5
        WHEN generate_series = 8 THEN 8
        WHEN generate_series = 9 THEN 4
        WHEN generate_series = 10 THEN 6
        WHEN generate_series = 11 THEN 3
        WHEN generate_series = 12 THEN 9
        WHEN generate_series = 13 THEN 5
        ELSE 4
    END
FROM generate_series(0, 14) AS generate_series;

-- Insert 15 days of daily logs for Mariam Saeed
INSERT INTO daily_logs (candidate_id, log_date, time_in, time_out, task_briefing, tbt_conducted, violation_briefing, checklist_submitted, observations_count)
SELECT 
    (SELECT id FROM candidates WHERE name = 'Mariam Saeed' LIMIT 1),
    CURRENT_DATE - generate_series * INTERVAL '1 day',
    '07:30',
    '16:30',
    CASE WHEN generate_series IN (2, 12) THEN false ELSE true END,
    CASE WHEN generate_series IN (4) THEN false ELSE true END,
    CASE WHEN generate_series IN (1, 9) THEN false ELSE true END,
    CASE WHEN generate_series IN (3) THEN false ELSE true END,
    CASE 
        WHEN generate_series = 0 THEN 2
        WHEN generate_series = 1 THEN 3
        WHEN generate_series = 2 THEN 1
        WHEN generate_series = 3 THEN 4
        WHEN generate_series = 4 THEN 2
        WHEN generate_series = 5 THEN 5
        WHEN generate_series = 6 THEN 3
        WHEN generate_series = 7 THEN 4
        WHEN generate_series = 8 THEN 2
        WHEN generate_series = 9 THEN 6
        WHEN generate_series = 10 THEN 3
        WHEN generate_series = 11 THEN 7
        WHEN generate_series = 12 THEN 2
        WHEN generate_series = 13 THEN 5
        ELSE 4
    END
FROM generate_series(0, 14) AS generate_series;

-- Insert Monthly KPIs for Hassan and Mariam
INSERT INTO monthly_kpis (candidate_id, month, observations_open, observations_closed, violations, ncrs_open, ncrs_closed, weekly_reports_open, weekly_reports_closed) VALUES
((SELECT id FROM candidates WHERE name = 'Hassan Khalid' LIMIT 1), DATE_TRUNC('month', CURRENT_DATE), 10, 28, 2, 1, 6, 0, 5),
((SELECT id FROM candidates WHERE name = 'Mariam Saeed' LIMIT 1), DATE_TRUNC('month', CURRENT_DATE), 6, 20, 1, 2, 4, 1, 4);

-- Insert candidates for Project Gamma
INSERT INTO candidates (project_id, name, photo, role)
SELECT id, 'Ali Rahman', 'https://ui-avatars.com/api/?name=Ali+Rahman&size=150&background=14B8A6&color=fff', 'Safety Inspector'
FROM projects WHERE name = 'Test Project Gamma';

INSERT INTO candidates (project_id, name, photo, role)
SELECT id, 'Noor Ahmed', 'https://ui-avatars.com/api/?name=Noor+Ahmed&size=150&background=A855F7&color=fff', 'Site Supervisor'
FROM projects WHERE name = 'Test Project Gamma';

-- Insert 15 days of daily logs for Ali Rahman
INSERT INTO daily_logs (candidate_id, log_date, time_in, time_out, task_briefing, tbt_conducted, violation_briefing, checklist_submitted, observations_count)
SELECT 
    (SELECT id FROM candidates WHERE name = 'Ali Rahman' LIMIT 1),
    CURRENT_DATE - generate_series * INTERVAL '1 day',
    '06:00',
    '15:00',
    CASE WHEN generate_series IN (3) THEN false ELSE true END,
    CASE WHEN generate_series IN (2, 10) THEN false ELSE true END,
    CASE WHEN generate_series IN (4, 13) THEN false ELSE true END,
    CASE WHEN generate_series IN (1, 9) THEN false ELSE true END,
    CASE 
        WHEN generate_series = 0 THEN 3
        WHEN generate_series = 1 THEN 4
        WHEN generate_series = 2 THEN 2
        WHEN generate_series = 3 THEN 5
        WHEN generate_series = 4 THEN 3
        WHEN generate_series = 5 THEN 6
        WHEN generate_series = 6 THEN 4
        WHEN generate_series = 7 THEN 7
        WHEN generate_series = 8 THEN 3
        WHEN generate_series = 9 THEN 5
        WHEN generate_series = 10 THEN 2
        WHEN generate_series = 11 THEN 8
        WHEN generate_series = 12 THEN 4
        WHEN generate_series = 13 THEN 6
        ELSE 5
    END
FROM generate_series(0, 14) AS generate_series;

-- Insert 15 days of daily logs for Noor Ahmed
INSERT INTO daily_logs (candidate_id, log_date, time_in, time_out, task_briefing, tbt_conducted, violation_briefing, checklist_submitted, observations_count)
SELECT 
    (SELECT id FROM candidates WHERE name = 'Noor Ahmed' LIMIT 1),
    CURRENT_DATE - generate_series * INTERVAL '1 day',
    '07:00',
    '16:00',
    CASE WHEN generate_series IN (5) THEN false ELSE true END,
    CASE WHEN generate_series IN (3, 12) THEN false ELSE true END,
    CASE WHEN generate_series IN (4) THEN false ELSE true END,
    CASE WHEN generate_series IN (6) THEN false ELSE true END,
    CASE 
        WHEN generate_series = 0 THEN 4
        WHEN generate_series = 1 THEN 5
        WHEN generate_series = 2 THEN 3
        WHEN generate_series = 3 THEN 6
        WHEN generate_series = 4 THEN 2
        WHEN generate_series = 5 THEN 4
        WHEN generate_series = 6 THEN 7
        WHEN generate_series = 7 THEN 5
        WHEN generate_series = 8 THEN 8
        WHEN generate_series = 9 THEN 4
        WHEN generate_series = 10 THEN 6
        WHEN generate_series = 11 THEN 3
        WHEN generate_series = 12 THEN 9
        WHEN generate_series = 13 THEN 5
        ELSE 7
    END
FROM generate_series(0, 14) AS generate_series;

-- Insert Monthly KPIs for Ali and Noor
INSERT INTO monthly_kpis (candidate_id, month, observations_open, observations_closed, violations, ncrs_open, ncrs_closed, weekly_reports_open, weekly_reports_closed) VALUES
((SELECT id FROM candidates WHERE name = 'Ali Rahman' LIMIT 1), DATE_TRUNC('month', CURRENT_DATE), 7, 24, 2, 1, 5, 1, 4),
((SELECT id FROM candidates WHERE name = 'Noor Ahmed' LIMIT 1), DATE_TRUNC('month', CURRENT_DATE), 9, 30, 1, 0, 7, 0, 5);