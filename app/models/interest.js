var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var InterestSchema = new Schema({
    id:  { type: Number, index: true },
    rate: { type: Number, index: true }
});
module.exports = mongoose.model('Interest', InterestSchema);