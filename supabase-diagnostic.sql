-- ============================================================================
-- DIAGNOSTIC: Find the created_at error
-- ============================================================================

-- 1. Check if created_at exists in financial_ledger
SELECT 'financial_ledger columns:' AS check_1;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'financial_ledger'
ORDER BY ordinal_position;

-- 2. Check if creator_timeline_events view exists and its definition
SELECT 'creator_timeline_events view:' AS check_2;
SELECT pg_get_viewdef('creator_timeline_events'::regclass, true);

-- 3. Try to query the view directly
SELECT 'Testing view query:' AS check_3;
SELECT * FROM creator_timeline_events LIMIT 1;

-- 4. Try to query financial_ledger directly with created_at
SELECT 'Testing financial_ledger query:' AS check_4;
SELECT id, created_at FROM financial_ledger LIMIT 1;

-- 5. Check all views that might reference created_at
SELECT 'Views referencing financial_ledger:' AS check_5;
SELECT viewname, definition
FROM pg_views
WHERE schemaname = 'public'
AND definition LIKE '%financial_ledger%';

-- 6. Check the get_creator_dashboard function
SELECT 'get_creator_dashboard function:' AS check_6;
SELECT prosrc
FROM pg_proc
WHERE proname = 'get_creator_dashboard';
