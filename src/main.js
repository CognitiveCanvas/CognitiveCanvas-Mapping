/* main.js */

var clientId, webstrateId, clicked_object, dragged_object = null;

var canvas = document.getElementById("canvas");
var radius = 40;
var height = 40;
var width = 40;
var defaultSize = null;
var defaultRadius = 20;
var defaultShape = "circle";
var defaultColor = "rgba(46, 127, 195, 0.1)";
var styleNode = null;

/* interact.js */
var mouseUp = 0;
var mouseDown = 0;
var delay = 300;
var mouseMoved = false;
var singleClickTimer, doubleClickDragTimer = null;

var hoveredEle = null;
var addWindowOpen = false;
var drawing_enabled = false;
var eraser_enabled = false;
var original_color = null;

// drag_line & source_node are stored as html element
var drag_line = null; 
var source_node = null;

var zoom = null;

var quickAddDist = 10 + MAX_RADIUS;

window.addEventListener("keypress", (e) => keyPressListener(e));
window.addEventListener("keydown", (e) => keyDownListener(e));

function mouseOverListener(e) {
  if (drawing_enabled) return;

  if (e.target.tagName === "tspan") {
    return;
  }
  
  let className = e.target.getAttribute("class").split(" ")[0];
  
  switch(className) {
    case "node-rep":
      hoveredEle = e.target.parentElement.getAttribute("id");
      if (nodes.find(x => x.id === hoveredEle)){
        if (nodes.find(x => x.id === hoveredEle).content === "true"){
            previewContent(hoveredEle);
        }
      }
      break;
    case "label":
      hoveredEle = e.target.parentElement.getAttribute("id");
      if (nodes.find(x => x.id === hoveredEle)){
        if (nodes.find(x => x.id === hoveredEle).content === "true"){
            previewContent(hoveredEle);
        }
      }
      break;
    case "link-rep":
      hoveredEle = e.target.parentElement.getAttribute("id");
      if (links.find(x => x.id === hoveredEle)){
        if (links.find(x => x.id === hoveredEle).content === "true"){
          previewContent(hoveredEle);
        }
      }
      break;
    default:
      break;
  }
}

function mouseOutListener(e) {
  if (drawing_enabled) return;    

  if (e.target.tagName === "tspan") {
    return;
  }
  
  let className = e.target.getAttribute("class").split("-")[0];

  switch(className) {
    case "node":
      if (nodes.find(x => x.id === hoveredEle)) {
        if (nodes.find(x => x.id === hoveredEle).content){
          var elem = document.getElementById("previewing");
          if (elem) {
            elem.parentNode.removeChild(elem);
          }
        }
      }
      break;
    case "label":
      if (nodes.find(x => x.id === hoveredEle)) {
        if (nodes.find(x => x.id === hoveredEle).content){
          var elem = document.getElementById("previewing");
          if (elem) {
            elem.parentNode.removeChild(elem);
          }
        }
      }
      break;
    case "link":
      if (links.find(x => x.id === hoveredEle)) {
        if (links.find(x => x.id === hoveredEle).content){
          var elem = document.getElementById("previewing");
          if (elem) {
            elem.parentNode.removeChild(elem);
          }
        }
      }
      break;
    default:
      break;
  }
  hoveredEle = null;
}

function keyPressListener(e) {
  var key = e.key;
  if (e.ctrlKey || e.metaKey)
    return;
  switch(key) {
    default:
      //Edit a node's label if one node is selected and an alphanumeric key is pressed
      if(!temp_label_div){
        //console.log("key press on node was triggered");
        e.preventDefault();
        var regExp = /^[A-Za-z0-9]+$/;
        var selectedNodes = d3.selectAll(".selected");
        if(key.match(regExp) && key.length === 1 && selectedNodes.size() === 1){
          addLabel(e.key, selectedNodes.node(), false);
        }
      }
      break;
  }
}

function keyDownListener(e){
  var key = e.key;
  var selectedNode = document.querySelector(".node.selected");
  //console.log("keyDown: " + key);
  if ((e.ctrlKey || e.metaKey) && e.key == "z") {
    e.preventDefault();
    undo()
    return false;
  }
  if ((e.ctrlKey || e.metaKey) && e.key == "y") {
    e.preventDefault();
    redo();
    return false;
  }
  switch(key) {
    case "Enter":
    case "Tab": // Tab
      if (!temp_label_div) {
        e.preventDefault();
        quickAdd(key);
      }
      break;
    case "Backspace":
      if(!temp_label_div){
        e.preventDefault();
        e.stopImmediatePropagation();
        
        d3.selectAll(".node.selected").each(function(){
          let data = {
            "node": this, 
            "groups": getNodeGroups(this)
          };
          action_done("deleteNode", data);
          logDeletion("Backspace", this);
          removeNode(this);
        });
        d3.selectAll(".link.selected").each(function(){
          let data = {
            "edge": this
          }
          action_done("removeEdge", data);
          logDeletion("Backspace", this);
          removeLink(this)
        });
        d3.selectAll(".map-image.selected").remove();
      }
      break;
    case "ArrowRight":
    case "ArrowLeft":
    case "ArrowUp":
    case "ArrowDown":
      if(selectedNode) selectNodeByDirection(key)
      else translateCanvas( ARROW_TRANSLATES[key] )
      break;
    default:
      break;
  }
}




function resetState() {
  //console.log("state was reset");
  mouseDown = 0;
  mouseUp = 0;
  mouseMoved = false;
  source_node = null;
  dragged_object = null;
  clicked_object = null;
  dragStartPos = null;
  drag_offset = [0,0];
  clearTimeout(singleClickTimer);
  clearTimeout(doubleClickDragTimer);
}

/*
* Tranlates the canvas by the Point: {x, y}
* @param vector: Point{x, y} to tranlate the vector by.  If not relative, this will be the upper left
*                corner of the viewport relative to the canvas
* @param isRelative: If true, translates by a vector.  If false, sets the upper left corner equal to vector
*/
function translateCanvas(vector, isRelative=true ){
  var currentTranslate = canvas.translateTransform;
  var newTranslate;

  if( isRelative ){
    newTranslate = new Point(vector.x + currentTranslate.x, vector.y + currentTranslate.y);
    canvas.translateTransform.set(newTranslate.x, newTranslate.y);
  } else{
    var newTranslate = Matrix.identity(3);
    newTranslate.translate( -1 * vector.x, -1 * vector.y);
    canvas.transformer.applyToGlobalTransform( newTranslate);
    canvas.translateTransform.update( newTranslate );
  }
  canvas.transformer.reapplyTransforms().then( () => { 
    canvas.transformer.complete();
    updateMinimapPosition();
  });
}

function checkIntersectionWithNodes(nodePoint, radius=null){
  if (!radius) radius = defaultRadius;

  nodePoint = canvas.transformer.fromLocalToGlobal(nodePoint);

  let testPoint = new Point(nodePoint.x - radius, nodePoint.y - radius);
  let collisionDetected = false;

  for(var i = 0; i < 3; i++){
    testPoint.x = nodePoint.x - radius;
    for(var j = 0; j < 3; j++){
      var elem = document.elementFromPoint(testPoint.x, testPoint.y);
      if( $(getParentMapElement(elem)).hasClass('node') ){
        return true
      }
      testPoint.x += radius;
    }
    testPoint.y += radius;
  }
  return false
}

/**
 * Creates a new node using either the tab or enter key and places it relative to the selected node or the viewport
 * @param  {String} key "Tab" or "Enter" - Tab places the new node to the right of the currently selected, enter places below
 * @return {[SVGELEMENT]} node - The created node
 */
function quickAdd(key){
  let selectedNode = document.querySelector(".selected.node");
  var quickAddX, quixkAddY;
  if(selectedNode){
    var nodeDims = selectedNode.getBoundingClientRect();
    if(key == "Enter"){
      //console.log("quick adding with enter");
      quickAddX = nodeDims.left + nodeDims.width / 2.0;
      quickAddY = nodeDims.bottom + quickAddDist;
    } else{
      //console.log("quick adding with tab");
      quickAddX = nodeDims.right + quickAddDist;
      quickAddY = nodeDims.top + nodeDims.height / 2.0;
    }
  } else{
    quickAddX = Math.floor(window.innerWidth/2.0);
    quickAddY = Math.floor(window.innerHeight/2.0)
  }
  var quickAddPoint = canvas.transformer.fromGlobalToLocal(new Point(quickAddX, quickAddY));
  //console.log("quickAddX: " + quickAddX + ", quickAddY: " + quickAddY + ", quickAddDist: " + quickAddDist);

  for(var i = 0; i < 10; i++){
    //console.log("checking for collisions");
    if( checkIntersectionWithNodes(quickAddPoint) ){
      //console.log("translating quickadded node away from collision");
      var translation = new Point(key == "Tab" ? quickAddDist : 0, key == "Enter" ? quickAddDist : 0);
      quickAddPoint.x += translation.x;
      quickAddPoint.y += translation.y;
    } else{
      //console.log("found a collision-free zone");
      break;
    }
  }
  
  let node = createNode({'position': quickAddPoint}).then( (node)=>
  { 
    logCreation(key,node);
    return node;
  });
}

function toggleDrawFunc() {
  let pad = document.getElementById("d3_container");
  let toggltBtn = document.getElementById("toggle_touch_drawing");
  let toolPalette = document.getElementById("tool-palette");

  if (drawing_enabled) {
    toolPalette.style.visibility = "hidden";
    pad.setAttribute("class", "");
    toggltBtn.innerHTML = "Enable Drawing!";
    eraser_enabled = false;
  } 
  else {
    toolPalette.style.visibility = "visible";
    pad.setAttribute("class", "drawable");
    toggltBtn.innerHTML = "Disable Drawing!";
    eraser_enabled = false;
  }
  drawing_enabled = !drawing_enabled;
  toggleNonDrawingHammers(!drawing_enabled);
  // Reset Eraser and Eraser Button Below;
  eraser_enabled = false;
  let eraser = document.querySelector(".drawing-instrument-tools .erase-drawing-canvas");
  eraser.style.background = "darkgrey";
  
}

function wrapInTransient(element){
  let temp_transient = document.createElement("transient");
  temp_transient.appendChild(element);
  document.getElementById("canvas").appendChild(temp_transient);
}

function removeFromTransient(element){
  // Remove the node from inside the transient element
  let inner_node = element.node();
  d3.select(inner_node.parentNode).remove();
  element.remove();
  document.getElementById("canvas").appendChild(inner_node);

}

function showEdit() {

  var editSection = document.getElementById("edit");

  if (editSection.style.display === "none") {
      editSection.style.display = "block";
  } else {
      editSection.style.display = "none";
  }
  
}

function showDraw() {

  var drawSection = document.getElementById("draw");

  if (drawSection.style.display === "none") {
      drawSection.style.display = "block";
  } else {
      drawSection.style.display = "none";
  }
}

/**
 * Moves the viewport so that the input dom element is in the center of it
 * @param  {DOMELEMENT} element - the dom element to center the view on
 */
function centerViewOnElement(element){
  viewport = document.getElementById("CogCanvas");
  var viewDims = [viewport.clientWidth - document.getElementById("content_container").clientWidth, viewport.clientHeight]
  var viewCenter = [viewDims[0]/2, viewDims[1]/2]
  var eleDims = element.getBoundingClientRect();
  var eleCenter = [eleDims.left + eleDims.width/2, eleDims.top + eleDims.height/2];
  var distance = [eleCenter[0] - viewCenter[0], eleCenter[1] - viewCenter[1]];

  translateCanvas( new Point(distance[0] * -1, distance[1] * -1) );
}