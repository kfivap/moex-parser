
import { createDerivativeData } from './src/parser'
import { createTradeData } from './src/parser-trade-results'
import { server } from './src/api/app'


(async () => {
    await createDerivativeData()
    await createTradeData()
})();

server.listen(5000, async () => { console.log('listen on http://localhost:5000') })