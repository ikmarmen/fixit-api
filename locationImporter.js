const csv = require('fast-csv');
const Location = require('./models/location');
const config = require('./config');

const importLocations = function () {
    Location.find({}).sort('zip').limit(1).exec(function (err, locations) {
        if (locations && locations.length > 0) {
            console.log("Location DB exist in current environment.");
        } else {
            console.log("Location DB doesn't exist in current environment. Starting location DB import from csv file...");

            let csvHeaders = ['zip', 'city', 'state', 'country', 'latitude', 'longitude']
            let csvPath = __dirname + config.locationsCsvPath;
            importFile(csvPath, csvHeaders)
        }
    });
}

const importFile = function (filePath, fileHeaders) {
    console.log("Location DB import started.");

    csv.fromPath(filePath, { headers: true })
        .on('data', function (data) {
            let locationRow = { location:[] };
            Object.keys(data).forEach(function (key) {
                if (key === 'longitude') {
                    locationRow.location[0] = data[key];
                } else if (key === 'latitude') {
                   locationRow.location[1] = data[key];
                } else {
                     locationRow[key] = data[key];
                }
            });

            let LocationSch = new Location(locationRow);
            LocationSch.save(function (err) {
                if (err)
                    console.log(err);
            });
        })
        .on('end', function () {
            console.log("Location DB import completed.");
        });
}

module.exports = importLocations;