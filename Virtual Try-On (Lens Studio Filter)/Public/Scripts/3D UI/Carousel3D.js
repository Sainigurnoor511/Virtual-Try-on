// Carousel3D.js
// Version: 2.0.0
// Event: Awake
// Description: Allows to create world placed UI carousel 

//@input SceneObject iconsRoot {"label" : "Items Parent"}
//@ui {"widget":"separator"}
//@input int startIndex = 0 {"showIf" : "autoCenter", "showIfValue" : "false"}
//@input bool autoCenter


//@ui {"widget":"separator"}

//@ui {"widget" : "label", "label" : "Layout Settings"}
//@input float depth = 100
//@input vec2 screenPos = {0.5, 0.9} {"hint" : "0,0 is top left, 1,1 is bottom right", "label" : "Screen Position"}
//@input bool safeRegion = true  {"hint" : "Use safe region instead of full screen"}
//@input float spacing = 1.0
//@input float scale = 0.5
//@input float scaleMultiplier = 1.5

//@ui {"widget":"separator"}
//@ui {"widget" : "label", "label" : "Callbacks"}
//@input bool callScriptApi 
//@input string apiFuncName {"showIf" : "callScriptApi"}
//@input Component.ScriptComponent[] scriptsWithApi {"showIf" : "callScriptApi"}

//@input bool useBehavior 
//@input string onIndexChanged = "ON_INDEX_CHANGED" {"showIf" : "useBehavior"}
//@input string onNthIndexSelected = "ON_INDEX_" {"showIf" : "useBehavior", "hint" : "This is a prefix, index will be aded to this string"}

//@ui {"widget":"separator"} 
//@input bool useTouchEvents = true 
//@input bool touchBlock  = true {"showIf": "useTouchEvents"}
//@ui {"widget":"separator"} 
//@input bool advanced = false
//@input float smoothCoef = 0.5 {"showIf": "advanced", "widget" : "slider", "min" : 0, "max" : 1, "step" : 0.05}
//@input float swipeSensitivity = 75  {"showIf": "advanced"}
//@input Component.Camera camera {"showIf": "advanced"}
//@input bool setRenderLayer {"showIf": "advanced", "hint" : "Force all children to this camera's render layer"}

const BOX_SIZE = 15; //default box mesh size 

var carousel;
var touchPos = vec2.zero();
var touchMoved = false;
var st;

var defaultParameters = {
    scale: script.scale,
    scaleMultiplier: script.scaleMultiplier,
    spacing: script.spacing,
    screenPos: script.screenPos,
    depth: script.depth,
    smoothCoef: 1.0 - script.smoothCoef
};

var Carousel = function(root) {
    this.rootTransform = root.getTransform();
    this.icons = [];
    this.iconTransforms = [];
    this.count = 0;
    for (var i = 0; i < root.getChildrenCount(); i++) {
        var child = root.getChild(i);
        if (child.enabled == true) {
            this.icons.push(child);
            this.iconTransforms.push(child.getTransform());
            var vis = child.getComponent("Component.BaseMeshVisual");
            if (vis != null) {
                var ic = child.createComponent("Component.InteractionComponent");
                ic.addMeshVisual(vis);
                ic.setCamera(script.camera);
                var onItemTapped = function(idx, self) {
                    return function() {
                        self.setIndex(idx); 
                    }; 
                }(i, this);
                child.createComponent("ScriptComponent").createEvent("TapEvent").bind(onItemTapped);
            }
            this.count++;
        }
    }
    this.currentIndex = script.autoCenter ? Math.floor(this.count / 2.0) : script.startIndex;
    this.callbacks = [];
    this.initialized = false;
};

Carousel.prototype.setParameters = function(params) {
    if (params.screenPos != undefined) {
        if (script.safeRegion) {
            this.screenPos = remapToSafePoint(params.screenPos);
        } else {
            this.screenPos = params.screenPos;
        }
    }
    this.scale = params.scale != undefined ? params.scale : this.scale;
    this.scaleMultiplier = params.scaleMultiplier != undefined ? params.scaleMultiplier : this.scaleMultiplier;
    this.spacing = params.spacing != undefined ? params.spacing * BOX_SIZE : this.spacing;
    this.depth = params.depth != undefined ? params.depth : this.depth;
    this.smoothCoef = params.smoothCoef != undefined ? params.smoothCoef : this.smoothCoef;
    this.initPosition = script.camera.screenSpaceToWorldSpace(this.screenPos, this.depth);
    this.currentPosition = this.initPosition.add(new vec3(this.currentIndex * -this.spacing, 0, 0));
    if (!this.initialized) {
        this.buildLayout();
        this.setIndex(this.currentIndex);
    }
};

Carousel.prototype.buildLayout = function() {
    if (!this.rootTransform || !this.currentPosition || this.smoothCoef === undefined || this.spacing === undefined || this.scale === undefined) {
        print("Warning, parameters are not set, casousel is not built");
        return;
    }
    this.rootTransform.setWorldPosition(this.currentPosition);
    var scaleVec = new vec3(this.scale, this.scale, this.scale);

    for (var i = 0; i < this.count; i++) {
        this.iconTransforms[i].setLocalPosition(new vec3(i * this.spacing, 0, 0));
        this.iconTransforms[i].setLocalScale(scaleVec);
    }
    this.initialized = true;
};

Carousel.prototype.setIndex = function(index) {
    
    if (!this.initialized) {
        return;
    }
    index = Math.min(Math.max(0, index), this.count - 1);
    this.currentPosition = this.initPosition.add(new vec3(index * -this.spacing, 0, 0));
    this.currentIndex = index;
    //call all the callbacks
    for (var i = 0; i < this.callbacks.length; i++) {
        this.callbacks[i](this.currentIndex);
    }
    if (script.callScriptApi) {
        for (var j = 0; j < script.scriptsWithApi.length; j++) {
            if (script.scriptsWithApi[j] && script.scriptsWithApi[j].api[script.apiFuncName]) {
                script.scriptsWithApi[j].api[script.apiFuncName](index);
            }
        }
    }
    if (script.useBehavior && global.behaviorSystem) {
        global.behaviorSystem.sendCustomTrigger(script.onIndexChanged);
        global.behaviorSystem.sendCustomTrigger(script.onNthIndexSelected + index.toString());
    }
};

Carousel.prototype.update = function() {
    if (!this.initialized) {
        return;
    }
    var curPos = this.rootTransform.getWorldPosition();
    this.rootTransform.setWorldPosition(vec3.lerp(curPos, this.currentPosition, this.smoothCoef));

    var scaleVec = new vec3(this.scale, this.scale, this.scale);
    var nextPos = vec3.zero();
    var nextScale;

    for (var i = 0; i < this.count; i++) {
        curPos = this.iconTransforms[i].getLocalPosition();
        nextPos.x = i * this.spacing;
        this.iconTransforms[i].setLocalPosition(vec3.lerp(curPos, nextPos, this.smoothCoef));

        var curScale = this.iconTransforms[i].getLocalScale();
        nextScale = (i == this.currentIndex) ? scaleVec.uniformScale(this.scaleMultiplier) : scaleVec;
        this.iconTransforms[i].setLocalScale(vec3.lerp(curScale, nextScale, this.smoothCoef));
    }
};

Carousel.prototype.move = function(delta) {
    if (!this.initialized) {
        return;
    }
    this.currentPosition.x += delta;
    this.rootTransform.setWorldPosition(this.currentPosition);
};

Carousel.prototype.snap = function() {
    if (!this.initialized) {
        return;
    }
    var index = Math.round((carousel.initPosition.x - carousel.currentPosition.x) / this.spacing);
    this.setIndex(index);
};


// initialize
function checkInputs() {
    if (!script.camera) {
        print("Error: Please set camera to attach carousel to");
        return false;
    }
    if (!script.iconsRoot) {
        print("Error: Please set iconsRoot scene object, the object with child items in it");
        return false;
    }
    return true;
}
// Build carousel
function init() {
    carousel = new Carousel(script.iconsRoot);
    if (script.safeRegion) {
        initSafeScreenRegion();
        callDelayed(function() {
            carousel.setParameters(defaultParameters);
        }, 0.001);
    } else {
        carousel.setParameters(defaultParameters);
    }

    if (script.setRenderLayer) {
        var renderLayer = script.camera.renderLayer;
        setRenderLayerRecursively(script.iconsRoot, renderLayer);
    }

    if (script.useTouchEvents) {
        setupTouchEvents();
    }

    script.createEvent("UpdateEvent").bind(function() {
        if (!touchMoved) {
            carousel.update();
        }
    });
}

//helper functions

function callDelayed(cb, delay) {
    var event = script.createEvent("DelayedCallbackEvent");
    event.bind(cb);
    event.reset(delay);
}

function initSafeScreenRegion() {
    var so = global.scene.createSceneObject("HelperCam");
    var cam = so.createComponent("Component.Camera");
    cam.type = Camera.Type.Orthographic;
    var child = global.scene.createSceneObject("screen_region_helper");
    child.setParent(so);
    st = child.createComponent("Component.ScreenTransform");
    var sr = child.createComponent("Component.ScreenRegionComponent");
    sr.region = ScreenRegionType.SafeRender;
}

function setRenderLayerRecursively(so, rl) {
    so.layer = rl;
    var count = so.getChildrenCount();
    for (var i = 0; i < count; i++) {
        setRenderLayerRecursively(so.getChild(i), rl);
    }

}
// Setup Touch Events

function setupTouchEvents() {
    if (script.touchBlock) {
        global.touchSystem.touchBlocking = true;
        //add mask
    }
    script.createEvent("TouchStartEvent").bind(function(data) {
        touchPos = data.getTouchPosition();
        touchMoved = false;
    });


    script.createEvent("TouchMoveEvent").bind(function(data) {
        var movePos = data.getTouchPosition();
        var delta = movePos.x - touchPos.x;
        if (Math.abs(delta) > 0.01) {
            touchMoved = true;
            carousel.move(delta * script.swipeSensitivity);
            touchPos = movePos;
        }
    });


    script.createEvent("TouchEndEvent").bind(function(data) {
        if (touchMoved) {
            carousel.snap();
        }
        touchMoved = false;
    });
}

function remapToSafePoint(p) {
    return st.localPointToScreenPoint(new vec2(p.x * 2 - 1, 1.0 - p.y * 2));
}

// external api
/**
 * add a callback
 * @param {function} func 
 */
script.api.addCallback = function(func) {
    carousel.callbacks.push(func);
};
/**
 * use this function to remove a callback
 * @param {function} func 
 */
script.api.removeCallback = function(func) {
    const idx = carousel.callbacks.indexOf(func);
    if (idx > -1) {
        carousel.callbacks.splice(idx, 1);
    }
};
/**
 *force next carousel item
 */
script.api.next = function() {
    carousel.setIndex(carousel.currentIndex + 1);
};
/**
 * force previous carousel item
 */
script.api.previous = function() {
    carousel.setIndex(carousel.currentIndex - 1);
};
//
/**
 * use this to override any settings 
 * @param {*} params 
 */
script.api.setParameters = function(params) {
    if (params) {
        carousel.setParameters(params);
    } else {
        carousel.setParameters(defaultParameters);
    }
};
/**
 * returns item count
 * @returns Number
 */
script.api.getCount = function() {
    return carousel.count;
};
/**
 * returns current selected index
 * @returns Number
 */
script.api.getIndex = function() {
    return carousel.currentIndex;
};
/**
 * set current index
 * @param {Number} idx 
 */
script.api.setIndex = function(idx) {
    carousel.setIndex(idx);
};
/**
 * set current index
 * @param {Number} idx 
 * @param {boolean} isEnabled 
 */
script.api.enableByIndex = function(idx, isEnabled) {
    carousel.icons[idx].enabled = isEnabled;
};

//initialize
if (checkInputs()) {
    init();
}