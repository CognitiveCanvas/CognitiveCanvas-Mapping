import Matrix from '../utils/matrix';
import Transform from './transform';

/**
 * The scale transform.
 * 
 * @class ScaleTransform
 * @extends {Transform}
 */
export default class ScaleTransform extends Transform {

    /**
     * Creates an instance of ScaleTransform. It will scale a matrix by x and y.
     * 
     * @param {any} x The scale factor in x.
     * @param {any} y The scale factor in y.
     * 
     * @memberOf ScaleTransform
     */
    constructor(x = 1.0, y = 1.0) {
        super();
        this.set(x, y);
    }

    set(x, y) {
        this.x = x;
        this.y = y;

        this.matrix = new Matrix([
            [x, 0, 0],
            [0, y, 0],
            [0, 0, 1],
        ]);
    }

    get inverse() {
        return ScaleTransform.from(this.matrix.inverse);
    }

    update(matrix) {

        if (!(matrix instanceof Matrix)) {
            throw new Error(`matrix needs to be of type ${Matrix.name}`);
        }

        const M = matrix;

        // http://math.stackexchange.com/questions/13150/extracting-rotation-scale-values-from-2d-transformation-matrix
        // const sx = Math.sign(M.a) * Math.sqrt(Math.pow(M.a, 2) + Math.pow(M.b, 2));
        // const sy = Math.sign(M.d) * Math.sqrt(Math.pow(M.c, 2) + Math.pow(M.d, 2));

        const sx = Math.sqrt(Math.pow(M.a, 2) + Math.pow(M.b, 2));
        const sy = Math.sqrt(Math.pow(M.c, 2) + Math.pow(M.d, 2));

        this.set(sx, sy);
    }

    /**
     * Reset scale transform.
     * 
     * @memberOf ScaleTransform
     */
    reset() {
        this.set(1, 1);
        super.reset();
    }

    static from(matrix) {
        const transform = new ScaleTransform();
        transform.update(matrix);
        return transform;
    }

    toString() {
        return `${this.constructor.name} [x=${this.x},y=${this.y}]`;
    }
}