// EnableChildByIndex.js
// Version: 0.1.0
// Event: On Awake
// Description: provides and api that allows to enable it's child sceneObject by index

// @input SceneObject parent

var previousIdx = 0;

function enableByIndex(idx) {
    // debounce
    if (idx === previousIdx) {
        return;
    }
    for (var i = 0; i < script.parent.getChildrenCount(); i++) {
        script.parent.getChild(i).enabled = i === idx;
    }
    previousIdx = idx;
}

script.api.enableByIndex = enableByIndex;