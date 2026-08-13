import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'

import authRoutes from './routes/auth'
import animeRoutes from './routes/anime'
import episodeRoutes from './routes/episodes'
import adminRoutes from './routes/admin'
import watchlistRoutes from './routes/watchlist'
import searchRoutes from './routes/search'

const app = express()
app.use(helmet())
app.use(cors({origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true}))
app.use(cookieParser())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/anime', animeRoutes)
app.use('/api/episodes', episodeRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/me/watchlist', watchlistRoutes)
app.use('/api/search', searchRoutes)

app.get('/api/health', (req,res)=> res.json({ok:true}))

export default app
