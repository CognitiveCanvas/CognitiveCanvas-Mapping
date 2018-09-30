/**
 * Initializes snap, and creates a transient SVG tag containing only the
 * definitions for SVG effects to be used in the canvas.  This is a workaround
 * to Webstrate's problems with not recreating SVG patterns after they are
 * first added to the DOM.
 */
export function initSnap(){
  window.snap = Snap(canvas);

  createTransientDefsSVG();
  createCanvasBackground();
  createSelectedFilter();
}

/**
 * Appends a transient SVG tag to the body which will contain only filters and
 * patterns to be used in the canvas SVG.  This is done as a workaround to
 * Webstrates not correctly recreating SVG patterns from the DOM.
 * @return {SVGELEMENT} the defs tag to which filter and pattern elements can
 * be appended
 */
function createTransientDefsSVG(){

  let defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.setAttribute("id", "canvas-defs");

  let defsSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  defsSVG.setAttribute("id", "defs-svg");
  defsSVG.appendChild(defs);
  
  let transient = document.createElement("transient");
  transient.appendChild(defsSVG);

  document.body.appendChild(transient);

  return defs;
}

/**
 * Finds the transient svg defs tag and appends the canvas background pattern
 * to it.
 */
function createCanvasBackground(){

  let defs = document.getElementById("canvas-defs");

  let background = document.getElementById("canvas-bg");

  let pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
  pattern.setAttribute("width", 20);
  pattern.setAttribute("height", 20);
  pattern.setAttribute("id", "canvas-bg-pattern");
  pattern.setAttribute("viewBox", "0 0 20 20");
  pattern.setAttribute("patternUnits", "userSpaceOnUse");

  let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", 10);
  circle.setAttribute("cy", 10);
  circle.setAttribute("r", 2)

  pattern.appendChild(circle);
  defs.appendChild(pattern);

  background.setAttribute("fill", "url(#canvas-bg-pattern)");
}

var selectedFilter;

/**
 * Creates a filter in the transient SVG Defs tag that adds a shadow to
 * selected objects on the canvas
 */
function createSelectedFilter(){
  let defsSVG = document.getElementById("defs-svg");
  window.selectedFilter = Snap(defsSVG).filter(Snap.filter.shadow(5, 5, 5, "#747678", .7)).attr({ //"Geisel color"
      id: 'selected-filter',
      filterUnits: "objectBoundingBox"
  });
}