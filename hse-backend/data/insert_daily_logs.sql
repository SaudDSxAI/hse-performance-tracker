-- Insert sample daily logs for candidates
INSERT INTO daily_logs (candidate_id, log_date, time_in, time_out, task_briefing, tbt_conducted, violation_briefing, checklist_submitted, observations_count) VALUES
-- Candidate 1 logs
(1, CURRENT_DATE, '07:00', '16:00', true, true, true, true, 3),
(1, CURRENT_DATE - INTERVAL '1 day', '07:00', '16:00', true, true, true, true, 2),
(1, CURRENT_DATE - INTERVAL '2 days', '07:00', '16:00', true, false, true, true, 4),

-- Candidate 2 logs
(2, CURRENT_DATE, '06:30', '15:30', true, true, true, true, 2),
(2, CURRENT_DATE - INTERVAL '1 day', '06:30', '15:30', true, true, false, true, 1),

-- Candidate 3 logs
(3, CURRENT_DATE, '07:30', '16:30', true, true, false, true, 1),
(3, CURRENT_DATE - INTERVAL '1 day', '07:30', '16:30', false, true, true, false, 0),

-- Candidate 4 logs
(4, CURRENT_DATE, '08:00', '17:00', true, true, true, true, 5),
(4, CURRENT_DATE - INTERVAL '1 day', '08:00', '17:00', true, true, true, true, 4),

-- Candidate 5 logs
(5, CURRENT_DATE, '06:00', '15:00', true, true, true, true, 2);