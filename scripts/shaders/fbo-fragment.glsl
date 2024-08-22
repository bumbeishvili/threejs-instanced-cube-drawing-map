uniform float uTime;
uniform float uProgress;
uniform sampler2D state1Texture;
uniform sampler2D state2Texture;
uniform vec3 uResolution;
varying vec2 vUv;
varying vec3 vPosition;
float PI = 3.141592;

void main() {
    vec4 color = texture2D(state1Texture, vUv);
    vec4 color2 = texture2D(state2Texture, vec2(vUv.x, 1. - vUv.y));

    float dist = distance(vUv, vec2(0.5));
    vec4 finalColor = mix(color, color2, uProgress);
    gl_FragColor = finalColor;
    //gl_FragColor = vec4(vUv, 0.0, 1.);
}