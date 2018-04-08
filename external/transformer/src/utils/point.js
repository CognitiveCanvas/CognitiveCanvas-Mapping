/**
 * A simple point class.
 * 
 * @class Point
 */
export default class Point {

    /**
     * Creates an instance of Point.
     * 
     * @param {any} x The x value.
     * @param {any} y The y value.
     * 
     * @memberOf Point
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * Returns the string representation of the point.
     * 
     * @returns The string representation of the point.
     * 
     * @memberOf Point
     */
    toString() {
        return `${Point.name} [x=${this.x},y=${this.y}]`;
    }
}