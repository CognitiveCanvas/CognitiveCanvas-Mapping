import Matrix from '../utils/matrix';
import Transform from './transform';

/**
 * The translate transform.
 * 
 * @class TranslateTransform
 * @extends {Transform}
 */
export default class TranslateTransform extends Transform {

    /**
     * Creates an instance of TranslateTransform. It will translate a matrix by tx and ty.
     * 
     * @param {any} tx The translate value in x.
     * @param {any} ty The translate value in y.
     * 
     * @memberOf TranslateTransform
     */
    constructor(x = 0, y = 0) {
        super();
        this.set(x, y);
    }

    set(x, y) {
        this.x = x;
        this.y = y;

        this.matrix = new Matrix([
            [1, 0, x],
            [0, 1, y],
            [0, 0, 1]
        ]);
    }

    get inverse() {
        return TranslateTransform.from(this.matrix.inverse);
    }

    update(matrix) {

        if (!(matrix instanceof Matrix)) {
            throw new Error(`matrix needs to be of type ${Matrix.name}`);
        }

        const M = matrix;

        // http://math.stackexchange.com/questions/13150/extracting-rotation-scale-values-from-2d-transformation-matrix
        const tx = M.tx;
        const ty = M.ty;

        this.set(tx, ty);
    }

    /**
     * Reset translate transform.
     * 
     * @memberOf TranslateTransform
     */
    reset() {
        this.set(0, 0);
        super.reset();
    }

    static from(matrix) {
        const transform = new TranslateTransform();
        transform.update(matrix);
        return transform;
    }

    toString() {
        return `${this.constructor.name} [x=${this.x},y=${this.y}]`;
    }
}