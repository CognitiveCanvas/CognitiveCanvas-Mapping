/* main.js */
var nodes = [];
var links = [];

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

// Message Passing to the Container Code. Package include the id & label
function sendSearchMsgToContainer() {
  if (window.parent) {
    //console.log(window.parent);
    let selected = d3.select(".selected");
    if (!selected.empty()) {
      let nodeID = selected.attr("id");
      let labelText = labelFinder(nodeID);
      let package = {
        id: "selected_element",
        uid: nodeID,
        label: labelText
      };
      window.parent.postMessage(package, "*");
    }
  }
}

// Related Node/Edge Passing to the Container.
function sendRelatedEleToContainer(label) {
  // TODO: Parse/Filter the data JSON with label as keyword, 
  //       and Add into the related element package
  let nodeList = nodes.filter(function(node) {
    return node.indexOf(label) > -1;
  });
  let edgeList = links.filter(function(link) {
    return link.indexOf(label) > -1;
  });
  
  let status;
  if (nodeList.length == 0 && edgeList.length == 0) {
    status = 204
  } else {
    status = 200
  }
  
  let relatedEle = {
    id: "related_element",
    query: label,
    nodes: nodeList,
    edges: edgeList
  }
  
  if (window.parent) {
    window.parent.postMessage(relatedEle, "*")
  }
}

// Use The id of the Element to find the label of the element!
function labelFinder(nodeID) {
  let labelElement = document.getElementById(nodeID+"_text");
  let labelText;
  if (labelElement) {
    if (labelElement.getElementsByTagName("tspan")[0]) {
      labelText = labelElement.getElementsByTagName("tspan")[0].innerHTML;
      //console.log("In View Mode, get label: " + labelText);
    } else {
      labelText = labelElement.innerHTML;
      //console.log("In Edit Mode, get label: " + labelText);
    }
    return labelText;
  }
  else {
    console.log("label NOT FOUND")
    return "";
  }
}


/*
 * Deprecared
 */
//function closePreviewIframe(target) {
//  if (hoveredEle) {
//    
//    switch (target) {
//      case "node":
//        if (nodes.find(x => x.id === hoveredEle)) {
//          if (nodes.find(x => x.id === hoveredEle).content){
//            var elem = document.getElementById("previewing");
//            if (elem) {
//              elem.parentNode.removeChild(elem);
//            }
//          }
//        }
//        break;
//      case "edge":
//        if (links.find(x => x.id === hoveredEle)) {
//          if (links.find(x => x.id === hoveredEle).content){
//            var elem = document.getElementById("previewing");
//            if (elem) {
//              elem.parentNode.removeChild(elem);
//            }
//          }
//        }
//        break;
//      default:
//        console.warn("Invalid Function Call on closePreviewIframe(target)");
//        break;
//    }
//    
//  }
//}

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
  
  let node = createNode({'position': quickAddPoint});
  logCreation(key,node);
  return node;
}

/*
* DEPRECATED
*/
function addEleContent(e) {
  let newNodeAddress = WEBSTRATES_URL_PREFIX + hoveredEle;
  let wrapper = document.createElement('div');
  wrapper.setAttribute("id", "addContentWrapper");
  
  let toFrame = '<iframe id="addWindow" src="'+ newNodeAddress + '"><p>ERROR: Your browser does not support iframes.</p></iframe>';
  let addNoteButton = '<button type="button" id="addNoteBtn" onclick="appendNote()">Add Sticky Note</button> ';
  let addPicButton = '<input type="file" id="addPicBtn" onchange="appendPic()"> ';
  let closeButton = '<button type="button" id="closeWindowBtn" onclick="closeContentWindow()">Close Content Window</button> ';
  
  wrapper.innerHTML = toFrame + addNoteButton + addPicButton + closeButton;
  
  document.getElementById("content_container").appendChild(wrapper);
  addEleToList(e);    
  addWindowOpen = true;
}

/*
* DEPRECATED
*/
function closeContentWindow() {
  let wrapper = document.getElementById("addContentWrapper");
  let windowFrame = document.getElementById("addWindow");
  let noteBtn = document.getElementById("addNoteBtn");
  let picBtn = document.getElementById("addPicBtn");
  let closeBtn = document.getElementById("closeWindowBtn");
  windowFrame.parentNode.removeChild(windowFrame);
  noteBtn.parentNode.removeChild(noteBtn);
  picBtn.parentNode.removeChild(picBtn);
  closeBtn.parentNode.removeChild(closeBtn);
  wrapper.parentNode.removeChild(wrapper);
  addWindowOpen = false;
}

/*
* DEPRECATED
*/
function appendNote() {
  let appendElement = '<div class="note" contenteditable="true" style="left: 8px;top: 8px;width: 235px;min-height: 100px;padding: 16px;box-shadow: 5px 5px 10px gray;background-color: rgb(255, 255, 150);font-size: 12pt;word-wrap: break-word;"></div><br>';  
  let addWindow = document.getElementById("addWindow");
  addWindow.contentWindow.document.body.innerHTML += appendElement;
}

/*
* DEPRECATED
*/
function appendPic() {  
  let appendElement = document.createElement('img');
  appendElement.setAttribute("width", "235");
  appendElement.setAttribute("alt", "Loading Image...");
  let addWindow = document.getElementById("addWindow");
  addWindow.contentWindow.document.body.appendChild(appendElement);
    
  let imgList = addWindow.contentWindow.document.querySelectorAll('img'); //selects the query named img
  let preview = imgList[imgList.length-1];
  let file    = document.querySelector('input[type=file]').files[0];
  let reader  = new FileReader();
    
  reader.onloadend = function () {
    preview.src = reader.result;
  }

  if (file) reader.readAsDataURL(file); //reads the data as a URL
  else preview.src = "";
}

function addEleToList(e) {
  if (nodes.find(x => x.id === hoveredEle)) {
    nodes.find(x => x.id === hoveredEle).content = "true";
    if (document.getElementById(hoveredEle)) { //Prevent finding null to error out the entire page;
      document.getElementById(hoveredEle).setAttribute("content","true");
    }
  }
  else if (links.find(x => x.id === hoveredEle)) {
    links.find(x => x.id === hoveredEle).content = "true";
    if (document.getElementById(hoveredEle)) { 
      document.getElementById(hoveredEle).setAttribute("content","true");
    }
  }
  else {
      console.warn("Node/Link NOT FOUND");
  }
}

function previewContent(ele) {
    let addressToFrame = WEBSTRATES_URL_PREFIX + ele;
    
    let wrapper = document.createElement('div');
    wrapper.setAttribute("id", "previewing");
    
    let toFrame = document.createElement('iframe');
    toFrame.setAttribute("id", "previewIframe");
    toFrame.setAttribute("src", addressToFrame);
    
    let warningTxt = document.createElement('p');
    warningTxt.innerHTML = "ERROR: Your browser does not support iframes.";
    
    toFrame.appendChild(warningTxt);
    wrapper.appendChild(toFrame);
    document.body.appendChild(wrapper);
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