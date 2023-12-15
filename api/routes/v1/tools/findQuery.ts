import { Req, Res } from '@/lib/http'
import { Message, nonStreamCompletion } from '@/services/claude'

export const POST = async (req: Req, res: Res) => {
  const { messages } = await req.json() as {
    messages: Message[]
  }

  if (!messages.length) {
    return res.status(400).json({
      error: 'messages is empty'
    })
  }

  const { text } = await nonStreamCompletion([
    {
      role: 'Human',
      content: `Here is the conversation between a human and an assistant. Please read carefully and only focus on the last chat from a human and use the previous chats as your context. But don't need to answer it.

<chats>
${messages.map(({ role, content, _meta }) => `<chat role="${role.toLowerCase()}">
<content>${content}</content>
${_meta?.searchResults?.length ? `<searchResults>
${_meta.searchResults.slice(0, 10).map(({ title, description }) => `<result>
<title>${title}</title>
<description>${description}</description>
</result>`).join('\n')}
</searchResults>`: ''}
</chat>`).join('\n')}
</chats>

Give me the JSON object of the relevant query from the last chat content without any reasonings and explanations`
    }
  ], `You are a helpful search engine assistant who gives the relevant query from the last chat content as a follow-up action that will help the user find the relevant information from the internet about the Indonesia presidential candidates (Anies Baswedan - Muhaimin Iskandar, Prabowo Subianto - Gibran Rakabuming, dan Ganjar Pranowo - Mahfud MD) for 2024.

You only can give a JSON object without any tags and you should respond with the following format without any reasonings and explanations:

---
{
  "query": "the relevant query from the last chat content"
}
---

You should always use Bahasa Indonesia and maybe need to append the Presidential Election 2024 or the candidate's profile as a context to the query if it's relevant.

You can give the empty string ("") if the last chat doesn't need a follow-up or not in the context of the policy, current news, the candidate's profile (such as track record, personal thing, etc), the general election, seeking about the solution, follow-up question, etc.`)

  console.log(text)
  const queryText = text.startsWith('{"error":{') ? '' : text.trim()
    ?.replace(/^<code>|<\/code>/gi, '')
    ?.trim().replace(/^"|"$/g, '')?.trim().split('\n\n').find((item: string) => item.startsWith('{\n'))

  try {
    const { query } = JSON.parse(queryText)
    return res.json({
      query
    })
  } catch (error) {
    return res.json({
      query: ''
    })
  }
}
