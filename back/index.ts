import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
const app = express()
import { createDbData } from './parser'
import { DerivativeModel, MatchDerivativeModel } from './models'
import { contractTypes } from './constants'
mongoose.connect(`mongodb://${process.env.MONGO_URI || 'localhost:27017'}/moexdb`, {});
createDbData()

app.use(cors())
app.use(express.json())

app.use((req, res, next) => {
    console.log(req.originalUrl)
    next()
})

app.get('/derivatives', async (req, res) => {
    const { isin } = req.query
    if (!isin) return res.sendStatus(400)
    const query = {
        isin, contract_type: contractTypes.futures
    }
    const limit = Number(req.query.limit) || 30

    const [fizDerivatives, legalDerivatives, matchData] = await Promise.all([
        DerivativeModel.find({ ...query, iz_fiz: true }).limit(limit).sort({ date: -1 }),
        DerivativeModel.find({ ...query, iz_fiz: false }).limit(limit).sort({ date: -1 }),
        MatchDerivativeModel.find({ ...query }).limit(limit).sort({ date: -1 })
    ])

    return res.json({ fizDerivatives, legalDerivatives, matchData })
})


app.get('/isin', async (req, res) => {
    const isinList = await DerivativeModel.aggregate([
        {
            $match: {
                contract_type: contractTypes.futures
            }
        },
        {
            $sort: { date: -1 }
        },
        {
            "$group": {
                "_id": {
                    "isin": "$isin",
                    "iz_fiz": "$iz_fiz"
                },
                "short_position": {
                    '$first': '$short_position'
                },
                "long_position": {
                    '$first': '$long_position'
                },
            }
        },
        {
            "$group": {
                "_id": "$_id.isin",
                "data": {
                    "$push": {
                        "iz_fiz": "$_id.iz_fiz",
                        "short_position": "$short_position",
                        "long_position": "$long_position",
                        "total_positions": {
                            '$sum': ['$long_position', '$short_position']
                        }
                    },
                },
            }
        },
        { "$sort": { "data.total_positions": -1 } },
        {
            $addFields: {
                isin: "$_id",
                meta: {
                    "$reduce": {
                        input: "$data.total_positions",
                        initialValue: { totalPositions: 0 },
                        in: {
                            totalPositions: { $add: ["$$value.totalPositions", "$$this"] },
                        }
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                data: 0
            }
        }
    ])
    return res.json(isinList)
})

app.use((req, res) => {
    res.sendStatus(404)
})

app.listen(5000, async () => { console.log('listen on http://localhost:5000') })