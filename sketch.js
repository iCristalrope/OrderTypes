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

function displayError(msg) {
  document.getElementById("errorMsg").innerText = msg;
  document.getElementById("errorBox").style.visibility = "visible";
  setTimeout(() => document.getElementById("errorBox").style.visibility = "hidden", 3000);
}

function range(n) {
  if (n < 9) return 256;
  else return 65536;
}

function orientationDet(a, b, c) {
  /*
  Basic orientation determinant function
  */
  return (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
}

function leqComparatorOrientDet(base) {
  /*
  Orientation determinant as comparison operator:
  base is the leftmost point, This function returns
  a boolean valued function taking 2 parameters, which
  in term returns true if the 2 parameters are radially
  ordered around the base point.
  */
  return (b, c) =>
    (b.x - base.x) * (c.y - b.y) - (b.y - base.y) * (c.x - b.x) > 0;
}

function findLeftmostPoint(points) {
  /*
  Finds the leftmost point and its position inside the points list
  */
  lfPoint = points[0];
  lfX = points[0].x;
  for (let i = 1; i < points.length; i++)
    if (points[i].x < lfX) {
      lfX = points[i].x;
      lfPoint = points[i];
    }
  return lfPoint;
}

function mergeSort(toSort) {
  /*
  Sorts the points using the given lower-or-equal operator
  */
  if (toSort.length <= 1) return toSort;

  const middle = Math.floor(toSort.length / 2);
  const left = toSort.slice(0, middle);
  const right = toSort.slice(middle, toSort.length);

  return merge(mergeSort(left), mergeSort(right));
}

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

function orderRadially(points, center = null) {
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

  let orderedPoints = [lfPoint].concat(mergeSort(toSort));
  //orderedPoints.push(lfPoint); //TODO
  return orderedPoints;
}

function grahamScan(points) {
  /*
  Returns the list of extrmum points in trigonometric order. The first
  and the last elements are identical.
  */
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

function drawPolygon(canvas, extremes, color) {
  if (extremes.length === 0) return;
  canvas.stroke(color);
  for (let i = 0; i < extremes.length - 1; i++) {
    canvas.line(extremes[i].x * canvas.width, (1 - extremes[i].y) * canvas.height, extremes[i + 1].x * canvas.width, (1 - extremes[i + 1]).y * canvas.height);
  }
  canvas.stroke("black");
}

function randomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

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

function drawCH(canvas) {
  for (let ch of canvas.contents.ch) {
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
  }
}

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

class ExcessivePointsError extends Error { }

class CanvasContents {
  constructor() {
    this.points = [];
    this.ch = [];
    this.drawCG = false;
    this.drawCH = false;
  }

  toggleDrawCG() {
    this.drawCG = !this.drawCG;
  }

  toogleDrawCH() {
    if (!this.drawCH && this.ch.length === 0) this.computeCH();
    else if (this.drawCH) this.ch = [];

    this.drawCH = !this.drawCH;
  }

  reset() {
    this.points = [];
    this.ch = [];
  }

  addPoint(point) {
    if (this.points.length === 0) this.points = [[point]];
    else if (this.points[0].length >= 10) return;
    else this.points[0].push(point);

    if (this.drawCH) {
      this.ch = [];
      this.computeCH();
    }
  }

  computeCH() {
    for (let pointSet of this.points) {
      if (pointSet.length === 0) continue;
      this.ch.push(grahamScan(pointSet));
    }
  }

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

var sketch = function (p) {
  p.setup = function () {
    p.canvas = p.createCanvas(500, 500);
  };
  p.draw = function () {
    p.background(51);
    update();
  };
  p.naturalClickPosition = function () {
    let x = (p.mouseX - canvasMargin)/ (p.width - 2 * canvasMargin);
    let y = 1 - (p.mouseY - canvasMargin)/ (p.height - 2 * canvasMargin);
    return { x: x, y: y};
  }
};

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

function toggleCHB() {
  canvasB.contents.toogleDrawCH();
  canvasB.redraw();
}

function toggleCGB() {
  canvasB.contents.toggleDrawCG();
  canvasB.redraw();
}

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

function clickOnEquivalent() {
  if (canvasA.contents.points[0].length < 3) return;
  let points = canvasA.contents.points[0];
  let lambdaMatrixStr = minLambdaMatrixString(points);
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

function clickOnExtremePointsSearch() {
  searchRes = [];
  if (!extrem_09_ready) {
    displayError("Files are still downloading, please wait");
    return;
  }
  let nbPoints = Number(document.getElementById("nb_extreme_points_n").value);
  let nbPointsOnCH = Number(document.getElementById("nb_points_CH_count").value);
  let res = searchByChSize(nbPoints, nbPointsOnCH);
  for (let i of res) {
    searchRes.push([nbPoints, i]);
  }
  document.getElementById("res_nb_extrem_points_total").innerText = "Found " + searchRes.length + " entries corresponding to the search";
  document.getElementById("res_nb_extrem_points_current").max = Number(searchRes.length);
  document.getElementById("search_result").style.display = "block";
  clickOnSearchGo();
}

function clickOnSearchByNbConvLayers() {
  searchRes = [];
  let nbConvLayers = Number(document.getElementById("nb_conv_layers_count").value);
  for (let nbPts = 3; nbPts <= 9; nbPts++) {
    let res = searchByConvexLayers(nbPts, nbConvLayers);
    for (let i of res) {
      searchRes.push([nbPts, i]);
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

function clickOnSearchPrev() {
  let current = document.getElementById("res_nb_extrem_points_current");
  if (Number(current.value) > Number(current.min)) current.value = (Number(current.value) - 1).toString();
  clickOnSearchGo();
}

function clickOnSearchNext() {
  let current = document.getElementById("res_nb_extrem_points_current");
  if (Number(current.value) < Number(current.max)) current.value = (Number(current.value) + 1).toString();
  clickOnSearchGo();
}

function clickOnSearchGo() {
  document.getElementById("ptnb").value = Number(searchRes[Number(document.getElementById("res_nb_extrem_points_current").value) - 1][0]);
  document.getElementById("idx").value = Number(searchRes[Number(document.getElementById("res_nb_extrem_points_current").value) - 1][1]) + 1;
  clickOnPreview();
}

function connectButtons() {
  document.getElementById("canvas-holder1").onclick = clickOnCanvasA;
  document.getElementById("canvas-holder2").onclick = clickOnCanvasB;
  document.getElementById("arrow_button").onclick = clickOnTransferPts;
  document.getElementById("magni").onclick = clickOnMagnify;
  document.getElementById("clr").onclick = clickOnClear;
  document.getElementById("showchA").onclick = toggleCHA;
  document.getElementById("showcgA").onclick = toggleCGA;
  document.getElementById("showchB").onclick = toggleCHB;
  document.getElementById("showcgB").onclick = toggleCGB;
  document.getElementById("ptnb").onchange = clickOnChnagePtsNb;
  document.getElementById("prev").onclick = clickOnPrev;
  document.getElementById("next").onclick = clickOnNext;
  document.getElementById("equiv").onclick = clickOnEquivalent;
  document.getElementById("pvw").onclick = clickOnPreview;
  document.getElementById("propExtremSearch").onclick = clickOnExtremePointsSearch;
  document.getElementById("nb_extreme_points_n").onchange = () => {document.getElementById("nb_points_CH_count").max = Number(document.getElementById("nb_extreme_points_n").value)};
  document.getElementById("res_nb_extrem_points_prev").onclick = clickOnSearchPrev;
  document.getElementById("res_nb_extrem_points_next").onclick = clickOnSearchNext;
  document.getElementById("res_nb_extrem_points_go").onclick = clickOnSearchGo;
  document.getElementById("propLayersSearch").onclick = clickOnSearchByNbConvLayers;

  document.getElementById("visib").style.display = "none";

  for (let i = 0; i < 10; i++) {
    document.getElementById("set" + i).style.display = "none";
    document.getElementById("chk" + i).onclick = () => { canvasB.redraw() };
    document.getElementById("del" + i).onclick = () => { clickOnDeleteSubset(i) };
    document.getElementById("col" + i).oninput = () => { clickOnChangeColor(i) };
  }
}
