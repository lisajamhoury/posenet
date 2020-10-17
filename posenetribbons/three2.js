let poses = [];
let video;

// for playing back data
let liveData = false;
let recordedPositions;
let currentPosition = null;
let posIndex = 0;
let posTime = 0;

//for 3D
let scene, camera, renderer;
let controls;
let pointLight, pointLight2;

// recoded data variables
let recordedData;
let sentTime = Date.now();
let currentFrame = 0;

init();

function init() {
  // if no live partner, load recorded data
  if (liveData) {
    initPoseNet();
    initSketch();
  } else {
    console.log("loading json");
    fetchJSONFile("recordeddata.json", getData);
  }
}

function getData(data) {
  recordedData = data;
  initSketch();
}

function initSketch() {
  initThreeJs();
  animate();
}

function loopRecordedData() {
  // send data every 20 seconds
  if (Date.now() > sentTime + 20) {
    bodyTracked(recordedData[currentFrame]);
    sentTime = Date.now();

    if (currentFrame < Object.keys(recordedData).length - 1) {
      currentFrame++;
    } else {
      currentFrame = 0;
    }
  }
}

function initPoseNet() {
  video = createCapture(VIDEO);
  video.size(width, height);
  // Hide the video element, and just show the canvas
  video.hide();
  // pg = createGraphics(width, height);

  if (liveData) {
    // Referencing ml5 library.name of function (posenet)
    // Create a new poseNet method
    const poseNet = ml5.poseNet(video, modelLoaded);
    // PoseNet works on event handlers: on pose, call this function & give results of pose
    // Listen to new 'pose' events
    poseNet.on("pose", (data) => getData(data));
  }
}

// When the model is loaded
function modelLoaded() {
  console.log("Model Loaded!");
}

function bodyTracked(body) { //should be data?
  // Green Keypoints array lists all 17 points in it
  // Loop through all keypoints deetected and get x, y, confidence score, and name of position of each
  // const keypoints = poses[0].pose.keypoints;
  const newJoints = body.skeleton.poses;

  // debugger;
  // For each pose detected, loop through all the keypoints
  for (let i = 0; i < pose.length; i++) {
    // A keypoint is an object describing a body part (like rightArm or leftShoulder)
    // Only draw an ellipse is the pose probability is bigger than 0.2
    // if (joint.score > 0.2) {
    poses[i].position.x = (newJoints[i].x * -1);
    poses[i].position.y = (newJoints[i].y * -1);
    poses[i].position.z = (newJoints[i].z * -1);

    // }
  }
  // index 9 is left hand
  pointLight.position.x = poses[9].position.x;
  pointLight.position.y = poses[9].position.y;
  pointLight.position.z = poses[9].position.z;

  // index 10 is right hand
  pointLight2.position.x = poses[10].position.x;
  pointLight2.position.y = poses[10].position.y;
  pointLight2.position.z = poses[10].position.z;

}

function initThreeJs() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(0, 10, 200);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 10, 0);
  controls.update();

  //   let ambLight = new THREE.AmbientLight(0xffffff);
  //   scene.add(ambLight);

  pointLight = new THREE.PointLight(0xffffff, 1, 100, 2);
  scene.add(pointLight);

  pointLight2 = new THREE.PointLight(0xffffff, 1, 100, 2);
  scene.add(pointLight2);

  createMesh();
  drawSkeleton();

  window.addEventListener("resize", resizeWindow, false);
}

function createMesh() {
  let geo = new THREE.BoxBufferGeometry(90, 90, 90);

  let mat = new THREE.MeshPhongMaterial({
    color: 0x10e6b7,
    specular: 0x10e6b7,
    side: THREE.BackSide,
  });

  let mesh = new THREE.Mesh(geo, mat);

  scene.add(mesh);
}

function drawSkeleton() {
  // Skeleton is a 2d array that draws lines between points (information in the skeleton property of the object found in the array returned to us). 2nd dimension stores two locations that are connected (which is why there are two [][])
  // Loop through all the skeletons detected
  // const bones = poses[0].skeleton;
  // For every skeleton, loop through all body connections
  for (let i = 0; i < 17; i++) { // should be poses.length?
    // const jointA = bones[i][0].position;
    // const jointB = bones[i][1].position;

    // strokeWeight(5);
    // stroke("green");
    // line(jointA.x, jointA.y, jointB.x, jointB.y);

    let geo = new THREE.BoxBufferGeometry(0.5, 0.5, 0.5);

    let mat = new THREE.MeshPhongMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      visible: false,
    });

    let mesh = new THREE.Mesh(geo, mat);

    poses.push(mesh);
    scene.add(mesh);
  }
}

function animate() {
  if (!liveData) loopRecordedData();

  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function resizeWindow() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

// https://stackoverflow.com/questions/14388452/how-do-i-load-a-json-object-from-a-file-with-ajax%5C
function fetchJSONFile(path, callback) {
  var httpRequest = new XMLHttpRequest();
  httpRequest.onreadystatechange = function () {
    if (httpRequest.readyState === 4) {
      if (httpRequest.status === 200) {
        var data = JSON.parse(httpRequest.responseText);
        if (callback) callback(data);
      }
    }
  };
  httpRequest.open("GET", path);
  httpRequest.send();
}

// function draw() {
// 	background(255);
// if (!liveData) {
//     if (poses.length === 0) {
//       poses = recordedPositions[posIndex].pose;
//       posIndex++;
//       posTime = Date.now();
//     } else {
//       const timeBtwRecords =
//         recordedPositions[posIndex].timeStamp -
//         recordedPositions[posIndex - 1].timeStamp;
//       const timeElapsed = Date.now() - posTime;

//       if (timeElapsed > timeBtwRecords) {
//         poses = recordedPositions[posIndex].pose;
//         posTime = Date.now();

//         if (posIndex < Object.keys(recordedPositions).length - 1) {
//           // console.log(posIndex);
//           posIndex++;
//         } else {
//           console.log("resetting");
//           posIndex = 1;
//         }
//       }
//     }
//   }

// 	if (poses.length === 0) {
// 		console.log("waiting for poses");
// 		return;
//   }
// }

// Call all functions to draw all keypoints and skeletons
// bodyTracked();
// drawSkeleton();
// drawWrists();

// push();
// scale(0.25, 0.25);
// image(video, 0, 0, width, height);
// pop();
// }

// The callback that gets called every time there's an update from the model
// function gotPose(results) {
// 	poses = results;
// }

// function drawWrists() {
// 	const rightWrist = poses[0].pose.rightWrist;
// 	const leftWrist = poses[0].pose.leftWrist;

// 	rectMode(CENTER);
// 	noStroke();
// 	fill("white");
// 	rect(rightWrist.x, rightWrist.y, 10);
// 	rect(leftWrist.x, leftWrist.y, 10);

//   mesh();
// 	positions.push([rightWrist.x, rightWrist.y]);
// 	positions.push([leftWrist.x, leftWrist.y]);
// 	noFill();
// }