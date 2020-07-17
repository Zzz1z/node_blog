const http = require('http')
const serveHandle = require('../app')
const PORT = 8080

const serve = http.createServer(serveHandle)

serve.listen(PORT)