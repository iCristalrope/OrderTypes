window.onload = function () {
    getBlobs();
    console.log($("p")[0]);
}

var ot_data = {};
var data_ot9_ready = false;

/**
 * Loads a portion of the files to search through of the database
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

////////////////////

class Point {
    constructor(x, y, range = 256, color = "black") {
        this.x = Math.round(x);
        this.y = Math.round(y);
        this.color = color;
        this.range = range;
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

//TODO debug
function test() {
    let buff = new Uint8Array(ot_data["otypes05_b08"]);

    console.log(buff[0]);
    console.log(buff[1]);
    console.log(buff[2]);
    console.log(buff[3]);
    console.log(buff[4]);
    console.log(buff[5]);
    console.log(buff[6]);
    console.log(buff[7]);
    console.log(buff[8]);
    console.log(buff[9]);
    console.log(buff[10]);
    console.log(buff[11]);
    console.log(buff[12]);
    console.log(buff[13]);
    console.log(buff[14]);
    console.log(buff[15]);
    console.log(buff[16]);
    console.log(buff[17]);
    console.log(buff[18]);
    console.log(buff[19]);
    console.log(buff[20]);
    console.log(buff[21]);
    console.log(buff[22]);
    console.log(buff[23]);
    console.log(buff[24]);
    console.log(buff[25]);
    console.log(buff[26]);
    console.log(buff[27]);
    console.log(buff[28]);
    console.log(buff[29]);


    pointSets = [];
    let nbSets = 3;
    let nbPoints = 5;
    let index = 0;
    for (let set = 0; set < nbSets; set++) {
        let points = [];
        for (let point = 0; point < nbPoints; point++) {
            let x = buff[index++];
            let y = buff[index++];
            points.push(new Point(x, y));
        }
        pointSets.push(points);
    };
    for (let i in pointSets[1]) {
        console.log(pointSets[1][i]);
    }

    let lambda1 = lambdaMatrixString(pointSets[2]);
    let set1bis = _readPointSet(buff, 2, nbPoints);
    let lambda1bis = lambdaMatrixString(set1bis);
    console.log("llllll", lambda1, lambda1bis);
    console.log("set1", pointSets[2]);
    console.log("set1bis", set1bis);
}

/**
 * Computes the lexicographically smallest lambda matrix of a point set and returns it as a string, row after row.
 * //TODO: if n is large format breaks (more than one digit required per entry)  
 * @param {Point[]} pointSet 
 */
function lambdaMatrixString(pointSet) {
    let indices = [];
    for (let i = 0; i < pointSet.length; i++) {
        indices.push(i);
    }

    let ots = [];
    let perms = genPerms(indices);

    for (let i in perms) {
        let perm = perms[i];
        let str = "";
        for (let row = 0; row < perm.length; row++) {
            for (let col = 0; col < perm.length; col++) {
                str += nbPointsLeftOf(pointSet[perm[row]], pointSet[perm[col]], pointSet);
            }
        }
        ots.push(str);
    }

    ots.sort();
    return ots[0];
}

/**
 * Computes the number of points different from point1 and point2 in points that are to the left of the line point1-point2
 * @param {Point} point1 first point of the line
 * @param {Point} point2 second point of the line
 * @param {Point[]} points the set complete set of points
 */
function nbPointsLeftOf(point1, point2, points) {
    let nbLeft = 0;
    for (let i in points) {
        let point = points[i];
        if (!point.equals(point1) && !point.equals(point2)) {
            if (orientationDet(point1, point2, point) < 0) {
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
 * Generates all permutations of a set of numbers
 * @param {number[]} numbers the number 
 * @returns {number[][]} the list of permutations
 */
function genPerms(numbers) {
    let perms = [];
    nextPerm(numbers, [], perms);
    return perms;
}

/**
 * Recursive helper function for the generation of permutations
 */
function nextPerm(indices, buff, out) {
    if (buff.length === indices.length) {
        out.push(buff);
        return;
    }
    for (let i of indices) {
        if (!buff.includes(i)) {
            let buff2 = [...buff];
            buff2.push(i);
            nextPerm(indices, buff2, out);
        }
    }
}

/**
 * Binary search for the point corresponding to the order type of the given lambda matrix 
 * @param {number} nbPoints the size of the order type
 * @param {string} lambdaMatrixString the lambda matrix flattended into a string (row after row)
 * @returns {Point[]} the point set realisation corresponding to the given lambda matrix contained in the database or undefined if it wasn't found
 */
function binSearchOt(nbPoints, lambdaMatrixString) {
    let arr;
    if (nbPoints === 9) {
        let pts = ("0" + nbPoints).slice(-2);
        arr = new Uint16Array(ot_data[`otypes${pts}_b16`]);
    } else if (nbPoints < 9) {
        arr = new Uint8Array(ot_data[`otypes0${nbPoints}_b08`]);
    } else {
        console.log("unhandled number of points");
        return undefined;
    }

    let entrySize = nbPoints * 2;
    return _recBinSearchOt(arr, 0, arr.length / entrySize - 1, nbPoints, lambdaMatrixString);
}

/**
 * Recursive helper function for a binary search on order types
 */
function _recBinSearchOt(arr, lo, hi, nbPoints, lambdaMatrixStr) {
    let midPoint = Math.floor((lo + hi) / 2);
    let entrySize = nbPoints * 2;
    let pointSet = _readPointSet(arr, midPoint * entrySize, nbPoints);
    let lmatrix = lambdaMatrixString(pointSet);
    let res = lmatrix.localeCompare(lambdaMatrixStr);

    if (lo === hi) {
        if (res === 0) {
            return pointSet;
        } else {
            return undefined;
        }
    }

    if (res === 0) {
        return pointSet;
    } else if (res < 0) {
        return _recBinSearchOt(arr, lo, midPoint, nbPoints, lambdaMatrixStr);
    } else {
        return _recBinSearchOt(arr, midPoint, hi, nbPoints, lambdaMatrixStr);
    }
}

function _readPointSet(arr, offset, nbPoints) {
    let points = [];
    let nbBytes = nbPoints < 9 ? 1 : 2;
    let entrySize = nbPoints * 2;
    for (let i = 0; i < nbPoints; i++) {
        let pointStart = (offset * entrySize) + i * 2;
        let xBig = arr[pointStart];
        let yBig = arr[pointStart + 1];
        points.push(new Point(swapEndian(xBig, nbBytes), swapEndian(yBig, nbBytes))); // BigEndian to LittleEndian
    }
    return points;
}

/**
 * Changes the endianess of an interger
 * @param {*} num the number
 * @param {*} nbBytes the number of bytes the number is encoded on (1,2 or 4)
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