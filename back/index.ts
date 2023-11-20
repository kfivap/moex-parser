
import { createDbData } from './src/parser'
import { server } from './src/api/app'

createDbData()

server.listen(5000, async () => { console.log('listen on http://localhost:5000') })