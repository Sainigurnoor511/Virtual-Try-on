// Version 0.1.0
// Event - Any
// MakeMaterialInvisible.js
// Used to make material visible in Scene View but invisible in Preview

//@input Asset.Material mat

if (script.mat) {
    var pass = script.mat.mainPass;
    pass.colorMask = new vec4b(false, false, false, false);
}