-- Clean up existing test data (optional - comment out if you want to keep current data)
-- DELETE FROM daily_logs;
-- DELETE FROM monthly_kpis;
-- DELETE FROM candidates;
-- DELETE FROM projects WHERE name LIKE 'Test%';

-- Insert 3 Test Projects
INSERT INTO projects (name, location, company, hse_lead_name, hse_lead_photo, manpower, man_hours, new_inductions, high_risk) VALUES
('Test Project Alpha', 'Dubai, UAE', 'Alpha Construction LLC', 'Omar Abdullah', 'https://ui-avatars.com/api/?name=Omar+Abdullah&size=150&background=3B82F6&color=fff', 75, 5200, 18, '["excavation", "lifting"]'),
('Test Project Beta', 'Abu Dhabi, UAE', 'Beta Engineering Co', 'Fatima Hassan', 'https://ui-avatars.com/api/?name=Fatima+Hassan&size=150&background=EC4899&color=fff', 52, 3800, 12, '["hotwork", "marine"]'),
('Test Project Gamma', 'Sharjah, UAE', 'Gamma Builders Ltd', 'Ahmed Ali', 'https://ui-avatars.com/api/?name=Ahmed+Ali&size=150&background=10B981&color=fff', 68, 4500, 15, '["excavation", "hotwork"]');

-- Get the project IDs (assuming they are the last 3 inserted)
DO $$
DECLARE
    project_alpha_id INT;
    project_beta_id INT;
    project_gamma_id INT;
    candidate_ids INT[];
BEGIN
    -- Get project IDs
    SELECT id INTO project_alpha_id FROM projects WHERE name = 'Test Project Alpha';
    SELECT id INTO project_beta_id FROM projects WHERE name = 'Test Project Beta';
    SELECT id INTO project_gamma_id FROM projects WHERE name = 'Test Project Gamma';

    -- Insert 2 candidates for Project Alpha
    INSERT INTO candidates (project_id, name, photo, role) VALUES
    (project_alpha_id, 'Youssef Mohammed', 'https://ui-avatars.com/api/?name=Youssef+Mohammed&size=150&background=F59E0B&color=fff', 'Site Safety Officer'),
    (project_alpha_id, 'Layla Ibrahim', 'https://ui-avatars.com/api/?name=Layla+Ibrahim&size=150&background=8B5CF6&color=fff', 'Safety Coordinator')
    RETURNING id INTO candidate_ids;

    -- Insert 15 days of daily logs for Candidate 1 (Youssef)
    INSERT INTO daily_logs (candidate_id, log_date, time_in, time_out, task_briefing, tbt_conducted, violation_briefing, checklist_submitted, observations_count) VALUES
    ((SELECT id FROM candidates WHERE name = 'Youssef Mohammed'), CURRENT_DATE - INTERVAL '0 days', '07:00', '16:30', true, true, true, true, 4),
    ((SELECT id FROM candidates WHERE name = 'Youssef Mohammed'), CURRENT_DATE - INTERVAL '1 days', '07:00', '16:30', true, true, true, true, 3),
    ((SELECT id FROM candidates WHERE name = 'Youssef Mohammed'), CURRENT_DATE - INTERVAL '2 days', '07:00', '16:30', true, true, false, true, 2),
    ((SELECT id FROM candidates WHERE name = 'Youssef Mohammed'), CURRENT_DATE - INTERVAL '3 days', '07:00', '16:30', true, false, true, true, 5),
    ((SELECT id FROM candidates WHERE name = 'Youssef Mohammed'), CURRENT_DATE - INTERVAL '4 days', '07:00', '16:30', true, true, true, true, 3),
    ((SELECT id FROM candidates WHERE name = 'Youssef Mohammed'), CURRENT_DATE - INTERVAL '5 days', '07:00', '16:30', false, true, true, true, 1),
    ((SELECT id FROM candidates WHERE name = 'Youssef Mohammed'), CURRENT_DATE - INTERVAL '6 days', '07:00', '16:30', true, true, true, false, 4),
    ((SELECT id FROM candidates WHERE name = 'Youssef Mohammed'), CURRENT_DATE - INTERVAL '7 days', '07:00', '16:30', true, true, true, true, 6),
    ((SELECT id FROM candidates WHERE name = 'Youssef Mohammed'), CURRENT_DATE - INTERVAL '8 days', '07:00', '16:30', true, true, true, true, 2),
    ((SELECT id FROM candidates WHERE name = 'Youssef Mohammed'), CURRENT_DATE - INTERVAL '9 days', '07:00', '16:30', true, true, true, true, 5),
    ((SELECT id FROM candidates WHERE name = 'Youssef Mohammed'), CURRENT_DATE - INTERVAL '10 days', '07:00', '16:30', true, false, true, true, 3),
    ((SELECT id FROM candidates WHERE name = 'Youssef Mohammed'), CURRENT_DATE - INTERVAL '11 days', '07:00', '16:30', true, true, false, true, 4),
    ((SELECT id FROM candidates WHERE name = 'Youssef Mohammed'), CURRENT_DATE - INTERVAL '12 days', '07:00', '16:30', true, true, true, true, 7),
    ((SELECT id FROM candidates WHERE name = 'Youssef Mohammed'), CURRENT_DATE - INTERVAL '13 days', '07:00', '16:30', true, true, true, true, 3),
    ((SELECT id FROM candidates WHERE name = 'Youssef Mohammed'), CURRENT_DATE - INTERVAL '14 days', '07:00', '16:30', true, true, true, true, 5);

    -- Insert 15 days of daily logs for Candidate 2 (Layla)
    INSERT INTO daily_logs (candidate_id, log_date, time_in, time_out, task_briefing, tbt_conducted, violation_briefing, checklist_submitted, observations_count) VALUES
    ((SELECT id FROM candidates WHERE name = 'Layla Ibrahim'), CURRENT_DATE - INTERVAL '0 days', '06:30', '15:30', true, true, true, true, 3),
    ((SELECT id FROM candidates WHERE name = 'Layla Ibrahim'), CURRENT_DATE - INTERVAL '1 days', '06:30', '15:30', true, false, true, true, 2),
    ((SELECT id FROM candidates WHERE name = 'Layla Ibrahim'), CURRENT_DATE - INTERVAL '2 days', '06:30', '15:30', true, true, true, false, 4),
    ((SELECT id FROM candidates WHERE name = 'Layla Ibrahim'), CURRENT_DATE - INTERVAL '3 days', '06:30', '15:30', false, true, true, true, 1),
    ((SELECT id FROM candidates WHERE name = 'Layla Ibrahim'), CURRENT_DATE - INTERVAL '4 days', '06:30', '15:30', true, true, true, true, 5),
    ((SELECT id FROM candidates WHERE name = 'Layla Ibrahim'), CURRENT_DATE - INTERVAL '5 days', '06:30', '15:30', true, true, false, true, 2),
    ((SELECT id FROM candidates WHERE name = 'Layla Ibrahim'), CURRENT_DATE - INTERVAL '6 days', '06:30', '15:30', true, true, true, true, 6),
    ((SELECT id FROM candidates WHERE name = 'Layla Ibrahim'), CURRENT_DATE - INTERVAL '7 days', '06:30', '15:30', true, true, true, true, 3),
    ((SELECT id FROM candidates WHERE name = 'Layla Ibrahim'), CURRENT_DATE - INTERVAL '8 days', '06:30', '15:30', true, true, true, true, 4),
    ((SELECT id FROM candidates WHERE name = 'Layla Ibrahim'), CURRENT_DATE - INTERVAL '9 days', '06:30', '15:30', true, true, true, true, 2),
    ((SELECT id FROM candidates WHERE name = 'Layla Ibrahim'), CURRENT_DATE - INTERVAL '10 days', '06:30', '15:30', true, true, true, true, 7),
    ((SELECT id FROM candidates WHERE name = 'Layla Ibrahim'), CURRENT_DATE - INTERVAL '11 days', '06:30', '15:30', true, false, true, true, 3),
    ((SELECT id FROM candidates WHERE name = 'Layla Ibrahim'), CURRENT_DATE - INTERVAL '12 days', '06:30', '15:30', true, true, true, true, 5),
    ((SELECT id FROM candidates WHERE name = 'Layla Ibrahim'), CURRENT_DATE - INTERVAL '13 days', '06:30', '15:30', true, true, true, false, 4),
    ((SELECT id FROM candidates WHERE name = 'Layla Ibrahim'), CURRENT_DATE - INTERVAL '14 days', '06:30', '15:30', true, true, true, true, 6);

    -- Insert Monthly KPIs for both candidates
    INSERT INTO monthly_kpis (candidate_id, month, observations_open, observations_closed, violations, ncrs_open, ncrs_closed, weekly_reports_open, weekly_reports_closed) VALUES
    ((SELECT id FROM candidates WHERE name = 'Youssef Mohammed'), DATE_TRUNC('month', CURRENT_DATE), 8, 22, 3, 2, 5, 0, 4),
    ((SELECT id FROM candidates WHERE name = 'Layla Ibrahim'), DATE_TRUNC('month', CURRENT_DATE), 5, 18, 1, 1, 4, 1, 3);

    -- Insert 2 candidates for Project Beta
    INSERT INTO candidates (project_id, name, photo, role) VALUES
    (project_beta_id, 'Hassan Khalid', 'https://ui-avatars.com/api/?name=Hassan+Khalid&size=150&background=06B6D4&color=fff', 'HSE Engineer'),
    (project_beta_id, 'Mariam Saeed', 'https://ui-avatars.com/api/?name=Mariam+Saeed&size=150&background=EF4444&color=fff', 'Environmental Officer');

    -- Insert 15 days of daily logs for Hassan
    INSERT INTO daily_logs (candidate_id, log_date, time_in, time_out, task_briefing, tbt_conducted, violation_briefing, checklist_submitted, observations_count) VALUES
    ((SELECT id FROM candidates WHERE name = 'Hassan Khalid'), CURRENT_DATE - INTERVAL '0 days', '08:00', '17:00', true, true, true, true, 5),
    ((SELECT id FROM candidates WHERE name = 'Hassan Khalid'), CURRENT_DATE - INTERVAL '1 days', '08:00', '17:00', true, true, true, true, 4),
    ((SELECT id FROM candidates WHERE name = 'Hassan Khalid'), CURRENT_DATE - INTERVAL '2 days', '08:00', '17:00', true, true, true, true, 6),
    ((SELECT id FROM candidates WHERE name = 'Hassan Khalid'), CURRENT_DATE - INTERVAL '3 days', '08:00', '17:00', true, true, false, true, 3),
    ((SELECT id FROM candidates WHERE name = 'Hassan Khalid'), CURRENT_DATE - INTERVAL '4 days', '08:00', '17:00', true, false, true, true, 4),
    ((SELECT id FROM candidates WHERE name = 'Hassan Khalid'), CURRENT_DATE - INTERVAL '5 days', '08:00', '17:00', true, true, true, true, 7),
    ((SELECT id FROM candidates WHERE name = 'Hassan Khalid'), CURRENT_DATE - INTERVAL '6 days', '08:00', '17:00', false, true, true, true, 2),
    ((SELECT id FROM candidates WHERE name = 'Hassan Khalid'), CURRENT_DATE - INTERVAL '7 days', '08:00', '17:00', true, true, true, false, 5),
    ((SELECT id FROM candidates WHERE name = 'Hassan Khalid'), CURRENT_DATE - INTERVAL '8 days', '08:00', '17:00', true, true, true, true, 8),
    ((SELECT id FROM candidates WHERE name = 'Hassan Khalid'), CURRENT_DATE - INTERVAL '9 days', '08:00', '17:00', true, true, true, true, 4),
    ((SELECT id FROM candidates WHERE name = 'Hassan Khalid'), CURRENT_DATE - INTERVAL '10 days', '08:00', '17:00', true, true, true, true, 6),
    ((SELECT id FROM candidates WHERE name = 'Hassan Khalid'), CURRENT_DATE - INTERVAL '11 days', '08:00', '17:00', true, true, true, true, 3),
    ((SELECT id FROM candidates WHERE name = 'Hassan Khalid'), CURRENT_DATE - INTERVAL '12 days', '08:00', '17:00', true, true, true, true, 9),
    ((SELECT id FROM candidates WHERE name = 'Hassan Khalid'), CURRENT_DATE - INTERVAL '13 days', '08:00', '17:00', true, false, true, true, 5),
    ((SELECT id FROM candidates WHERE name = 'Hassan Khalid'), CURRENT_DATE - INTERVAL '14 days', '08:00', '17:00', true, true, true, true, 4);

    -- Insert 15 days of daily logs for Mariam
    INSERT INTO daily_logs (candidate_id, log_date, time_in, time_out, task_briefing, tbt_conducted, violation_briefing, checklist_submitted, observations_count) VALUES
    ((SELECT id FROM candidates WHERE name = 'Mariam Saeed'), CURRENT_DATE - INTERVAL '0 days', '07:30', '16:30', true, true, true, true, 2),
    ((SELECT id FROM candidates WHERE name = 'Mariam Saeed'), CURRENT_DATE - INTERVAL '1 days', '07:30', '16:30', true, true, false, true, 3),
    ((SELECT id FROM candidates WHERE name = 'Mariam Saeed'), CURRENT_DATE - INTERVAL '2 days', '07:30', '16:30', false, true, true, true, 1),
    ((SELECT id FROM candidates WHERE name = 'Mariam Saeed'), CURRENT_DATE - INTERVAL '3 days', '07:30', '16:30', true, true, true, false, 4),
    ((SELECT id FROM candidates WHERE name = 'Mariam Saeed'), CURRENT_DATE - INTERVAL '4 days', '07:30', '16:30', true, false, true, true, 2),
    ((SELECT id FROM candidates WHERE name = 'Mariam Saeed'), CURRENT_DATE - INTERVAL '5 days', '07:30', '16:30', true, true, true, true, 5),
    ((SELECT id FROM candidates WHERE name = 'Mariam Saeed'), CURRENT_DATE - INTERVAL '6 days', '07:30', '16:30', true, true, true, true, 3),
    ((SELECT id FROM candidates WHERE name = 'Mariam Saeed'), CURRENT_DATE - INTERVAL '7 days', '07:30', '16:30', true, true, true, true, 4),
    ((SELECT id FROM candidates WHERE name = 'Mariam Saeed'), CURRENT_DATE - INTERVAL '8 days', '07:30', '16:30', true, true, true, true, 2),
    ((SELECT id FROM candidates WHERE name = 'Mariam Saeed'), CURRENT_DATE - INTERVAL '9 days', '07:30', '16:30', true, true, false, true, 6),
    ((SELECT id FROM candidates WHERE name = 'Mariam Saeed'), CURRENT_DATE - INTERVAL '10 days', '07:30', '16:30', true, true, true, true, 3),
    ((SELECT id FROM candidates WHERE name = 'Mariam Saeed'), CURRENT_DATE - INTERVAL '11 days', '07:30', '16:30', true, true, true, true, 7),
    ((SELECT id FROM candidates WHERE name = 'Mariam Saeed'), CURRENT_DATE - INTERVAL '12 days', '07:30', '16:30', false, true, true, true, 2),
    ((SELECT id FROM candidates WHERE name = 'Mariam Saeed'), CURRENT_DATE - INTERVAL '13 days', '07:30', '16:30', true, true, true, true, 5),
    ((SELECT id FROM candidates WHERE name = 'Mariam Saeed'), CURRENT_DATE - INTERVAL '14 days', '07:30', '16:30', true, true, true, true, 4);

    -- Insert Monthly KPIs for Hassan and Mariam
    INSERT INTO monthly_kpis (candidate_id, month, observations_open, observations_closed, violations, ncrs_open, ncrs_closed, weekly_reports_open, weekly_reports_closed) VALUES
    ((SELECT id FROM candidates WHERE name = 'Hassan Khalid'), DATE_TRUNC('month', CURRENT_DATE), 10, 28, 2, 1, 6, 0, 5),
    ((SELECT id FROM candidates WHERE name = 'Mariam Saeed'), DATE_TRUNC('month', CURRENT_DATE), 6, 20, 1, 2, 4, 1, 4);

    -- Insert 2 candidates for Project Gamma
    INSERT INTO candidates (project_id, name, photo, role) VALUES
    (project_gamma_id, 'Ali Rahman', 'https://ui-avatars.com/api/?name=Ali+Rahman&size=150&background=14B8A6&color=fff', 'Safety Inspector'),
    (project_gamma_id, 'Noor Ahmed', 'https://ui-avatars.com/api/?name=Noor+Ahmed&size=150&background=A855F7&color=fff', 'Site Supervisor');

    -- Insert 15 days of daily logs for Ali
    INSERT INTO daily_logs (candidate_id, log_date, time_in, time_out, task_briefing, tbt_conducted, violation_briefing, checklist_submitted, observations_count) VALUES
    ((SELECT id FROM candidates WHERE name = 'Ali Rahman'), CURRENT_DATE - INTERVAL '0 days', '06:00', '15:00', true, true, true, true, 3),
    ((SELECT id FROM candidates WHERE name = 'Ali Rahman'), CURRENT_DATE - INTERVAL '1 days', '06:00', '15:00', true, true, true, false, 4),
    ((SELECT id FROM candidates WHERE name = 'Ali Rahman'), CURRENT_DATE - INTERVAL '2 days', '06:00', '15:00', true, false, true, true, 2),
    ((SELECT id FROM candidates WHERE name = 'Ali Rahman'), CURRENT_DATE - INTERVAL '3 days', '06:00', '15:00', false, true, true, true, 5),
    ((SELECT id FROM candidates WHERE name = 'Ali Rahman'), CURRENT_DATE - INTERVAL '4 days', '06:00', '15:00', true, true, false, true, 3),
    ((SELECT id FROM candidates WHERE name = 'Ali Rahman'), CURRENT_DATE - INTERVAL '5 days', '06:00', '15:00', true, true, true, true, 6),
    ((SELECT id FROM candidates WHERE name = 'Ali Rahman'), CURRENT_DATE - INTERVAL '6 days', '06:00', '15:00', true, true, true, true, 4),
    ((SELECT id FROM candidates WHERE name = 'Ali Rahman'), CURRENT_DATE - INTERVAL '7 days', '06:00', '15:00', true, true, true, true, 7),
    ((SELECT id FROM candidates WHERE name = 'Ali Rahman'), CURRENT_DATE - INTERVAL '8 days', '06:00', '15:00', true, true, true, true, 3),
    ((SELECT id FROM candidates WHERE name = 'Ali Rahman'), CURRENT_DATE - INTERVAL '9 days', '06:00', '15:00', true, true, true, false, 5),
    ((SELECT id FROM candidates WHERE name = 'Ali Rahman'), CURRENT_DATE - INTERVAL '10 days', '06:00', '15:00', true, false, true, true, 2),
    ((SELECT id FROM candidates WHERE name = 'Ali Rahman'), CURRENT_DATE - INTERVAL '11 days', '06:00', '15:00', true, true, true, true, 8),
    ((SELECT id FROM candidates WHERE name = 'Ali Rahman'), CURRENT_DATE - INTERVAL '12 days', '06:00', '15:00', true, true, true, true, 4),
    ((SELECT id FROM candidates WHERE name = 'Ali Rahman'), CURRENT_DATE - INTERVAL '13 days', '06:00', '15:00', true, true, false, true, 6),
    ((SELECT id FROM candidates WHERE name = 'Ali Rahman'), CURRENT_DATE - INTERVAL '14 days', '06:00', '15:00', true, true, true, true, 5);

    -- Insert 15 days of daily logs for Noor
    INSERT INTO daily_logs (candidate_id, log_date, time_in, time_out, task_briefing, tbt_conducted, violation_briefing, checklist_submitted, observations_count) VALUES
    ((SELECT id FROM candidates WHERE name = 'Noor Ahmed'), CURRENT_DATE - INTERVAL '0 days', '07:00', '16:00', true, true, true, true, 4),
    ((SELECT id FROM candidates WHERE name = 'Noor Ahmed'), CURRENT_DATE - INTERVAL '1 days', '07:00', '16:00', true, true, true, true, 5),
    ((SELECT id FROM candidates WHERE name = 'Noor Ahmed'), CURRENT_DATE - INTERVAL '2 days', '07:00', '16:00', true, true, true, true, 3),
    ((SELECT id FROM candidates WHERE name = 'Noor Ahmed'), CURRENT_DATE - INTERVAL '3 days', '07:00', '16:00', true, false, true, true, 6),
    ((SELECT id FROM candidates WHERE name = 'Noor Ahmed'), CURRENT_DATE - INTERVAL '4 days', '07:00', '16:00', true, true, false, true, 2),
    ((SELECT id FROM candidates WHERE name = 'Noor Ahmed'), CURRENT_DATE - INTERVAL '5 days', '07:00', '16:00', false, true, true, true, 4),
    ((SELECT id FROM candidates WHERE name = 'Noor Ahmed'), CURRENT_DATE - INTERVAL '6 days', '07:00', '16:00', true, true, true, false, 7),
    ((SELECT id FROM candidates WHERE name = 'Noor Ahmed'), CURRENT_DATE - INTERVAL '7 days', '07:00', '16:00', true, true, true, true, 5),
    ((SELECT id FROM candidates WHERE name = 'Noor Ahmed'), CURRENT_DATE - INTERVAL '8 days', '07:00', '16:00', true, true, true, true, 8),
    ((SELECT id FROM candidates WHERE name = 'Noor Ahmed'), CURRENT_DATE - INTERVAL '9 days', '07:00', '16:00', true, true, true, true, 4),
    ((SELECT id FROM candidates WHERE name = 'Noor Ahmed'), CURRENT_DATE - INTERVAL '10 days', '07:00', '16:00', true, true, true, true, 6),
    ((SELECT id FROM candidates WHERE name = 'Noor Ahmed'), CURRENT_DATE - INTERVAL '11 days', '07:00', '16:00', true, true, true, true, 3),
    ((SELECT id FROM candidates WHERE name = 'Noor Ahmed'), CURRENT_DATE - INTERVAL '12 days', '07:00', '16:00', true, false, true, true, 9),
    ((SELECT id FROM candidates WHERE name = 'Noor Ahmed'), CURRENT_DATE - INTERVAL '13 days', '07:00', '16:00', true, true, true, true, 5),
    ((SELECT id FROM candidates WHERE name = 'Noor Ahmed'), CURRENT_DATE - INTERVAL '14 days', '07:00', '16:00', true, true, true, true, 7);

    -- Insert Monthly KPIs for Ali and Noor
    INSERT INTO monthly_kpis (candidate_id, month, observations_open, observations_closed, violations, ncrs_open, ncrs_closed, weekly_reports_open, weekly_reports_closed) VALUES
    ((SELECT id FROM candidates WHERE name = 'Ali Rahman'), DATE_TRUNC('month', CURRENT_DATE), 7, 24, 2, 1, 5, 1, 4),
    ((SELECT id FROM candidates WHERE name = 'Noor Ahmed'), DATE_TRUNC('month', CURRENT_DATE), 9, 30, 1, 0, 7, 0, 5);

END $$;