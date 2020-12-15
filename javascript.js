// dictionary containing ByteArrays of the files in the database
var ot_data = {};
// flags that signal that files finished downloading and are ready for use
var data_ot9_ready = false;
var extrem_09_ready = false;

/**
 * Asynchronously loads a portion of the files to search through of the database
 */
async function getBlobs() {
    const [ot3, ot4, ot5, ot6, ot7, ot8, ot9] = await Promise.all([
        fetch('/ot_data/otypes/otypes03.b08'),
        fetch('/ot_data/otypes/otypes04.b08'),
        fetch('/ot_data/otypes/otypes05.b08'),
        fetch('/ot_data/otypes/otypes06.b08'),
        fetch('/ot_data/otypes/otypes07.b08'),
        fetch('/ot_data/otypes/otypes08.b08'),
        fetch('/ot_data/otypes/otypes09.b16')
    ]);

    ot_data["otypes03_b08"] = await ot3.arrayBuffer();
    ot_data["otypes04_b08"] = await ot4.arrayBuffer();
    ot_data["otypes05_b08"] = await ot5.arrayBuffer();
    ot_data["otypes06_b08"] = await ot6.arrayBuffer();
    ot_data["otypes07_b08"] = await ot7.arrayBuffer();
    ot_data["otypes08_b08"] = await ot8.arrayBuffer();
    ot_data["otypes09_b16"] = await ot9.arrayBuffer();

    data_ot9_ready = true;
}

/**
 * Asynchronously loads the property files containing the number of extreme points of the database
 */
async function getBlobsExtremePoints() {
    const [extr3, extr4, extr5, extr6, extr7, extr8, extr9] = await Promise.all([
        fetch('/ot_data/extrem/extrem03.b08'),
        fetch('/ot_data/extrem/extrem04.b08'),
        fetch('/ot_data/extrem/extrem05.b08'),
        fetch('/ot_data/extrem/extrem06.b08'),
        fetch('/ot_data/extrem/extrem07.b08'),
        fetch('/ot_data/extrem/extrem08.b08'),
        fetch('/ot_data/extrem/extrem09.b08')
    ])

    ot_data["extrem03_b08"] = await extr3.arrayBuffer();
    ot_data["extrem04_b08"] = await extr4.arrayBuffer();
    ot_data["extrem05_b08"] = await extr5.arrayBuffer();
    ot_data["extrem06_b08"] = await extr6.arrayBuffer();
    ot_data["extrem07_b08"] = await extr7.arrayBuffer();
    ot_data["extrem08_b08"] = await extr8.arrayBuffer();
    ot_data["extrem09_b08"] = await extr9.arrayBuffer();

    extrem_09_ready = true;
}

/**
 * Class representing the points in a point set
 * 
 * They have an x and a y coordinate, a range in which the coordinates lie and a color
 */
class Point {
    constructor() {
        let x, y, range = 255, color = "#888888";
        switch (arguments.length) {
            case 1:
                x = arguments[0].x;
                y = arguments[0].y;
                break;
            case 4:
                color = arguments[3];
            case 3:
                range = arguments[2];
            case 2:
                x = arguments[0];
                y = arguments[1];
                break;
        }
        this.x = x;
        this.y = y;
        this.range = range;
        this.color = color;
    }

    setRange(range) {
        let newX = (this.x / this.range) * range;
        let newY = (this.y / this.range) * range;
        this.x = newX;
        this.y = newY;
        this.range = range;
    }

    equals(other) {
        return this.x === other.x && this.y === other.y;
    }
}

/**
 * Finds the lambda matrix of a point set in its natural ordering.
 * This algorithm is derived from the slides of a presentation of the author of [Aichholtzer et al. (2001)]:
 * http://conferences2.imfm.si/conferenceDisplay.py/getPic?picId=36&amp;confId=12
 * @param {Point[]} pointSet the set of points 
 */
function minLambdaMatrixString(pointSet) {
    let CH = grahamScan(pointSet);
    let minMatrix = undefined;

    // try each point on CH as pivot
    for (let pivotId in CH) {
        let tmpMatrix = "";
        let pivotPoint = CH[pivotId];
        let ordered = orderRadially(pointSet, pivotPoint, true);

        for (let i in ordered) {
            for (let j in ordered) {
                tmpMatrix += nbPointsLeftOf(ordered[i], ordered[j], ordered);
            }
        }

        if (minMatrix === undefined || tmpMatrix.localeCompare(minMatrix) < 0) {
            minMatrix = tmpMatrix;
        }
    }

    return minMatrix;
}

/**
 * Computes the number of points different from point1 and point2 in points that are to the left of the ordered line point1-point2
 * @param {Point} point1 first point of the line
 * @param {Point} point2 second point of the line
 * @param {Point[]} points the set complete set of points
 * @param {boolean} left indicated the direction of the turn with the line
 */
function nbPointsLeftOf(point1, point2, points, left = true) {
    let nbLeft = 0;
    for (let i in points) {
        let point = points[i];
        if (!point.equals(point1) && !point.equals(point2)) {
            if (orientationDet(point1, point2, point) > 0) {
                if (left) {
                    nbLeft++;
                }
            } else if (!left) {
                nbLeft++;
            }
        }
    }
    return nbLeft;
}

/**
 * Computes the orientation determinant of three points
 */
function orientationDet(a, b, c) {
    return b.x * c.y - a.x * c.y + a.x * b.y - b.y * c.x + a.y * c.x - a.y * b.x;
}

/**
 * Returns the array containing the point sets of size nbPoints in an array of unsigned int of the correct length
 * @param {Number} nbPoints the number of points in the order type
 */
function readOtypeDataset(nbPoints) {
    let arr;
    if (nbPoints === 9) {
        let pts = ("0" + nbPoints).slice(-2);
        arr = new Uint16Array(ot_data[`otypes${pts}_b16`]);
    } else if (nbPoints < 9) {
        arr = new Uint8Array(ot_data[`otypes0${nbPoints}_b08`]);
    } else {
        console.error("unhandled number of points");
        arr = undefined;
    }
    return arr;
}

/**
 * Binary search for the point corresponding to the order type of the given lambda matrix in the files of the database
 * @param {number} nbPoints the size of the order type
 * @param {string} minLambdaMatrixString the natural lambda matrix flattended into a string (row after row)
 * @returns {Point[]} the point set realisation corresponding to the given lambda matrix contained in the database or undefined if it wasn't found
 */
function binSearchOt(nbPoints, inputLambdaMatrix) {
    let arr = readOtypeDataset(nbPoints);
    let entrySize = nbPoints * 2; // n points of 2 coordinates
    let lastEntryIndex = (arr.length / entrySize) - 1;
    return _recBinSearchOt(arr, 0, lastEntryIndex, nbPoints, inputLambdaMatrix);
}

/**
 * Recursive helper function for a binary search on order types
 * @param {Uint8Array | Uint16Array} array array of coordinates of points of point sets
 * @param {Number} lo the lowest entry index of the range still considered by the search
 * @param {Number} hi the highest entry index of the range still considered by the search
 * @param {NUmber} nbPoints the size of the order type
 * @param {String} inputLambdaMatrix the flattened lambda matrix that we look for
 * @returns {Point[]} returns the point set realisation from the database with the same natural lambda matrix or undefined it no match was found
 */
function _recBinSearchOt(arr, lo, hi, nbPoints, inputLambdaMatrix) {
    let midPoint = Math.floor((lo + hi) / 2);
    let pointSet = readPointSet(arr, midPoint, nbPoints);
    let midPointMatrix = minLambdaMatrixString(pointSet);
    let res = midPointMatrix.localeCompare(inputLambdaMatrix);

    if (lo === hi) {
        if (res === 0) {
            return { points: pointSet, index: lo };
        } else {
            return undefined;
        }
    }

    if (res === 0) {
        return { points: pointSet, index: midPoint };
    } else if (res < 0) {
        return _recBinSearchOt(arr, midPoint + 1, hi, nbPoints, inputLambdaMatrix);
    } else {
        return _recBinSearchOt(arr, lo, midPoint, nbPoints, inputLambdaMatrix);
    }
}

/**
 * Reads the point set of size nbPoints from the files of the database at offset offset
 * @param {Uint8Array | Uint16Array} arr array of coordinates of points of point sets 
 * @param {*} offset the index of the entry in the array. One entry takes has nbPoints*2 coordinates 
 * @param {*} nbPoints the number of points on the set to read
 */
function readPointSet(arr, offset, nbPoints) {
    let points = [];
    let nbBytes = nbPoints < 9 ? 1 : 2;
    let range = nbPoints < 9 ? 255 : 65535;
    let entrySize = nbPoints * 2;
    for (let i = 0; i < nbPoints; i++) {
        let pointStart = (offset * entrySize) + i * 2;
        let xBig = arr[pointStart];
        let yBig = arr[pointStart + 1];
        points.push(new Point(xBig, yBig, range));
    }
    return points;
}

/**
 * Changes the endianess of an interger
 * @param {Number} num the number
 * @param {Number} nbBytes the number of bytes the number is encoded on (1,2 or 4)
 */
function swapEndian(num, nbBytes) {
    if (nbBytes === 1) {
        return num;
    } else if (nbBytes === 2) {
        return ((num & 0xFF) << 8) | ((num >> 8) & 0xFF);
    } else if (nbBytes === 4) {
        return ((num & 0xFF) << 24) | ((num & 0xFF00) << 8) | ((num >> 8) & 0xFF00) | ((num >> 24) & 0xFF);
    }
}

/**
 * Returns all the indices of the point set entries of size n that have chSize extreme points 
 * @param {Number} n the size of the point set
 * @param {Number} chSize the number of extreme points
 */
function searchByChSize(n, chSize) {
    let key = "extrem0" + n + "_b08";
    let arr = new Uint8Array(ot_data[key]);
    let res = [];
    try {
        for (let i in arr) {
            if (Number(arr[i]) === chSize) {
                res.push(i);
            }
        }
    } catch (e) {
        console.error(e);
    }
    return res;
}

/**
 * Returns all the idices of the point set entries of size n that have chSize extreme points
 * @param {Number} n the size of the point set
 * @param {Number} layers the number of convex layers
 */
function searchByConvexLayers(n, layers) {
    let key = "extrem0" + n + "_b08";
    let arr = new Uint8Array(ot_data[key]); // contains nb extreme points 
    let res = [];
    try {
        for (let i in arr) {
            let supposition;
            if (n === arr[i]) {
                supposition = 1;
            } else if (n - arr[i] <= 3) { // shortcut to avoid repeated CH computation
                supposition = 2;
            } else {
                // recursive algo
                supposition = 0;
                let points = readPointSet(readOtypeDataset(n), i, n);
                while (points.length >= 3) {
                    let ch = grahamScan(points);
                    points = points.filter(x => !ch.includes(x));
                    supposition++;
                }
                if (points.length > 0) supposition++;
            }
            if (supposition === layers) res.push(i);
        }
    } catch (e) {
        console.error(e);
    }
    return res;
}