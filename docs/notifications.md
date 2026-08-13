# Notifications

This project supports optional webhook and email notifications when transcode jobs complete or fail. Configure the following environment variables in your deployment environment to enable notifications:

- NOTIFY_WEBHOOK_URL — a URL to POST job events to. The server will POST JSON like { event: 'job:completed', payload: {...} }.
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS — SMTP connection to send email notifications.
- NOTIFY_EMAIL_FROM, NOTIFY_EMAIL_TO — sender and recipient addresses for email notifications.

The worker will automatically send a webhook and an email (if SMTP and recipient are configured) on job success and failure.
