const express = require('express')
const cors = require('cors')
const app = express()
const mongoose = require("mongoose");
const { DerivativeModel } = require('./models')

mongoose.connect("mongodb://localhost:27017/moexdb", { useUnifiedTopology: true, useNewUrlParser: true });

app.use(cors())
app.use(express.json())

app.get('/derivatives', async (req, res) => {
    const { isin } = req.query
    if (!isin) return res.sendStatus(400)
    const derivatives = await DerivativeModel.find({ isin }).limit(100)
    return res.json(derivatives)
})
app.get('/isin', async (req, res) => {
    const isiList = await DerivativeModel.distinct('isin')
    return res.json(isiList)
})

app.use((req, res) => {
    res.sendStatus(404)
})

app.listen(5000, () => { console.log('http://localhost:5000') })