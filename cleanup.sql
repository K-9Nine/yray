-- 1. Identify which tenants are smoke tests
-- Run this first to see what you are about to delete
/*
select tenant_key, count(*) 
from exposures_current
group by tenant_key
order by count(*) desc;
*/

-- 2. Delete data for smoke-test tenants
-- (Adjust the like pattern if your smoke test keys look different)
delete from exposures_current
where tenant_key like 'org_smoke_test%';

delete from scan_jobs
where tenant_key like 'org_smoke_test%';

delete from scans
where tenant_key like 'org_smoke_test%';

delete from assets
where tenant_key like 'org_smoke_test%';

-- 3. Add unique constraint to prevent duplicates in future
-- This ensures you can't have two rows for same identity_key within one tenant
alter table exposures_current
add constraint exposures_current_tenant_identity_key_uniq
unique (tenant_key, identity_key);
