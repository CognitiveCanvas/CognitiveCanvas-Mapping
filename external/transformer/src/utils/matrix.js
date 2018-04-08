/**
 * The matrix class provides convenient functions for affine transformations, e.g., translate, rotate,
 * and scale. It also offers functions like matrix multiplication or creating an inverse matrix.
 * 
 * @class Matrix
 */
export default class Matrix {

    /**
     * Creates an instance of Matrix. The matrix needs to be a two-dimensional array. The first index will
     * be rows and the second index will be columns. The array needs to be in a n x m format. For example,
     * an array [[1, 2, 3], [4, 5, 6], [7, 8 ,9]] will result in the following matrix:
     * 
     * 1   2   3
     * 4   5   6
     * 7   8   9
     * 
     * @param {any} M A two-dimensional array.
     * 
     * @memberOf Matrix
     */
    constructor(M) {

        if (typeof M === 'undefined' || !Array.isArray(M)) {
            throw new Error(`first parameter needs to be a two-dimensional array`);
        }
        this.matrix = M;
    }

    /**
     * Sets the matrix. The matrix needs to be a two-dimensional array. The first index will be rows and
     * the second index will be columns. The array needs to be in a n x m format.
     * 
     * @memberOf Matrix
     */
    set matrix(matrix) {
        this._matrix = matrix;
        this._rows = matrix.length;
        this._columns = matrix[0].length;
    }

    /**
     * Returns the matrix as a two-dimensional array.
     * 
     * @memberOf Matrix
     */
    get matrix() {
        return this._matrix;
    }

    /**
     * Returns number of rows of matrix.
     * 
     * @readonly
     * 
     * @memberOf Matrix
     */
    get rows() {
        return this._rows;
    }

    /**
     * Returns number of columns of matrix.
     * 
     * @readonly
     * 
     * @memberOf Matrix
     */
    get columns() {
        return this._columns;
    }

    get a() {
        return this.matrix[0][0];
    }

    get b() {
        return this.matrix[1][0];
    }

    get c() {
        return this.matrix[0][1];
    }

    get d() {
        return this.matrix[1][1];
    }

    get tx() {
        return this.matrix[0][2];
    }

    get ty() {
        return this.matrix[1][2];
    }

    get angle() {
        const rad = Math.atan2(this.b, this.a);
        return (rad * 180) / Math.PI;
    }

    get scaleX() {
        return this.a;
    }

    get scaleY() {
        return this.d;
    }

    /**
     * Translates the matrix by tx and ty.
     * 
     * @param {Number} tx The translation value in x.
     * @param {Number} ty The translation value in y.
     * 
     * @memberOf Matrix
     */
    translate(tx, ty, truncate = true) {
        const M = this.multiply(new Matrix([
            [1, 0, tx],
            [0, 1, ty],
            [0, 0, 1],
        ]), truncate).matrix;

        this.matrix = M;
    }

    /**
     * Rotates the matrix by angle. The rotation value has to be in degrees.
     * 
     * @param {Number} angle The rotation value in degrees.
     * 
     * @memberOf Matrix
     */
    rotate(angle, truncate = true) {
        const rad = angle * (Math.PI / 180);
        const costheta = Math.cos(rad);
        const sintheta = Math.sin(rad);

        const M = this.multiply(new Matrix([
            [costheta, -sintheta, 0],
            [sintheta, costheta, 0],
            [0, 0, 1],
        ]), truncate).matrix;

        this.matrix = M;
    }

    /**
     * Scales the matrix by sx and sy.
     * 
     * @param {Number} sx The scale value in x.
     * @param {Number} sy The scale value in y.
     * 
     * @memberOf Matrix
     */
    scale(sx, sy, truncate = true) {
        const M = this.multiply(new Matrix([
            [sx, 0, 0],
            [0, sy, 0],
            [0, 0, 1],
        ]), truncate).matrix;

        this.matrix = M;
    }

    /**
     * Skwes the matrix in degX and degY.
     * 
     * @param {Number} degX The skew value in x in degrees.
     * @param {Number} degY The skew value in y in degrees.
     * 
     * @memberOf Matrix
     */
    skew(degX, degY, truncate = true) {
        const radX = degX * (Math.PI / 180);
        const radY = degY * (Math.PI / 180);
        const x = Math.tan(radX);
        const y = Math.tan(radY);

        const M = this.multiply(new Matrix([
            [1, x, 0],
            [y, 1, 0],
            [0, 0, 1],
        ]), truncate).matrix;

        this.matrix = M;
    }

    /**
     * Multiplies a given matrix with this matrix and returns the result as new matrix instance. In order
     * to perform the matrix multiplication, rows of matrix M1 need to match columns of matrix M2 as well
     * as columns of matrix M1 need to match rows of matrix M2.
     * 
     * @param {any} M The matrix used to multiply with this matrix.
     * @returns The multipied matrix.
     * 
     * @memberOf Matrix
     */
    multiply(M, truncate = true) {

        if (this.rows !== M.columns || this.columns !== M.rows) {
            throw new Error(`cannot multiply because matrix dimensions do not match (n*m !== m*n)`);
        }

        const m = [];
        const m1 = this.matrix;
        const m2 = M.matrix;
        for (let i = 0; i < m1.length; i++) {
            m[i] = [];
            for (let j = 0; j < m2[0].length; j++) {
                let sum = 0;
                for (let k = 0; k < m1[0].length; k++) {
                    sum += m1[i][k] * m2[k][j];
                }
                // m[i][j] = sum;
                m[i][j] = truncate ? parseFloat(sum.toFixed(3)) : sum;
            }
        }

        return new Matrix(m);
    }

    /**
     * Multiplies this matrix by the given matrix and replaces this matrix by the resulting matrix.
     * 
     * @param {any} The matrix used to multiply with this matrix.
     * 
     * @memberOf Matrix
     */
    multiplyBy(M) {
        // const m = this.multiply(M).matrix;
        const m = M.multiply(this).matrix;
        this.matrix = m;
    }

    /**
     * Creates a copy of the matrix.
     * 
     * @returns The copy of this matrix.
     * 
     * @memberOf Matrix
     */
    copy() {
        const m = this.matrix;
        const copyM = JSON.parse(JSON.stringify(m));
        return new Matrix(copyM);
    }

    /**
     * Returns the inverse matrix of this matrix.
     * 
     * http://blog.acipo.com/matrix-inversion-in-javascript/
     * 
     * @readonly
     * 
     * @memberOf Matrix
     */
    get inverse() {
        // I use Guassian Elimination to calculate the inverse:
        // (1) 'augment' the matrix (left) by the identity (on the right)
        // (2) Turn the matrix on the left into the identity by elemetry row ops
        // (3) The matrix on the right is the inverse (was the identity matrix)
        // There are 3 elemtary row ops: (I combine b and c in my code)
        // (a) Swap 2 rows
        // (b) Multiply a row by a scalar
        // (c) Add 2 rows

        const M = this.matrix;

        //if the matrix isn't square: exit (error)
        if (M.length !== M[0].length) {
            throw new Error(`matrix is not squared`);
        }

        //create the identity matrix (I), and a copy (C) of the original
        var i = 0,
            ii = 0,
            j = 0,
            dim = M.length,
            e = 0;
            // t = 0;
        var I = [],
            C = [];
        for (i = 0; i < dim; i += 1) {
            // Create the row
            I[I.length] = [];
            C[C.length] = [];
            for (j = 0; j < dim; j += 1) {

                //if we're on the diagonal, put a 1 (for identity)
                if (i == j) {
                    I[i][j] = 1;
                } else {
                    I[i][j] = 0;
                }

                // Also, make the copy of the original
                C[i][j] = M[i][j];
            }
        }

        // Perform elementary row operations
        for (i = 0; i < dim; i += 1) {
            // get the element e on the diagonal
            e = C[i][i];

            // if we have a 0 on the diagonal (we'll need to swap with a lower row)
            if (e == 0) {
                //look through every row below the i'th row
                for (ii = i + 1; ii < dim; ii += 1) {
                    //if the ii'th row has a non-0 in the i'th col
                    if (C[ii][i] != 0) {
                        //it would make the diagonal have a non-0 so swap it
                        for (j = 0; j < dim; j++) {
                            e = C[i][j]; //temp store i'th row
                            C[i][j] = C[ii][j]; //replace i'th row by ii'th
                            C[ii][j] = e; //repace ii'th by temp
                            e = I[i][j]; //temp store i'th row
                            I[i][j] = I[ii][j]; //replace i'th row by ii'th
                            I[ii][j] = e; //repace ii'th by temp
                        }
                        //don't bother checking other rows since we've swapped
                        break;
                    }
                }
                //get the new diagonal
                e = C[i][i];
                //if it's still 0, not invertable (error)
                if (e == 0) {
                    throw new Error(`matrix is not invertable`);
                }
            }

            // Scale this row down by e (so we have a 1 on the diagonal)
            for (j = 0; j < dim; j++) {
                C[i][j] = C[i][j] / e; //apply to original matrix
                I[i][j] = I[i][j] / e; //apply to identity
            }

            // Subtract this row (scaled appropriately for each row) from ALL of
            // the other rows so that there will be 0's in this column in the
            // rows above and below this one
            for (ii = 0; ii < dim; ii++) {
                // Only apply to other rows (we want a 1 on the diagonal)
                if (ii == i) {
                    continue;
                }

                // We want to change this element to 0
                e = C[ii][i];

                // Subtract (the row above(or below) scaled by e) from (the
                // current row) but start at the i'th column and assume all the
                // stuff left of diagonal is 0 (which it should be if we made this
                // algorithm correctly)
                for (j = 0; j < dim; j++) {
                    C[ii][j] -= e * C[i][j]; //apply to original matrix
                    I[ii][j] -= e * I[i][j]; //apply to identity
                }
            }
        }

        //we've done all operations, C should be the identity
        //matrix I should be the inverse:
        return new Matrix(I);
    }

    toJSON() {
        return JSON.stringify(this.matrix);
    }

    static fromJSON(json) {
        const matrix = JSON.parse(json);
        return new Matrix(matrix);
    }

    /**
     * Converts the matrix to a CSS matrix transform. It respects whether the matrix should be a
     * CSS matrix() or CSS matrix3d().
     * 
     * @returns The CSS transform.
     * 
     * @memberOf Matrix
     */
    toCss(fixed = true) {

        const M = this.matrix;

        const getFixedValue = (row, column) => {
            if (fixed) {
                return parseFloat(M[row][column].toFixed(3));
            }
            return M[row][column];
        };

        if (this.rows === 3 && this.columns === 3) {
            if (this.equals(Matrix.identity(3))) {
                return "none";
            }

            const a = getFixedValue(0, 0);
            const b = getFixedValue(1, 0);
            const c = getFixedValue(0, 1);
            const d = getFixedValue(1, 1);
            const tx = getFixedValue(0, 2);
            const ty = getFixedValue(1, 2);

            return `matrix(${a}, ${b}, ${c}, ${d}, ${tx}, ${ty})`;
        }

        if (this.equals(Matrix.identity(4))) {
            return "none";
        }

        const a1 = getFixedValue(0, 0);
        const b1 = getFixedValue(1, 0);
        const c1 = getFixedValue(2, 0);
        const d1 = getFixedValue(3, 0);
        const a2 = getFixedValue(0, 1);
        const b2 = getFixedValue(1, 1);
        const c2 = getFixedValue(2, 1);
        const d2 = getFixedValue(3, 1);
        const a3 = getFixedValue(0, 2);
        const b3 = getFixedValue(1, 2);
        const c3 = getFixedValue(2, 2);
        const d3 = getFixedValue(3, 2);
        const a4 = getFixedValue(0, 3);
        const b4 = getFixedValue(1, 3);
        const c4 = getFixedValue(2, 3);
        const d4 = getFixedValue(3, 3);

        return `matrix3d(${a1}, ${b1}, ${c1}, ${d1}, ${a2}, ${b2}, ${c2}, ${d2}, ${a3}, ${b3}, ${c3}, ${d3}, ${a4}, ${b4}, ${c4}, ${d4})`;
    }

    /**
     * Returns true if matrix M equals to this matrix.
     * 
     * @param {any} M A matrix to compare to.
     * @returns True if this matrix and matrix M are equal.
     * 
     * @memberOf Matrix
     */
    equals(M) {
        return Matrix.equals(this, M);
    }

    /**
     * Returns true if both matrix have the same matrix values, false otherwise.
     * 
     * @static
     * @param {any} M1 Matrix 1.
     * @param {any} M2 Matrix 2.
     * @returns True if matrix M1 and M2 are equal.
     * 
     * @memberOf Matrix
     */
    static equals(M1, M2) {
        return JSON.stringify(M1.matrix) === JSON.stringify(M2.matrix);
    }

    /**
     * Creates an n x n identity matrix.
     * 
     * @static
     * @param {any} n The number of rows and columns to create this n x n identity matrix.
     * @returns The identity matrix.
     * 
     * @memberOf Matrix
     */
    static identity(n) {

        let m = [];
        for (let row = 0; row < n; row++) {
            let mRow = m[row] = [];

            for (let col = 0; col < n; col++) {
                mRow[col] = col === row ? 1 : 0;
            }
        }

        return new Matrix(m);
    }

    /**
     * Creates a matrix from a DOM element (e.g., a HTMLElement or a SVGElement).
     * 
     * @static
     * @param {any} element A DOM element from which the matrix is created from.
     * @returns The matrix.
     * 
     * @memberOf Matrix
     */
    static from(element) {

        let rawTransform = "none";

        if (element instanceof SVGElement) {
            rawTransform = element.getAttribute("transform");

            // SAFARI does not return a proper transform with window.getComputedStyle for SVGElement.
            // TODO This is a nasty workaround.
            if (!rawTransform || rawTransform === "") {
                rawTransform = element.style.transform;
            }
        } else if (element.nodeType === 1) {
            rawTransform = window.getComputedStyle(element).transform;
        }

        if (rawTransform === "" || rawTransform === "none") {
            return Matrix.identity(3);
        } else {
            const regEx = /([-+]?[\d\.]+)/g;

            // console.log('rawTransform %o', rawTransform);

            if (rawTransform.indexOf("matrix3d") > -1) {
                // throw new Error(`matrix3d transformation not yet supported`);

                // https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/matrix3d
                const a1 = parseFloat(regEx.exec(rawTransform)[0]);
                const b1 = parseFloat(regEx.exec(rawTransform)[0]);
                const c1 = parseFloat(regEx.exec(rawTransform)[0]);
                const d1 = parseFloat(regEx.exec(rawTransform)[0]);
                const a2 = parseFloat(regEx.exec(rawTransform)[0]);
                const b2 = parseFloat(regEx.exec(rawTransform)[0]);
                const c2 = parseFloat(regEx.exec(rawTransform)[0]);
                const d2 = parseFloat(regEx.exec(rawTransform)[0]);
                const a3 = parseFloat(regEx.exec(rawTransform)[0]);
                const b3 = parseFloat(regEx.exec(rawTransform)[0]);
                const c3 = parseFloat(regEx.exec(rawTransform)[0]);
                const d3 = parseFloat(regEx.exec(rawTransform)[0]);
                const a4 = parseFloat(regEx.exec(rawTransform)[0]);
                const b4 = parseFloat(regEx.exec(rawTransform)[0]);
                const c4 = parseFloat(regEx.exec(rawTransform)[0]);
                const d4 = parseFloat(regEx.exec(rawTransform)[0]);

                return new Matrix([
                    [a1, a2, a3, a4],
                    [b1, b2, b3, b4],
                    [c1, c2, c3, c4],
                    [d1, d2, d3, d4]
                ]);
            } else {

                // https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/matrix
                const a = parseFloat(regEx.exec(rawTransform)[0]);
                const b = parseFloat(regEx.exec(rawTransform)[0]);
                const c = parseFloat(regEx.exec(rawTransform)[0]);
                const d = parseFloat(regEx.exec(rawTransform)[0]);
                const tx = parseFloat(regEx.exec(rawTransform)[0]);
                const ty = parseFloat(regEx.exec(rawTransform)[0]);

                return new Matrix([
                    [a, c, tx],
                    [b, d, ty],
                    [0, 0, 1]
                ]);
            }
        }
    }

    /**
     * Returns the matrix in a human readable format. 
     * 
     * @returns The matrix in string format.
     * 
     * @memberOf Matrix
     */
    toString() {
        return `Matrix [rows=${this.rows},columns=${this.columns},matrix=${JSON.stringify(this.matrix)}]`;
    }
}