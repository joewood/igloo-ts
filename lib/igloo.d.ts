/**
 * A TypeScript Port of IglooJS - taken from https://github.com/skeeto/igloojs
 *
 */
export declare const GL_RGBA = 6408;
export declare const GL_CLAMP_TO_EDGE = 33071;
export declare const GL_LINEAR = 9729;
export default class Igloo {
    gl: WebGLRenderingContext;
    private canvas;
    /** To be used in a vec2 GL_TRIANGLE_STRIP draw. */
    private static readonly QUAD2;
    defaultFramebuffer: Framebuffer;
    /** Wrap WebGLRenderingContext objects with useful behavior.
     * @param {WebGLRenderingContext|HTMLCanvasElement} gl
     * @param {Object} [options] to pass to getContext() */
    constructor(gl: HTMLCanvasElement | WebGLRenderingContext, options?: WebGLContextAttributes);
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {Object} [options] to pass to getContext()
     * @param {boolean} [noerror] If true, return null instead of throwing
     * @returns {?WebGLRenderingContext} a WebGL rendering context.
     */
    private static getContext(canvas, options, noerror?);
    /**
     * @param {*} object
     * @returns {boolean} true if object is an array or typed array
     */
    static isArray(object: Object): object is Array<number>;
    /** Creates a program from a program configuration.
     * @param {string} vertex URL or source of the vertex shader
     * @param {string} fragment URL or source of the fragment shader
     * @param {Function} [transform] Transforms the shaders before compilation
     * @returns {Igloo.Program}
     */
    program(vertex: string, fragment: string, transform?: (shader: string) => string): Program;
    /** Create a new GL_ARRAY_BUFFER with optional data. */
    array(data?: ArrayBuffer | ArrayBufferView | null, usage?: GLenum | null): Buffer;
    /** Create a new GL_ELEMENT_ARRAY_BUFFER with optional data.*/
    private elements(data?, usage?);
    /** */
    private texture(source, format?, wrap?, filter?);
    /** */
    private framebuffer(texture);
}
export declare class Program {
    private gl;
    private vars;
    private program;
    /**
     * Fluent WebGLProgram wrapper for managing variables and data. The
     * constructor compiles and links a program from a pair of shaders.
     * Throws an exception if compiling or linking fails.
     * @param {WebGLRenderingContext} gl
     * @param {string} vertex Shader source
     * @param {string} fragment Shader source
     * @constructor
     */
    constructor(gl: WebGLRenderingContext, vertex: string, fragment: string);
    /** Compile a shader from source.*/
    private makeShader(type, source);
    /** Tell WebGL to use this program right now. */
    use(): Program;
    /**
     * Declare/set a uniform or set a uniform's data.
     * @param {string} name uniform variable name
     * @param {number|Array|ArrayBufferView} [value]
     * @param {boolean} [i] if true use the integer version
     * @returns {Igloo.Program} this
     */
    uniform(name: string, value?: number | Array<number> | boolean | ArrayBufferView | Float32Array, i?: boolean): Program;
    private isArrayBufferView(matrix);
    /**
     * Set a uniform's data to a specific matrix.
     * @param {string} name uniform variable name
     * @param {Array|ArrayBufferView} matrix
     * @param {boolean} [transpose=false]
     * @returns {Igloo.Program} this
     */
    private matrix(name, matrix, transpose?);
    /**
     * Like the uniform() method, but using integers.
     * @returns {Igloo.Program} this
     */
    private uniformi(name, value);
    /**
     * Declare an attrib or set an attrib's buffer.
     * @param {string} name attrib variable name
     * @param {WebGLBuffer} [value]
     * @param {number} [size] element size (required if value is provided)
     * @param {number} [stride=0]
     * @returns {Igloo.Program} this
     */
    attrib(name: string, value?: Buffer, size?: number | null, stride?: number | null): Program;
    /**
     * Call glDrawArrays or glDrawElements with this program.
     * @param {number} mode
     * @param {number} count the number of vertex attribs to render
     * @param {GLenum} [type] use glDrawElements of this type
     * @returns {Igloo.Program} this
     */
    draw(mode: number, count: number, type?: GLenum | null): Program;
    /**
     * Disables all attribs from this program.
     * @returns {Igloo.Program} this
     */
    private disable();
}
export declare class Buffer {
    private gl;
    private target;
    private buffer;
    private size;
    /** Fluent WebGLBuffer wrapper.
     * @param {WebGLRenderingContext} gl
     * @param {GLenum} [target] either GL_ARRAY_BUFFER or GL_ELEMENT_ARRAY_BUFFER
     * @returns {WebGLProgram}
     * @constructor
     */
    constructor(gl: WebGLRenderingContext, target: GLenum);
    /**
     * Binds this buffer to ARRAY_BUFFER.
     * @returns {Buffer} this
     */
    bind(): Buffer;
    /**
     * @param
     * @param {ArrayBuffer|ArrayBufferView} data
     * @param {GLenum} [usage]
     * @returns {Buffer} this
     */
    update(data: ArrayBuffer | ArrayBufferView, usage: GLenum): Buffer;
}
export declare class Texture {
    private gl;
    texture: WebGLTexture;
    private format;
    /**
     * Create a new texture, optionally filled blank.
     * @param {WebGLRenderingContext} gl
     * @param {GLenum} [format=GL_RGBA]
     * @param {GLenum} [wrap=GL_CLAMP_TO_EDGE]
     * @param {GLenum} [filter=GL_LINEAR]
     * @returns {Igloo.Texture}
     */
    constructor(gl: WebGLRenderingContext, format?: number, wrap?: number, filter?: number);
    /**
     * @param {number} [unit] active texture unit to bind
     * @returns {Igloo.Texture}
     */
    private bind(unit?);
    /**
     * Set texture to particular size, filled with vec4(0, 0, 0, 1).
     * @param {number} width
     * @param {number} height
     * @returns {Igloo.Texture}
     */
    private blank(width, height);
    private static isArrayBufferView(source);
    /** Set the texture to a particular image.
     * @param {Array|ArrayBufferView|TexImageSource} source
     * @param {number} [width]
     * @param {number} [height]
     * @returns {Igloo.Texture}
     */
    set(source: Array<number> | ArrayBufferView | ImageData, width?: number | null, height?: number | null): Texture;
    /** Set part of the texture to a particular image.    */
    private subset(source, xoff, yoff, width?, height?);
    /** Copy part/all of the current framebuffer to this image */
    private copy(x, y, width, height);
}
export declare class Framebuffer {
    private gl;
    private framebuffer;
    private renderbuffer;
    /**
     * @param {WebGLRenderingContext} gl
     * @param {WebGLFramebuffer} [framebuffer] to be wrapped (null for default)
     */
    constructor(gl: WebGLRenderingContext, framebuffer?: WebGLFramebuffer);
    bind(): Framebuffer;
    private unbind();
    attach(texture: Texture): Framebuffer;
    /**
     * Attach a renderbuffer as a depth buffer for depth-tested rendering.
     * @param {number} width
     * @param {number} height
     * @returns {Igloo.Framebuffer}
     */
    private attachDepth(width, height);
}
