import 'reactjs-popup/dist/index.css';
import './normalize.css';
import './reset.css';
import './App.css';
import React from 'react';
import Collapsible from 'react-collapsible';
import Popup from 'reactjs-popup';
import SearchBar from './SearchBar/SearchBar.js';
import Globe from './Globe/Globe.js';
import Epic from '../../util/Epic.js';
import Geocode from '../../util/Geocode.js';
import Helper from '../../util/Helper.js';

// This array will store the list of all dates for which available data exists
const availableDatesArray = [];

// This array will store the metadata for the images on the last searched date
const metadataArray = [];

// This var will store the date used in the last AJAX query. As such, it will always be an available date (ensured by the search logic below)
let lastDateSearched;

// todaysDate and yesterdaysDate store today's date and yesterday's date as strings
let today = new Date();
let yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
let todaysDate = Helper.convertDateToStr(today);
let yesterdaysDate = Helper.convertDateToStr(yesterday);

// This object stores the name and longitudinal coordinate of the last location searched
// Initialized to North America, the search box's placeholder value
let northAmericaLatitude = 51.0000002;
let northAmericaLongitude = -109.0000002;
let lastLocationSearched = {
    name: '',
    latitude: northAmericaLatitude,
    longitude: northAmericaLongitude
};

// These vars will be used to display a message in the Globe component based on the search results
let globeMsgBeforeLocationInfo = <span></span>;
let globeMsg = <span></span>;

// This var will allow us to use clearTimeout for cancelling the setTimeout func used to hide the searchbar message after a few seconds
// This prevents buggy behavior when, say, a user spams 'Enter' in the search bar
let timeoutID;

// Renders SearchBar
// Renders Globe
class App extends React.Component {
    constructor(props) {
        super();
        this.state = {
            date: yesterdaysDate, // initialize the date to yesterday's date. This var is a string YYYY-MM-DD, NOT a Date object
            lastDateSearched: lastDateSearched, // also a string
            location: '',
            metadata: metadataArray,
            globeMsg: globeMsg,
            searchBarStatus: 'Searching...', // "Searching... || Done!"
            searchBarStatusCSS: 'searchbar-status hidden',
            imgIndex: 0
        }

        // "this" binding
        this.setStateAsync = this.setStateAsync.bind(this);
        this.hideMsgAfterFourSecs = this.hideMsgAfterFourSecs.bind(this);
        this.updateDate = this.updateDate.bind(this);
        this.updateLocation = this.updateLocation.bind(this);
        this.determineImgIndexBasedOnLocation = this.determineImgIndexBasedOnLocation.bind(this);
        this.search = this.search.bind(this);
        this.spinClockwise = this.spinClockwise.bind(this);
        this.spinCounterclockwise = this.spinCounterclockwise.bind(this);
        this.search2020CaliforniaFires = this.search2020CaliforniaFires.bind(this);
        this.searchMangkhut = this.searchMangkhut.bind(this);
        this.search2017SolarEclipse = this.search2017SolarEclipse.bind(this);
    }

    // A version of setState() that returns a Promise, so you can use with async/await! Hallelujah!
    setStateAsync(state) {
        return new Promise((resolve) => {
          this.setState(state, resolve)
        });
    }

    // Hide searchBarStatus message after 4 seconds
    hideMsgAfterFourSecs() {
        if (timeoutID) {
            clearTimeout(timeoutID);
        }
        timeoutID = setTimeout(() => {
            if (this.state.searchBarStatusCSS === 'searchbar-status active error') {
                this.setState({
                    searchBarStatusCSS: 'searchbar-status hidden error'
                });
            }
            else {
                this.setState({
                    searchBarStatusCSS: 'searchbar-status hidden'
                });
            }
        }, 4000);
    }

    // Update the date to be searched based on the input from SearchBar. newDate must be a Date object.
    updateDate(newDate) {
        // if newDate is not null, update state
        // this prevents an error being thrown when a user manually clears the textbox
        if (newDate) {
            let newDateStr = Helper.convertDateToStr(newDate);
            this.setState({
                date: newDateStr
            });
        }
    }

    // Update the location query based on SearchBar input
    updateLocation(newLocation) {
        this.setState({
            location: newLocation
        });
    }

    // Scroll to the Globe component. Gets called after every search to improve mobile viewing experience
    // so users don't have to scroll down to see the rendered globe pic
    scrollToGlobe() {
        let globeElement = document.querySelector('.Globe-container');
        globeElement.scrollIntoView();
    }
    
    // Get array of dates with available natural color imagery. Only fetch from API if needed
    async getAvailableDatesArray() {
        // Check if availableDatesArray is already populated. If not fetch from API and populate availableDatesArray.
        // If already populated, simply return availableDatesArray.
        // This ensures we only fetch from the API if we have to.
        if (availableDatesArray.length === 0) {
            let arr = await Epic.getAvailableDates();
            for (let i = 0; i < arr.length; i++) {
                availableDatesArray[i] = arr[i];
            }
            return availableDatesArray;
        }
        else {
            return availableDatesArray;
        }
    }

    // Get array of all image metadata for the specified available date. Only fetch from the API if needed
    async getMetadataArray(availableDate) {
        // If you already just searched for this date, don't fetch from API; just return what you already have
        if (availableDate === lastDateSearched) {
            return metadataArray;
        }

        // Otherwise, fetch from the API
        else {
            // First clear the existing metadataArray
            metadataArray.splice(0, metadataArray.length);

            // Fetch from API, copy the results to metadataArray, and return metadataArray
            let arr = await Epic.getMetadata(availableDate);
            for (let i = 0; i < arr.length; i++) {
                metadataArray[i] = arr[i];
            }
            lastDateSearched = availableDate;
            return metadataArray;
        }
    }

    // Use LocationIQ's Geocoding API (if necessary) to retrieve the coordinates of a location search term
    async findLocationCoords(location) {
        // First check if the location being searched was just searched for previously. If so, simply return the saved coords from before.
        // This helps reduce the number of requests we need to make to LocationIQ
        if (location === lastLocationSearched.name) {
            return {
                lat: lastLocationSearched.latitude,
                lon: lastLocationSearched.longitude
            };
        }

        // If the location field is blank (and the placeholder value of "North America" is thus visible), return North America's coords
        // This also saves us an unnecessary AJAX request
        else if (location === '') {
            return {
                lat: northAmericaLatitude,
                lon: northAmericaLongitude
            };
        }

        // Otherwise perform AJAX
        else {
            let jsonResponse = await Geocode.getLocation(location);

            // If LocationIQ successfully found a location, return its coords
            if (Array.isArray(jsonResponse)) {
                let latitude = jsonResponse[0].lat;
                let longitude = jsonResponse[0].lon;
                lastLocationSearched.name = location;
                lastLocationSearched.latitude = latitude;
                lastLocationSearched.longitude = longitude;
                return {
                    lat: latitude,
                    lon: longitude
                };
            }

            // If no location was found, simply return the last saved coords
            else {
                lastLocationSearched.name = location;
                return {
                    lat: lastLocationSearched.latitude,
                    lon: lastLocationSearched.longitude
                };
            }
        }
    }

    // Given a location search parameter and an array of image metadata, find index of image closest to the searched location
    async determineImgIndexBasedOnLocation(location, metadata) {
        let coords = await this.findLocationCoords(location);
        let dist;
        let smallestDist = Infinity;
        let indexOfClosestImg;
        for (let i = 0; i < metadata.length; i++) {
            let metadataCoords = {
                lat: metadata[i].centroid_coordinates.lat,
                lon: metadata[i].centroid_coordinates.lon
            };
            dist = Helper.getHaversineDist(coords.lat, coords.lon, metadataCoords.lat, metadataCoords.lon);
            if (dist < smallestDist) {
                smallestDist = dist;
                indexOfClosestImg = i;
            }
        }

        // if the smallestDiff is greater than 6700 km (about 1/6 of Earth's circumference), display an appropriate message
        let locationStr = !location ? 'North America' : location;
        if (smallestDist > 6.7e6) {
            globeMsg = <span>{globeMsgBeforeLocationInfo}. There aren't any great angles of <span className="accent-color">{locationStr}</span> for this date, sadly; showing the best available angle.</span>
        }
        else {
            globeMsg = <span>{globeMsgBeforeLocationInfo} near <span className="accent-color">{locationStr}</span>.</span>
        }

        // return the image index
        return indexOfClosestImg;
    }

    // Main search function
    // GOD BLESS THE CREATORS OF ASYNC/AWAIT... HALLELUJAH PRAISE THE SUN GLORIA IN EXCELSIS ECMASCRIPT2017
    async search() {
        // Initialize state of searchBarStatus and searchBarStatusCSS
        await this.setStateAsync({
            searchBarStatus: 'Searching...',
            searchBarStatusCSS: 'searchbar-status active'
        });

        // First, make sure this.state.date is after 2015-06-13. If it's before, return a special error msg saying
        // that NASA doesn't have any data before 2015-06-13.
        if (this.state.date < '2015-06-13') {
            this.setState({
                searchBarStatus: 'Please select a date after June 13, 2015.',
                searchBarStatusCSS: 'searchbar-status active error'
            });
            this.hideMsgAfterFourSecs();
            return;
        }

        // If this.state.date is in the future, return special error msg.
        if (this.state.date > todaysDate) {
            this.setState({
                searchBarStatus: 'That date is in the future. For all we know, the Earth will be in flames by then.',
                searchBarStatusCSS: 'searchbar-status active error'
            });
            this.hideMsgAfterFourSecs();
            return;
        }

        // Otherwise, conduct the search
        try {
            let metadata = [];

            // This while loop exists because, INFURIATINGLY, NASA's provided list of available dates contains some dates with zero images.
            // So, for every search, we still need to check if images exist for that date, and if not, delete the date from availableDatesArray[]
            // then retry the search. Fortunately, async/await makes this relatively straightforward.
            while (metadata.length === 0) {
                // Retrieve array of available dates
                let availableDates = await this.getAvailableDatesArray();

                // Check if this.state.date matches an available date. If so, retrieve the index of the available date
                let isMatch;
                let availableDate = '';
                let indexOfAvailable;
                for (let i = 0; i < availableDates.length; i++) {
                    if (availableDates[i] === this.state.date) {
                        isMatch = true;
                        indexOfAvailable = i;
                    }
                }

                // If no match found, retrieve the index of the nearest available date
                // There's definitely a more efficient method to do this, but it doesn't matter too much for this app
                let diff;
                let smallestDiff = Infinity;
                if (!isMatch) {
                    for (let i = 0; i < availableDates.length; i++) {
                        diff = Helper.findDiffBetweenDates(this.state.date, availableDates[i]);
                        if (diff < smallestDiff) {
                            smallestDiff = diff;
                            indexOfAvailable = i;
                        }
                    }
                }

                // Either way, assign var availableDate based on indexOfAvailable
                availableDate = availableDates[indexOfAvailable];

                // Update globeMsgBeforeLocationInfo accordingly
                let isYesterday = availableDate === yesterdaysDate;
                let availableDateInEnglish = Helper.convertDateStrToEnglish(availableDate);
                if (this.state.date === todaysDate) {
                    if (isMatch) {
                        globeMsgBeforeLocationInfo = <span>Here's what Earth looks like <span className="accent-color">today</span></span>;
                    }
                    else {
                        let whichDay;
                        if (isYesterday) {
                            whichDay = <span className="accent-color">yesterday</span>;
                        }
                        else {
                            whichDay = <span>on <span className="accent-color">{availableDateInEnglish}</span></span>;
                        }
                        globeMsgBeforeLocationInfo = <span>It looks like today's pictures aren't up yet. Here's what Earth looked like {whichDay}</span>;
                    }
                }
                else if (this.state.date === yesterdaysDate) {
                    if (isMatch) {
                        globeMsgBeforeLocationInfo = <span>Here's what Earth looked like <span className="accent-color">yesterday</span></span>;
                    }
                    else {
                        let searchedDateInEnglish = Helper.convertDateStrToEnglish(this.state.date);
                        let earlierOrLater = this.state.date > availableDate ? 'earlier' : 'later';
                        let dayOrDays = smallestDiff === 1 ? 'day' : 'days';
                        globeMsgBeforeLocationInfo = <span>It looks like NASA has no data for {searchedDateInEnglish}. Here's Earth {smallestDiff} {dayOrDays} {earlierOrLater} on <span className="accent-color">{availableDateInEnglish}</span></span>;
                    }
                }
                else {
                    if (isMatch) {
                        globeMsgBeforeLocationInfo = <span>Here's Earth on <span className="accent-color">{availableDateInEnglish}</span></span>;
                    }
                    else {
                        let searchedDateInEnglish = Helper.convertDateStrToEnglish(this.state.date);
                        let earlierOrLater = this.state.date > availableDate ? 'earlier' : 'later';
                        let dayOrDays = smallestDiff === 1 ? 'day' : 'days';
                        globeMsgBeforeLocationInfo = <span>It looks like NASA has no data for {searchedDateInEnglish}. Here's Earth {smallestDiff} {dayOrDays} {earlierOrLater} on <span className="accent-color">{availableDateInEnglish}</span></span>;
                    }
                }

                // Get array of image metadata for availableDate
                metadata = await this.getMetadataArray(availableDate);

                // Check if the metadata array is empty. If so, delete the availableDate from availableDatesArray[] and try the search again
                if (metadata.length === 0) {
                    console.log(`It looks like ${availableDate} has 0 images even though it's listed as an available date. Thanks NASA! Trying again...`);
                    availableDatesArray.splice(indexOfAvailable, 1);
                }
            }

            // Once non-empty metadata array has been retrieved, initialize the image index based on the location searched
            let imgIndex = await this.determineImgIndexBasedOnLocation(this.state.location, metadata);

            // Finally, set the App state based on the retrieved metadata
            await this.setStateAsync({
                lastDateSearched: lastDateSearched,
                metadata: metadata,
                globeMsg: globeMsg,
                searchBarStatus: 'Done!',
                imgIndex: imgIndex
            });

            // Hide the searchBarStatus message after 4 secs
            this.hideMsgAfterFourSecs();

            // Scroll to the Globe component
            this.scrollToGlobe();
        }
        catch(error) {
            console.log(error);
        }
    }

    // "Spin" the globe clockwise
    spinClockwise() {
        let currentImgIndex = this.state.imgIndex;
        if (currentImgIndex === 0) {
            this.setState({
                globeMsg: this.state.metadata.length !== 0 ? <span>{globeMsgBeforeLocationInfo}.</span> : <span></span>,
                imgIndex: this.state.metadata.length - 1
            });
        }
        else {
            this.setState({
                globeMsg: this.state.metadata.length !== 0 ? <span>{globeMsgBeforeLocationInfo}.</span> : <span></span>,
                imgIndex: currentImgIndex - 1
            });
        }
    }

    // "Spin" the globe counterclockwise
    spinCounterclockwise() {
        let currentImgIndex = this.state.imgIndex;
        if (currentImgIndex === this.state.metadata.length - 1) {
            this.setState({
                globeMsg: this.state.metadata.length !== 0 ? <span>{globeMsgBeforeLocationInfo}.</span> : <span></span>,
                imgIndex: 0
            });
        }
        else {
            this.setState({
                globeMsg: this.state.metadata.length !== 0 ? <span>{globeMsgBeforeLocationInfo}.</span> : <span></span>,
                imgIndex: currentImgIndex + 1
            });
        }
    }

    // Render image metadata as collapsible element
    renderCollapsible(imgIndex) {
        if (this.state.metadata.length !== 0) {
            // Extract J2000 coords from metadata. Coordinate values are all in km
            const satCoords = {
                x: this.state.metadata[imgIndex].dscovr_j2000_position.x,
                y: this.state.metadata[imgIndex].dscovr_j2000_position.y,
                z: this.state.metadata[imgIndex].dscovr_j2000_position.z
            }
            const moonCoords = {
                x: this.state.metadata[imgIndex].lunar_j2000_position.x,
                y: this.state.metadata[imgIndex].lunar_j2000_position.y,
                z: this.state.metadata[imgIndex].lunar_j2000_position.z
            }
            const sunCoords = {
                x: this.state.metadata[imgIndex].sun_j2000_position.x,
                y: this.state.metadata[imgIndex].sun_j2000_position.y,
                z: this.state.metadata[imgIndex].sun_j2000_position.z
            }

            // Computer Earth-Satellite and Earth-Sun distance, in millions of km
            const distEarthToSat = Math.round(Helper.getCartesianDist(0, 0, 0, satCoords.x, satCoords.y, satCoords.z)).toLocaleString('en-US');
            const distEarthToMoon = Math.round(Helper.getCartesianDist(0, 0, 0, moonCoords.x, moonCoords.y, moonCoords.z)).toLocaleString('en-US');
            const distEarthToSun = Math.round(Helper.getCartesianDist(0, 0, 0, sunCoords.x, sunCoords.y, sunCoords.z)).toLocaleString('en-US');

            // Return Collapsible component
            return (
                <Collapsible
                    trigger="Show image metadata"
                    triggerWhenOpen="Hide image metadata"
                >
                    <ul>
                        <li>Showing image {imgIndex + 1} of {this.state.metadata.length}</li>
                        <li>Image ID: {this.state.metadata[imgIndex].image}</li>
                        <li>Date: {this.state.metadata[imgIndex].date}</li>
                        <li>Distance b/w Earth and DSCOVR: {distEarthToSat} km</li>
                        <li>Distance b/w Earth and Moon: {distEarthToMoon} km</li>
                        <li>Distance b/w Earth and Sun: {distEarthToSun} km</li>
                    </ul>
                </Collapsible>
            );
        }
    }

    // Preset search for 2020 California wildfires
    search2020CaliforniaFires() {
        this.setState({
            date: '2020-09-10',
            location: 'California'
        }, () => {
            this.search();
        });
    }

    // Preset search for Typhoon Mangkhut
    searchMangkhut() {
        this.setState({
            date: '2018-09-16',
            location: 'China'
        }, () => {
            this.search();
        });
    }

    // Preset search for 2017 solar eclipse
    search2017SolarEclipse() {
        this.setState({
            date: '2017-08-21',
            location: 'North America'
        }, () => {
            this.search();
        });
    }

    // Render
    render() {
        return (
            <div>
                <Popup trigger={<div className="about-button">About this site</div>} position="right center" modal>
                    {close => (
                        <div className="about">
                            <p>This site uses NASA's <a href="https://epic.gsfc.nasa.gov/about/api" target="_blank" rel="noopener noreferrer">EPIC API</a> and LocationIQ's <a href="https://locationiq.com/geocoding" target="_blank" rel="noopener noreferrer">Geocoding API</a> to display what planet Earth looked like from space, in natural color, on almost any given date since June 2015, centered (if possible) on a location you've specified. If no images exist for a given date, the nearest date for which available imagery exists is returned instead.</p>

                            <p className="bold">To "rotate" the globe, use the white arrows onscreen or your keyboard's arrow keys.</p>

                            <p>All of the images were captured by the <a href="https://epic.gsfc.nasa.gov/about/epic" target="_blank" rel="noopener noreferrer">Earth Polychromatic Imaging Camera (EPIC)</a> aboard NOAA's <a href="https://www.nesdis.noaa.gov/content/dscovr-deep-space-climate-observatory" target="_blank" rel="noopener noreferrer">Deep Space Climate Observatory (DSCOVR)</a> satellite. Positioned at the <a href="https://solarsystem.nasa.gov/resources/754/what-is-a-lagrange-point/" target="_blank" rel="noopener noreferrer">Earth-Sun L-1 point</a>, DSCOVR and its instruments are able to provide near-continuous coverage of the entire sunlit side of Earth. In addition to taking breathtaking photos of the planet, EPIC monitors other parameters of interest to scientists such as ozone and aerosol levels, cloud dynamics, and vegetation using 10 different spectral channels.</p>

                            <p>EPIC's unique "big picture" vantage point has allowed it to capture remarkable shots of significant climatic and celestial events, such as the <span className="preset-search" onClick={() => {this.search2020CaliforniaFires(); close();}}>2020 California wildfires</span>, <span className="preset-search" onClick={() => {this.searchMangkhut(); close();}}>Typhoon Mangkhut</span> and the <span className="preset-search" onClick={() => {this.search2017SolarEclipse(); close();}}>solar eclipse of August 21, 2017</span>.</p>

                            <p>Made with <a href="https://github.com/dsshen/blue-marble" target="_blank" rel="noopener noreferrer">React</a>.</p>

                            <div className="return-button-container">
                                <div className="return-button" onClick={() => close()}>Return to site</div>
                            </div>
                        </div>
                    )}
                </Popup>
                <div className="App-container">
                    <div className="SearchBar-and-Collapsible-container">
                        <SearchBar
                            date={this.state.date}
                            updateDate={this.updateDate}
                            updateLocation={this.updateLocation}
                            search={this.search}
                            searchBarStatus={this.state.searchBarStatus}
                            searchBarStatusCSS={this.state.searchBarStatusCSS}
                        />
                        <div className="metadata-div">
                            {this.renderCollapsible(this.state.imgIndex)}
                        </div>
                    </div>
                    <Globe
                        metadata={this.state.metadata}
                        lastDateSearched={this.state.lastDateSearched}
                        globeMsg={this.state.globeMsg}
                        imgIndex={this.state.imgIndex}
                        spinClockwise={this.spinClockwise}
                        spinCounterclockwise={this.spinCounterclockwise}
                        scrollToGlobe={this.scrollToGlobe}
                    />
                </div>
            </div>
        );
    }
}

export default App;
