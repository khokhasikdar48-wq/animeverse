import fs from 'fs'
import path from 'path'
import axios from 'axios'
import nodemailer from 'nodemailer'

const uploadsDir = path.join(__dirname, '..', '..', 'uploads')

export async function sendWebhookNotification(eventType: 'job:completed'|'job:failed', payload:any){
  const url = process.env.NOTIFY_WEBHOOK_URL
  if(!url) return
  try{
    await axios.post(url, { event: eventType, payload }, { timeout: 5000 })
  }catch(e){ console.warn('Webhook notify failed', e?.message || e) }
}

export async function sendEmailNotification(subject:string, text:string, html?:string){
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = Number(process.env.SMTP_PORT || '587')
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const to = process.env.NOTIFY_EMAIL_TO
  const from = process.env.NOTIFY_EMAIL_FROM || ('no-reply@' + (process.env.FRONTEND_URL?.replace(/https?:\/\//,'') || 'example.local'))

  if(!smtpHost || !smtpUser || !smtpPass || !to) return

  try{
    const transporter = nodemailer.createTransport({ host: smtpHost, port: smtpPort, secure: smtpPort===465, auth:{ user: smtpUser, pass: smtpPass } })
    await transporter.sendMail({ from, to, subject, text, html })
  }catch(e){ console.warn('Email notify failed', e?.message || e) }
}

export function writeJobLog(jobId:string, content:string){
  try{
    const logsDir = path.join(uploadsDir, 'logs')
    fs.mkdirSync(logsDir, { recursive:true })
    const file = path.join(logsDir, `${jobId}.log`)
    fs.appendFileSync(file, content + '\n')
  }catch(e){ console.warn('Failed to write job log', e) }
}

export function readJobLog(jobId:string){
  try{
    const file = path.join(uploadsDir, 'logs', `${jobId}.log`)
    if(!fs.existsSync(file)) return null
    return fs.readFileSync(file,'utf8')
  }catch(e){ console.warn('Failed to read job log', e); return null }
}
