-- Profile suggestions via Brave Search are gone (the People tab now builds
-- LinkedIn search links in the browser); drop the cached results.
ALTER TABLE applications DROP COLUMN suggested_profiles;
ALTER TABLE applications DROP COLUMN suggested_profiles_updated_at;
