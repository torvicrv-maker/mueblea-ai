# DATA MODEL — borrador P1

Entidades previstas:

- organizations
- users / memberships
- customers
- projects
- rooms
- furniture
- furniture_versions
- modules
- parts
- materials
- boards
- edge_bands
- hardware
- cut_lists
- nesting_jobs
- price_lists
- quotes
- ai_sessions
- ai_actions
- audit_log

## Identidad
`project_id → furniture_id → furniture_version_id → module_id → part_id`

Nunca se usará el nombre visible de una pieza como clave de relación.
