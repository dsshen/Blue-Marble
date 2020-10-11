// Your access token for LocationIQ. Be sure to rotate this token out often!
const token = 'pk.470f56552ec98efe20bd7f26542e7dab'

// Methods that will perform AJAX requests for location geocoding (conversion of location to LatLong and vice versa)
class Geocode {
    // Fetch JSON data for a location from LocationIQ using user-provided search query
    // Refer to LocationIQ docs for more info: https://locationiq.com/docs
    static getLocation(locationQuery) {
        return fetch(`https://us1.locationiq.com/v1/search.php?key=${token}&q=${locationQuery}&format=json&limit=1`)
        .then(response => {
            console.log('Successfully fetched from LocationIQ');
            return response.json();
        })
        .then(jsonResponse => {
            // If LocationIQ can't find anything, they will just return an object with a single error property.
            // Otherwise, they will return an array of objects
            if (Array.isArray(jsonResponse)) {
                let lat = jsonResponse[0].lat;
                let lon = jsonResponse[0].lon;
                console.log(`LocationIQ API found a location! Lat: ${lat}, Lon: ${lon}`);
            }
            else {
                console.log('LocationIQ API could not find any locations with that search query');
            }

            // Return the jsonResponse either way; App.js handles the errors properly
            return jsonResponse;
        })
        .catch(error => {
            console.log(error);
        })
    }
}

export default Geocode;