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

var counter = 0;
function update(){
  if (counter % 2 === 0){
    
  }
}

var sketch = function (p) {
  p.x = 100;
  p.y = 100;
  p.canvas;
  p.setup = function () {
    p.canvas = p.createCanvas(500, 500);
    p.background(51);
  };
  p.draw = function () {
    update();

    p.fill(255, 200, 0, 25);
    p.noStroke();
    p.ellipse(p.x, p.y, 48, 48);

    p.x = p.x + p.random(-10, 10);
    p.y = p.y + p.random(-10, 10);
  };
};

var canvasA = new p5(sketch, "canvas-holder1");
var canvasB = new p5(sketch, "canvas-holder2");

function resetBackground() {
  canvasA.x = canvasA.width / 2;
  canvasA.y = canvasA.height / 2;
  canvasA.background(51);
}

setInterval(resetBackground, 3000);