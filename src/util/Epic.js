// Collection of static methods that will make AJAX fetch requests to the NASA Epic API
class Epic {
    // Get a list of all dates with available natural color imagery, and return as an array
    static getAvailableDates() {
        return fetch('https://epic.gsfc.nasa.gov/api/natural/all')
        .then(response => {
            console.log('Successfully fetched list of available dates from EPIC API.');
            return response.json();
        })
        .then(jsonResponse => {
            // Return list of dates stored in array
            // Refer to NASA EPIC API for the response body shape
            console.log(`API returned ${jsonResponse.length} available dates.`);
            return jsonResponse.map(dateObj => {
                return dateObj.date;
            });
        })
        .catch(error => {
            console.log(error);
        });
    }

    // Get metadata for all natural color images on a given date
    static getMetadata(date) {
        return fetch(`https://epic.gsfc.nasa.gov/api/natural/date/${date}`)
        .then(response => {
            console.log(`Successfully fetched metadata for natural color images on ${date}`);
            return response.json();
        })
        .then(jsonResponse => {
            // jsonResponse is an array of objects containing metadata for each image
            console.log(`API returned metadata on ${jsonResponse.length} images for ${date}`)
            return jsonResponse;
        })
        .catch(error => {
            console.log(error);
        })
    }
}

export default Epic;