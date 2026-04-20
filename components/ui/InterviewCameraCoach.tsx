"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export default function InterviewCameraCoach() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [status, setStatus] = useState("Camera off");
  const [faceText, setFaceText] = useState("Face: Waiting...");
  const [movementText, setMovementText] = useState("Movement: Waiting...");
  const [eyeContactText, setEyeContactText] = useState("Eye contact: Waiting...");
  const [eyeContactScore, setEyeContactScore] = useState(0);

  const previousCenterRef = useRef<{ x: number; y: number } | null>(null);
  const movementHistoryRef = useRef<number[]>([]);
  const eyeSamplesRef = useRef<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelLoadedRef = useRef(false);

  useEffect(() => {
    async function startCameraAndTracking() {
      try {
        if (!modelLoadedRef.current) {
          setStatus("Loading face model...");
          await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
          modelLoadedRef.current = true;
        }

        setStatus("Opening camera...");
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
        }

        setStatus("Camera on");

        intervalRef.current = setInterval(async () => {
          if (!videoRef.current) return;
          if (videoRef.current.readyState < 2) return;

          const detection = await faceapi.detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          );

          if (!detection) {
            setFaceText("Face: No face detected");
            setMovementText("Movement: Cannot measure");
            setEyeContactText("Eye contact: No face detected");
            previousCenterRef.current = null;
            movementHistoryRef.current = [];
            return;
          }

          setFaceText("Face: Detected");

          const box = detection.box;
          const faceCenter = {
            x: box.x + box.width / 2,
            y: box.y + box.height / 2,
          };

          const videoWidth = videoRef.current.videoWidth;
          const videoHeight = videoRef.current.videoHeight;

          const frameCenter = {
            x: videoWidth / 2,
            y: videoHeight / 2,
          };

          const normalizedOffsetX = Math.abs(faceCenter.x - frameCenter.x) / frameCenter.x;
          const normalizedOffsetY = Math.abs(faceCenter.y - frameCenter.y) / frameCenter.y;
          const combinedOffset = (normalizedOffsetX + normalizedOffsetY) / 2;

          let currentEyeScore = 0;

          if (combinedOffset < 0.12) {
            setEyeContactText("Eye contact: Good");
            currentEyeScore = 100;
          } else if (combinedOffset < 0.22) {
            setEyeContactText("Eye contact: Fair");
            currentEyeScore = 65;
          } else {
            setEyeContactText("Eye contact: Looking away");
            currentEyeScore = 30;
          }

          eyeSamplesRef.current.push(currentEyeScore);
          if (eyeSamplesRef.current.length > 30) {
            eyeSamplesRef.current.shift();
          }

          const avgEyeScore =
            eyeSamplesRef.current.reduce((a, b) => a + b, 0) / eyeSamplesRef.current.length;

          setEyeContactScore(Math.round(avgEyeScore));

          if (previousCenterRef.current) {
            const dx = faceCenter.x - previousCenterRef.current.x;
            const dy = faceCenter.y - previousCenterRef.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            movementHistoryRef.current.push(dist);

            if (movementHistoryRef.current.length > 20) {
              movementHistoryRef.current.shift();
            }

            const avgMovement =
              movementHistoryRef.current.reduce((a, b) => a + b, 0) /
              movementHistoryRef.current.length;

            if (avgMovement < 3) {
              setMovementText("Movement: Very steady");
            } else if (avgMovement < 8) {
              setMovementText("Movement: Normal");
            } else {
              setMovementText("Movement: Too much movement");
            }
          }

          previousCenterRef.current = faceCenter;
        }, 500);
      } catch (error) {
        console.error(error);
        setStatus("Could not access camera or load model");
      }
    }

    function stopCameraAndTracking() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      previousCenterRef.current = null;
      movementHistoryRef.current = [];
      eyeSamplesRef.current = [];

      setStatus("Camera off");
      setFaceText("Face: Waiting...");
      setMovementText("Movement: Waiting...");
      setEyeContactText("Eye contact: Waiting...");
      setEyeContactScore(0);
    }

    if (cameraEnabled) {
      startCameraAndTracking();
    } else {
      stopCameraAndTracking();
    }

    return () => {
      stopCameraAndTracking();
    };
  }, [cameraEnabled]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        {!cameraEnabled ? (
          <button
            onClick={() => setCameraEnabled(true)}
            className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
          >
            Enable Camera
          </button>
        ) : (
          <button
            onClick={() => setCameraEnabled(false)}
            className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
          >
            Turn Off Camera
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-slate-700 bg-black">
        {cameraEnabled ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-[320px] w-full object-cover"
          />
        ) : (
          <div className="flex h-[320px] items-center justify-center text-sm text-slate-400">
            Camera is disabled
          </div>
        )}
      </div>

      <div className="rounded-3xl bg-slate-900 p-4">
        <p className="text-sm text-slate-400">{status}</p>

        <div className="mt-3 space-y-2 text-sm text-white">
          <p>{faceText}</p>
          <p>{eyeContactText}</p>
          <p>{movementText}</p>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
            <span>Eye Contact Score</span>
            <span>{eyeContactScore}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${eyeContactScore}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}