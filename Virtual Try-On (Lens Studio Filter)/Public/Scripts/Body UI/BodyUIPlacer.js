// BodyUIPlacer.js
// Version: 0.1.0
// Event: On Awake
// Description: Body UI Placer places 3d UI relative to a body tracked by an ObjectTracking3D instance.
// Attach this script to an object to have to have it placed relative to a tracked body.


// @input Component.ObjectTracking3D bodyTracking
// @input Component.Camera camera
// @input string side = "Left" {"widget":"combobox", "values":[{"label":"Left", "value": "Left"}, {"label": "Right", "value": "Right"}]}
// @input float verticalOffset = 0.7 {"widget":"slider", "min":0.0, "max":3.0, "step":0.1}
// @input float horizontalOffset = 0.5 {"widget":"slider", "min":0.0, "max":3.0, "step":0.1}
// @input float uiDepth = 175.0 {"widget":"slider", "min":0, "max":500, "step":1}
// @input float smoothTime = 0.3 {"widget":"slider", "min":0, "max":5, "step":0.1}
// @input float snapDistance = 50 {"widget":"slider", "min":0, "max":200, "step":1.0}


// Manages placing of the body UI
/**
 * 
 * @param {Component.ObjectTracking3D} bodyTracking 
 * @param {SceneObject} uiElement 
 * @param {Component.Camera} camera
 * @param {Number} horizontalOffset 
 * @param {Number} verticalOffset 
 */
var BodyUIPlacer = function(bodyTracking, uiElement, camera, horizontalOffset, verticalOffset) {
    this.rightForeArm = bodyTracking.createAttachmentPoint("RightForeArm").getTransform();
    this.rightArm = bodyTracking.createAttachmentPoint("RightArm").getTransform();
    this.rightHand = bodyTracking.createAttachmentPoint("RightHand").getTransform();
    this.neck =  bodyTracking.createAttachmentPoint("Neck").getTransform();
    this.leftArm = bodyTracking.createAttachmentPoint("LeftArm").getTransform();

    this.camera = camera;
    this.cameraTransform = camera.getSceneObject().getTransform();
    this.uiElementTransform = uiElement.getTransform();
      
    this.upperArmLength = 0;
    this.foreArmLength = 0;
    this.armToNeck = 0;
    
    this.horizontalOffset = horizontalOffset;
    this.verticalOffset = verticalOffset;
    
    this.bodyTracking = bodyTracking;
    
    
};

BodyUIPlacer.prototype.updateArmLength = function() {
    // Get length of upper arm
    var rightArmPos = this.rightArm.getWorldPosition();
    var rightForeArmPos = this.rightForeArm.getWorldPosition();
    this.upperArmLength = rightArmPos.sub(rightForeArmPos).length;
    // Get length of the forearm 
    var rightHandPos = this.rightHand.getWorldPosition();
    this.foreArmLength = rightArmPos.sub(rightHandPos).length;
    
    var neckPos = this.neck.getWorldPosition();
    this.neckToRArm = rightArmPos.sub(neckPos);        
    this.armToNeck = this.neckToRArm.length;    
};

BodyUIPlacer.prototype.getHorizontalBodyVector = function() {
    // Get vector defining shoulder line
    return this.cameraTransform.right;
};

BodyUIPlacer.prototype.getVerticalBodyVector = function() {
    // Get vector defining torso line
    return this.neck.up;
};

BodyUIPlacer.prototype.updateUIElementPosition =  function() {
    var shoulderVector = this.getHorizontalBodyVector();
    var torsoVector = this.getVerticalBodyVector();
    // Place UI an upper arms length along the shoulder line and a forearms length up
    var uiPosition;
    if (script.side === "Left") {
        var neckToLArm = vec3.right().uniformScale(this.armToNeck);
        var leftArmPos = this.neck.getWorldPosition().add(neckToLArm);
        uiPosition = leftArmPos.add(shoulderVector.uniformScale(this.upperArmLength * this.horizontalOffset));
    } else {
        var neckToRArm = vec3.left().uniformScale(this.armToNeck);
        var rightArmPos = this.neck.getWorldPosition().add(neckToRArm); 
        uiPosition = rightArmPos.add(shoulderVector.uniformScale(-1 * this.upperArmLength * this.horizontalOffset));
    }
    uiPosition = uiPosition.add(torsoVector.uniformScale(this.foreArmLength * this.verticalOffset));
    var screenPoint = this.camera.worldSpaceToScreenSpace(uiPosition);
    var worldPoint = this.camera.screenSpaceToWorldSpace(screenPoint, script.uiDepth);
    var currentPosition = this.uiElementTransform.getWorldPosition();
    var smoothedPosition;   
    if (currentPosition.distance(worldPoint) > script.snapDistance) {
        smoothedPosition = worldPoint;
    } else {
        smoothedPosition = vec3.lerp(currentPosition, worldPoint, getDeltaTime() / script.smoothTime);
    }
    this.uiElementTransform.setWorldPosition(smoothedPosition);
};

// -------- EVENT SETUP ---------- //

var bodyUiPlacer = new BodyUIPlacer(script.bodyTracking, script.getSceneObject(), script.camera, script.horizontalOffset, script.verticalOffset);

if (!global.behaviorSystem) {
    print("Error: No behavior system detected in scene");
} else {
    global.behaviorSystem.addCustomTriggerResponse("BODY_TRACKING_IN_VIEW", function() {
        bodyUiPlacer.updateArmLength();
    });
}

var updateEvent = script.createEvent("UpdateEvent");
updateEvent.bind(function(eventData) {
    bodyUiPlacer.updateUIElementPosition();
});

