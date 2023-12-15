type SearchResult = {
  title: string,
  description: string,
  rawDescription: string,
  hostname: string,
  icon: string,
  url: string
}

export type Message = {
  role: 'Human' | 'Assistant',
  content: string,
  _meta?: { searchResults?: SearchResult[] }
}

export const completion = async (messages: Message[], system?: string) => {
  let text = system ? `${system}\n\n` : ''
  for (const message of messages) {
    text += `${message.role}: ${message.content}\n\n`
  }
  text += 'Assistant:'

  const abort = new AbortController()
  const resp = await fetch('https://api.anthropic.com/v1/complete', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': process.env.ANTHROPIC_API_KEY as string
    },
    body: JSON.stringify({
      model: 'claude-2.1',
      max_tokens_to_sample: 2048,
      temperature: 0.05,
      stream: true,
      prompt: text
    }),
    signal: abort.signal
  })

  if (!resp.ok) {
    const text = await resp.text()
    return {
      stream: new ReadableStream<string>({
        start(controller) {
          controller.enqueue(text)
          controller.close()
        }
      }),
      abort
    }
  }

  return {
    stream: new ReadableStream<string>({
      async start(controller) {
        if (!resp.body) return controller.close()

        const reader = resp.body.getReader()
        const decoder = new TextDecoder()

        let isFinished = false
        let index = 0

        while(!isFinished) {
          const { value, done } = await reader.read()
          isFinished = done

          const decoded = decoder.decode(value)
          if (!decoded) break

          for (const chunk of decoded.split('\n')) {
            if (chunk?.trim()) {
              const data = chunk.trim().split(/^data: /)?.[1]?.trim()
              if (data) {
                try {
                  const json = JSON.parse(data)
                  if (json.completion) {
                    controller.enqueue(index === 0 ? json.completion.trim() : json.completion)
                    index++
                  }
                } catch (error) {
                  // ignore
                }
              }
            }
          }
        }
        controller.close()
      }
    }),
    abort
  }
}

export const nonStreamCompletion = async (messages: Message[], system?: string) => {
  let text = system ? `${system}\n\n` : ''
  for (const message of messages) {
    text += `${message.role}: ${message.content}\n\n`
  }
  text += 'Assistant:'

  const abort = new AbortController()
  const resp = await fetch('https://api.anthropic.com/v1/complete', {
    method: 'POST',
    verbose: true,
    headers: {
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': process.env.ANTHROPIC_API_KEY as string
    },
    body: JSON.stringify({
      model: 'claude-2.1',
      temperature: 0.05,
      max_tokens_to_sample: 2048,
      prompt: text
    }),
    signal: abort.signal
  })

  if (!resp.ok) {
    const text = await resp.text()
    return {
      text,
      abort
    }
  }

  const json = await resp.json()
  return {
    text: json.completion?.trim(),
    abort
  }
}
