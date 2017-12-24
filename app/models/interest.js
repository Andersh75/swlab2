var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var InterestSchema = new Schema({
    percentage: { type: Number, index: true }
});
module.exports = mongoose.model('Interest', InterestSchema);