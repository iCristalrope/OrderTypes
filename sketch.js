/* eslint-disable no-undef, no-unused-vars */
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

function otypeToPoints(otype) {
  /*
  Takes a string defining an order type from the dataset
  and returns a corresponding list of points.
  */
  otype = otype.trim().replace("\n", " ");
  let strPoints = otype.split(" ");
  let points = [];
  let r = range(strPoints.length);
  for (let i = 0; i < strPoints.length; i++) {
    let numPoint = parseInt(strPoints[i], 16);
    points.push(new Point(Math.floor(numPoint / r), numPoint % r, r));
  }
  return points;
}

function pointsToOtype(points) {
  /*
  Takes an array of points and produces a string containing
  the representation of the points compatible with the otype 
  files contents.
  */
  let otype = "";
  for (let i = 0; i < points.length; i++) {
    let x = points[i].x
      .toString(16)
      .padStart((points[i].range - 1).toString(16).length, "0");
    let y = points[i].y
      .toString(16)
      .padStart((points[i].range - 1).toString(16).length, "0");
    otype += x + y + " ";
  }
  return otype;
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

function orderRadially(points) {
  /*
  Returns the ordered list of point with respect to the leftmost 
  point.
  */
  const lfPoint = findLeftmostPoint(points);
  const lfPointIndex = points.indexOf(lfPoint);

  leq = leqComparatorOrientDet(lfPoint);
  let toSort = [...points];
  toSort.splice(lfPointIndex, 1);

  let orderedPoints = [lfPoint].concat(mergeSort(toSort));
  orderedPoints.push(lfPoint);
  return orderedPoints;
}

function grahamScan(points) {
  /*
  Returns the list of extrmum points in trigonometric order. The first
  and the last elements are identical.
  */
  if (points.length <= 3) {
    let ch = [...points];
    ch.push(ch[0]);
    return ch;
  }

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

function drawPolygon(extremes, color) {
  if (extremes.length === 0) return;
  stroke(color);
  for (let i = 0; i < extremes.length - 1; i++) {
    line(extremes[i].x, extremes[i].y, extremes[i + 1].x, extremes[i + 1].y);
  }
  stroke("black");
}

class ExcessivePointsError extends Error { }

class VirtualCanvas {
  constructor(x, y, width, height, distToBorder = 10) {
    this.xMin = x;
    this.xMax = x + width;
    this.yMin = y;
    this.yMax = y + height;
    this.points = [];
    this.ch = null;
    this.maxPoints = 10;
    this.allowDrawing = false;
  }

  enableDrawing() {
    this.allowDrawing = true;
  }
  disableDrawing() {
    this.allowDrawing = false;
  }

  changeX(newX) {
    this.xMax = this.xMax - this.xMin + newX;
  }

  changeY(newY) {
    this.yMax = this.yMax - this.yMin + newY;
  }

  inside(mouseX, mouseY) {
    return (
      this.xMin < mouseX &&
      this.xMax > mouseX &&
      this.yMin < mouseY &&
      this.yMax > mouseY
    );
  }

  drawBorder() {
    noFill();
    stroke("grey");
    rect(this.xMin, this.yMin, this.xMax - this.xMin, this.yMax - this.yMin);
  }

  drawPoint(point) {
    let relativeX =
      this.xMin + (point.x / (point.range - 1)) * (this.xMax - this.xMin);
    // invert the y axis direction (origin becomes the bottom left corner)
    let relativeY =
      this.yMin +
      (this.yMax -
        this.yMin -
        (point.y / (point.range - 1)) * (this.yMax - this.yMin));

    fill(point.color);
    stroke(point.color);
    ellipse(relativeX, relativeY, 6);
  }

  drawCanvasPoints(points = this.points) {
    for (let i in points) {
      this.drawPoint(points[i]);
    }
  }

  drawPointSets(points = this.points) {
    for (let i in points) {
      if (select("#chk" + i).checked()) this.drawCanvasPoints(points[i]);
    }
  }

  drawCompleteGraph() {
    for (let i = 0; i < this.points.length - 1; i++) {
      for (let j = i + 1; j < this.points.length; j++) {
        let point1 = this.points[i];
        let relativeX1 =
          this.xMin + (point1.x / (point1.range - 1)) * (this.xMax - this.xMin);
        // invert the y axis direction (origin becomes the bottom left corner)
        let relativeY1 =
          this.yMin +
          (this.yMax -
            this.yMin -
            (point1.y / (point1.range - 1)) * (this.yMax - this.yMin));

        let point2 = this.points[j];
        let relativeX2 =
          this.xMin + (point2.x / (point2.range - 1)) * (this.xMax - this.xMin);
        // invert the y axis direction (origin becomes the bottom left corner)
        let relativeY2 =
          this.yMin +
          (this.yMax -
            this.yMin -
            (point2.y / (point2.range - 1)) * (this.yMax - this.yMin));

        line(relativeX1, relativeY1, relativeX2, relativeY2);
      }
    }
  }

  setMaxPointsNum(max) {
    this.maxPoints = max;
  }

  addPoint(mouseX, mouseY) {
    this.ch = null;

    if (this.allowDrawing)
      if (this.points.length >= this.maxPoints) {
        throw ExcessivePointsError();
      } else {
        if (this.inside(mouseX, mouseY)) {
          let r = range(this.points.length + 1);
          let absoluteX = ((mouseX - this.xMin) / (this.xMax - this.xMin)) * r;
          let absoluteY =
            r - ((mouseY - this.yMin) / (this.yMax - this.yMin)) * r;
          if (this.points.length === 8) {
            for (let i = 0; i < this.points.length; i++) {
              this.points[i].setRange(r);
            }
          }
          this.points.push(new Point(absoluteX, absoluteY, r));
        }
      }
  }

  clearAndErase() {
    document.getElementById("showchA").checked = false;
    document.getElementById("showAcomp").checked = false;
    this.points = [];
    this.ch = null;
    clear();
  }

  computeRelatives(points) {
    let res = [];
    for (let i = 0; i < points.length; i++) {
      let point = points[i];
      let relativeX =
        this.xMin + (point.x / (point.range - 1)) * (this.xMax - this.xMin);
      // invert the y axis direction (origin becomes the bottom left corner)
      let relativeY =
        this.yMin +
        (this.yMax -
          this.yMin -
          (point.y / (point.range - 1)) * (this.yMax - this.yMin));
      res.push(new Point(relativeX, relativeY));
    }
    return res;
  }

  drawCH() {
    if (!this.ch) {
      this.ch = grahamScan(this.points);
    }

    drawPolygon(this.computeRelatives(this.ch), this.ch[0].color);
  }

  drawCHs() {
    for (let i = 0; i < this.points.length; i++) {
      this.ch[i] = grahamScan(this.points[i]);
      drawPolygon(this.computeRelatives(this.ch[i]), this.ch[i][0].color);
    }
  }

  magnify() {
    let x1 = this.point[0].range,
      x2 = 0,
      y1 = this.point[0].range,
      y2 = 0;
    for (point of this.points) {
      if (point.x < x1) x1 = point.x;
      else if (point.x > x2) x2 = point.x;
      if (point.y < y1) y1 = point.y;
      else if (point.y > y2) y2 = point.y;
    }
    let maxSpread = max(x2 - x1, y2 - y1);
    let magFactor = (this.point[0].range - 1) / maxSpread;

    function newCoordinates(point) {
      let newX, newY;

      point.x = newX;
      point.y = newY;
    }
  }
}

var a,
  b,
  button,
  toClear = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  let canvasL;
  if (true || windowWidth >= windowHeight) { //TODO 
    // landscape orientation
    canvasL = min(0.9 * windowHeight, (0.85 * windowWidth) / 2);
    a = new VirtualCanvas(
      0.05 * windowWidth,
      0.05 * windowHeight,
      canvasL,
      canvasL
    );
    button = createButton("▶");
    button.position(
      0.51 * windowWidth - 12.5,
      0.05 * windowHeight + canvasL / 2 - 12.5
    );
    button.size(25, 25);
    button.mousePressed(transferPoints);
    b = new VirtualCanvas(
      0.55 * windowWidth,
      0.05 * windowHeight,
      canvasL,
      canvasL
    );
    select("#dataOpt").size(b.xMax - a.xMin, canvasL / 2);
    select("#dispOpts")
      .size(windowWidth - 0.1 * windowWidth, canvasL)
      .style("padding: " + 0.05 * windowWidth + "px;");
    select("#dispOptA").size(canvasL, canvasL).style("float: left;");
    select("#dispOptB")
      .size(canvasL, canvasL)
      .style("float: right;")
      .position(b.xMin, AUTO);
    //select("#defaultCanvas0.p5Canvas").parent("dispOpts");
  } else {
    // portrait orientation
    canvasL = min(0.9 * windowWidth, (0.85 * windowHeight) / 2);
    a = new VirtualCanvas(
      0.05 * windowWidth,
      0.05 * windowHeight,
      canvasL,
      canvasL
    );
    button = createButton("▼");
    button.position(
      0.05 * windowWidth + canvasL / 2 - 12.5,
      0.51 * windowHeight - 12.5
    );
    button.size(25, 25);
    button.mousePressed(transferPoints);
    b = new VirtualCanvas(
      0.05 * windowWidth,
      0.55 * windowHeight,
      canvasL,
      canvasL
    );
  }

  // Initially no points sets should be displayed
  for (let i = 0; i < 10; i++) {
    select("#set" + i).hide();
    select("#col" + i).input(() => {
      if (i < b.points.length) {
        for (pt of b.points[i]) {
          pt.color = document.getElementById("col" + i).value;
        }
      }
    });
    select("#del" + i).mousePressed(() => {
      // the set to delete is the last one
      if (i === b.points.length - 1) {
        b.points.pop();
        select("#set" + b.points.length).hide();
      } else {
        // the set to delete is followed by other(s)
        for (let j = i + 1; j < b.points.length; j++) {
          b.points[j - 1] = b.points[j];
          document.getElementById(
            "col" + (j - 1)
          ).value = document.getElementById("col" + j).value;
        }

        b.points.pop();
        select("#set" + b.points.length).hide();
      }
    });
  }

  select("#magni").mousePressed(() => {
    a.magnify();
  });

  select("#clr").mousePressed(() => {
    a.clearAndErase();
  });

  select("#ptnb").changed(() => {
    let id = document.getElementById("idx");
    let nb = document.getElementById("ptnb");
    id.max = otypesNb[nb.value];
  });

  select("#next").mousePressed(() => {
    let id = Number(document.getElementById("idx").value);
    let nb = document.getElementById("ptnb");
    if (id + 1 <= otypesNb[nb.value]) {
      id++;
      document.getElementById("idx").value = id.toString();
    }
    preview();
  });

  select("#prev").mousePressed(() => {
    let id = Number(document.getElementById("idx").value);
    if (id - 1 >= 1) {
      id--;
      document.getElementById("idx").value = id.toString();
    }
    document.getElementById("pvw").click();
    preview();
  });

  select("#idx").changed(() => {
    let id = document.getElementById("idx");
    if (parseInt(id.value, 10) > parseInt(id.max, 10)) id.value = id.max;
    else if (parseInt(id.value, 10) < parseInt(id.min, 10)) id.value = id.min;
  });

  function preview() {
    a.clearAndErase();
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
    a.points = pointSet;
  }

  select("#pvw").mousePressed(preview);

  select("#equiv").mousePressed(() => {
    let points = a.points;
    let lambdaMatrixStr = lambdaMatrixString(points);
    let equivPoints = binSearchOt(points.length, lambdaMatrixStr);
    console.log("jjjjjjjj", equivPoints);
    transferPoints();
    a.points = equivPoints;
  });

  button.parent(select("#canvasContainer"));
  // Put setup code here
}

function randomColor() {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function transferPoints() {
  if (a.points.length > 0) {
    let color = randomColor();
    select("#set" + b.points.length).show();
    select("#chk" + b.points.length).attribute("checked", true);
    document.getElementById("col" + b.points.length).value = color;
    b.points.push(a.points);
    if (!b.ch) b.ch = [];
    b.ch.push(a.ch);
    for (let i of b.points[b.points.length - 1]) {
      i.color = color;
    }
    a.clearAndErase();
  }
}

function draw() {
  clear();
  // Put drawings here
  a.drawBorder();
  a.enableDrawing();
  a.drawCanvasPoints();
  if (select("#showAcomp").checked()) a.drawCompleteGraph();
  if (select("#showchA").checked() && a.points.length > 0) a.drawCH();

  b.drawBorder();
  b.enableDrawing();
  b.drawPointSets();
  if (select("#showchB").checked()) b.drawCHs();
}

function mousePressed() {
  a.addPoint(mouseX, mouseY);
  //console.log(select("#chk0").checked());
}

// This Redraws the Canvas when resized
windowResized = function () {
  resizeCanvas(windowWidth, windowHeight);
};
