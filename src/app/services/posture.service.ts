import { Injectable, ElementRef } from '@angular/core';
import { Pose } from '@mediapipe/pose';
import { BehaviorSubject, interval, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PostureService {
  private pose!: Pose;
  private postureHistory: string[] = [];
  private debugInfo = new BehaviorSubject<any>({});
  private feedbackSubject = new BehaviorSubject<string>('');
  private goodOrBadSubject = new BehaviorSubject<string>('');
  private captureInterval!: Subscription;

  feedback$ = this.feedbackSubject.asObservable();
  goodOrBad$ = this.goodOrBadSubject.asObservable();
  debug$ = this.debugInfo.asObservable();

  constructor() {}

  initializePose() {
    this.pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    this.pose.setOptions({
      modelComplexity: 2,
      smoothLandmarks: true,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7
    });

    this.pose.onResults(this.onResults.bind(this));
  }

  private captureFrameEveryInterval(videoElement: ElementRef<HTMLVideoElement>) {
    // Capture frame every 500 ms
    this.captureInterval = interval(500).subscribe(() => {
      if (videoElement.nativeElement.readyState === 4) {
        this.pose.send({ image: videoElement.nativeElement });
      }
    });
  }

  private onResults(results: any) {
    if (results.poseLandmarks) {
      this.evaluatePosture(results.poseLandmarks);
    }
  }

  private evaluatePosture(landmarks: any) {
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const nose = landmarks[0];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    let debug: any = { leftShoulder, rightShoulder, nose, leftHip, rightHip };
    let detected = false;
    let badPosture = false;

    const process = (action: string | undefined, notBad: boolean = false) => {
        if (!detected && action) {
          detected = true;
          badPosture = !notBad;
          this.feedbackSubject.next(action);
        }
    }

    const shoulderAlignmentCheck = (): string | undefined => {
      const shoulderAlignment = Math.abs(leftShoulder.y - rightShoulder.y);
      debug = { ...debug, shoulderAlignment };
      if (shoulderAlignment > 0.05) {
        return 'FEEDBACK_ALIGN_SHOULDERS';
      }
      return undefined;
    }

    const forwardHeadCheck = (): string | undefined => {
      const forwardHead = nose.y > leftShoulder.y && nose.y > rightShoulder.y;
      if (forwardHead) {
        return 'FEEDBACK_PULL_HEAD_BACK';
      } 
      return undefined;
    }

    const shoulderHunchingCheck = (): string | undefined => {
      const torsoCenterX = (leftHip.x + rightHip.x) / 2;
      
      const leftShoulderOffset = leftShoulder.x - torsoCenterX;
      const rightShoulderOffset = rightShoulder.x - torsoCenterX;
      
      debug = { ...debug, torsoCenterX, leftShoulderOffset, rightShoulderOffset };
      
      const shoulderHunchThreshold = 0.1;
    
      if (leftShoulderOffset < shoulderHunchThreshold && rightShoulderOffset < shoulderHunchThreshold) {
        return 'FEEDBACK_SHOULDERS_HUNCHED';
      }
  
      return undefined;
    };

    process(shoulderAlignmentCheck());
    process(forwardHeadCheck());
    process(shoulderHunchingCheck());
    process('FEEDBACK_GOOD_POSTURE', true);

    this.debugInfo.next(debug);

    this.updatePostureHistory(badPosture ? 'bad' : 'good');
  }



  private updatePostureHistory(postureState: 'good' | 'bad') {
    this.postureHistory.push(postureState);
    if (this.postureHistory.length > 10) {
      this.postureHistory.shift();
    }

    const badPostureCount = this.postureHistory.filter(state => state === 'bad').length;
    if (badPostureCount > 5) {
      this.goodOrBadSubject.next('bad');
    } else {
      this.goodOrBadSubject.next('good');
    }
  }

  startVideo(videoElement: ElementRef<HTMLVideoElement>) {
    const video = videoElement.nativeElement;
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      video.srcObject = stream;
      video.play();
      this.captureFrameEveryInterval(videoElement);
    });
  }

  stopCapture(videoElement: ElementRef<HTMLVideoElement>) {
    if (this.captureInterval) {
      this.captureInterval.unsubscribe();
    }
    const video = videoElement.nativeElement;
    video.pause();
    video.currentTime = 0;
    const mediaStream = video.srcObject;

    if (mediaStream instanceof MediaStream) {
      mediaStream.getTracks()?.[0]?.stop();
    }
    
  }
}