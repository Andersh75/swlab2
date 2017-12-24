var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var BlogSchema = new Schema({
    id:  { type: Number, index: true },
    title:  String,
    author: { type: String, index: true },
    body:   String,
    comments: [{ body: String, date: Date }],
    date: { type: Date, default: Date.now },
    hidden: Boolean,
    meta: {
      votes: Number,
      favs:  Number
    }
});
module.exports = mongoose.model('Blog', BlogSchema);