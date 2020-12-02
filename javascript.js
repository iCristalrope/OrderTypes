window.onload = function() {
    getBlobs();
}

var ot_data = {};
var data_ot9_ready = false;

async function getBlobs(){
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

function firstPoint(){
    if (!data_ot9_ready){
        alert("Files still downloading, please wait");
        return;
    }


    console.log(new Uint8Array(ot_data["otypes03_b08"])[0]);
    console.log(new Uint8Array(ot_data["otypes03_b08"])[1]);
    console.log(new Uint8Array(ot_data["otypes03_b08"])[2]);
    console.log(new Uint8Array(ot_data["otypes03_b08"])[3]);
    console.log(new Uint8Array(ot_data["otypes03_b08"])[4]);
    console.log(new Uint8Array(ot_data["otypes03_b08"])[5]);
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

    equals(other){
        return this.x === other.x && this.y === other.y;
    }
  }
  
  function test(){
    let buff = new Uint8Array(ot_data["otypes04_b08"]);

    pointSets = [];
    let nbSets = 2;
    let nbPoints = 4;
    let index = 0;
    for (let set = 0; set < nbSets; set++) {
        let points = [];
        for (let point = 0; point < nbPoints; point++){
            let x = buff[index++];
            let y = buff[index++];
            points.push(new Point(x, y));
        }
        pointSets.push(points);
    }
    console.log(lambdaMatrix(pointSets[0]));
    console.log(lambdaMatrix(pointSets[1]));
  }

  function lambdaMatrix(pointSet){
      let indices = [];
      for (let i = 0; i < pointSet.length; i++){
          indices.push(i);
      }

      let ots = [];
      let perms = genPerms(indices);

      for (let i in perms){
        let perm = perms[i];
        let str = "";
        for (let row = 0; row < perm.length; row++){
            for (let col = 0; col < perm.length; col++){
                str += nbPointsLeftOf(pointSet[perm[row]], pointSet[perm[col]], pointSet);
            }
        }
        ots.push(str);
      }

      ots.sort();
      return ots[0];
  }

  function nbPointsLeftOf(point1, point2, points){
      let nbLeft = 0;
      for (let i in points){
          let point = points[i];
          if (!point.equals(point1) && !point.equals(point2)){
              if (orientation(point1, point2, point) < 0){
                  nbLeft++;
              }
          }
      }
      return nbLeft;
  }

  function orientation(a, b, c){
    return b.x * c.y - a.x * c.y + a.x * b.y - b.y * c.x + a.y * c.x - a.y * b.x;
  }

  function genPerms(indices){
      let perms = [];
      nextPerm(indices, [], perms);
      return perms;
  }

  function nextPerm(indices, buff, out){
    if (buff.length === indices.length){
        out.push(buff);
        return;
    }
    for (let i of indices){
        if (!buff.includes(i)){
            let buff2 = [...buff];
            buff2.push(i);
            nextPerm(indices, buff2, out);
        }
    }
  }