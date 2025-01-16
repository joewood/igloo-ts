import { Buffer } from "./Buffer";
import { Framebuffer } from "./Framebuffer";
import { Program } from "./Program";
import { Texture } from "./Texture";

/**
 * A TypeScript Port of IglooJS - taken from https://github.com/skeeto/igloojs
 * 
 */
export const GL_RGBA : number = 0x1908;
export const GL_CLAMP_TO_EDGE:number = 0x812F;
export const GL_LINEAR :number = 0x2601;

export class Igloo {
    public gl: WebGLRenderingContext;
    private canvas: HTMLCanvasElement | OffscreenCanvas;

    /** To be used in a vec2 GL_TRIANGLE_STRIP draw. */
    private static readonly QUAD2 = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    public defaultFramebuffer: Framebuffer;

    /** Wrap WebGLRenderingContext objects with useful behavior.
     * @param {WebGLRenderingContext|HTMLCanvasElement} gl
     * @param {Object} [options] to pass to getContext() */
    constructor(gl: HTMLCanvasElement | WebGLRenderingContext, options?: WebGLContextAttributes) {
        if (gl instanceof HTMLCanvasElement) {
            this.canvas = gl;
            this.gl = Igloo.getContext(gl, options);
        } else {
            this.canvas = gl.canvas;
            this.gl = gl;
        }
        this.defaultFramebuffer = new Framebuffer(this.gl, null);
    }


    /**
     * @param {HTMLCanvasElement} canvas
     * @param {Object} [options] to pass to getContext()
     * @param {boolean} [noerror] If true, return null instead of throwing
     * @returns {?WebGLRenderingContext} a WebGL rendering context.
     */
    private static getContext(canvas: HTMLCanvasElement, options: WebGLContextAttributes, noerror = false): WebGLRenderingContext {
        let gl;
        try {
            gl = canvas.getContext('webgl', options || {}) ||
                canvas.getContext('experimental-webgl', options || {});
        } catch (e) {
            gl = null;
        }
        if (gl == null && !noerror) {
            throw new Error('Could not create WebGL context.');
        } else {
            return gl;
        }
    };

    /**
     * @param {*} object
     * @returns {boolean} true if object is an array or typed array
     */
    public static isArray(object: Object): object is Array<number> {
        const name = Object.prototype.toString.apply(object, []);
        const re = / (Float(32|64)|Int(16|32|8)|Uint(16|32|8(Clamped)?))?Array]$/;
        return re.exec(name) != null;
    };

    /** Creates a program from a program configuration.
     * @param {string} vertex URL or source of the vertex shader
     * @param {string} fragment URL or source of the fragment shader
     * @param {Function} [transform] Transforms the shaders before compilation
     * @returns {Igloo.Program}
     */
    public program(vertex: string, fragment: string, transform?: (shader: string) => string): Program {
        // if (Igloo.looksLikeURL(vertex)) vertex = Igloo.fetch(vertex);
        // if (Igloo.looksLikeURL(fragment)) fragment = Igloo.fetch(fragment);
        if (transform != null) {
            vertex = transform(vertex);
            fragment = transform(fragment);
        }
        return new Program(this.gl, vertex, fragment);
    };

    /** Create a new GL_ARRAY_BUFFER with optional data. */
    public array(data: ArrayBuffer | ArrayBufferView | null = null, usage: GLenum | null = null): Buffer {
        const gl = this.gl;
        const buffer = new Buffer(gl, gl.ARRAY_BUFFER);
        if (data != null) {
            buffer.update(data, usage == null ? gl.STATIC_DRAW : usage);
        }
        return buffer;
    };

    /** Create a new GL_ELEMENT_ARRAY_BUFFER with optional data.*/
    private elements(data: ArrayBuffer | ArrayBufferView | null = null, usage: GLenum | null = null): Buffer {
        var gl = this.gl,
            buffer = new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER);
        if (data != null) {
            buffer.update(data, usage == null ? gl.STATIC_DRAW : usage);
        }
        return buffer;
    };

    /** */
    private texture(source: ImageData, format: GLenum = GL_RGBA, wrap: GLenum = GL_CLAMP_TO_EDGE, filter: GLenum = GL_LINEAR): Texture {
        var texture = new Texture(this.gl, format, wrap, filter);
        if (source != null) {
            texture.set(source);
        }
        return texture;
    };

    /** */
    private framebuffer(texture: Texture): Framebuffer {
        var framebuffer = new Framebuffer(this.gl);
        if (texture != null) framebuffer.attach(texture);
        return framebuffer;
    };
}

