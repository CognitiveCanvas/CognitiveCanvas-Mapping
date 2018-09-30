export function eventToCanvasPoint(e){
  var eventPoint = e.center ? new Point(e.center.x, e.center.y) : new Point(e.clientX, e.clientY);
  return canvas.transformer.fromGlobalToLocal( eventPoint );
}

/**
 * Checks if a new elementMatrix, when applied to an element, would create a
 * bounding box that goes outside that of the element's parent node
 * @param  {Node}  element           The element being tested
 * @param  {Matrix}  elementMatrix   The new transform matrix to test for
 * @param  {Boolean} isOutsideParent true if the parent needs to be smaller
 *                                   than the element.  False if vice-versa
 * @return {Boolean}                 True if the above condition is met
 */
export function isContainingParent(element, elementMatrix, isOutsideParent = true ){

  var ele = element;
  var oldElementMatrix = element.transformer.getTransformMatrix();
  var eleCorners = getCornerMatrix(ele);
  var invOldMatrix = oldElementMatrix.inverse;
  var origCorners = invOldMatrix.multiply(eleCorners);
  var newCorners = elementMatrix.multiply(origCorners);
  var newBB = getBBoxFromCorners(newCorners);

  var parentEle = element.parentNode;
  var parentBB = parentEle.getBoundingClientRect();

  var isContained;

  if( isOutsideParent ){
    isContained = newBB.left <= parentBB.left &&
      newBB.top <= parentBB.top &&
      newBB.right >= parentBB.right &&
      newBB.bottom >= parentBB.bottom;
  }else{
    isContained = newBB.left >= parentBB.left &&
      newBB.top >= parentBB.top &&
      newBB.right <= parentBB.right &&
      newBB.bottom <= parentBB.bottom;     
  }
  return (isContained)
};

function getCornerMatrix(ele){
  var bb = ele.getBoundingClientRect();
  return new Matrix([
    [bb.left, bb.right, bb.right],
    [bb.top,  bb.top,   bb.bottom],
    [1,       1,        1]
  ]);
}

function getBBoxFromCorners(corners){
  var m = corners.matrix
  return(
  {
    top:    m[1][0],
    right:  m[0][1],
    bottom: m[1][2],
    left:   m[0][0]
  })
}

function translateFromHammerEvent(event){
  var element = getParentMapElement(event.target);

  if(event.type === 'panstart' || !element.prevPoint){
    element.prevPoint = new Point(0, 0);
  }

  var deltaPoint = element.transformer.fromGlobalToLocalDelta(new Point(event.deltaX, event.deltaY));

  var newPoint = new Point( element.translateTransform.x - element.prevPoint.x + deltaPoint.x,
                            element.translateTransform.y - element.prevPoint.y + deltaPoint.y);

  element.prevPoint.x = deltaPoint.x;
  element.prevPoint.y = deltaPoint.y;

  if(event.type === 'panend'){
    element.prevPoint = null;
  }

  element.translateTransform.set( newPoint.x, newPoint.y);
  element.transformer.reapplyTransforms()
}