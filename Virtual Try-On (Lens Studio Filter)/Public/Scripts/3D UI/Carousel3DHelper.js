// Carousel3DHelper.js
// Controls carousel properties based on the body tracking state
// @input Component.ScriptComponent carousel

var hideActiveItem = false;
var currentIdx;
var carousel = script.carousel.api;

var zoomedOutParams = { screenPos: new vec2(0.50, 0.75), 
    scale : 1.0,
    spacing: 1.5,
    scaleMultiplier : 1.0};

var delayedZoomOutEvent = script.createEvent("DelayedCallbackEvent");
delayedZoomOutEvent.bind(zoomCarousel);

function onStart() {
    currentIdx = carousel.getIndex();
    carousel.addCallback(function(idx) {
        currentIdx = idx;
        updateCarouselItems(idx, hideActiveItem);
    });
}

function zoomCarousel() {
    carousel.setParameters(zoomedOutParams);
    updateCarouselItems(currentIdx, hideActiveItem);
}

var resetCarousel = function() {
    carousel.setParameters();
    hideActiveItem = false;
    updateCarouselItems(currentIdx, hideActiveItem);
};

function updateCarouselItems(activeIdx, hideActive) {
    for (var i = 0; i < carousel.getCount(); i++) {
        carousel.enableByIndex(i, hideActive ? i !== activeIdx : true);
    }
}

script.createEvent("OnStartEvent").bind(onStart);

if (!global.behaviorSystem) {
    print("Error: No behavior system detected in scene");
} else {
    global.behaviorSystem.addCustomTriggerResponse("BODY_TRACKING_IN_VIEW", function() {
        hideActiveItem = true;
        delayedZoomOutEvent.enabled = true;
        delayedZoomOutEvent.reset(1.25);
    });
    
    global.behaviorSystem.addCustomTriggerResponse("BODY_TRACKING_LOST", function() {
        delayedZoomOutEvent.enabled = false;    
        resetCarousel();
    });
    
    global.behaviorSystem.addCustomTriggerResponse("BODY_TRACKING_DETECTED", function() {
        delayedZoomOutEvent.enabled = false;        
        resetCarousel();
    });
}
