// BodyTrackingDetector.js
// Version: 0.1.0
// Event: On Awake
// Description: This script handles broadcasting behavior system events based on a bodyTracking
// ObjectTracking3D asset. It moves through three states:
// 1. BODY_TRACKING_LOST: When no body is detected
// 2. BODY_TRACKING_DETECTED: When a body is tracked by the body tracking system
// 3. BODY_TRACKING_IN_VIEW: When the body is a specified distance away from the tracking camera


/*
State Tansitions for Body Tracking Detector 
┌─────────────────────┐       ┌─────────────────────┐       ┌─────────────────────┐
│                     │       │                     │       │                     │
│ BODY_TRACKING_LOST  ├──────►BODY_TRACKING_DETECTED├──────►│BODY_TRACKING_IN_VIEW│
│                     │       │                     │       │                     │
└─────────────────────┘       └──────────┬──────────┘       └───────────┬───┬─────┘
       ▲   ▲                             │        ▲                     │   │
       │   └─────────────────────────────┘        └─────────────────────┘   │
       │                                                                    │
       └────────────────────────────────────────────────────────────────────┘
*/

// @input Component.ObjectTracking3D bodyTracking
// @input Component.Camera trackingCamera
// @input float inViewDistanceThreshold = 150; 

const EPS = 2.0; // used for stabilizing distance switching
var hipAttachment;
var isInView = false;
var TrackingState = {"BODY_TRACKING_LOST": "BODY_TRACKING_LOST", 
    "BODY_TRACKING_DETECTED": "BODY_TRACKING_DETECTED", 
    "BODY_TRACKING_IN_VIEW": "BODY_TRACKING_IN_VIEW"};
var currentState = TrackingState.BODY_TRACKING_LOST;
var newState = null;

function init() {
    if (!global.behaviorSystem) {
        print("Error: No behavior system detected in scene");
    }
    hipAttachment = script.bodyTracking.createAttachmentPoint("Hips");
}

function broadcastStateUpdate(state) {
    if (global.behaviorSystem) {
        global.behaviorSystem.sendCustomTrigger(state);
    }
}

function handleIsTrackingUpdate(isTracking) {
    if (currentState !== TrackingState.BODY_TRACKING_LOST && !isTracking) {
        newState = TrackingState.BODY_TRACKING_LOST;
    }
    if ((currentState === TrackingState.BODY_TRACKING_LOST) && isTracking) {
        newState = TrackingState.BODY_TRACKING_DETECTED;       
    }    
}

function handleIsInViewUpdate(isInView) {
    if (currentState === TrackingState.BODY_TRACKING_DETECTED && isInView) {
        newState = TrackingState.BODY_TRACKING_IN_VIEW;        
    }
    if (currentState === TrackingState.BODY_TRACKING_IN_VIEW && !isInView) {
        newState = TrackingState.BODY_TRACKING_DETECTED;        
    }
}

init();

var updateEvent = script.createEvent("UpdateEvent");
updateEvent.bind(function(eventData) {
    var hipPos = hipAttachment.getTransform().getWorldPosition();
    var cameraPos = script.trackingCamera.getTransform().getWorldPosition();
    
    if (isInView) {
        isInView = hipPos.distance(cameraPos) >= script.inViewDistanceThreshold - EPS;    
    } else {
        isInView = hipPos.distance(cameraPos) >= script.inViewDistanceThreshold + EPS;    
    }    
        
    handleIsTrackingUpdate(script.bodyTracking.isTracking());
    handleIsInViewUpdate(isInView);
    
    if (newState != currentState) {        
        broadcastStateUpdate(newState);
        currentState = newState;
    }
});