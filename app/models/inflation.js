var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var InflationSchema = new Schema({
    percentage: { type: Number, index: true }
});
module.exports = mongoose.model('Inflation', InflationSchema);