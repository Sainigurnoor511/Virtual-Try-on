// BodyUIButton.js
// Version: 0.1.0
// Event: On Awake
// Description: A script that allows to add callbacks to the button placed in 3D space.
// Allows to set up a hold time that is required in order to trigger attached callbacks

// @input SceneObject[] controls {"hint" : "SceneObjects to trigger button with"}
// @ui {"widget":"separator"}
// @input float pressedTime = 1.0 {"min" : "0"}
// @ui {"widget":"separator"}
// @ui {"widget":"label", "label":"Callbacks"}
// @input bool callScriptApi 
// @input string apiFuncName {"showIf" : "callScriptApi"}
// @input Component.ScriptComponent[] scriptsWithApi {"showIf" : "callScriptApi"}
// @input bool useBehavior 
// @input string[] onTapped = "ON_TAPPED" {"showIf" : "useBehavior"}

// @ui {"widget":"separator"}
// @input bool useTouchEvents

// @ui {"widget":"separator"}
// @input bool connections 
// @input Component.Camera camera {"showIf" : "connections"}
// @input Component.MaterialMeshVisual percentageVisual  {"showIf" : "connections"}
// @input Component.BaseMeshVisual collisionSphere {"showIf" : "connections"}

// Object to manage placing the body UI
const SPHERE_RADIUS = 7.5;

var percentageController;
var button;

var transform;
var controlTransforms;
var cameraTransform;

var isColliding = false;

var PercentageController = function(matMeshVisual) {
    this.mat = matMeshVisual.mainMaterial.clone();
    matMeshVisual.mainMaterial = this.mat;
    this.pass = this.mat.mainPass;
};

PercentageController.prototype.update = function(value) {
    this.pass.progress_value = value;
};

var Button3D = function(pressedTime) {
    this.pressedTime = pressedTime;
    this.startTime = -1;
    this.pressedDown = false;
    this.percentComplete = 0;
    this.callbacks = [];
    this.sceneObject = [];
};

Button3D.prototype.pressDown = function() {
    this.startTime = getTime();
    this.pressedDown = true;
};

Button3D.prototype.pressUp = function() {
    this.pressedDown = false;
    this.percentComplete = 0;
};
Button3D.prototype.update = function() {
    if (this.pressedDown) {
        var timeSinceEnter = getTime() - this.startTime;
        var percent = timeSinceEnter / this.pressedTime;
        this.percentComplete = percent;
        if (timeSinceEnter >= this.pressedTime) {
            this.callbacks.forEach(function(cb) {
                cb();
            });
            this.pressUp();
        }
    }
};

Button3D.prototype.addCallback = function(cb) {
    this.callbacks.push(cb);
};

Button3D.prototype.removeCallback = function(cb) {
    const idx = this.callbacks.indexOf(cb);
    if (idx > -1) {
        this.callbacks.splice(idx, 1);
    }
};

Button3D.prototype.getPressedProgress = function() {
    return this.percentComplete;
};

// to help debug in studio ability allowing touch events

function setupTouchEvents() {
    var ic = script.getSceneObject().createComponent("Component.InteractionComponent");
    ic.addMeshVisual(script.collisionSphere);
    ic.setCamera(script.camera);

    script.createEvent("TouchStartEvent").bind(function(data) {
        button.pressDown();
    });

    script.createEvent("TouchEndEvent").bind(function(data) {
        button.pressUp();
    });
}

function checkCollision() {
    for (var i = 0; i < controlTransforms.length; i++) {
        var controlPos = controlTransforms[i].getWorldPosition();
        var screenPoint = script.camera.worldSpaceToScreenSpace(controlPos);
        if (screenPoint.x > 0 && screenPoint.x < 1 && screenPoint.y > 0 && screenPoint.y < 1) {

            var buttonPos = transform.getWorldPosition();
            //convert control position to the position at btns depth
            var depth = cameraTransform.getWorldPosition().distance(buttonPos);
            controlPos = script.camera.screenSpaceToWorldSpace(screenPoint, depth);
            var distance = buttonPos.distance(controlPos);
            var scale = transform.getWorldScale();
            if (distance < SPHERE_RADIUS * scale.x) {
                return true;
            }
        }
    }
    return false;
}

function onButtonTapped() {
    if (script.callScriptApi) {
        for (var i = 0; i < script.scriptsWithApi.length; i++) {
            if (script.scriptsWithApi[i] && script.scriptsWithApi[i].api[script.apiFuncName]) {
                script.scriptsWithApi[i].api[script.apiFuncName]();
            }
        }
    }
    if (script.useBehavior && global.behaviorSystem) {
        for (var j = 0; j < script.onTapped.length; j++) {
            global.behaviorSystem.sendCustomTrigger(script.onTapped[j]);
        }
    }
}
//main update function
function onUpdate() {
    if (checkCollision()) {
        if (!isColliding) {
            button.pressDown();
            isColliding = true;
        }
    } else {
        if (isColliding) {
            button.pressUp();
        }
        isColliding = false;

    }
    button.update();
    percentageController.update(button.getPressedProgress());
}

function checkInputs() {
    if (!script.camera) {
        print("Please set Camera under connections checkbox on the " + script.getSceneObject().name + " scene object");
        return false;
    }
    if (!script.collisionSphere) {
        print("Please set Collision Sphere under connections checkbox on the " + script.getSceneObject().name + " scene object");
        return false;
    }
    if (!script.percentageVisual) {
        print("Please set Percentage Visual under connections checkbox on the " + script.getSceneObject().name + " scene object");
        return false;
    }
    return true;
}

function init() {

    transform = script.collisionSphere.getTransform();
    controlTransforms = [];
    for (var i = 0; i < script.controls.length; i++) {
        if (script.controls[i]) {
            controlTransforms.push(script.controls[i].getTransform());
        }
    }
    cameraTransform = script.camera.getSceneObject().getTransform();

    percentageController = new PercentageController(script.percentageVisual);

    button = new Button3D(script.pressedTime);
    button.addCallback(onButtonTapped);

    if (script.useTouchEvents) {
        setupTouchEvents();
    }

    script.createEvent("UpdateEvent").bind(onUpdate);
}

// external api
/**
 * add a callback
 * @param {function} func 
 */
script.api.addCallback = function(func) {
    button.addCallback(func);
};
/**
 * use this function to remove a callback
 * @param {function} func 
 */
script.api.removeCallback = function(func) {
    button.removeCallback(func);
};

if (checkInputs()) {
    init();
}
