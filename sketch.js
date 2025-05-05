// Hand Pose Detection with ml5.js
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose

let video;
let handPose;
let hands = [];

function preload() {
  // Initialize HandPose model with flipped video input
  handPose = ml5.handPose({ flipped: true });
}

function mousePressed() {
  console.log(hands);
}

function gotHands(results) {
  hands = results;
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO, { flipped: true });
  video.hide();

  // Start detecting hands
  handPose.detectStart(video, gotHands);
}

function draw() {
  // Set canvas background to light pink
  background(255, 182, 193);

  // Calculate position to center the video
  let x = (width - video.width) / 2;
  let y = (height - video.height) / 2;

  // Draw the video at the calculated position
  image(video, x, y);

  // Ensure at least one hand is detected
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        // Loop through keypoints and draw circles
        for (let i = 0; i < hand.keypoints.length; i++) {
          let keypoint = hand.keypoints[i];

          // Color-code based on left or right hand
          if (hand.handedness == "Left") {
            fill(255, 0, 255);
          } else {
            fill(255, 255, 0);
          }

          noStroke();
          // Adjust keypoint positions relative to the centered video
          circle(keypoint.x + x, keypoint.y + y, 16);
        }

        // Draw lines connecting points 0 to 4
        stroke(0); // Set line color to black
        strokeWeight(2); // Set line thickness
        for (let i = 0; i < 4; i++) {
          let start = hand.keypoints[i];
          let end = hand.keypoints[i + 1];
          line(start.x + x, start.y + y, end.x + x, end.y + y);
        }
      }
    }
  }
}
