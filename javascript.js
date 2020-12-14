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
    constructor() {
        let x, y, range=255, color = "#888888";
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

//TODO debug
function test() {
    let buff = new Uint8Array(ot_data["otypes05_b08"]);


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

    console.log(minLambdaMatrixString(pointSets[0]));
    console.log(minLambdaMatrixString(pointSets[1]));
    console.log(minLambdaMatrixString(pointSets[2]));

    console.log(buff);
    return "end of functioin test";

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
}

/**
 * Computes the lexicographically smallest lambda matrix of a point set and returns it as a string, row after row.
 * //TODO: if n is large format breaks (more than one digit required per entry)  
 * @param {Point[]} pointSet 
 */
/*
function minLambdaMatrixString(pointSet) {
    let indices = [];
    for (let i = 0; i < pointSet.length; i++) {
        indices.push(i);
    }

    let arr = derefIndices(indices, pointSet);
    let min_matrix = _lambdaMatrixStr(arr);
    while (true) {
        indices = nextPermutation(indices);
        if (indices === undefined) {
            break;
        }
        arr = derefIndices(indices, pointSet);
        let matrix = _lambdaMatrixStr(arr);

        if (matrix.localeCompare(min_matrix) === -1) {
            min_matrix = matrix;
        }
    }

    return min_matrix;
}
*/

function minLambdaMatrixString(pointSet) {
    let CH = grahamScan(pointSet);
    let minMatrix = undefined;

    // try each point on CH as pivot
    for (let pivotId in CH) {
        let tmpMatrix = "";
        let pivotPoint = CH[pivotId];
        let ordered = orderRadially(pointSet, pivotPoint);
        let reversed = [ordered[0]].concat(ordered.slice(1).reverse());
        
        for (let i in reversed) {
            for (let j in reversed) {
                tmpMatrix += nbPointsLeftOf(reversed[i], reversed[j], reversed);
            }
        }

        console.log(tmpMatrix);
        if (minMatrix === undefined || tmpMatrix.localeCompare(minMatrix) < 0){
            minMatrix = tmpMatrix;
        }
    }

    return minMatrix;
}

/**
 * 
 * @param {*} arr 
 * @param {*} left 
 */
function _lambdaMatrixStr(arr, left = true) {
    let matrix = "";
    for (let row = 0; row < arr.length; row++) {
        for (let col = 0; col < arr.length; col++) {
            if (row !== col) {
                matrix += nbPointsLeftOf(arr[row], arr[col], arr, left);
            } else {
                matrix += "0";
            }
        }
    }
    return matrix;
}

/**
 * Function that replaces an array of indices to objects by the objects themselves
 * @param {number[]} indices the list of indices to replace
 * @param {[]} arr the objects
 */
function derefIndices(indices, arr) {
    let out = [];
    for (let i in indices) {
        out.push(arr[indices[i]]);
    }
    return out;
}

/**
 * https://www.youtube.com/watch?v=VVPUAUVbjfM
 * @param {number[]} arr an array of numbers 
 */
function nextPermutation(arr) {
    // find peak
    let peak;
    for (let i = arr.length; i >= 0; i--) {
        if (i === 0) {
            return undefined;
        }

        if (arr[i] > arr[i - 1]) {
            peak = i;
            break;
        }
    }

    // find largest number on right of peak
    for (let j = arr.length - 1; j >= 0; j--) {
        if (arr[j] > arr[peak - 1]) {
            let temp = arr[j];
            arr[j] = arr[peak - 1];
            arr[peak - 1] = temp;
            break;
        }
    }

    // reverse from peak to end of arr
    let start = peak;
    let end = arr.length - 1;
    while (start < end) {
        let temp = arr[start];
        arr[start] = arr[end];
        arr[end] = temp;
        start++;
        end--;
    }
    return arr;
}



/**
 * Computes the number of points different from point1 and point2 in points that are to the left of the line point1-point2
 * @param {Point} point1 first point of the line
 * @param {Point} point2 second point of the line
 * @param {Point[]} points the set complete set of points
 * @param {boolean} left indicated the direction of the turn with the line
 */
function nbPointsLeftOf(point1, point2, points, left=true) {
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
 * Binary search for the point corresponding to the order type of the given lambda matrix 
 * @param {number} nbPoints the size of the order type
 * @param {string} minLambdaMatrixString the lambda matrix flattended into a string (row after row)
 * @returns {Point[]} the point set realisation corresponding to the given lambda matrix contained in the database or undefined if it wasn't found
 */
function binSearchOt(nbPoints, minLambdaMatrixString) {
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
    return _recBinSearchOt(arr, 0, arr.length / entrySize - 1, nbPoints, minLambdaMatrixString);
}

/**
 * Recursive helper function for a binary search on order types
 * lo and hi are entry offsets
 */
function _recBinSearchOt(arr, lo, hi, nbPoints, lambdaMatrixStr) {
    let midPoint = Math.floor((lo + hi) / 2);
    let pointSet = readPointSet(arr, midPoint, nbPoints);


    let ch = grahamScan(pointSet);
    let minMatrix = _lambdaMatrixStr(pointSet, ch[0]);
    for (let i = 1; i < ch.length; i++) {
        let tmpMatrix = _lambdaMatrixStr(orderRadially(pointSet, ch[i]));
        if (tmpMatrix.localeCompare(minMatrix) < 0) {
            minMatrix = tmpMatrix;
        }
    }

    let lmatrix = minMatrix; //TODO
    //let lmatrix = minLambdaMatrixString(pointSet);
    console.log("comparing: ", lmatrix, " to ", lambdaMatrixStr);
    let res = lmatrix.localeCompare(lambdaMatrixStr);

    console.log("binSearch: ", _lambdaMatrixStr(pointSet), "\ne: ", lambdaMatrixStr);


    if (lo === hi) {
        if (res === 0) {
            return {points: pointSet, index: lo};
        } else {
            return undefined;
        }
    }

    if (res === 0) {
        return {points: pointSet, index: midPoint};
    } else if (res < 0) {
        return _recBinSearchOt(arr, midPoint + 1, hi, nbPoints, lambdaMatrixStr);
    } else {
        return _recBinSearchOt(arr, lo, midPoint - 1, nbPoints, lambdaMatrixStr);
    }
}

/**
 * //TODO
 * @param {*} arr  
 * @param {*} offset 
 * @param {*} nbPoints 
 */
function readPointSet(arr, offset, nbPoints) {
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