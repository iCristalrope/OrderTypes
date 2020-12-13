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
    canvas.line(extremes[i].x* canvas.width, (1-extremes[i].y) * canvas.height, extremes[i + 1].x * canvas.width, (1-extremes[i + 1]).y * canvas.height);
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
        canvas.ellipse(point.x * canvas.width, (1 - point.y) * canvas.height, 5);
      }
  }
}

function drawCH(canvas) {
  for (let ch of canvas.contents.ch) {
    canvas.stroke(ch[0].color);
    for (let i = 0; i < ch.length; i++) {
      let x1 = canvas.width * ch[i].x;
      let y1 = canvas.height * (1 - ch[i].y);
      let x2 = canvas.width * ch[(i + 1) % ch.length].x;
      let y2 = canvas.height * (1 - ch[(i + 1) % ch.length].y);
      canvas.line(x1, y1, x2, y2);
    }
  }
}

function drawCG(canvas) {
  for (let pointSet of canvas.contents.points) {
    canvas.stroke(pointSet[0].color);
    for (let i = 0; i < pointSet.length; i++) {
      for (let j = i+1; j < pointSet.length; j++) {
        let x1 = canvas.width * pointSet[i].x;
        let y1 = canvas.height * (1 - pointSet[i].y);
        let x2 = canvas.width * pointSet[j].x;
        let y2 = canvas.height * (1 - pointSet[j].y);
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

  let magnificationFactor = Math.min(1/(maxX - minX), 1/(maxY - minY));

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
    p.background(51);
  };
  p.draw = function () {
    p.background(51);
    update();
  };
  p.naturalClickPosition = function () {
    return {x: p.mouseX/p.width, y: 1-p.mouseY/p.height};
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
  if (idxField.value > idxField.min) idxField.value--;

  clickOnPreview();
}

function clickOnNext() {
  let idxField = document.getElementById("idx");
  if (idxField.value < idxField.max) idxField.value++;

  clickOnPreview();
}

function clickOnEquivalent() {
  if (canvasA.contents.points[0].length < 3) return;
  let points = canvasA.contents.points[0];
  let lambdaMatrixStr = minLambdaMatrixString(points);
  let equivPoints = binSearchOt(points.length, lambdaMatrixStr);
  clickOnTransferPts();
  canvasA.contents.points.push(equivPoints);
  if (canvasA.contents.drawCH) canvasA.contents.computeCH();

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
  canvasA.contents.points.push(pointSet);
  if (canvasA.contents.drawCH) canvasA.contents.computeCH();

  canvasA.redraw();
}

function afterLoading(){
  connectButtons();
  getBlobs();
}

function connectButtons() {
  document.getElementById("canvas-holder1").onclick = clickOnCanvasA;
  document.getElementById("canvas-holder2").onclick = clickOnCanvasB;
  document.getElementById("arrow_button").onclick= clickOnTransferPts;
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

  document.getElementById("visib").style.display = "none";

  for (let i = 0; i < 10; i++) {
    document.getElementById("set" + i).style.display = "none";
    document.getElementById("chk" + i).onclick = () => {canvasB.redraw()};
    document.getElementById("del" + i).onclick = () => {clickOnDeleteSubset(i)};
    document.getElementById("col" + i).oninput = () => {clickOnChangeColor(i)};
  }
}
