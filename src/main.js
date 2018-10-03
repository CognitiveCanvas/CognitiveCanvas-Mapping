import {updateMinimapPosition} from './minimap.js';
import {isContainingParent} from './transformer_extensions.js';
import {addLabel} from './label.js';
import {action_done, getNodeGroups} from './undo.js';
import {logDeletion, logCreation} from './logger.js';
import {removeNode, getParentMapElement, createNode} from './nodes.js';
import {removeLink} from './links.js';
import {getElementsWithEditedNote} from './request_handler.js';
import {selectNodeByDirection} from './selections.js';

window.addEventListener("keypress", keyPressListener);
window.addEventListener("keydown", keyDownListener);

/**
 * Helper function to create a DOM element with optional Id and Classes
 * @param  {String} tagName The name of the DOM tag to be created
 * @param  {String} classes Classes of the element.  Can be a string or array
 * @param  {Object} attributes An object of key-value pairs corresponding to
 *                             attribute names and values
 * @param {HTMLELEMENT} parentElement the element to append the created element to
 * @return {HTMLELEMENT}    The created element if no parentElement was passed
 */
export function createElement(tagName, classes=null, attributes=null, parentElement=null){
  let element = document.createElement(tagName);
  if (classes){
    classes = typeof classes === "string" ? [classes] : classes;
    element.classList.add(...classes);
  }
  if (attributes){
    Object.keys(attributes).forEach( (attr)=>{
      if (attributes.hasOwnProperty(attr)){
        element.setAttribute(attr, attributes[attr]);
      }
    })
  }
  if (parentElement) parentElement.appendChild(element)
  return element;
}

/**
 * Creates a FontAwesome icon element from an icon name
 * @param {String} iconName The name of the icon without any prefixes ("Cog")
 * @param {String} faStyle  The fontAwesome style prefix to use ("fas" | "far")
 * @param {Boolean} returnClassesOnly If true, returns the classlist
 * @return {HTMLELEMENT}     A span element containing the icon
 */
export function faIcon(iconName, faStyle = "fas", returnClassesOnly=false){
  var icon = document.createElement("span");
  icon.classList.add("icon", faStyle, ("fa-" + iconName) );
  if (returnClassesOnly) return icon.classList;
  else return icon;
}

/**
 * Searches the UI element for a child element with the class "anchor" and
 * adds a Hammer Pan listener to it that moves the parent element's position
 * with the CSS "left" and "top" attributes
 * @param  {HTMLELEMENT} container The element to reposition.  This element
 *                                 must have a child with class "anchor"
 * @return none
 */
export function makeUIDraggable(container){
  let anchor = container.getElementsByClassName("anchor")[0];
  anchor.isDragging = false;

  if(!anchor.hammer){
    anchor.hammer = new Hammer.Manager(anchor, { recognizers: [ [Hammer.Tap] ] });
  }

  let hammer = anchor.hammer;
  hammer.add( new Hammer.Pan());
  hammer.on( 'pan panstart panend', (event)=>{
    if (event.type === "panstart"){
      container.dragStartPos = {
        x: Number(container.style.left.replace("px", "")), 
        y: Number(container.style.top.replace("px", ""))
      };
    }
    container.style.left = container.dragStartPos.x + event.deltaX + "px";
    container.style.top = container.dragStartPos.y + event.deltaY + "px";

    if (event.type === "panend") {
      container.dragStartPos = null;
    };
  })
}

export function keyPressListener(e) {
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
          addLabel(e.key, selectedNodes.node(), true, true);
        }
      }
      break;
  }
}

export function keyDownListener(e){
  var key = e.key;
  var selectedNode = document.querySelector(".node.selected");
  //console.log("keyDown: " + key);
  if ((e.ctrlKey || e.metaKey) && e.key == "z") {
    e.preventDefault();
    undo()
    
    getElementsWithEditedNote()
    
    return false;
  }
  if ((e.ctrlKey || e.metaKey) && e.key == "y") {
    e.preventDefault();
    redo();
    
    getElementsWithEditedNote()
    
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
        deleteSelectedElement();
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

export function deleteSelectedElement(){
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
  
  getElementsWithEditedNote()
}


export function resetState() {
  //console.log("state was reset");
  mouseUp = 0;
  mouseDown = 0;
  source_node = null;
  dragged_object = null;
  dragStartPos = null;
}

/*
* Tranlates the canvas by the Point: {x, y}
* @param vector: Point{x, y} to tranlate the vector by.  If not relative, this will be the upper left
*                corner of the viewport relative to the canvas
* @param isRelative: If true, translates by a vector.  If false, sets the upper left corner equal to vector
*/
export function translateCanvas(vector, isRelative=true ){
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

export function zoomCanvas(deltaZoom){

  let oldMatrix = canvas.transformer.elementMatrix;
  let newMatrix = oldMatrix.copy();
  newMatrix.scale(deltaZoom, deltaZoom);

  if (isContainingParent(canvas, newMatrix, true)){
    let screenCenterPoint = new Point(document.documentElement.clientWidth / 2.0, document.documentElement.clientHeight / 2.0);
    let centerPoint = canvas.transformer.fromGlobalToLocal(screenCenterPoint);

    let transform = canvas.scaleTransform;

    transform.set(deltaZoom, deltaZoom);
    transform._centerPoint.x = centerPoint.x;
    transform._centerPoint.y = centerPoint.y;
    
    canvas.transformer.reapplyTransforms().then( ()=>{
      canvas.transformer.complete();
      updateMinimapPosition();
    });
  } else{
    console.log("not zooming");
    return canvas.transformer.localScale.x;
  }
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
  var quickAddX, quickAddY;
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
  viewport = document.getElementById("d3_container");
  var viewDims = [viewport.clientWidth - document.getElementById("content_container").clientWidth, viewport.clientHeight]
  var viewCenter = [viewDims[0]/2, viewDims[1]/2]
  var eleDims = element.getBoundingClientRect();
  var eleCenter = [eleDims.left + eleDims.width/2, eleDims.top + eleDims.height/2];
  var distance = [eleCenter[0] - viewCenter[0], eleCenter[1] - viewCenter[1]];

  translateCanvas( new Point(distance[0] * -1, distance[1] * -1) );
}

export function roundToPlace(number, nPlaces){
  number = Number(number);
  let multiplier = Math.pow(10, nPlaces);
  let rounded = Math.round(number * multiplier) / multiplier;
  return rounded;
}