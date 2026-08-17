-- The legacy conversation identity was created as a unique index, not a
-- table constraint. The page-routing migration attempted to drop it as a
-- constraint, so PostgreSQL kept both identities and rejected the same
-- contact when it arrived from another connected Page.
DROP INDEX IF EXISTS "conversations_tenant_id_contact_number_channel_type_key";
