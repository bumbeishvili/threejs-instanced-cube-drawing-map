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
    float radius = 1.41;
    float outer_progress = clamp(1.1 * uProgress, 0., 1.);
    float inner_progress = clamp(1.1 * uProgress - 0.05, 0., 1.);
    float innerCircle = 1. - smoothstep((inner_progress - 0.1) * radius, inner_progress * radius, dist);
    float outerCircle = 1. - smoothstep((outer_progress - 0.1) * radius, outer_progress * radius, dist);
    vec4 finalColor = mix(color, color2, uProgress);
    float displacement = outerCircle - innerCircle;
    float scale = mix(color.r, color2.r, innerCircle);
    //gl_FragColor = finalColor;
    gl_FragColor = vec4(vec3(displacement,scale,0.0), 1.);
}