//AlignChildrenMeshes.js
//Aligns all the children scene objects of the content object to fit int the default box bounds 

//@input SceneObject content

const BOX_SIZE = 15;// default box size in lens studio 

if (checkInputs()) {
    init();
}

function checkInputs() {
    if (!script.content) {
        print("Parent object is not set");
        return false;
    }
    return true;
}

function init() {
    alignContentToItemSize();
}

function alignContentToItemSize() {
    var tr = script.content.getTransform();
    var maxNumber = 1e20;
    var minNumber = -1 * 1e20;
    
    var aabb = {
        Min: new vec3(maxNumber, maxNumber, maxNumber),
        Max: new vec3(minNumber, minNumber, minNumber),
    };
    var parent = script.content;
    var count = parent.getChildrenCount();
    for (var i = 0; i < count; i++) {
        appendMeshBbox(aabb, parent.getChild(i));
    }
    //get parent scale and position
    var center = aabb.Max.add(aabb.Min).uniformScale(-0.5);
    var size = aabb.Max.sub(aabb.Min);
    var maxSide = Math.max(size.x, size.y, size.z);
    var scale = vec3.one().uniformScale(BOX_SIZE / maxSide);
    //apply transform
    tr.setLocalPosition(center.scale(scale));
    tr.setLocalScale(scale);
}

function appendMeshBbox(aabb, so) {
    var mv = so.getComponent("Component.RenderMeshVisual");
    if (mv && mv.mesh) {
        var transform = so.getTransform();
        var localTransformMat = mat4.compose(transform.getLocalPosition(), transform.getLocalRotation(), transform.getLocalScale());

        var curMin = localTransformMat.multiplyPoint(mv.mesh.aabbMin);
        var curMax = localTransformMat.multiplyPoint(mv.mesh.aabbMax);
        
        aabb.Min.x = Math.min(aabb.Min.x, curMax.x, curMin.x);
        aabb.Min.y = Math.min(aabb.Min.y, curMax.y, curMin.y);
        aabb.Min.z = Math.min(aabb.Min.z, curMax.z, curMin.z);
        
        aabb.Max.x = Math.max(aabb.Max.x, curMax.x, curMin.x);
        aabb.Max.y = Math.max(aabb.Max.y, curMax.y, curMin.y);
        aabb.Max.z = Math.max(aabb.Max.z, curMax.z, curMin.z);
    }
}