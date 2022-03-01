// https://www.moex.com/ru/derivatives/open-positions-csv.aspx?d=20220125&t=1
const https = require('https')
const csv = require('csv-parser')
const moment = require('moment')
const mongoose = require("mongoose");
const { DerivativeModel } = require('./models');
const { resolve } = require('path');
mongoose.connect("mongodb://localhost:27017/moexdb", { useUnifiedTopology: true, useNewUrlParser: true });

const CSV_DOCUMENT_DATE_FORMAT = 'YYYYMMDD'

const parseFloatOrReturnNull = (strNum) => parseFloat(strNum) || null

function derivativesMapper(rawDerivative) {
    return {
        date: moment(rawDerivative['date']).add(3, 'hours').toISOString(),
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

async function main(callback) {
    const daysArr = await dataArrayGenerator(365)
    for (const day of daysArr) {
        const data = await getDataByDay(day)
        if (!data.length) continue
        const formatted = data.map(derivativesMapper)
        // console.log(data, formatted)
        for (const row of formatted) {

            await DerivativeModel.updateOne({
                date: row.date,
                isin: row.isin,
                iz_fiz: row.iz_fiz,
                contract_type: row.contract_type
            }, row, { upsert: true }) //todo unique
        }
    }

    if (callback) callback()
}

async function dataArrayGenerator(range) {
    const daysArr = []
    console.log(range)
    for (let i = 0; i < range; i++) {
        const date = moment().subtract(i, 'd')
            .set("hour", 0)
            .set("minute", 0)
            .set("second", 0)
            .set("millisecond", 0)
            .utc(true)
            .toISOString()
        const docsExist = await DerivativeModel.findOne({ date: date })
        if (docsExist) break
        daysArr.push(moment(date).utc(true).format(CSV_DOCUMENT_DATE_FORMAT))
    }
    return daysArr
}

async function getDataByDay(day) {
    try {
        const fetchDataPromise = new Promise((resolve, reject) => {
            const results = [];
            const url = `https://www.moex.com/ru/derivatives/open-positions-csv.aspx?d=${day}&t=1`
            console.log(url)
            try {

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
            } catch (e) {
                reject(e)
            }
        })
        const timeoutPromise = new Promise((resolve, reject) => { setTimeout(reject, 10000) })
        return await Promise.race([fetchDataPromise, timeoutPromise])
    } catch (e) {
        return getDataByDay(day)
    }
}

if (require.main === module) {
    console.log('script is main, exit after done')
    main(() => { process.exit(0) });
} else {
    console.log('script is module, no exit')
    main()
}