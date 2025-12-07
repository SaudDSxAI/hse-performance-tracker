-- Insert monthly KPIs for candidates
INSERT INTO monthly_kpis (candidate_id, month, observations_open, observations_closed, violations, ncrs_open, ncrs_closed, weekly_reports_open, weekly_reports_closed) VALUES
(1, DATE_TRUNC('month', CURRENT_DATE), 5, 12, 2, 1, 3, 0, 4),
(2, DATE_TRUNC('month', CURRENT_DATE), 3, 8, 1, 0, 2, 1, 3),
(3, DATE_TRUNC('month', CURRENT_DATE), 2, 5, 0, 0, 1, 0, 2),
(4, DATE_TRUNC('month', CURRENT_DATE), 8, 18, 1, 2, 4, 0, 5),
(5, DATE_TRUNC('month', CURRENT_DATE), 4, 9, 2, 1, 2, 1, 3),
(6, DATE_TRUNC('month', CURRENT_DATE), 6, 11, 1, 1, 3, 0, 4),
(7, DATE_TRUNC('month', CURRENT_DATE), 1, 3, 3, 1, 1, 2, 2),
(8, DATE_TRUNC('month', CURRENT_DATE), 10, 22, 0, 0, 6, 0, 5),
(9, DATE_TRUNC('month', CURRENT_DATE), 7, 15, 3, 2, 5, 0, 4),
(10, DATE_TRUNC('month', CURRENT_DATE), 4, 10, 2, 1, 3, 1, 3);