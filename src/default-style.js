/**
 * Set default style element and set corresponding 
 * variable to the style.
 *
 * - attr: attribute name of element
 * - data: the data want to change for the attr
 * - variable: local variable need to update the value, leave NULL 
 *             if no variable need to be updated
 */
function setDefaultStyleData(attr, data) {
	let styleElement = 
		initHTMLElement(DATA_COLLECTION, DEFAULT_STYLE, true);

	setElementAttribute(styleElement, attr, data);
}

/**
 * Set default shape
 * - shape: shape you want to update
 */
function setDefaultShape(shape) {
	setDefaultStyleData("shape", shape);
	defaultShape = shape;
}

/**
 * Set default color
 * - color: color you want to update
 */
function setDefaultColor(color) {
	setDefaultStyleData("color", color);
	defaultColor = color;
}