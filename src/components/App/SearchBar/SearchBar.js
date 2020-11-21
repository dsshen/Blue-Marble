import React from 'react';
import PropTypes from 'prop-types';
import Helper from '../../../util/Helper.js';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './SearchBar.css';
import './animation.css';

// Receives props from App
class SearchBar extends React.Component {
    constructor(props) {
        super();

        // "this" binding
        this.handleLocationChange = this.handleLocationChange.bind(this);
        this.searchOnEnter = this.searchOnEnter.bind(this);
    }

    // Update App.js state's location value
    handleLocationChange(e) {
        let newLocation = e.target.value;
        this.props.updateLocation(newLocation);
    }

    // Conduct search if user presses Enter
    searchOnEnter(e) {
        if (e.key === 'Enter') {
            this.props.search();
        }
    }

    // Render
    render() {
        return (
            <div className="SearchBar-container">
                <h1 className="accent-color"><span className="title1">Blue </span><span className="title2">Marble</span></h1>
                <p className="pick-a-search-term pick-date"><span className="bold">Pick a <span className="accent-color">date</span>.</span></p>
                <DatePicker
                    selected={Helper.convertStrToDate(this.props.date)}
                    onChange={this.props.updateDate}
                />
                <p className="pick-a-search-term pick-location"><span className="bold">Pick a <span className="accent-color">location</span>.</span> <span className="location-examples">(Indian Ocean, France, Sahara Desert, California, Tokyo...)</span></p>
                <input
                    type="text"
                    className="location-input"
                    placeholder="North America"
                    onChange={this.handleLocationChange}
                />
                <div className="search-button-container">
                    <span className="search-button" onClick={this.props.search}>SEARCH</span>
                </div>
                <div className="searchbar-status-container">
                    <p className={this.props.searchBarStatusCSS}>{this.props.searchBarStatus}</p>
                </div>
            </div>
        );
    }

    // Upon mounting, allow user to press Enter to conduct a search
    // Your search function has good anti-spamming logic built in so keeping this functionality global is safe
    componentDidMount() {
        document.addEventListener('keydown', this.searchOnEnter);
    }
}

SearchBar.propTypes = {
    date: PropTypes.string,
    updateDate: PropTypes.func,
    updateLocation: PropTypes.func,
    search: PropTypes.func,
    searchBarStatus: PropTypes.string,
    searchBarStatusCSS: PropTypes.string
}

export default SearchBar;