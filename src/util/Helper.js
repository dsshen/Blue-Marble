// Bunch of helper functions. Most deal with handling dates
// They've all been relegated here so the component code is cleaner.
class Helper {
    // convert date string 'YYYY-MM-DD' into Date object
    static convertStrToDate(dateStr) {
        // split the string
        const dateStrSplit = dateStr.split('-');

        // extract year, monthIndex, and day from the split
        const year = Number(dateStrSplit[0]);
        const monthIndex = Number(dateStrSplit[1]) - 1;
        const day = Number(dateStrSplit[2]);

        return new Date(year, monthIndex, day);
    }

    // convert Date object into date string 'YYYY-MM-DD'
    static convertDateToStr(date) {
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = (date.getDate()).toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // find the number of days between two date strings formatted as 'YYYY-MM-DD'
    static findDiffBetweenDates(date1_str, date2_str) {
        // create Date objects
        const date1 = this.convertStrToDate(date1_str);
        const date2 = this.convertStrToDate(date2_str);
    
        // find the difference between them, in days
        const numMillisecondsInDay = 24 * 60 * 60 * 1000;
        const diff = (date1 - date2) / numMillisecondsInDay;
        
        return Math.abs(Math.round(diff));
    }

    // convert a 'YYYY-MM-DD' date string into 'Month DD, YYYY' format
    // ex: '2020-09-05' becomes 'September 05, 2020'
    static convertDateStrToEnglish(dateStr) {
        const dateStrSplit = dateStr.split('-');
        let month;
        switch (dateStrSplit[1]) {
            case '01':
                month = 'January';
                break;
            case '02':
                month = 'February';
                break;
            case '03':
                month = 'March';
                break;
            case '04':
                month = 'April';
                break;
            case '05':
                month = 'May';
                break;
            case '06':
                month = 'June';
                break;
            case '07':
                month = 'July';
                break;
            case '08':
                month = 'August';
                break;
            case '09':
                month = 'September';
                break;
            case '10':
                month = 'October';
                break;
            case '11':
                month = 'November';
                break;
            case '12':
                month = 'December';
                break;
            default:
                month = 'InvalidMonth';
        }
        return `${month} ${parseInt(dateStrSplit[2], 10)}, ${dateStrSplit[0]}`;
    }

    // Find the distance between two latitude-longitude coordinate pairs in meters using Haversine formula
    static getHaversineDist(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // meters
        const φ1 = lat1 * Math.PI/180; // φ, λ in radians
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        const d = R * c; // in meters
        return d;
    }

    // Find distance between two points in 3D Cartesian space. Unit agnostic, units depend on input
    static getCartesianDist(x1, y1, z1, x2, y2, z2) {
        const Δx = x2 - x1;
        const Δy = y2 - y1;
        const Δz = z2 - z1;
        const d = Math.sqrt((Δx*Δx) + (Δy*Δy) + (Δz*Δz));
        return d;
    }
}

export default Helper;