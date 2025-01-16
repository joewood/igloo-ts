import { Texture } from "./Texture";


export class Framebuffer {
    private framebuffer: WebGLFramebuffer;
    private renderbuffer: WebGLRenderbuffer;

    /**
     * @param {WebGLRenderingContext} gl
     * @param {WebGLFramebuffer} [framebuffer] to be wrapped (null for default)
     */
    constructor(private gl: WebGLRenderingContext, framebuffer?: WebGLFramebuffer) {
        this.framebuffer = arguments.length == 2 ? framebuffer : gl.createFramebuffer();
        this.renderbuffer = null;
    };

    public bind(): Framebuffer {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
        return this;
    };

    private unbind(): Framebuffer {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        return this;
    };

    public attach(texture: Texture): Framebuffer {
        const gl = this.gl;
        this.bind();
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D, texture.texture, 0);
        return this;
    };

    /**
     * Attach a renderbuffer as a depth buffer for depth-tested rendering.
     * @param {number} width
     * @param {number} height
     * @returns {Igloo.Framebuffer}
     */
    private attachDepth(width: number, height: number): Framebuffer {
        const gl = this.gl;
        this.bind();
        if (this.renderbuffer == null) {
            this.renderbuffer = gl.createRenderbuffer();
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16,
                width, height);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
                gl.RENDERBUFFER, this.renderbuffer);
        }
        return this;
    }
}