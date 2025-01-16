export class Buffer {
    private target: GLenum;
    private buffer: WebGLBuffer;
    private size: number;

    /** Fluent WebGLBuffer wrapper.
     * @param {WebGLRenderingContext} gl
     * @param {GLenum} [target] either GL_ARRAY_BUFFER or GL_ELEMENT_ARRAY_BUFFER
     * @returns {WebGLProgram}
     * @constructor
     */
    constructor(private gl: WebGLRenderingContext, target: GLenum) {
        this.buffer = gl.createBuffer();
        this.target = (target == null ? gl.ARRAY_BUFFER : target);
        this.size = -1;
    };

    /**
     * Binds this buffer to ARRAY_BUFFER.
     * @returns {Buffer} this
     */
    public bind(): Buffer {
        this.gl.bindBuffer(this.target, this.buffer);
        return this;
    }

    /**
     * @param
     * @param {ArrayBuffer|ArrayBufferView} data
     * @param {GLenum} [usage]
     * @returns {Buffer} this
     */
    public update(data: ArrayBuffer | ArrayBufferView, usage: GLenum): Buffer {
        const gl = this.gl;
        if (data instanceof Array) {
            data = new Float32Array(data);
        }
        usage = usage == null ? gl.DYNAMIC_DRAW : usage;
        this.bind();
        if (this.size !== data.byteLength) {
            gl.bufferData(this.target, data, usage);
            this.size = data.byteLength;
        } else {
            gl.bufferSubData(this.target, 0, data);
        }
        return this;
    };
}
