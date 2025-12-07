-- Insert monthly activities for projects
INSERT INTO monthly_activities (project_id, month, mock_drill, campaign_type, campaign_completed, inspection_power_tools, inspection_plant_equipment, inspection_tools_accessories, near_miss_recorded) VALUES
(1, DATE_TRUNC('month', CURRENT_DATE), true, 'safety', true, true, true, false, true),
(2, DATE_TRUNC('month', CURRENT_DATE), true, 'environmental', true, true, false, true, false),
(3, DATE_TRUNC('month', CURRENT_DATE), false, 'safety', false, true, true, true, true),
(4, DATE_TRUNC('month', CURRENT_DATE), true, 'environmental', true, false, true, true, false),
(5, DATE_TRUNC('month', CURRENT_DATE), true, 'safety', true, true, true, true, true),
(6, DATE_TRUNC('month', CURRENT_DATE), false, NULL, false, true, false, false, false),
(7, DATE_TRUNC('month', CURRENT_DATE), true, 'safety', true, true, true, false, true),
(8, DATE_TRUNC('month', CURRENT_DATE), true, 'environmental', true, true, true, true, false),
(9, DATE_TRUNC('month', CURRENT_DATE), false, 'safety', false, false, true, true, true),
(10, DATE_TRUNC('month', CURRENT_DATE), true, 'environmental', true, true, false, true, true);