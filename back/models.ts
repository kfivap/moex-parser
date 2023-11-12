import mongoose from 'mongoose'
const Schema = mongoose.Schema;

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

derivativeSchema.index(
    { date: 1, isin: 1, iz_fiz: 1, contract_type: 1 },
    { unique: true }
)
export const DerivativeModel = mongoose.model("derivatives", derivativeSchema);