// BodyUITransitionController.js
// Version: 0.1.0
// Event: On Awake
// Description: Triggers tweens to transition body UI in and out based on whether the body is tracked 

// @input SceneObject bodyUI
// @input SceneObject objectWithTweens
// @input string tweenOn
// @input string tweenOff

if (!global.behaviorSystem) {
    print("Error: No behavior system detected in scene");
}

if (script.bodyUI) {
    script.bodyUI.getTransform().setLocalScale(vec3.zero());
}

if (script.objectWithTweens && global.behaviorSystem) {
    global.behaviorSystem.addCustomTriggerResponse("BODY_TRACKING_IN_VIEW", function() {
        global.tweenManager.startTween(script.objectWithTweens, script.tweenOn);
    });

    global.behaviorSystem.addCustomTriggerResponse("BODY_TRACKING_LOST", function() {
        global.tweenManager.startTween(script.objectWithTweens, script.tweenOff);
    });

    global.behaviorSystem.addCustomTriggerResponse("BODY_TRACKING_DETECTED", function() {
        global.tweenManager.startTween(script.objectWithTweens, script.tweenOff);
    });
}