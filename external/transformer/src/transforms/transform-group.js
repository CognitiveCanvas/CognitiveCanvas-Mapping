import Transform from './transform';

/**
 * The transform group can hold multiple transform of type TranslateTransform, RotateTransform,
 * ScaleTransform, or even another TransformGroup. When the apply function is called, it will apply all
 * added transform in the exact order in which they have been added to the transform group. The unapply
 * function will unapply all transform in the reverse order in which they have been added to the
 * transform group.
 * 
 * @class TransformGroup
 * @extends {Transform}
 */
export default class TransformGroup extends Transform {

    /**
     * Creates an instance of TransformGroup.
     * 
     * @memberOf TransformGroup
     */
    constructor() {
        super();

        this.transforms = [];
    }

    /**
     * Add a transform (e.g., TranslateTransform, RotateTransform, or ScaleTransform) to the transform
     * group. All transforms will be applied in the order they were added to the transform group. If a
     * transform group is unapplied, it will unapply all transforms in reverse order.
     * 
     * @param {Transform} transform A transform of type Transform (e.g., TranslateTransform, RotateTransform,
     * or ScaleTransform). Eventually, a TransformGroup can also be added.
     * 
     * @throws {Error} Throws an error if transform is not of type Transform.
     * 
     * @memberOf TransformGroup
     */
    add(transform, inverse = false) {

        // Check if transform is of proper type.
        if (!(transform instanceof Transform)) {
            throw new Error(`transform needs to be of type ${Transform.name}`);
        }

        // Add transform to transforms.
        this.transforms.push({
            inverse,
            transform
        });
    }

    /**
     * Remove a transform from this transform group. The transform has to be part of the transform group,
     * otherwise an error will be thrown.
     * 
     * @param {Transform} transform
     * 
     * @throws {Error} Throws an error if transform is not of type Transform and if transform is not part
     * of transform group.
     * 
     * @memberOf TransformGroup
     */
    remove(transform) {

        // Check if transform is of proper type.
        if (!(transform instanceof Transform)) {
            throw new Error(`transform needs to be of type ${Transform.name}`);
        }

        // Check if transform is part of transform group.
        if (!this.transforms.contains(transform)) {
            throw new Error(`transform is not part of this transform group`);
        }

        // Remove transform from transform group.
        const idx = this.transforms.indexOf(transform);
        this.transforms.splice(idx, 1);
    }

    /**
     * Applies all transforms in the order in which they have been added to this transform group. The
     * TransformGroup#apply function is specified in Transform ({@see Transform#apply}).
     * 
     * @param {any} matrix The matrix to which transforms are applied.
     * 
     * @memberOf TransformGroup
     */
    apply(matrix, type = null) {

        // Apply each transform to the matrix.
        this.transforms.forEach(({
          transform,
            inverse
        }) => {
            if (type && !(transform instanceof type) && !(transform instanceof TransformGroup)) {
                return;
            }
            // console.log('apply inverse=%o transform=%o', inverse, transform.toString());
            inverse ? transform.unapply(matrix, type) : transform.apply(matrix, type);
        });
    }

    /**
     * Unapplies all transforms in reverse order in which they have been added to this transform group. The
     * TransformGroup#unapply function is specified in Transform ({@see Transform#unapply}).
     * 
     * @param {any} matrix The matrix from which the transforms are unapplied.
     * 
     * @memberOf TransformGroup
     */
    unapply(matrix, type = null) {

        // Unapply each transform from the matrix in reverse order.
        this.transforms.slice().reverse().forEach(({
          transform,
            inverse
        }) => {
            if (type && !(transform instanceof type) && !(transform instanceof TransformGroup)) {
                return;
            }
            // console.log('unapply inverse=%o transform=%o', inverse, transform.toString());
            inverse ? transform.apply(matrix, type) : transform.unapply(matrix, type);
        });
    }

    /**
     * Reset transform group.
     * 
     * @memberOf TransformGroup
     */
    reset() {
        this.transforms.forEach(({
          transform
        }) => {
            transform.reset();
        });
    }

    /**
     * Transform group to string.
     * 
     * @returns Transform group in string representation.
     * 
     * @memberOf TransformGroup
     */
    toString() {
        return `${this.constructor.name} [transforms=[${this.transforms.map(({ transform, inverse }) => {
            return inverse ? transform.inverse.toString() : transform.toString();
        }).join(", ")}]]`;
    }
}