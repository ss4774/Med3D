#version 300 es
precision mediump float;uniform mat4 MVMat;uniform mat4 PMat;in vec3 VPos;in vec4 VColor;out vec4 fragVColor;in vec2 uv;out vec2 fragUV;void main(){vec4 VPos4 = MVMat*vec4(VPos, 1.0);gl_Position = PMat*VPos4;fragVColor = VColor;fragUV = uv;}