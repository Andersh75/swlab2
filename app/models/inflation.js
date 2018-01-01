var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var InflationSchema = new Schema({
    id:  { type: Number, index: true },
    rate: { type: Number, index: true }
});
module.exports = mongoose.model('Inflation', InflationSchema);