export type Req = Request & {
  params?: Record<string, string>, query?: Record<string, string>
}

export class Res {
  private options: ResponseInit = {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Meta',
      'Access-Control-Allow-Credentials': 'true'
    }
  }
  constructor() {}

  status(status: number) {
    this.options.status = status
    return this
  }

  headers(headers: Record<string, string>) {
    this.options.headers = {
      ...this.options.headers || {},
      ...headers
    }
    return this
  }

  send(data: ReadableStream<any> | BlobPart | BlobPart[] | FormData | URLSearchParams | null | undefined) {
    return new Response(data, this.options)
  }

  json(data: any) {
    return this.headers({
      'content-type': 'application/json'
    }).send(
      JSON.stringify(data)
    )
  }
}

export const http = (dir: string, port: number = 4001) => {
  const router = new Bun.FileSystemRouter({
    style: 'nextjs',
    dir
  })

  const server = Bun.serve({
    port,
    async fetch(request: Req) {
      if (request.method === 'OPTIONS') {
        return new Res().send('departed')
      }

      const match = router.match(request)
      if (match) {
        request.params = match.params
        request.query = match.query
        const handler = await import(match.filePath)
        if (handler[request.method]) {
          if (Array.isArray(handler[request.method])) {
            for (const middleware of handler[request.method]) {
              const response = await middleware(request, new Res())
              if (response instanceof Response) return response
            }
          } else {
            return await handler[request.method](request, new Res())
          }
        }
      }

      return new Res().status(404).json({
        error: 'Not Found'
      })
    },
    error: (error: Error) => {
      console.error(error)
      return new Res().status(500).json({
        error: error.message,
        details: error.stack
      })
    }
  })

  return server
}
