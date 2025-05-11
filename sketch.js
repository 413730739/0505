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
let faceDetectionEnabled = false; // 是否啟用臉部偵測
let toggleButton; // 切換按鈕

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
  console.log(faces);
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
  video.size(640, 480); // 限制影片大小以提升效能
  video.hide();

  // 圓的初始位置為視窗中心
  circleX = width / 2;
  circleY = height / 2;

  // Start detecting hands
  handPose.detectStart(video, gotHands);

  // Create a button to toggle face detection
  toggleButton = createButton('啟用臉部偵測');
  toggleButton.position((width - toggleButton.width) / 2-50, 150); // 放置在影像上方 50px
  toggleButton.style('background-color', '#ADD8E6'); // 設置按鈕背景顏色為淡藍色
  toggleButton.style('border', 'none'); // 移除邊框
  toggleButton.style('padding', '20px 30px'); // 增加按鈕內邊距
  toggleButton.style('border-radius', '5px'); // 圓角按鈕
  toggleButton.style('color', '#000'); // 按鈕文字顏色
  toggleButton.style('font-size', '20px'); // 按鈕文字大小
  toggleButton.mousePressed(toggleFaceDetection);
}

function toggleFaceDetection() {
  faceDetectionEnabled = !faceDetectionEnabled;
  toggleButton.html(faceDetectionEnabled ? '停用臉部偵測' : '啟用臉部偵測');
  if (faceDetectionEnabled) {
    faceMesh.detectStart(video, gotFaces); // 啟用臉部偵測
    hands = []; // 停用手部資料
    trails = []; // 停用繪畫資料
  } else {
    faces = []; // 停用時清空臉部資料
  }
}

function draw() {
  // Set canvas background to light pink
  background(255, 182, 193);

  // Calculate position to center the video
  let x = (width - video.width) / 2;
  let y = (height - video.height) / 2;

  // Draw the video at the calculated position
  push();
  translate(width / 2, height / 2); // 將畫布的原點移到畫布中心
  scale(1, 1); // 水平翻轉畫布
  image(video, -video.width / 2, -video.height / 2); // 繪製翻轉後的影片
  pop();

  // 如果啟用臉部偵測，執行臉部偵測邏輯
  if (faceDetectionEnabled) {
    if (faces.length > 0) {
      let face = faces[0];

      // 確保 scaledMesh 存在
      if (face.scaledMesh) {
        // 左耳和右耳的特徵點索引
        const leftEarIndex = 234; // 左耳
        const rightEarIndex = 454; // 右耳

        // 獲取左耳和右耳的座標
        const leftEar = face.scaledMesh[leftEarIndex];
        const rightEar = face.scaledMesh[rightEarIndex];

        // 確保特徵點存在並繪製耳朵圖片
        if (leftEar) {
          push();
          translate(leftEar[0] + x, leftEar[1] + y); // 以左耳位置為原點
          imageMode(CENTER); // 圖片以中心點為座標點
          scale(0.1); // 縮小圖片到 0.1 倍
          image(earImage, 0, 0); // 顯示左耳圖片
          pop();
        }
        if (rightEar) {
          push();
          translate(rightEar[0] + x, rightEar[1] + y); // 以右耳位置為原點
          imageMode(CENTER); // 圖片以中心點為座標點
          scale(-0.1, 0.1); // 縮小圖片並左右翻轉
          image(earImage, 0, 0); // 顯示右耳圖片
          pop();
        }
      }

      // Draw keypoints on the detected face
      for (let i = 0; i < face.keypoints.length; i++) {
        let keypoint = face.keypoints[i];
        
        stroke(255, 255, 0);
        strokeWeight(4);

        // 調整座標以匹配翻轉後的影片位置
        let flippedX = width - (keypoint.x + x); // 翻轉 x 座標
        point(flippedX, keypoint.y + y);
      }
    }
    return; // 跳過手部偵測和繪畫邏輯
  }

  //畫圓
  fill(200, 200, 255, 153); // 153 is 60% of 255 for alpha
  noStroke();
  ellipse(circleX, circleY, circleRadius * 2);

  // Draw the trails
  for (let trail of trails) {
    stroke(trail.color);
    strokeWeight(2);
    line(trail.x1, trail.y1, trail.x2, trail.y2);
  }

  // Ensure at least one hand is detected
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        let pointColor = hand.handedness == "Left" ? [255, 0, 255] : [255, 255, 0];

        for (let keypoint of hand.keypoints) {
          fill(...pointColor);
          noStroke();
          let flippedX = width - (keypoint.x + x); // 翻轉 x 座標
          circle(flippedX, keypoint.y + y, 16);
        }

        const ranges = [
          [0, 4],
          [5, 8],
          [9, 12],
          [13, 16],
          [17, 20]
        ];

        stroke(...pointColor);
        strokeWeight(2);
        for (let [startIdx, endIdx] of ranges) {
          for (let i = startIdx; i < endIdx; i++) {
            let start = hand.keypoints[i];
            let end = hand.keypoints[i + 1];
            let flippedStartX = width - (start.x + x); // 翻轉起點 x 座標
            let flippedEndX = width - (end.x + x); // 翻轉終點 x 座標
            line(flippedStartX, start.y + y, flippedEndX, end.y + y);
          }
        }

        let indexFinger = hand.keypoints[8];
        let thumb = hand.keypoints[4];

        let flippedIndexX = width - (indexFinger.x + x); // 翻轉 x 座標
        let flippedThumbX = width - (thumb.x + x); // 翻轉 x 座標

        if (dist(flippedIndexX, indexFinger.y + y, circleX, circleY) < circleRadius) {
          isDragging = true;
          dragColor = 'red';
          circleX = flippedIndexX;
          circleY = indexFinger.y + y;

          addTrail(circleX, circleY, dragColor);
        } else if (dist(flippedThumbX, thumb.y + y, circleX, circleY) < circleRadius) {
          isDragging = true;
          dragColor = 'green';
          circleX = flippedThumbX;
          circleY = thumb.y + y;

          addTrail(circleX, circleY, dragColor);
        } else {
          isDragging = false;
        }
      }
    }
  }

  if (!isDragging) {
    dragColor = null;
  }
}

function addTrail(x, y, color) {
  if (trails.length > 0) {
    let lastTrail = trails[trails.length - 1];
    trails.push({
      x1: lastTrail.x2,
      y1: lastTrail.y2,
      x2: x,
      y2: y,
      color: color
    });
  } else {
    trails.push({
      x1: x,
      y1: y,
      x2: x,
      y2: y,
      color: color
    });
  }
}
