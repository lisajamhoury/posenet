let poses = [];
let positions = [];
let video;

// for playing back data
let liveData = false;
let recordedPositions;
let currentPosition = null;
let posIndex = 0;
let posTime = 0;

function preload() {
	// if no live partner, load recorded data
	if (!liveData) {
		console.log("loading json");
		recordedPositions = loadJSON("recordeddata.json");
	}
}

function setup() {
	createCanvas(640, 480);

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
		poseNet.on("pose", (results) => gotPose(results));
	}
}

function draw() {
	background(255);
	if (!liveData) {
		if (poses.length === 0) {
			poses = recordedPositions[posIndex].pose;
			posIndex++;
			posTime = Date.now();
		} else {
			const timeBtwRecords =
				recordedPositions[posIndex].timeStamp -
				recordedPositions[posIndex - 1].timeStamp;
			const timeElapsed = Date.now() - posTime;

			if (timeElapsed > timeBtwRecords) {
				poses = recordedPositions[posIndex].pose;
				posTime = Date.now();

				if (posIndex < Object.keys(recordedPositions).length - 1) {
					// console.log(posIndex);
					posIndex++;
				} else {
					console.log("resetting");
					posIndex = 1;
				}
			}
		}
	}

	if (poses.length === 0) {
		console.log("waiting for poses");
		return;
	}
	// Call all functions to draw all keypoints and skeletons
	drawKeypoints();
	drawSkeleton();
	drawWrists();

	push();
	scale(0.25, 0.25);
	image(video, 0, 0, width, height);
	pop();
}

// The callback that gets called every time there's an update from the model
function gotPose(results) {
	poses = results;
}

function drawKeypoints() {
	// Green Keypoints array lists all 17 points in it
	// Loop through all keypoints deetected and get x, y, confidence score, and name of position of each
	const keypoints = poses[0].pose.keypoints;
	// debugger;
	// For each pose detected, loop through all the keypoints
	for (let i = 0; i < keypoints.length; i++) {
		// A keypoint is an object describing a body part (like rightArm or leftShoulder)
		const keypoint = keypoints[i];
		// Only draw an ellipse is the pose probability is bigger than 0.2
		if (keypoint.score > 0.2) {
			noStroke();
			fill("red");
			ellipse(keypoint.position.x, keypoint.position.y, 20);
		}
	}
}

function drawSkeleton() {
	// Skeleton is a 2d array that draws lines between points (information in the skeleton property of the object found in the array returned to us). 2nd dimension stores two locations that are connected (which is why there are two [][])
	// Loop through all the skeletons detected
	const bones = poses[0].skeleton;
	// For every skeleton, loop through all body connections
	for (let i = 0; i < bones.length; i++) {
		const jointA = bones[i][0].position;
		const jointB = bones[i][1].position;

		strokeWeight(5);
		stroke("green");
		line(jointA.x, jointA.y, jointB.x, jointB.y);
	}
}

function drawWrists() {
	const rightWrist = poses[0].pose.rightWrist;
	const leftWrist = poses[0].pose.leftWrist;

	rectMode(CENTER);
	noStroke();
	fill("white");
	rect(rightWrist.x, rightWrist.y, 10);
	rect(leftWrist.x, leftWrist.y, 10);

	for (let i = 0; i < positions.length; i++) {
		ellipse(positions[i][0], positions[i][1], 5, 5);
		fill("blue");
		positions[i][1]++;
	}
	positions.push([rightWrist.x, rightWrist.y]);
	positions.push([leftWrist.x, leftWrist.y]);
	noFill();
}

// When the model is loaded
function modelLoaded() {
	console.log("Model Loaded!");
}

// from https://stackoverflow.com/questions/19721439/download-json-object-as-a-file-from-browser
function downloadObjectAsJson(exportObj, exportName) {
	var dataStr =
		"data:text/json;charset=utf-8," +
		encodeURIComponent(JSON.stringify(exportObj));
	var downloadAnchorNode = document.createElement("a");
	downloadAnchorNode.setAttribute("href", dataStr);
	downloadAnchorNode.setAttribute("download", exportName + ".json");
	document.body.appendChild(downloadAnchorNode); // required for firefox
	downloadAnchorNode.click();
	downloadAnchorNode.remove();
}
