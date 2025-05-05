// Hand Pose Detection with ml5.js
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose

let video;
let handPose;
let faceMesh;
let hands = [];
let faces = [];
let earImage; // 儲存耳朵圖片
let circleX, circleY; // 圓的初始位置
let circleRadius = 50; // 圓的半徑
let isDragging = false; // 是否正在拖動圓
let dragColor = null; // 拖動時的線條顏色
let trails = []; // 儲存軌跡的陣列

function preload() {
  // Initialize HandPose model with flipped video input
  handPose = ml5.handPose({ flipped: true });

  // Initialize FaceMesh model with a maximum of one face and flipped video input
  faceMesh = ml5.faceMesh({ maxFaces: 1, flipped: true });

  // Load the ear image
  earImage = loadImage('ear.png');
}

function mousePressed() {
  console.log(hands);
}

function gotHands(results) {
  hands = results;
}

function gotFaces(results) {
  faces = results;
}

function setup() {
  createCanvas(windowWidth, windowHeight); // Set canvas size to match the screen size
  video = createCapture(VIDEO, { flipped: true });
  video.hide();

  // 圓的初始位置為視窗中心
  circleX = width / 2;
  circleY = height / 2;

  // Start detecting hands
  handPose.detectStart(video, gotHands);

  // Start detecting faces
  faceMesh.detectStart(video, gotFaces);
}

function draw() {
  // Set canvas background to light pink
  background(255, 182, 193);

  // Calculate position to center the video
  let x = (width - video.width) / 2;
  let y = (height - video.height) / 2;

  // Draw the video at the calculated position
  image(video, x, y);

  // Draw the circle with 60% transparency
  fill(200, 200, 255, 153); // 153 is 60% of 255 for alpha
  noStroke();
  ellipse(circleX, circleY, circleRadius * 2);

  // Draw the trails
  for (let trail of trails) {
    stroke(trail.color);
    strokeWeight(2);
    line(trail.x1, trail.y1, trail.x2, trail.y2);
  }

  // Ensure at least one face is detected
  if (faces.length > 0) {
    let face = faces[0];

    // Draw ear images at the detected ear positions
    const leftEar = face.scaledMesh[234]; // 左耳的特徵點
    const rightEar = face.scaledMesh[454]; // 右耳的特徵點

    // Draw ear image at left ear position
    image(earImage, leftEar[0] - 25, leftEar[1] - 25, 50, 50);

    // Draw ear image at right ear position
    image(earImage, rightEar[0] - 25, rightEar[1] - 25, 50, 50);
  }

  // Ensure at least one hand is detected
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        // Determine the color based on handedness
        let pointColor = hand.handedness == "Left" ? [255, 0, 255] : [255, 255, 0];

        // Loop through keypoints and draw circles
        for (let i = 0; i < hand.keypoints.length; i++) {
          let keypoint = hand.keypoints[i];

          fill(...pointColor);
          noStroke();
          // Adjust keypoint positions relative to the centered video
          circle(keypoint.x + x, keypoint.y + y, 16);
        }

        // Draw lines connecting points 0~4, 5~8, 9~12, 13~16, 17~20
        const ranges = [
          [0, 4],  // Thumb
          [5, 8],  // Index finger
          [9, 12], // Middle finger
          [13, 16], // Ring finger
          [17, 20]  // Pinky finger
        ];

        stroke(...pointColor); // Set line color to match the points
        strokeWeight(2); // Set line thickness
        for (let [startIdx, endIdx] of ranges) {
          for (let i = startIdx; i < endIdx; i++) {
            let start = hand.keypoints[i];
            let end = hand.keypoints[i + 1];
            line(start.x + x, start.y + y, end.x + x, end.y + y);
          }
        }

        // Get the keypoints for the index finger (8) and thumb (4)
        let indexFinger = hand.keypoints[8];
        let thumb = hand.keypoints[4];

        // Check if the index finger is touching the circle
        if (dist(indexFinger.x + x, indexFinger.y + y, circleX, circleY) < circleRadius) {
          isDragging = true;
          dragColor = 'red'; // Set the drag color to red for index finger
          circleX = indexFinger.x + x;
          circleY = indexFinger.y + y;

          // Add a trail
          if (trails.length > 0) {
            let lastTrail = trails[trails.length - 1];
            trails.push({
              x1: lastTrail.x2,
              y1: lastTrail.y2,
              x2: circleX,
              y2: circleY,
              color: dragColor
            });
          } else {
            trails.push({
              x1: circleX,
              y1: circleY,
              x2: circleX,
              y2: circleY,
              color: dragColor
            });
          }
        } else if (dist(thumb.x + x, thumb.y + y, circleX, circleY) < circleRadius) {
          isDragging = true;
          dragColor = 'green'; // Set the drag color to green for thumb
          circleX = thumb.x + x;
          circleY = thumb.y + y;

          // Add a trail
          if (trails.length > 0) {
            let lastTrail = trails[trails.length - 1];
            trails.push({
              x1: lastTrail.x2,
              y1: lastTrail.y2,
              x2: circleX,
              y2: circleY,
              color: dragColor
            });
          } else {
            trails.push({
              x1: circleX,
              y1: circleY,
              x2: circleX,
              y2: circleY,
              color: dragColor
            });
          }
        } else {
          isDragging = false;
        }
      }
    }
  }

  // Stop drawing trails if not dragging
  if (!isDragging) {
    dragColor = null;
  }

  // Continuously detect faces
  faceMesh.detect(video, gotFaces);
}
