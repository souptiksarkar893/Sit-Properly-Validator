// App.js
import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "@tensorflow/tfjs";
import * as posenet from "@tensorflow-models/posenet";
import "./App.css";

function App() {
  const [stream, setStream] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [model, setModel] = useState(null);

  useEffect(() => {
    async function initializePoseNet() {
      const poseNetModel = await posenet.load();
      setModel(poseNetModel);
    }
    initializePoseNet();
  }, []);

  const toggleCamera = async () => {
    const videoElement = document.getElementById("videoElement");
    if (!isCameraOn) {
      // Turn on camera.
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      setStream(newStream);
      videoElement.srcObject = newStream;
      setIsCameraOn(true);
    } else {
      // Turn off camera.
      stopCamera();
    }
  };

  const stopCamera = () => {
    const videoElement = document.getElementById("videoElement");
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoElement.srcObject = null;
      setIsCameraOn(false);
    }
  };

  const validateUserPosition = async () => {
    if (model && isCameraOn) {
      const videoElement = document.getElementById("videoElement");
      const pose = await model.estimateSinglePose(videoElement, {
        flipHorizontal: false,
      });

      // Add your validation logic here
      if (pose) {
        // Example: Check if certain keypoints are detected with sufficient confidence
        const requiredKeypoints = [
          "nose",
          "leftEye",
          "rightEye",
          "leftShoulder",
          "rightShoulder",
        ];
        const minConfidence = 0.5;
        const detectedKeypoints = pose.keypoints.filter(
          (keypoint) =>
            requiredKeypoints.includes(keypoint.part) &&
            keypoint.score >= minConfidence
        );

        // Calculate the completion percentage with decimal points
        const percentage =
          (detectedKeypoints.length / requiredKeypoints.length) * 100;
        document.getElementById(
          "progress"
        ).innerText = `Completion: ${percentage.toFixed(2)}%`;

        if (detectedKeypoints.length === requiredKeypoints.length) {
          // All keypoints detected, user is sitting properly
          console.log("User is sitting properly!");
          document.getElementById("message").innerText =
            "You are sitting properly!";
          // Redirect to the home page after a delay
          setTimeout(() => {
            window.location.href = "home.html";
          }, 2000); // Redirect after 2 seconds
        } else {
          // Not all keypoints detected, prompt user to sit properly
          document.getElementById("message").innerText =
            "Please sit properly to visit the home page.";
        }
      }
    }
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      validateUserPosition();
    }, 1000); // Update every second

    // Listen for changes in the video feed
    const videoElement = document.getElementById("videoElement");
    videoElement.addEventListener("loadeddata", validateUserPosition);

    return () => {
      clearInterval(intervalId);
      videoElement.removeEventListener("loadeddata", validateUserPosition);
    };
  }, [model, isCameraOn]);

  return (
    <div className="container">
      <h1 className="text-center">Sit Properly Validator</h1>
      <div id="video-container">
        <video id="videoElement" autoPlay></video>
      </div>
      <div id="message"></div>
      <div id="progress"></div>
      <div id="controls">
        <button
          id="toggleCameraBtn"
          className="btn btn-primary"
          onClick={toggleCamera}
        >
          Turn {isCameraOn ? "Off" : "On"} Camera
        </button>
      </div>
    </div>
  );
}

export default App;
