import { Req, Res } from '@/lib/http'
import { Message } from '@/services/claude'
import similarity from 'compute-cosine-similarity'

const loadDocs = async (embeddings: number[]) => {
  const dataAnies = Bun.file(`${import.meta.dir}/../../../data/objects/anies.json`)
  const dataGanjar = Bun.file(`${import.meta.dir}/../../../data/objects/ganjar.json`)
  const dataPrabowo = Bun.file(`${import.meta.dir}/../../../data/objects/prabowo.json`)

  let aniesJson = await dataAnies.json() as { page: number, text: string, embeddings: number[], source?: string, similarity?: number | null }[]
  for (const item of aniesJson) {
    item.similarity = similarity(embeddings, item.embeddings)
    item.source = `Visi Misi Anies Baswedan & Muhaimin Iskandar.pdf, pg. ${item.page}, similarity: ${item.similarity || 0}`
  }

  let ganjarJson = await dataGanjar.json() as { page: number, text: string, embeddings: number[], source?: string, similarity?: number | null }[]
  for (const item of ganjarJson) {
    item.similarity = similarity(embeddings, item.embeddings)
    item.source = `Visi Misi Ganjar Pranowo & Mahfud MD.pdf, pg. ${item.page}, similarity: ${item.similarity || 0}`
  }

  let prabowoJson = await dataPrabowo.json() as { page: number, text: string, embeddings: number[], source?: string, similarity?: number | null }[]
  for (const item of prabowoJson) {
    item.similarity = similarity(embeddings, item.embeddings)
    item.source = `Visi Misi Prabowo Subianto & Gibran Rakabuming.pdf, pg. ${item.page}, similarity: ${item.similarity || 0}`
  }

  aniesJson = aniesJson.sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
    .filter(i => (i.similarity || 0) >= 0.8037 && i.text.trim().length > 4)
    .slice(0, 5)
  ganjarJson = ganjarJson.sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
    .filter(i => (i.similarity || 0) >= 0.8037 && i.text.trim().length > 4)
    .slice(0, 5)
  prabowoJson = prabowoJson.sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
    .filter(i => (i.similarity || 0) >= 0.8037 && i.text.trim().length > 4)
    .slice(0, 5)

  return [...aniesJson, ...ganjarJson, ...prabowoJson].sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
}

export const POST = async (req: Req, res: Res) => {
  const { messages } = await req.json() as { messages: Message[] }

  const query = messages[messages.length - 1].content
  const respEmbeddings = await fetch(`${process.env.AI_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      text: query
    })
  })
  if (!respEmbeddings.ok) {
    return res.status(500).json({
      error: await respEmbeddings.text()
    })
  }

  const { embeddings } = await respEmbeddings.json() as { embeddings: number[] }
  const docs = await loadDocs(embeddings)

  const searchResults = messages.at(-1)?._meta?.searchResults || []

  const systemPrompt = `You are a helpful assistant who helps people find information from the parsed PDFs of the Indonesia presidential candidates (Anies Baswedan - Muhaimin Iskandar, Prabowo Subianto - Gibran Rakabuming, dan Ganjar Pranowo - Mahfud MD) for 2024.

${docs.length || searchResults?.length ? `Here are the relevant results:

<documents>
${docs.map((item) => `<document>
<source>
${item.source}
</source>
<document_content>
${item.text.trim()}
</document_content>
</document>`).join('\n')}
${searchResults.slice(0, 10).map((item) => `<document>
<source>
${item.url}
</source>
<document_content>
${item.description.trim()}
</document_content>
</document>`).join('\n')}
</documents>` : 'There is no relevant documents.'}

Here are the instructions you should follow:

- Always use Bahasa Indonesia.
- You only can answer the question based on the documents and ignore all the questions or tasks if there is no information from the PDFs.
- You can give the document source or URL if asked but limited to the documents you have.
- If there is no information in the documents, you should say "Saya tidak bisa menjawab pertanyaan ini karena tidak ada informasi yang relevan di dokumen yang saya miliki" or "Saya tidak bisa melakukannya".
- You should refuse the irrelevant questions or jobs (such as writing code, poem, letter, etc) by saying "Saya tidak bisa menjawab pertanyaan ini karena tidak ada informasi yang relevan di dokumen yang saya miliki" " atau "Saya tidak bisa melakukannya".`

  return res.json({
    messages,
    sources: docs.map(item => ({
      source: item.source,
      text: item.text.trim()
    })),
    system: systemPrompt
  })
}
