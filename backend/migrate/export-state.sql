-- psql -XAt -f export-state.sql "$DATABASE_URL" > state.json
\set ON_ERROR_STOP on
select jsonb_build_object(
	'reactions', (
		select coalesce(jsonb_object_agg(post_id, to_jsonb(r) - 'post_id'), '{}')
		from reactions r
	),
	'views', (
		select coalesce(jsonb_object_agg(post_id, total), '{}')
		from (select post_id, count(*) as total from views group by post_id) v
	),
	'visitors', jsonb_build_object('day', '', 'seen', jsonb_build_array()),
	'subscriptions', (
		select coalesce(jsonb_object_agg(endpoint, jsonb_build_object(
			'p256dh', p256dh,
			'auth', auth,
			'expiresAt', to_char(expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
		)), '{}')
		from push_subscriptions
	),
	'notified', (
		select coalesce(jsonb_object_agg(post_id, sent), '{}')
		from new_post_notifications
	),
	'broadcasts', jsonb_build_array()
);
