// https://www.moex.com/ru/derivatives/open-positions-csv.aspx?d=20220125&t=1
const https = require('https')
const csv = require('csv-parser')
const moment = require('moment')
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.connect("mongodb://localhost:27017/moexdb", { useUnifiedTopology: true, useNewUrlParser: true });

const derivativeSchema = new Schema({
    moment: Date,
    isin: String,
    name: String,
    contract_type: String,
    iz_fiz: Boolean,
    clients_in_long: Number,
    clients_in_short: Number,
    short_position: Number,
    long_position: Number,
    change_prev_week_short_abs: Number,
    change_prev_week_long_abs: Number,
    change_prev_week_short_perc: Number,
    change_prev_week_long_perc: Number,
}, { strict: false });
const derivative = mongoose.model("derivatives", derivativeSchema);

const parseFloatOrReturnNull = (strNum) => parseFloat(strNum) || null

function derivativesMapper(rawDerivative) {
    return {
        moment: moment(rawDerivative['moment']).add(3, 'hours').toISOString(),
        isin: rawDerivative.isin,
        name: rawDerivative.name,
        contract_type: rawDerivative.contract_type,
        iz_fiz: !!rawDerivative.iz_fiz,
        clients_in_long: parseFloatOrReturnNull(rawDerivative.clients_in_long),
        clients_in_short: parseFloatOrReturnNull(rawDerivative.clients_in_short),
        short_position: parseFloatOrReturnNull(rawDerivative.short_position),
        long_position: parseFloatOrReturnNull(rawDerivative.long_position),
        change_prev_week_short_abs: parseFloatOrReturnNull(rawDerivative.change_prev_week_short_abs),
        change_prev_week_long_abs: parseFloatOrReturnNull(rawDerivative.change_prev_week_long_abs),
        change_prev_week_short_perc: parseFloatOrReturnNull(rawDerivative.change_prev_week_short_perc),
        change_prev_week_long_perc: parseFloatOrReturnNull(rawDerivative.change_prev_week_long_perc),
    }
}

async function main() {
    const daysArr = dataArrayGenerator(365) //todo index by dates
    console.log(1)
    for (const day of daysArr) {
        console.log(2, day)
        const data = await getDataByDay(day)
        if (!data.length) continue
        const formated = data.map(derivativesMapper)

        await derivative.create(formated)
    }
}

function dataArrayGenerator(range) {
    const daysArr = []
    console.log(range)
    for (let i = 0; i < range; i++) {
        daysArr.push(moment().subtract(i, 'd').format('YYYYMMDD'))
    }
    return daysArr
}

async function getDataByDay(day) {
    return new Promise((resolve, reject) => {
        const results = [];
        const url = `https://www.moex.com/ru/derivatives/open-positions-csv.aspx?d=${day}&t=1`
        console.log(url)
        https.get(url, function (res) {
            res.pipe(csv({
                mapHeaders: ({ header, index }) => {
                    if (index === 0) {
                        return 'date' //moment in wrong encoding or idk
                    }
                    return header.toLowerCase()
                }
            }))
                .on('data', (data) => results.push(data))
                .on('end', () => {
                    resolve(results)
                })
                .on('error', (e) => { reject(e) })
        });
    })
}

main()