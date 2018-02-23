/* main.js */
var nodes = [];
var links = [];

var clientId, active_node, dragged_object = null;

var canvas = document.getElementById("canvas");
var radius = 20;
var height = 40;
var width = 40;
var defaultSize = null;
var defaultRadius = 20;
var defaultShape = "circle";
var defaultColor = "#f00";

/* interact.js */
var mouseUp = 0;
var mouseDown = 0;
var delay = 300;
var mouseMoved = false;
var singleClickTimer, doubleClickDragTimer = null;

var hoveredEle = null;
var addWindowOpen = false;
var drawing_enabled = false;

// drag_line & source_node are stored as html element
var drag_line = null; 
var source_node = null;

var hoveredEle = null;
var zoom = null;

// quick add vars
var quickAdd = false;
var quickAddX = 0;
var quickAddY = 0;
var quickAddDist = 70;

canvas.addEventListener("mouseup", (e) => mouseUpListener(e));
canvas.addEventListener("mousedown", (e) => mouseDownListener(e));
canvas.addEventListener("contextmenu", (e) => rightClickListener(e));
canvas.addEventListener("mousemove", (e) => mouseMoveListener(e));
canvas.addEventListener("mouseover", (e) => mouseOverListener(e));
canvas.addEventListener("mouseout", (e) => mouseOutListener(e));
window.addEventListener("keypress", (e) => keyPressListener(e));
window.addEventListener("keydown", (e) => keyDownListener(e));

function mouseUpListener(e) {
  if (drawing_enabled) return; 
    
  mouseUp++;

  if(mouseUp === 1 && dragged_object && !mouseMoved ){
    dragged_object = null;
  }

  if (mouseUp === 1 && mouseDown === 1) {
    singleClickTimer = setTimeout(() => {
      console.log("single click");
      singleClickEvent(e);
    }, delay);
  }
  else if (mouseUp === 2 && mouseDown === 2 && !mouseMoved) {
    console.log("double click");
    doubleClickEvent(e);
  }
  else if (mouseUp === 2 && mouseDown === 2 && mouseMoved) {
    console.log("double click drag")
    selectLineDest(e);
  }
  else {
    resetState();
  }
}

function mouseDownListener(e) {
  if (drawing_enabled) return; 
    
  mouseDown++;
  e.preventDefault();
  if(temp_label_div){
    e.stopImmediatePropagation();
    handleClickDuringLabelInput();
    resetState();
    return;
  }

  if (mouseDown === 1) {
    selectDraggedObject(e);
  }
  else if (mouseDown === 2 && mouseUp === 1) {
    clearTimeout(singleClickTimer);
    selectSrcNode(e);
    doubleClickDragTimer = setTimeout(() => {
      let className = e.target.parentNode.getAttribute("class").split(" ")[0];
      if (className === "node") {
        revealDragLine();
      }
    }, delay);
  }
  else {
    resetState();
  }
}

function rightClickListener(e) {
  let className = e.target.getAttribute("class").split(" ")[0];

  if (className != "canvas") {
    e.preventDefault();
  }

  switch(className) {
    case "node-rep":
      break;
    case "link-rep":
      break;
    case "selection_area":
      break;
    default:
      break;
  }
  resetState();
}

function mouseMoveListener(e) {
  if (drawing_enabled) return; 
  
  if (mouseDown > 0) {
    mouseMoved = true
  }
  if (mouseDown === 1 && mouseUp === 0) {
    if(dragged_object){
      var selection = d3.select(dragged_object);
      if(selection.classed("node")){
        drawDragNode(e);
      }else if(selection.classed("selection_area")){
        moveGroup(selection.node(), e.pageX, e.pageY);
      }
    }else{
      console.log("drawing selection area");
      drawSelectionArea(e);

    }
  }
  else if (mouseDown === 2 && source_node) {
    drawDragLine(e);
  }
}

function mouseOverListener(e) {
  if (drawing_enabled) return;
  
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
  console.log("key: " + key);

  switch(key) {
    case "Enter": // Enter
      if (!temp_label_div) {
        console.log("quick adding with enter");
        var selectedNodes = d3.selectAll(".selected");
        quickAddY += quickAddDist;
        let addedNode = addNode();
        let node = drawNode(addedNode, quickAddX, quickAddY);
        selectNode(node);
        addLabel("Node Name", node);
      }
      break;
    case "1": // #1
      if (hoveredEle && !addWindowOpen) addEleContent(e);
      break;
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
  console.log("keyDown: " + key);
  switch(key) {
    case "Tab": // Tab
      if (!temp_label_div) {
        console.log("quick adding with tab");
        e.preventDefault();
        quickAddX += quickAddDist;
        let addedNode = addNode();
        let node = drawNode(addedNode, quickAddX, quickAddY);
        selectNode(node);
        addLabel("Node Name", node);
      }
      break;
    case "Backspace":
      if(!temp_label_div){
        e.preventDefault();
        e.stopImmediatePropagation();
        d3.selectAll(".node.selected").each(function(){removeNode(this)});
        d3.selectAll(".link.selected").each(function(){removeLink(this)});
      }
      break;
    case "ArrowRight":
      selectNodeByDirection("right");
      break;
    case "ArrowLeft":
      selectNodeByDirection("left");
      break;
    case "ArrowUp":
      selectNodeByDirection("up");
      break;
    case "ArrowDown":
      selectNodeByDirection("down");
      break;
    default:
      break;
  }
}

/*
 * Single click interaction
 * - canvas: add a new node
 * - existing node:
 * - existing link:
 */
function singleClickEvent(e) {
  let entity = e.target.getAttribute("class").split(" ")[0];

  if(selection_area){
    //console.log("single click while there is a selection area");
    createGroup();
  } else if(dragged_object){
    //console.log("single click while there is a dragged object");
  } else {
    let addedNode = null;
    //console.log("regular single click");
    switch(entity) {
      case "canvas":
        deselectAllObjects();
        break;
      case "node-rep":
      case "label":
        console.log("node rep was clicked");
        if( d3.select(e.target.parentNode).classed("selected") ){
          console.log("Adding a label it a selected node that was clicked");
          addLabel(null, e.target.parentNode, false);
        } else{
          selectNode(e.target.parentNode, !e.shiftKey);
        }
        break;
      case "link-rep":
        selectNode(e.target.parentNode, !e.shiftKey);
        break;
      case "selection_area":
        break;
      default:
        break;
    }
  }

  resetState();
}


/*
 * Double click interaction
 * - canvas:
 * - existing node: add label
 * - existing link: add label
 *
 */
function doubleClickEvent(e) {
  clearTimeout(doubleClickDragTimer);
  e.preventDefault();
  let selection = d3.select(e.target);
  let className = selection.attr("class").split(" ")[0]
  console.log(className);
  switch(className) {
    case "canvas":
      addedNode = addNode();
      var node = drawNode(addedNode, e.clientX, e.clientY, defaultShape, radius, defaultColor);
      selectNode(node, !e.shiftKey);
      addLabel("Node Name", node);
      break;
    case "node-rep":
    case "label":
      var node = d3.select(e.target.parentNode);
      if( !node.classed("selected") ){
        selectNode(node.node(), !e.shiftKey);
      }
      addLabel(null, node.node(), false);
      break;
    case "link-rep":
      var link = e.target.parentNode;
      addLabel(null, link, false);
      break;
    case "selection_area":
      addedNode = addNode();
      var node = drawNode(addedNode, e.clientX, e.clientY, defaultShape, radius, defaultColor);
      selectNode(node, false);
      addLabel("Node Name", node);
      addNodeToGroup(addedNode, e.target);
      break;
    default:
      break;
  }

  resetState()
}




/* entity.js */
function getID() {
  return clientId + "_" + Date.now();
}

function addNode() {
  let node = { type: "node", id: getID(), content: "false" };
  n = nodes.push(node);

  return node;
}

function addLink(sourceId, destId) {
  let link = { type: "link", id: getID(), sourceId: sourceId, destId: destId, content: "false" };
  l = links.push(link);

  //console.log("add link", links);
  return link;
}

function deleteEntity(entities, id) {
  let index = entities.findIndex((n) => n.id === id);
  if (index > -1) {
    entities.splice(index, 1);
  }
}

function drawNode(node, cx, cy, shape=defaultShape, radius=defaultRadius, color=defaultColor) {
  let x = parseInt(cx)
  let y = parseInt(cy)

  if (shape === "circle") {
    var nodeG = d3.select(canvas)
      .append("g")
      .attr("class", "node")
      .attr("id", node.id)
      .attr("content", "false")
      .attr("transform", "translate("+x+","+y+")");
    nodeG
      .append(shape)
      .attr("class", "node-rep")
      .style("fill", color)
      .style("z-index", 1)
      .attr("r", radius)
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("xmlns", "http://www.w3.org/2000/svg");
  }

  if (shape === "rect") {
    var nodeG = d3.select(canvas)
      .append("g")
      .attr("class", "node")
      .attr("id", node.id)
      .attr("content", "false")
      .attr("transform", "translate("+x+","+y+")");
    nodeG
      .append(shape)
      .attr("class", "node-rep")
      .style("fill", color)
      .style("z-index", 1)
      .attr("width", width)
      .attr("height", height)
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("xmlns", "http://www.w3.org/2000/svg");
  }

  return nodeG.node();
}

function drawLink(link) {
  let linkSrcNode = document.getElementById(link.sourceId);
  let linkDestNode = document.getElementById(link.destId);
  //console.log("source node: " + linkSrcNode + ", dest node: " + linkDestNode);

  let x1 = getNodePosition(linkSrcNode)[0];
  let y1 = getNodePosition(linkSrcNode)[1];
  let x2 = getNodePosition(linkDestNode)[0];
  let y2 = getNodePosition(linkDestNode)[1];

  var linkG = d3.select(canvas)
    .insert("g", ":first-child")
    .attr("class", "link")
    .attr("id", link.id)
    .attr("source_id", link.sourceId)
    .attr("target_id", link.destId)
    .attr("content", "false");
  linkG
    .append("line")
    .attr("class", "link-rep")
    .attr("id", link.id)
    .attr("x1", x1)
    .attr("y1", y1)
    .attr("x2", x2)
    .attr("y2", y2)
    .attr("xmlns", "http://www.w3.org/2000/svg");

  addLabel("Link Name", linkG.node());
}

function removeNode(node) {
  console.log(node);
  let node_d3 = node instanceof d3.selection ?  node : d3.select(node);
  let node_id = node_d3.attr("id");

  d3.selectAll(`[source_id=${node_id}]`)
    .remove();

  d3.selectAll(`[target_id=${node_id}]`)
    .remove();

  d3.selectAll(".selection_area[children_ids~=" + node_id + "]")
    .each(function(){
      let group = d3.select(this);
      group.attr("children_ids", group.attr("children_ids").split(' ').filter(id => id !== node_id).join(' ') );
    });

  deleteEntity(nodes, node_id);
  node_d3.remove();
}

function removeLink(link) {
  link = link instanceof d3.selection ? link : d3.select(link);
  let link_id = link.attr("id");
  deleteEntity(links, link_id);
  link.remove();
}

/* TODO: initialize the canvas */
/* init.js */
webstrate.on("loaded", (webstrateId, clientId, user) => onLoaded(webstrateId, clientId, user));

function onLoaded(webstrateId, clientId, user) {
  this.clientId = clientId;
  getDefaultStyle();
  initDragLine();
  initDataElement();
  reloadElement();
  initToolPalette();
}

function reloadElement() {
  let NodeEleCollection = document.getElementsByClassName("node");
  let EdgeEleCollection = document.getElementsByClassName("link"); 
  
  for (i = 0; i < NodeEleCollection.length; i++) {
    let currNodeEle = NodeEleCollection[i];
    let node = { type: "node", id: currNodeEle.id, content: currNodeEle.getAttribute("content") };
    n = nodes.push(node);
  }
    
  for (j = 0; j < EdgeEleCollection.length; j++) {
    let currEdgeEle = EdgeEleCollection[j];
    let link = { type: "link", id: currEdgeEle.id, sourceId: currEdgeEle.getAttribute("source_id"), destId: currEdgeEle.getAttribute("target_id"), content: currEdgeEle.getAttribute("content") };
    l = links.push(link);
  }
}

function initDragLine() {
  drag_line = document.getElementById("drag_line");
  if (drag_line === null) {
    d3.select(canvas)
      .append("line")
      .attr("id", "drag_line")
      .attr("class", "drag_line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", 0);

    drag_line = document.getElementById("drag_line");
  }
}

function getDefaultStyle() {
  let defaultStyle = document.getElementsByTagName(DEFAULT_STYLE)[0];

  if (defaultStyle) {
    defaultShape = defaultStyle.getAttribute("shape")
                  ? defaultStyle.getAttribute("shape")
                  : defaultShape;

    defaultColor = defaultStyle.getAttribute("color")
                  ? defaultStyle.getAttribute("color")
                  : defaultColor;
  }
}

function resetState() {
  //console.log("state was reset");
  mouseDown = 0;
  mouseUp = 0;
  mouseMoved = false;
  source_node = null;
  dragged_object = null;
  drag_offset = [0,0];
  clearTimeout(singleClickTimer);
  clearTimeout(doubleClickDragTimer);
}

function selectDraggedObject(e) {
  var selection = d3.select(e.target)
  if (d3.select(e.target.parentNode).classed("node")) {
    dragged_object = e.target.parentNode;
  } else if(selection.classed("selection_area")){
    dragged_object = e.target;
    var dragged_group = d3.select(dragged_object);
    drag_offset = [dragged_group.attr("x") - e.pageX, dragged_group.attr("y") - e.pageY]
  }
}

function selectLineDest(e) {
  hideDragLine();
  if (dragged_object) {
    dragged_object = null
  }
  var selection = d3.select(e.target.parentNode)
  let sourceNode = d3.select(source_node);
  if (sourceNode && selection.classed("node")) {
    let addedLink = addLink(sourceNode.attr("id"), selection.attr("id"));
    drawLink(addedLink);
    source_node = null;
  }
  resetState();
}

function revealDragLine() {
  d3.select(drag_line)
    .classed({"drag_line": true, "drag_line_hidden": false});
}

function hideDragLine() {
  let dragLine = d3.select(drag_line)
  dragLine.classed({"drag_line_hidden": true, "drag_line": false})
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", 0)
          .attr("y2", 0)
}

function selectSrcNode(e) {
  source_node = e.target.parentNode;
}

function drawDragLine(e) {
  let sourceNode = source_node;
  let dragLine = d3.select(drag_line);

  dragLine.attr("x1", getNodePosition(sourceNode)[0])
          .attr("y1", getNodePosition(sourceNode)[1])
          .attr("x2", e.pageX)
          .attr("y2", e.pageY)
}

function drawDragNode(e) {
  //console.log("drawing drag node");
  if (dragged_object != null) {
    let node = d3.select(dragged_object);
    if(!node.classed("selected") ){
      selectNode(node, !e.shiftKey);
    }
    let selected_id = node.attr("id");
    quickAddX = e.pageX;
    quickAddY = e.pageY;
    translateNode(dragged_object, e.pageX, e.pageY);
  }
}

//TODO: Improve efficiency
//Helper Function to move a node group
/**
node: the node to move along with its links
x: the x coordinate to move the node to.  If relative is true, this will be an x offest instead
y: the y coordinate to move the node to.  If relative is true, this will be a y offest instead
**/
function translateNode(node, x, y, relative=false){
  //console.log("Node: ", node, ", X: ", x, ", Y: ", y);
  if(relative){
    var position = getNodePosition(node);
    x += position[0];
    y += position[1];
  }

  var g = d3.select(node);
  g.attr("transform", "translate(" + x + "," + y + ")");

  let selected_id = d3.select(node).attr("id");

  d3.selectAll(`[source_id=${selected_id}] > [class="link-rep"]`)
    .attr("x1", x)
    .attr("y1", y)
    .each( function(){
      let line = d3.select(this);
      let label = d3.select(this.parentNode).select(".label"); 
      label.attr("x",  (parseFloat(line.attr("x1")) + parseFloat(line.attr("x2"))) / 2.0  + "px");
      label.attr("y",  (parseFloat(line.attr("y1")) + parseFloat(line.attr("y2"))) / 2.0  + "px");
    });


  d3.selectAll(`[target_id=${selected_id}] > [class="link-rep"]`)
    .attr("x2", x)
    .attr("y2", y)
    .each( function(){
      let line = d3.select(this);
      let label = d3.select(this.parentNode).select(".label"); 
      label.attr("x",  (parseFloat(line.attr("x1")) + parseFloat(line.attr("x2"))) / 2.0  + "px");
      label.attr("y",  (parseFloat(line.attr("y1")) + parseFloat(line.attr("y2"))) / 2.0  + "px");
    }); 

}

function getNodePosition(node){
  node = node instanceof d3.selection ? node : d3.select(node);
  return d3.transform( node.attr("transform") ).translate;
}


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
 * Add Conent Alternative Way
 * (Break AddPic Functionality, need exploration later) 
 */
//function addEleContent(e) {
//  let newNodeAddress = WEBSTRATES_URL_PREFIX + hoveredEle;
//  let wrapper = document.createElement('div');
//  wrapper.setAttribute("id", "addContentWrapper");
//  
//  let toFrame = document.createElement('iframe');
//  toFrame.setAttribute("id", "addWindow");
//  toFrame.setAttribute("src", newNodeAddress);
//  let warningTxt = document.createElement('p');
//  warningTxt.innerHTML = "ERROR: Your browser does not support iframes.";
//  toFrame.appendChild(warningTxt);
//  
//  let addNoteButton = document.createElement('button');
//  addNoteButton.setAttribute("id", "addNoteBtn");
//  addNoteButton.setAttribute("type", "button");
//  addNoteButton.setAttribute("onclick", "appendNote()");
//  addNoteButton.innerHTML = "Add Sticky Note";
//    
//  let addPicButton = document.createElement('input');
//  addPicButton.setAttribute("id", "addPicBtn");
//  addPicButton.setAttribute("type", "file");
//  addPicButton.setAttribute("onclick", "appendPic()");
//    
//  let closeButton = document.createElement('button');
//  closeButton.setAttribute("id", "closeWindowBtn");
//  closeButton.setAttribute("type", "button");
//  closeButton.setAttribute("onclick", "closeContentWindow()");
//  closeButton.innerHTML = "Close Content Window";
//  
//  wrapper.appendChild(toFrame);
//  wrapper.appendChild(addNoteButton);
//  wrapper.appendChild(addPicButton);
//  wrapper.appendChild(closeButton);
//  
//  
//  document.getElementById("content_container").appendChild(wrapper);
//  addEleToList(e);    
//  addWindowOpen = true;
//}

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

function appendNote() {
  let appendElement = '<div class="note" contenteditable="true" style="left: 8px;top: 8px;width: 235px;min-height: 100px;padding: 16px;box-shadow: 5px 5px 10px gray;background-color: rgb(255, 255, 150);font-size: 12pt;word-wrap: break-word;"></div><br>';  
  let addWindow = document.getElementById("addWindow");
  addWindow.contentWindow.document.body.innerHTML += appendElement;
}

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

function initToolPalette() {
    let toolPalette = document.createElement("transient");
    toolPalette.setAttribute("id", "tool-palette");
    document.body.appendChild(toolPalette);
    document.getElementById("tool-palette").style.visibility = "hidden";
}

function toggleDrawFunc() {
  let pad = document.getElementById("d3_container");
  let toggltBtn = document.getElementById("toggle_touch_drawing");
  let toolPalette = document.getElementById("tool-palette");

  if (drawing_enabled) {
    toolPalette.style.visibility = "hidden";
    pad.setAttribute("class", "");
    toggltBtn.innerHTML = "Enable Drawing!";
    console.log(toggltBtn.innerHTML);
  } 
  else {
    toolPalette.style.visibility = "visible";
    pad.setAttribute("class", "drawable");
    toggltBtn.innerHTML = "Disable Drawing!";
    console.log(toggltBtn.innerHTML);
  }
  drawing_enabled = !drawing_enabled;
  
}