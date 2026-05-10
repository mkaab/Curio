import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('*', cors())

app.get('/', (c) => {
  return c.json({
    message: 'Welcome to Curio API',
    status: 'healthy',
    version: '1.0.0'
  })
})

const port = 3001
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
