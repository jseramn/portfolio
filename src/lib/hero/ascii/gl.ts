import { PLANE_H, PLANE_W, samplerMvp, type AsciiCamera } from "./scene"

const VERT = `
attribute vec3 aPos;
attribute vec2 aUv;
uniform mat4 uMVP;
varying vec2 vUv;
void main() {
  vUv = aUv;
  gl_Position = uMVP * vec4(aPos, 1.0);
}
`

const FRAG = `
precision mediump float;
uniform sampler2D uTex;
varying vec2 vUv;
void main() {
  gl_FragColor = texture2D(uTex, vUv);
}
`

const GL_OPTS: WebGLContextAttributes = {
  alpha: false,
  antialias: false,
  depth: false,
  stencil: false,
  powerPreference: "low-power",
  preserveDrawingBuffer: false,
}

export type SamplerCanvas = {
  width: number
  height: number
  getContext: (
    id: string,
    opts?: WebGLContextAttributes,
  ) => WebGL2RenderingContext | WebGLRenderingContext | null
}

export type AsciiSampler = {
  canvas: SamplerCanvas
  resize: (cols: number, rows: number) => void
  uploadVideo: (video: HTMLVideoElement) => void
  draw: (camera: AsciiCamera) => void
  readPixels: (pixels: Uint8Array) => boolean
  dispose: () => void
}

function compile(gl: WebGLRenderingContext, vertSrc: string, fragSrc: string): WebGLProgram | null {
  const vs = gl.createShader(gl.VERTEX_SHADER)
  const fs = gl.createShader(gl.FRAGMENT_SHADER)
  if (!vs || !fs) return null
  gl.shaderSource(vs, vertSrc)
  gl.shaderSource(fs, fragSrc)
  gl.compileShader(vs)
  gl.compileShader(fs)
  if (
    !gl.getShaderParameter(vs, gl.COMPILE_STATUS) ||
    !gl.getShaderParameter(fs, gl.COMPILE_STATUS)
  ) {
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    return null
  }
  const program = gl.createProgram()
  if (!program) return null
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    return null
  }
  return program
}

export function createAsciiSampler(canvas?: SamplerCanvas): AsciiSampler | null {
  const target = canvas ?? (document.createElement("canvas") as unknown as SamplerCanvas)
  try {
    const gl = target.getContext("webgl2", GL_OPTS) || target.getContext("webgl", GL_OPTS)
    if (!gl) return null
    const program = compile(gl, VERT, FRAG)
    if (!program) return null
    const buf = gl.createBuffer()
    const tex = gl.createTexture()
    if (!buf || !tex) return null
    const bindProgram = gl.useProgram.bind(gl)

    const hw = PLANE_W / 2
    const hh = PLANE_H / 2
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-hw, -hh, 0, 0, 0, hw, -hh, 0, 1, 0, -hw, hh, 0, 0, 1, hw, hh, 0, 1, 1]),
      gl.STATIC_DRAW,
    )
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)

    const aPos = gl.getAttribLocation(program, "aPos")
    const aUv = gl.getAttribLocation(program, "aUv")
    const uMVP = gl.getUniformLocation(program, "uMVP")
    const uTex = gl.getUniformLocation(program, "uTex")
    const stride = 20

    const bindAttribs = () => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.enableVertexAttribArray(aPos)
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, stride, 0)
      gl.enableVertexAttribArray(aUv)
      gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, stride, 12)
    }

    return {
      canvas: target,
      resize(cols, rows) {
        target.width = cols
        target.height = rows
        gl.viewport(0, 0, cols, rows)
      },
      uploadVideo(video) {
        try {
          gl.bindTexture(gl.TEXTURE_2D, tex)
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video)
        } catch {
          /* video has no frame yet */
        }
      },
      draw(camera) {
        gl.viewport(0, 0, target.width, target.height)
        gl.clearColor(0, 0, 0, 1)
        gl.clear(gl.COLOR_BUFFER_BIT)
        bindProgram(program)
        gl.uniformMatrix4fv(uMVP, false, samplerMvp(camera))
        gl.uniform1i(uTex, 0)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, tex)
        bindAttribs()
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      },
      readPixels(pixels) {
        try {
          const cols = target.width
          const rows = target.height
          if (cols <= 0 || rows <= 0) return false
          gl.readPixels(0, 0, cols, rows, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
          return true
        } catch {
          return false
        }
      },
      dispose() {
        gl.deleteBuffer(buf)
        gl.deleteTexture(tex)
        gl.deleteProgram(program)
      },
    }
  } catch {
    return null
  }
}
