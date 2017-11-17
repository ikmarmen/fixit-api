const mongoose = require('mongoose');

const locationSchema = mongoose.Schema({
    zip: {
        type: String,
        unique: true,
        required: [true, 'Zip is required']
    },

    city: {
        type: String,
        required: [true, 'City is required']
    },

    state: {
        type: String,
        required: [true, 'State is required'],
    },

    country: {
        type: String,
        required: [true, 'Country is required'],
    },
    location:{
        type: [Number], // [<longitude>, <latitude>]
        index: '2d',
        required: [true, 'Location is required'],
    },
}, { usePushEach: true });

module.exports = mongoose.model('Location', locationSchema, 'locations'); 