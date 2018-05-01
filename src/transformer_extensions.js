function eventToCanvasPoint(e){
  var eventPoint = e.center ? new Point(e.center.x, e.center.y) : new Point(e.clientX, e.clientY);
  return canvas.transformer.fromGlobalToLocal( eventPoint );
}

function isContainingParent(elementMatrix){

  var ele = this.element;
  var oldElementMatrix = this.getTransformMatrix();
  var eleCorners = getCornerMatrix(ele);
  var invOldMatrix = oldElementMatrix.inverse;
  var origCorners = invOldMatrix.multiply(eleCorners);
  var newCorners = elementMatrix.multiply(origCorners);
  var newBB = getBBoxFromCorners(newCorners);

  var parentEle = this.element.parentNode;
  parentBB = parentEle.getBoundingClientRect();

  var isContained = newBB.left <= parentBB.left &&
    newBB.top <= parentBB.top &&
    newBB.right >= parentBB.right &&
    newBB.bottom >= parentBB.bottom;
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