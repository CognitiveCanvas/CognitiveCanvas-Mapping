import Point from '../utils/point';
import Matrix from '../utils/matrix';

/**
 * The base class for a transforms.
 * 
 * @class Transform
 */
export default class Transform {

    /**
     * Creates an instance of Transform. It will create an instance with a default identity matrix.
     * 
     * @memberOf Transform
     */
    constructor() {
        this.matrix = Matrix.identity(3);
        this._centerPoint = new Point(0, 0);
    }

    get centerPoint() {
        return this._centerPoint;
    }

    /**
     * Applies this transform to the matrix given as parameter.
     * 
     * @param {any} matrix The matrix to which this transform will be applied.
     * 
     * @memberOf Transform
     */
    apply(matrix) {
        const centerPointMatrix = Matrix.identity(3);
        centerPointMatrix.translate(this._centerPoint.x, this._centerPoint.y);

        matrix.multiplyBy(centerPointMatrix.inverse);
        matrix.multiplyBy(this.matrix);
        matrix.multiplyBy(centerPointMatrix);
    }

    /**
     * Unapplies this transformation from the matrix given as paramter.
     * 
     * @param {any} matrix The matrix from which this transform will be unapplied.
     * 
     * @memberOf Transform
     */
    unapply(matrix) {
        const centerPointMatrix = Matrix.identity(3);
        centerPointMatrix.translate(this._centerPoint.x, this._centerPoint.y);

        matrix.multiplyBy(centerPointMatrix.inverse);
        // console.log('matrix1 %o', this.matrix.toString());
        matrix.multiplyBy(this.matrix.inverse);
        // console.log('matrix2 %o', this.matrix.toString());
        matrix.multiplyBy(centerPointMatrix);
    }

    get inverse() {
        throw new Error(`inverse not implemented for ${this.constructor.name}`);
    }

    reset() {
        this._centerPoint.x = 0;
        this._centerPoint.y = 0;
    }

    /* jshint ignore:start */
    static from(matrix) {
        throw new Error(`inverse not implemented for transform`);
    }
    /* jshint ignore:end */
}