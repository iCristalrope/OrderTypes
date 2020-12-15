const otypesNb = {
    "3": 1,
    "4": 2,
    "5": 3,
    "6": 16,
    "7": 135,
    "8": 3315,
    "9": 158817,
    "10": 14309547
};

var canvasMargin = 10;

var searchRes = [];

/**
 * Displays an error message for 2 seconds in upper part of the demo page.
 * @param msg
 */
function displayError(msg) {
    document.getElementById("errorMsg").innerText = msg;
    document.getElementById("errorBox").style.visibility = "visible";
    setTimeout(() => document.getElementById("errorBox").style.visibility = "hidden", 3000);
}

/**
 * Computes the orientation determinant for 3 points.
 * @param a first point
 * @param b second point
 * @param c third point
 * @returns {number} returns 0 if the points are on a line, a negative
 * value if the points form a right turn and a positive value if they
 * form a left turn.
 */
function orientationDet(a, b, c) {
    return (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
}

/**
 * Returns a function which can act like a position-based comparison
 * operator for the merge sort.
 * @param base the point around which the others should be ordered
 * @returns {function(*, *): boolean}
 */
function leqComparatorOrientDet(base) {
    return (b, c) =>
        (b.x - base.x) * (c.y - b.y) - (b.y - base.y) * (c.x - b.x) >= 0;
}

/**
 * Finds the leftmost point of the set (has the minimal x coordinate)
 * @param points a set points
 * @returns {*} the leftmost point
 */
function findLeftmostPoint(points) {
    lfPoint = points[0];
    lfX = points[0].x;
    for (let i = 1; i < points.length; i++)
        if (points[i].x < lfX) {
            lfX = points[i].x;
            lfPoint = points[i];
        }
    return lfPoint;
}

/**
 * Generic merge sort implementation.
 * @param toSort the elements to be sorted
 * @returns {*[]|*} the sorted element
 */
function mergeSort(toSort) {
    if (toSort.length <= 1) return toSort;

    const middle = Math.floor(toSort.length / 2);
    const left = toSort.slice(0, middle);
    const right = toSort.slice(middle, toSort.length);

    return merge(mergeSort(left), mergeSort(right));
}

/**
 * Part of the merge sort implementation: mergers two arrays
 * while maintaining the order of the elements
 * @param left the first sorted array
 * @param right the second sorted array
 * @returns {*[]} the merged sorted array
 */
function merge(left, right) {
    let merged = [],
        leftPos = 0,
        rightPos = 0;

    while (leftPos < left.length && rightPos < right.length) {
        if (leq(left[leftPos], right[rightPos])) {
            merged.push(left[leftPos]);
            leftPos++;
        } else {
            merged.push(right[rightPos]);
            rightPos++;
        }
    }

    return merged.concat(left.slice(leftPos)).concat(right.slice(rightPos));
}

function orderRadially(points, center = null, clockwise = false) {
  /*
  Returns the ordered list of point with respect to the leftmost
  point.
  */
  let lfPoint;
  if (!center) lfPoint = findLeftmostPoint(points);
  else lfPoint = center;
  const lfPointIndex = points.indexOf(lfPoint);

  leq = leqComparatorOrientDet(lfPoint);
  let toSort = [...points];
  toSort.splice(lfPointIndex, 1);

  let ordered = [lfPoint].concat(mergeSort(toSort));
  if (clockwise){
    return [ordered[0]].concat(ordered.slice(1).reverse());
  }
  return ordered;
}

function grahamScan(points) {
    if (points.length <= 3) return [...points];

    let orderedPoints = orderRadially(points);
    let extremePoints = orderedPoints.slice(0, 2);

    for (let i = 2; i < orderedPoints.length; i++) {
        while (
            orientationDet(
                extremePoints[extremePoints.length - 2],
                extremePoints[extremePoints.length - 1],
                orderedPoints[i]
            ) <= 0
            ) {
            extremePoints.pop();
        }
        extremePoints.push(orderedPoints[i]);
    }

    return extremePoints;
}

/**
 * Picks a random color.
 * @returns {string} a random color in HEX RGB format
 */
function randomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

/**
 * Draws a set of points on a given canvas.
 * @param canvas on which the points should be drawn
 * @param subsetVisibility if false indicates that all the
 * subsets should be drawn, otherwise only the set subsets
 * should be drawn.
 */
function drawPoints(canvas, subsetVisibility = false) {
    let points = canvas.contents.points;

    for (i = 0; i < points.length; i++) {
        let pointSubset = points[i];
        if (!subsetVisibility || subsetVisibility[i])
            for (let point of pointSubset) {
                canvas.noStroke();
                canvas.fill(point.color);
                let x = point.x * (canvas.width - 2 * canvasMargin) + canvasMargin;
                let y = (1 - point.y) * (canvas.height - 2 * canvasMargin) + canvasMargin;
                canvas.ellipse(x, y, 5);
            }
    }
}

/**
 * Draws the convex hull which must be in the form of sets of points.
 * @param canvas on which the convex hull should be drawn
 * @param chs if null, draw the computed convex hulls in the canvas
 * contents, otherwise draw the one given in parameter
 */
function drawCH(canvas, chs = null) {
    if (!chs) chs = canvas.contents.ch;
    for (let ch of chs) {
        canvas.stroke(ch[0].color);
        for (let i = 0; i < ch.length; i++) {
            let x1 = (canvas.width - 2 * canvasMargin) * ch[i].x + canvasMargin;
            let y1 = (canvas.height - 2 * canvasMargin) * (1 - ch[i].y) + canvasMargin;
            let x2 = (canvas.width - 2 * canvasMargin) * ch[(i + 1) % ch.length].x + canvasMargin;
            let y2 = (canvas.height - 2 * canvasMargin) * (1 - ch[(i + 1) % ch.length].y) + canvasMargin;
            canvas.line(x1, y1, x2, y2);
        }
    }
}

/**
 * Draw the complete graph of the sets of points found in the
 * canvas contents.
 * @param canvas on which the drawing should take place
 */
function drawCG(canvas) {
    for (let pointSet of canvas.contents.points) {
        canvas.stroke(pointSet[0].color);
        for (let i = 0; i < pointSet.length; i++) {
            for (let j = i + 1; j < pointSet.length; j++) {
                let x1 = (canvas.width - 2 * canvasMargin) * pointSet[i].x + canvasMargin;
                let y1 = (canvas.height - 2 * canvasMargin) * (1 - pointSet[i].y) + canvasMargin;
                let x2 = (canvas.width - 2 * canvasMargin) * pointSet[j].x + canvasMargin;
                let y2 = (canvas.height - 2 * canvasMargin) * (1 - pointSet[j].y) + canvasMargin;
                canvas.line(x1, y1, x2, y2);
            }
        }

    }
}

/**
 * Draw the convex layers of the sets of points found the
 * canvas contents.
 * @param canvas on which the drawing should take place
 */
function drawCL(canvas) {
    for (let pointSet of canvas.contents.points) {
        canvas.stroke(pointSet[0].color);
        let points = [...pointSet];
        let chs = [];
        while (points.length >= 3) {
            let ch = grahamScan(points);
            chs.push(ch);
            points = points.filter(x => !ch.includes(x));
        }
        drawCH(canvas, chs);
    }
}

/**
 * Redraws the contents of the two canvases. Should be called
 * everytime the canvas contents change and when the display
 * options associated to some canvas change.
 */
function update() {
    drawPoints(canvasA);
    let subsetVisibility = [];
    for (let i = 0; i < canvasB.contents.points.length; i++) {
        subsetVisibility.push(document.getElementById("chk" + i).checked);
    }
    drawPoints(canvasB, subsetVisibility);
    for (let canvas of [canvasA, canvasB]) {
        if (canvas.contents.drawCH) drawCH(canvas);
        if (canvas.contents.drawCG) drawCG(canvas);
        if (canvas.contents.drawCL) drawCL(canvas);
    }
    showLM();
}

/**
 * Magnifies the drawing made by the user such that
 * it spreads over the entire canvas. After magnifying
 * a drawing, it will be aligned to the origin and its
 * maximum dimension (width/ height) will be the same
 * as the corresponding canvas dimension.
 * @param points is the set of points to be magnified
 */
function magnify(points) {
    if (points.length === 0) return;

    let minX = points[0].x, maxX = points[0].x, minY = points[0].y, maxY = points[0].y;
    for (let i = 1; i < points.length; i++) {
        if (points[i].x < minX) minX = points[i].x;
        else if (points[i].x > maxX) maxX = points[i].x;
        if (points[i].y < minY) minY = points[i].y;
        else if (points[i].y > maxY) maxY = points[i].y;
    }

    let magnificationFactor = Math.min(1 / (maxX - minX), 1 / (maxY - minY));

    for (let i = 0; i < points.length; i++) {
        points[i].x -= minX;
        points[i].y -= minY;
        points[i].x *= magnificationFactor;
        points[i].y *= magnificationFactor;
    }
}

class ExcessivePointsError extends Error {
}

/**
 * Class whose instances are to be associated to a canvas
 * object in order to store its contents.
 */
class CanvasContents {
    constructor() {
        this.points = [];
        this.ch = [];
        this.drawCG = false;
        this.drawCH = false;
        this.drawCL = false;
    }

    toggleDrawCG() {
        this.drawCG = !this.drawCG;
    }

    toogleDrawCH() {
        if (!this.drawCH && this.ch.length === 0) this.computeCH();
        else if (this.drawCH) this.ch = [];

        this.drawCH = !this.drawCH;
    }

    toggleDrawCL() {
        this.drawCL = !this.drawCL;
    }

    reset() {
        this.points = [];
        this.ch = [];
    }

    /**
     * Adds a point if the maximum number of points accepted was not met yet (9).
     * Recomputes the convex hulls since the newly added point might have
     * changed it.
     * @param point the point to be added
     */
    addPoint(point) {
        if (this.points.length === 0) this.points = [[point]];
        else if (this.points[0].length >= 9) return;
        else this.points[0].push(point);

        if (this.drawCH) {
            this.ch = [];
            this.computeCH();
        }
    }

    /**
     * Computes the convex hulls of the points sets stored so far
     * and saves them such that they can be easily displayed.
     */
    computeCH() {
        for (let pointSet of this.points) {
            if (pointSet.length === 0) continue;
            this.ch.push(grahamScan(pointSet));
        }
    }

    /**
     * Deletes a certain set of points.
     * @param i is the index of the set of points to be deleted
     */
    deleteSubset(i) {
        if (i !== this.points.length - 1) {
            for (let j = i + 1; j < this.points.length; j++) {
                this.points[j - 1] = this.points[j];
                this.ch[j - 1] = this.ch[j];
            }
        }
        this.points.pop();
        this.ch.pop();
    }
}

/**
 * Use to create a P5 canvas in instance mode.
 * @param p
 */
var sketch = function (p) {
    p.setup = function () {
        p.canvas = p.createCanvas(500, 500);
    };
    p.draw = function () {
        p.background(51);
        update();
    };

    /**
     * Computes the coordinates of the point such that the click
     * in the bottom left corner would correspond to the position (0,0)
     * @returns {{x: number, y: number}} the natural coordinates
     */
    p.naturalClickPosition = function () {
        let x = (p.mouseX - canvasMargin) / (p.width - 2 * canvasMargin);
        let y = 1 - (p.mouseY - canvasMargin) / (p.height - 2 * canvasMargin);
        return {x: x, y: y};
    }
};

// instantiate the canvases
let canvasA = new p5(sketch, "canvas-holder1");
canvasA.contents = new CanvasContents();
canvasA.noLoop();
let canvasB = new p5(sketch, "canvas-holder2");
canvasB.contents = new CanvasContents();
canvasB.noLoop();

function clickOnCanvasA() {
    canvasA.contents.addPoint(new Point(canvasA.naturalClickPosition()));
    canvasA.redraw();
}

function clickOnCanvasB() {
    // clicks on canvas B should be ignored for the moment
}

function clickOnClear() {
    canvasA.contents.reset();
    canvasA.redraw();
}

function clickOnMagnify() {
    magnify(canvasA.contents.points[0]);
    canvasA.redraw();
}

function toggleCHA() {
    canvasA.contents.toogleDrawCH();
    canvasA.redraw();
}

function toggleCGA() {
    canvasA.contents.toggleDrawCG();
    canvasA.redraw();
}

function toggleCLA() {
    canvasA.contents.toggleDrawCL();
    canvasA.redraw();
}

function toggleCHB() {
    canvasB.contents.toogleDrawCH();
    canvasB.redraw();
}

function toggleCGB() {
    canvasB.contents.toggleDrawCG();
    canvasB.redraw();
}

function toggleCLB() {
    canvasB.contents.toggleDrawCL();
    canvasB.redraw();
}

/**
 * Stores the points drawn on the working canvas (A) in the
 * comparison canvas (B) if the later is not already full. The
 * latter accepts up to 10 point sets, but this limitation is
 * arbitrary and its scope is to maintain the readability.
 */
function transferPoints() {
    if (canvasB.contents.points.length >= 10) return;
    let color = randomColor();
    for (let point of canvasA.contents.points[0]) point.color = color;
    canvasB.contents.points.push(canvasA.contents.points[0]);
    if (canvasB.contents.ch.length !== 0) canvasB.contents.ch.push(grahamScan(canvasA.contents.points[0]));
    canvasA.contents.reset();
    document.getElementById("visib").style.display = "block";
}

function clickOnTransferPts() {
    if (canvasA.contents.points.length === 0) return;
    transferPoints();

    // enable the display options for the points sets in the canvas
    let i = canvasB.contents.points.length - 1;
    document.getElementById("set" + i).style.display = "block";
    document.getElementById("chk" + i).checked = true;
    document.getElementById("col" + i).value = canvasB.contents.points[i][0].color;

    canvasA.redraw();
    canvasB.redraw();
}

function clickOnDeleteSubset(i) {
    canvasB.contents.deleteSubset(i);

    if (canvasB.contents.points.length === 0) document.getElementById("visib").style.display = "none";

    for (let i = 0; i < canvasB.contents.points.length; i++) {
        document.getElementById("col" + i).value = canvasB.contents.points[i][0].color;
    }
    document.getElementById("set" + canvasB.contents.points.length).style.display = "none";

    canvasB.redraw();
}

function clickOnChangeColor(i) {
    for (let point of canvasB.contents.points[i]) point.color = document.getElementById("col" + i).value;
    canvasB.redraw();
}

function clickOnChnagePtsNb() {
    let selectedValue = document.getElementById("ptnb").value;
    let idxField = document.getElementById("idx");
    idxField.max = otypesNb[selectedValue];
    idxField.value = idxField.min;
}

function clickOnPrev() {
    let idxField = document.getElementById("idx");
    if (Number(idxField.value) > Number(idxField.min)) idxField.value = (Number(idxField.value) - 1).toString();

    clickOnPreview();
}

function clickOnNext() {
    let idxField = document.getElementById("idx");
    if (Number(idxField.value) < Number(idxField.max)) idxField.value = (Number(idxField.value) + 1).toString();

    clickOnPreview();
}

/**
 * Retrieves the equivalent set of points from teh database that corresponds
 * to the set of points drawn by the user and displays it on the working
 * canvas, after the user input is transfered to the comparison canvas.
 */
function clickOnEquivalent() {
    if (canvasA.contents.points[0].length < 3) return;
    let points = canvasA.contents.points[0];
    let lambdaMatrixStr = minLambdaMatrixString(points);
    console.log(lambdaMatrixStr);
    let res = binSearchOt(points.length, lambdaMatrixStr);
    let equivPoints = res.points;
    clickOnTransferPts();
    for (let point of equivPoints) {
        point.x /= point.range;
        point.y /= point.range;
    }
    canvasA.contents.points.push(equivPoints);
    if (canvasA.contents.drawCH) canvasA.contents.computeCH();

    document.getElementById("ptnb").value = equivPoints.length.toString();
    document.getElementById("idx").value = (res.index + 1).toString();

    canvasA.redraw();
    canvasB.redraw();
}

/**
 * Retrieves a specific set of points from the database and displays it
 * on the working canvas. The set of points to be displayed is determined
 * by the number of points it contains and by its index in the database.
 */
function clickOnPreview() {
    canvasA.contents.reset();
    let id = Number(document.getElementById("idx").value) - 1;
    let nb = Number(document.getElementById("ptnb").value);

    let arr;
    if (nb < 9) {
        arr = new Uint8Array(ot_data[`otypes0${nb}_b08`]);
    } else {
        let pts = ("0" + nb).slice(-2);
        arr = new Uint16Array(ot_data[`otypes${pts}_b16`]);
    }

    let pointSet = readPointSet(arr, id, nb);
    for (let point of pointSet) {
        point.x /= point.range;
        point.y /= point.range;
    }
    canvasA.contents.points.push(pointSet);
    if (canvasA.contents.drawCH) canvasA.contents.computeCH();

    canvasA.redraw();
}

function clearSearchResults() {
    searchRes = [];
    document.getElementById("search_result").style.display = "none";
}

/**
 * Reacts to the action of user of changing the search type
 * by modifying the displayed fields in order to match the
 * desired search method.
 * @param selectedObject the selected search type
 */
function changeSearchType(selectedObject) {
    let type = selectedObject.value;
    switch (type) {
        case "entry_index":
            document.getElementById("index_search_div").style.display = "block";
            document.getElementById("property_search_div").style.display = "none";
            // remove the search results for properties
            clearSearchResults();
            break;
        case "property":
            if (!extrem_09_ready) {
                getBlobsExtremePoints();
            }
            document.getElementById("index_search_div").style.display = "none";
            document.getElementById("property_search_div").style.display = "block";
            break;
    }
}

/**
 * Change the input fields of the search in order to match
 * the required fields of the property selected by the user.
 * @param selectedObject
 */
function changeSearchProperty(selectedObject) {
    clearSearchResults();
    let property = selectedObject.value;
    switch (property) {
        case "nb_points_CH":
            document.getElementById("nb_points_CH_div").style.display = "block";
            document.getElementById("nb_conv_layers_div").style.display = "none";
            break;
        case "nb_conv_layers":
            document.getElementById("nb_points_CH_div").style.display = "none";
            document.getElementById("nb_conv_layers_div").style.display = "block";
            break;
    }
}

/**
 * Performs a search for order types with a certain number of points
 * (selected by the user) and a certain number of points on the convex
 * hull. The search results panel is displayed in order to allow the user
 * to walk though the different results and the first result (if any) is
 * loaded in the working canvas.
 */
function clickOnExtremePointsSearch() {
    clearSearchResults();
    if (!extrem_09_ready) {
        displayError("Files are still downloading, please wait");
        return;
    }
    let nbPoints = document.getElementById("nb_extreme_points_n").value;
    let nbPointsOnCH = Number(document.getElementById("nb_points_CH_count").value);
    if (nbPoints === "any") {
        for (let nbPts = nbPointsOnCH; nbPts <= 9; nbPts++) {
            let res = searchByChSize(nbPts, nbPointsOnCH);
            for (let i of res) {
                searchRes.push([nbPts, Number(i)]);
            }
        }
    } else {
        nbPoints = Number(nbPoints);
        let res = searchByChSize(nbPoints, nbPointsOnCH);
        for (let i of res) {
            searchRes.push([nbPoints, Number(i)]);
        }
    }
    document.getElementById("res_nb_extrem_points_total").innerText = "Found " + searchRes.length + " entries corresponding to the search";
    document.getElementById("res_nb_extrem_points_current").max = Number(searchRes.length);
    document.getElementById("search_result").style.display = "block";
    clickOnSearchGo();
}

/**
 * Performs a search for order types with a certain number of convex layers
 * (selected by the user). The search results panel is displayed in order to
 * allow the user to see the different results and the first result (if any) is
 * loaded in the working canvas.
 */
function clickOnSearchByNbConvLayers() {
    clearSearchResults();
    let nbConvLayers = Number(document.getElementById("nb_conv_layers_count").value);
    for (let nbPts = 3; nbPts <= 9; nbPts++) {
        let res = searchByConvexLayers(nbPts, nbConvLayers);
        for (let i of res) {
            searchRes.push([nbPts, Number(i)]);
        }
    }
    document.getElementById("res_nb_extrem_points_total").innerText = "Found " + searchRes.length + " entries corresponding to the search";
    document.getElementById("res_nb_extrem_points_current").max = Number(searchRes.length);
    document.getElementById("search_result").style.display = "block";
    clickOnSearchGo();
}

function afterLoading() {
    connectButtons();
    getBlobs();
}

/**
 * Sets the previous search result in the working canvas.
 */
function clickOnSearchPrev() {
    let current = document.getElementById("res_nb_extrem_points_current");
    if (Number(current.value) > Number(current.min)) current.value = (Number(current.value) - 1).toString();
    clickOnSearchGo();
}

/**
 * Sets the next search result in the working canvas.
 */
function clickOnSearchNext() {
    let current = document.getElementById("res_nb_extrem_points_current");
    if (Number(current.value) < Number(current.max)) current.value = (Number(current.value) + 1).toString();
    clickOnSearchGo();
}

/**
 * Displays a certain search result demanded by the user.
 */
function clickOnSearchGo() {
    document.getElementById("ptnb").value = Number(searchRes[Number(document.getElementById("res_nb_extrem_points_current").value) - 1][0]);
    document.getElementById("idx").value = Number(searchRes[Number(document.getElementById("res_nb_extrem_points_current").value) - 1][1]) + 1;
    clickOnPreview();
}

/**
 * Displays the natural (minimum) lambda matrix of the points
 * drawn on the working canvas (A).
 */
function showLM() {
    if (document.getElementById("showlm").checked && canvasA.contents.points.length !== 0) {
        let lmatField = document.getElementById("lmatrix");
        lmatField.style.display = "block";
        let lmatVal = minLambdaMatrixString(canvasA.contents.points[0]);
        console.log(lmatVal);
        let lmatHTML = "<table class='matrix'>\n";
        let nbPts = canvasA.contents.points[0].length;
        for (let i = 0; i < nbPts; i++) {
            lmatHTML += "<tr>\n";
            for (let j = 0; j < nbPts; j++) {
                let val;
                if (i === j) val = "&omega;";
                else val = lmatVal[i * nbPts + j];
                lmatHTML += "<td>" + val + "</td>\n";
            }
            lmatHTML += "</tr>\n";
        }
        lmatHTML += "</table>\n";
        lmatField.innerHTML = lmatHTML;
    } else {
        document.getElementById("lmatrix").style.display = "none";
    }
}

function connectButtons() {
    document.getElementById("canvas-holder1").onclick = clickOnCanvasA;
    document.getElementById("canvas-holder2").onclick = clickOnCanvasB;
    document.getElementById("arrow_button").onclick = clickOnTransferPts;
    document.getElementById("magni").onclick = clickOnMagnify;
    document.getElementById("clr").onclick = clickOnClear;
    document.getElementById("showchA").onclick = toggleCHA;
    document.getElementById("showcgA").onclick = toggleCGA;
    document.getElementById("showclA").onclick = toggleCLA;
    document.getElementById("showlm").onclick = showLM;
    document.getElementById("showchB").onclick = toggleCHB;
    document.getElementById("showcgB").onclick = toggleCGB;
    document.getElementById("showclB").onclick = toggleCLB;
    document.getElementById("ptnb").onchange = clickOnChnagePtsNb;
    document.getElementById("prev").onclick = clickOnPrev;
    document.getElementById("next").onclick = clickOnNext;
    document.getElementById("equiv").onclick = clickOnEquivalent;
    document.getElementById("pvw").onclick = clickOnPreview;
    document.getElementById("propExtremSearch").onclick = clickOnExtremePointsSearch;
    document.getElementById("nb_extreme_points_n").onchange = () => {
        document.getElementById("nb_points_CH_count").max = Number(document.getElementById("nb_extreme_points_n").value)
    };
    document.getElementById("res_nb_extrem_points_prev").onclick = clickOnSearchPrev;
    document.getElementById("res_nb_extrem_points_next").onclick = clickOnSearchNext;
    document.getElementById("res_nb_extrem_points_go").onclick = clickOnSearchGo;
    document.getElementById("propLayersSearch").onclick = clickOnSearchByNbConvLayers;

    document.getElementById("visib").style.display = "none";

    for (let i = 0; i < 10; i++) {
        document.getElementById("set" + i).style.display = "none";
        document.getElementById("chk" + i).onclick = () => {
            canvasB.redraw()
        };
        document.getElementById("del" + i).onclick = () => {
            clickOnDeleteSubset(i)
        };
        document.getElementById("col" + i).oninput = () => {
            clickOnChangeColor(i)
        };
    }
}