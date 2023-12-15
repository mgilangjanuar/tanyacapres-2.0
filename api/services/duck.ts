import { SafeSearchType, search } from 'duck-duck-scrape'

export const webSearch = async (q: string) => {
  return await search(q, {
    safeSearch: SafeSearchType.STRICT
  })
}
