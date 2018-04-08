import Matrix from '../utils/matrix';
import Transform from './transform';

/**
 * The rotate transform.
 * 
 * @class RotateTransform
 * @extends {Transform}
 */
export default class RotateTransform extends Transform {

    /**
     * Creates an instance of RotateTransform. It will rotate a matrix by an angle [in degrees].
     * 
     * @param {any} deg The rotate value in degrees.
     * 
     * @memberOf RotateTransform
     */
    constructor(angle = 0) {
        super();
        this.set(angle);
    }

    set(angle) {
        this.angle = angle;

        const rad = angle * (Math.PI / 180);
        const costheta = Math.cos(rad);
        const sintheta = Math.sin(rad);

        this.matrix = new Matrix([
            [costheta, -sintheta, 0],
            [sintheta, costheta, 0],
            [0, 0, 1]
        ]);
    }

    get inverse() {
        return RotateTransform.from(this.matrix.inverse);
    }

    update(matrix) {

        if (!(matrix instanceof Matrix)) {
            throw new Error(`matrix needs to be of type ${Matrix.name}`);
        }

        const M = matrix;

        // http://math.stackexchange.com/questions/13150/extracting-rotation-scale-values-from-2d-transformation-matrix
        // const psi1 = Math.atan2(-M.b, M.a);
        // const psi2 = Math.atan2(M.c, M.d);

        // if (psi1 !== psi2) {
        //     throw new Error(`matrix error ${psi1} !== ${psi2}`);
        // }

        // const angle = (psi2 * 180) / Math.PI;

        const rad = Math.atan2(M.b, M.a);
        const angle = (rad * 180) / Math.PI;

        this.set(angle);
    }

    /**
     * Reset rotate transform.
     * 
     * @memberOf RotateTransform
     */
    reset() {
        this.set(0);
        super.reset();
    }

    static from(matrix) {
        const transform = new RotateTransform();
        transform.update(matrix);
        return transform;
    }

    toString() {
        return `${this.constructor.name} [angle=${this.angle}]`;
    }
}