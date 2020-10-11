import React from 'react';
import PropTypes from 'prop-types';
import './Globe.css';
import leftArrow from './left-arrow-color-corrected.png';
import rightArrow from './right-arrow-color-corrected.png';

// Receives props from App
class Globe extends React.Component {
    constructor(props) {
        super();

        // "this" binding
        this.handleArrowKeyPress = this.handleArrowKeyPress.bind(this);
    }

    // Allow user to rotate globe using arrow keys on keyboard
    handleArrowKeyPress(e) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            this.props.spinClockwise();
        }
        else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            this.props.spinCounterclockwise();
        }
    }

    // Display the Earth, along with relevant metadata 
    renderEarth(imgIndex) {
        if (this.props.metadata.length !== 0) {
            // Load all available images of Earth on a given date. Hide all except the image corresponding to the current imgIndex
            // This uses more data and makes each search load more slowly, but the increase in performance when "rotating" the globe
            // is worth it
            const imageDivs = [];
            for (let i = 0; i < this.props.metadata.length; i++) {
                // Get the JPG and PNG urls
                const imgName = this.props.metadata[i].image;
                const dateStrSplit = this.props.lastDateSearched.split('-');
                const year = dateStrSplit[0];
                const month = dateStrSplit[1];
                const day = dateStrSplit[2];
                const jpgUrl = `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${day}/jpg/${imgName}.jpg`;
                const pngUrl = `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${day}/png/${imgName}.png`;

                // Show/hide the image using CSS classes depending on the value of imgIndex
                const className = i === imgIndex ? 'blue-marble' : 'blue-marble no-display';

                // store in imageDivs[] as JSX expression
                imageDivs[i] = (
                    <div className={className} key={i}>
                        <a href={pngUrl} target="_blank" rel="noopener noreferrer">
                            <img src={jpgUrl} alt="" />
                        </a>
                    </div>
                );
            }

            // Return the JSX
            return (
                <div className="globe-with-arrows">
                    <img className="arrow" src={leftArrow} alt="" onClick={this.props.spinClockwise} />
                    {imageDivs}
                    <img className="arrow" src={rightArrow} alt="" onClick={this.props.spinCounterclockwise} />
                </div>
            );
        }
    }

    // Render
    render() {
        return (
            <div className="Globe-container">
                {this.renderEarth(this.props.imgIndex)}
                <div className="globe-msg-div">
                    <p>{this.props.globeMsg}</p>
                </div>
            </div>
        );
    }

    // Upon mounting, allow user to rotate globe using arrow keys
    componentDidMount() {
        document.addEventListener('keydown', this.handleArrowKeyPress);
    }
}

Globe.propTypes = {
    metadata: PropTypes.array,
    lastDateSearched: PropTypes.string,
    globeMsg: PropTypes.object,
    imgIndex: PropTypes.number,
    spinClockwise: PropTypes.func,
    spinCounterclockwise: PropTypes.func
}

export default Globe;