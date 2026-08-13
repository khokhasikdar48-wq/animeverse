# Cleanup & retention

A cleanup script exists at backend/src/scripts/cleanupStaging.ts which removes old temporary working directories and HLS outputs. Configure the following env var to control retention:

- STAGING_RETENTION_DAYS (default 7)

You can run the script manually or schedule it as a cron job. In production consider running this from a short-lived container or via a scheduled job in your orchestration platform (ECS/Fargate, Kubernetes CronJob, etc.).
