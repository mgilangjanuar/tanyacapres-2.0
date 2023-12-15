import { Req, Res } from '@/lib/http'
import { webSearch } from '@/services/duck'

export const POST = async (req: Req, res: Res) => {
  const { query } = await req.json() as {
    query: string
  }

  const results = await webSearch(query)
  return res.json({
    results
  })
}
