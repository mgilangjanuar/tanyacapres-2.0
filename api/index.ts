import { http } from '@/lib/http'

const server = http(
  'routes', Number(process.env.PORT))

console.log(`Listening on localhost:${server.port}`)
