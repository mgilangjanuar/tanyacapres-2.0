import { createParser, ParsedEvent, ReconnectInterval } from 'eventsource-parser'


export const config = {
  runtime: 'edge'
}

export default async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(
      null,
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
          'Access-Control-Allow-Credentials': 'true'
        }
      }
    )
  }

  const { messages, system } = await req.json() as {
    messages: { role: string, content: string }[],
    system: string
  }
  if (!messages?.length) return new Response(JSON.stringify({
    error: 'Missing messages'
  }), { status: 400 })

  let text = system ? `${system}\n\n` : ''
  for (const message of messages) {
    text += `${message.role}: ${message.content.trim()}\n\n`
  }
  text += 'Assistant:'

  const resp = await fetch('https://api.anthropic.com/v1/complete', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': process.env.ANTHROPIC_API_KEY as string
    },
    body: JSON.stringify({
      model: 'claude-2.1',
      temperature: 0.05,
      max_tokens_to_sample: 2048,
      stream: true,
      prompt: text
    })
  })

  if (!resp.ok) {
    const text = await resp.text()
    return new Response(text)
  }

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const customReadable = new ReadableStream({
    async start(controller) {
      function onParse(event: ParsedEvent | ReconnectInterval) {
        if (event.type === 'event') {
          const data = event.data
          controller.enqueue(encoder.encode(data))
        }
      }
      const parser = createParser(onParse)
      for await (const chunk of resp.body as unknown as AsyncIterable<Uint8Array>) {
        parser.feed(decoder.decode(chunk))
      }
    },
  })
  const transformStream = new TransformStream({
    async transform(chunk, controller) {
      const content = decoder.decode(chunk)
      try {
        const json = JSON.parse(content.trim())
        if (json.completion) {
          controller.enqueue(encoder.encode(json.completion))
        }
        if (json.stop_reason) {
          controller.terminate()
          return
        }
      } catch (error) {
        // ignore
      }
    },
  })
  return new Response(customReadable.pipeThrough(transformStream))
}
