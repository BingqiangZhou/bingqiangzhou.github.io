import type { APIRoute } from 'astro'
import { generateAtom } from '@/utils/feed'

export const GET: APIRoute = async () => generateAtom()
