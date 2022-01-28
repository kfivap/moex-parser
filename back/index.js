const express = require('express')
const cors = require('cors')
const app = express()
const mongoose = require("mongoose");
const { DerivativeModel } = require('./models')

mongoose.connect("mongodb://localhost:27017/moexdb", { useUnifiedTopology: true, useNewUrlParser: true });

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
        isin, contract_type: 'F'
    }
    const limit = 10
    const [fizDerivatives, nonFizDerivatives] = await Promise.all([
        DerivativeModel.find({ ...query, iz_fiz: true }).limit(limit).sort({ date: 1 }),
        DerivativeModel.find({ ...query, iz_fiz: false }).limit(limit).sort({ date: 1 })
    ])
    return res.json({ fizDerivatives, nonFizDerivatives })
})
app.get('/isin', async (req, res) => {
    const isinList = await DerivativeModel.aggregate([
        {
            $group: {
                "_id": "$isin",
                name: {
                    $first: "$name"
                }
            }
        }, {
            $addFields: {
                isin: "$_id"
            }
        }, {
            $project: {
                _id: 0
            }
        }, {
            $sort: { "isin": 1 }
        }
    ])
    console.log(isinList)
    return res.json(isinList)
})

app.use((req, res) => {
    res.sendStatus(404)
})

app.listen(5000, () => { console.log('http://localhost:5000') })