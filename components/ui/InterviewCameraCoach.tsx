"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import type { VisualMetrics } from "@/lib/interview-feedback";

type InterviewCameraCoachProps = {
  trackingActive?: boolean;
  onMetricsChange?: (metrics: VisualMetrics) => void;
};

export default function InterviewCameraCoach({
  trackingActive = false,
  onMetricsChange,
}: InterviewCameraCoachProps) {
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
  const recentEyeScoresRef = useRef<number[]>([]);
  const awaySampleCountRef = useRef(0);
  const noFaceSampleCountRef = useRef(0);
  const highMovementSampleCountRef = useRef(0);
  const sampleCountRef = useRef(0);
  const detectedSamplesRef = useRef(0);
  const centeredSamplesRef = useRef(0);
  const lookingAwaySamplesRef = useRef(0);
  const steadySamplesRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelLoadedRef = useRef(false);
  const trackingActiveRef = useRef(trackingActive);
  const onMetricsChangeRef = useRef(onMetricsChange);

  useEffect(() => {
    trackingActiveRef.current = trackingActive;
  }, [trackingActive]);

  useEffect(() => {
    onMetricsChangeRef.current = onMetricsChange;
  }, [onMetricsChange]);

  const emitMetrics = useCallback(() => {
    if (!onMetricsChangeRef.current) return;

    const sampleCount = sampleCountRef.current;
    const safeRatio = (value: number) => (sampleCount ? value / sampleCount : 0);
    const averageEyeContactScore = eyeSamplesRef.current.length
      ? eyeSamplesRef.current.reduce((sum, score) => sum + score, 0) / eyeSamplesRef.current.length
      : 0;

    onMetricsChangeRef.current({
      sampleCount,
      faceDetectedRatio: Number(safeRatio(detectedSamplesRef.current).toFixed(3)),
      centeredFaceRatio: Number(safeRatio(centeredSamplesRef.current).toFixed(3)),
      lookingAwayRatio: Number(safeRatio(lookingAwaySamplesRef.current).toFixed(3)),
      steadyRatio: Number(safeRatio(steadySamplesRef.current).toFixed(3)),
      averageEyeContactScore: Math.round(averageEyeContactScore),
    });
  }, []);

  const resetMetrics = useCallback(() => {
    sampleCountRef.current = 0;
    detectedSamplesRef.current = 0;
    centeredSamplesRef.current = 0;
    lookingAwaySamplesRef.current = 0;
    steadySamplesRef.current = 0;
    eyeSamplesRef.current = [];
    recentEyeScoresRef.current = [];
    awaySampleCountRef.current = 0;
    noFaceSampleCountRef.current = 0;
    highMovementSampleCountRef.current = 0;
    emitMetrics();
  }, [emitMetrics]);

  useEffect(() => {
    if (!trackingActive) {
      resetMetrics();
    }
  }, [resetMetrics, trackingActive]);

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
          const video = videoRef.current;
          if (!video) return;
          if (video.readyState < 2) return;

          const detection = await faceapi.detectSingleFace(
            video,
            new faceapi.TinyFaceDetectorOptions()
          );

          if (videoRef.current !== video) return;

          if (trackingActiveRef.current) {
            sampleCountRef.current += 1;
          }

          if (!detection) {
            noFaceSampleCountRef.current += 1;
            const sustainedNoFace = noFaceSampleCountRef.current >= 2;

            setFaceText(
              sustainedNoFace
                ? "Face: Turned away or out of frame"
                : "Face: No face detected",
            );
            setMovementText("Movement: Cannot measure");
            setEyeContactText(
              sustainedNoFace
                ? "Eye contact: Looking away"
                : "Eye contact: No face detected",
            );
            previousCenterRef.current = null;
            movementHistoryRef.current = [];
            recentEyeScoresRef.current = [];
            awaySampleCountRef.current = 0;
            highMovementSampleCountRef.current = 0;
            if (trackingActiveRef.current) {
              lookingAwaySamplesRef.current += 1;
              emitMetrics();
            }
            return;
          }

          setFaceText("Face: Detected");
          noFaceSampleCountRef.current = 0;
          if (trackingActiveRef.current) {
            detectedSamplesRef.current += 1;
          }

          const box = detection.box;
          const faceCenter = {
            x: box.x + box.width / 2,
            y: box.y + box.height / 2,
          };

          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;

          if (!videoWidth || !videoHeight) return;

          const frameCenter = {
            x: videoWidth / 2,
            y: videoHeight / 2,
          };

          const normalizedOffsetX = Math.abs(faceCenter.x - frameCenter.x) / frameCenter.x;
          const normalizedOffsetY = Math.abs(faceCenter.y - frameCenter.y) / frameCenter.y;
          const faceBox = detection.box;
          const leftMargin = Math.max(faceBox.x, 0);
          const rightMargin = Math.max(videoWidth - (faceBox.x + faceBox.width), 0);
          const marginDenominator = Math.max(leftMargin + rightMargin, 1);
          const horizontalBias = Math.abs(leftMargin - rightMargin) / marginDenominator;

          const combinedOffset =
            normalizedOffsetX * 0.45 +
            normalizedOffsetY * 0.15 +
            horizontalBias * 0.4;
          const rawLookingAway =
            combinedOffset >= 0.3 ||
            normalizedOffsetX >= 0.18 ||
            horizontalBias >= 0.28;
          const sustainedLookingAway = rawLookingAway
            ? awaySampleCountRef.current + 1 >= 2
            : false;

          awaySampleCountRef.current = rawLookingAway
            ? awaySampleCountRef.current + 1
            : 0;

          let currentEyeScore = 0;

          if (sustainedLookingAway) {
            currentEyeScore = 20;
            if (trackingActiveRef.current) {
              lookingAwaySamplesRef.current += 1;
            }
          } else if (combinedOffset < 0.2) {
            currentEyeScore = 100;
            if (trackingActiveRef.current) {
              centeredSamplesRef.current += 1;
            }
          } else if (combinedOffset < 0.3) {
            currentEyeScore = 75;
            if (trackingActiveRef.current) {
              centeredSamplesRef.current += 1;
            }
          } else {
            currentEyeScore = 55;
          }

          recentEyeScoresRef.current.push(currentEyeScore);
          if (recentEyeScoresRef.current.length > 6) {
            recentEyeScoresRef.current.shift();
          }

          const recentEyeScore =
            recentEyeScoresRef.current.reduce((a, b) => a + b, 0) /
            recentEyeScoresRef.current.length;

          if (sustainedLookingAway) {
            setEyeContactText("Eye contact: Looking away");
          } else if (recentEyeScore >= 88) {
            setEyeContactText("Eye contact: Good");
          } else if (recentEyeScore >= 55) {
            setEyeContactText("Eye contact: Fair");
          } else {
            setEyeContactText("Eye contact: Looking away");
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
            const normalizedDist =
              Math.sqrt(dx * dx + dy * dy) / Math.max(box.width, box.height, 1);

            movementHistoryRef.current.push(normalizedDist);

            if (movementHistoryRef.current.length > 8) {
              movementHistoryRef.current.shift();
            }

            const sortedMovement = [...movementHistoryRef.current].sort((a, b) => a - b);
            const trimCount = Math.floor(sortedMovement.length * 0.15);
            const trimmedMovement = sortedMovement.slice(
              trimCount,
              sortedMovement.length - trimCount || sortedMovement.length,
            );
            const avgMovement =
              trimmedMovement.reduce((a, b) => a + b, 0) /
              Math.max(trimmedMovement.length, 1);

            if (avgMovement < 0.025) {
              highMovementSampleCountRef.current = 0;
              setMovementText("Movement: Very steady");
              if (trackingActiveRef.current) {
                steadySamplesRef.current += 1;
              }
            } else if (avgMovement < 0.07) {
              highMovementSampleCountRef.current = 0;
              setMovementText("Movement: Normal");
              if (trackingActiveRef.current) {
                steadySamplesRef.current += 1;
              }
            } else {
              highMovementSampleCountRef.current += 1;
              setMovementText(
                highMovementSampleCountRef.current >= 2
                  ? "Movement: Too much movement"
                  : "Movement: Normal",
              );
            }
          }

          previousCenterRef.current = faceCenter;
          if (trackingActiveRef.current) {
            emitMetrics();
          }
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
      recentEyeScoresRef.current = [];
      awaySampleCountRef.current = 0;
      noFaceSampleCountRef.current = 0;
      highMovementSampleCountRef.current = 0;
      resetMetrics();

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
  }, [cameraEnabled, emitMetrics, resetMetrics]);

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
