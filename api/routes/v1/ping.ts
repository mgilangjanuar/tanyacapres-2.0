import { Req, Res } from '@/lib/http'

export const GET = (_: Req, res: Res) => res.json({ pong: true })
