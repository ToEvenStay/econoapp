// server.js
const { createServer } = require('http')
const next = require('next')

const port = parseInt(process.env.PORT, 10) || 3000
const app = next({ dev: false })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port, err => {
    if (err) throw err
    console.log(`> Next.js ready on http://localhost:${port}`)
  })
})
