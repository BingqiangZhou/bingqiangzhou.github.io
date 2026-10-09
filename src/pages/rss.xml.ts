import type { APIRoute } from 'astro'
import { generateRSS } from '@/utils/feed'

export const GET: APIRoute = async () => generateRSS()
