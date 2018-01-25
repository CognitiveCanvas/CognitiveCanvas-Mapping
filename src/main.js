/* main.js */
var nodes = [];
var links = [];

var clientId, active_node, dragged_node = null;
var drag_offset = [0, 0];

var canvas = document.getElementById("canvas");
var radius = 20;

/* interact.js */
var mouseUp = 0;
var mouseDown = 0;
var delay = 300;
var mouseMoved = false;
var singleClickTimer, duobleClickDragTimer = null;
var mouseHoverNode = false;
var hoveredNode = null;
var mouseHoverEdge = false;
var hoveredEdge = null;

// drag_line & source_node are stored as html element
var drag_line = null;
var source_node = null;
var selection_area = null;
var zoom = null;

canvas.addEventListener("mouseup", (e) => mouseUpListener(e));
canvas.addEventListener("mousedown", (e) => mouseDownListener(e));
canvas.addEventListener("contextmenu", (e) => rightClickListener(e));
canvas.addEventListener("mousemove", (e) => mouseMoveListener(e));
canvas.addEventListener("mouseover", (e) => mouseOverListener(e));
canvas.addEventListener("mouseout", (e) => mouseOutListener(e));
window.addEventListener("keypress", (e) => keyPressListener(e));

function mouseUpListener(e) {
  mouseUp++;

  if (mouseUp === 1 && mouseDown === 1) {
    singleClickTimer = setTimeout(() => {
      console.log("single click");
      singleClickEvent(e);
    }, delay);

    if (mouseMoved) {
      resetState();
    }
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
  mouseDown++;
  e.preventDefault();

  if (mouseDown === 1) {
    selectDraggedObject(e);
  }
  else if (mouseDown === 2 && mouseUp === 1) {
    clearTimeout(singleClickTimer);
    selectSrcNode(e);
    doubleClickDragTimer = setTimeout(() => {
      let className = e.target.getAttribute("class").split(" ")[0];
      if (className === "node-rep") {
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
      deleteEntity(nodes, e.target.parentNode.getAttribute("id"));
      removeNode(e.target.parentNode);
      break;
    case "link-rep":
      deleteEntity(links, e.target.parentNode.getAttribute("id"));
      removeLink(e.target.parentNode);
      break;
    case "selection_area":
      d3.select(e.target).remove();
      break;
    default:
      break;
  }
  resetState();
}

function mouseMoveListener(e) {
  if (mouseDown > 0) {
    mouseMoved = true
  }

  if (mouseDown === 1 && mouseUp === 0) {
    var selection = d3.select(e.target);
    if(dragged_object){
      var selection = d3.select(dragged_object);
      if(selection.classed("node-rep")){
        drawDragNode(e);
      }else if(selection.classed("selection_area")){
        moveGroup(selection.node(), e.pageX, e.pageY);
      }
    }else if(selection.classed("canvas")){
      drawSelectionArea(e);
    }
  }
  else if (mouseDown === 2) {
    drawDragLine(e)
  }
}


function mouseOverListener(e) {
  let className = e.target.getAttribute("class").split(" ")[0];
  
  switch(className) {
    case "node":
      mouseHoverNode = true;
      hoveredNode = e.target.getAttribute("id");
      if (nodes.find(x => x.id === hoveredNode)){
          if (nodes.find(x => x.id === hoveredNode).content){
          var addressToFrame = "http://webstrates.ucsd.edu/" + hoveredNode;
              
          var wrapper = document.createElement('div');
          wrapper.setAttribute("id", "showing");

          var toFrame = '<iframe src="'+ addressToFrame + '" style="position: absolute;left: 8px;top: 8px;width: 300px;height: 300px;"><p>ERROR: Your browser does not support iframes.</p></iframe>';
              
          wrapper.innerHTML = toFrame;
              
          document.body.appendChild(wrapper);
        }
      }
      break;
    case "link":
      mouseHoverEdge = true;
      break;
    default:
      break;
  }
}

function mouseOutListener(e) {
  let className = e.target.getAttribute("class").split(" ")[0];
  
  switch(className) {
    case "node":
      if (nodes.find(x => x.id === hoveredNode)) {  
        if (nodes.find(x => x.id === hoveredNode).content){
          var elem = document.getElementById("showing");
          if (elem) {
            elem.parentNode.removeChild(elem);
          }
        }
      }
                
      mouseHoverNode = false;
      hoveredNode = null;
      break;
    case "link":
      mouseHoverEdge = false;
      break;
    default:
      break;
  }
}

function keyPressListener(e) {
  var keyCode = e.which;
    
  if (keyCode == 97) {

    if (mouseHoverNode){
      addNodeContent(e);
    }
    else if (mouseHoverEdge){
      addEdgeContent(e);
    }
    
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

  switch(entity) {
    case "canvas":
      let addedNode = addNode();
      drawNode(addedNode, e.clientX, e.clientY, radius);
      break;
    case "node":
      break;
    case "link":
      break;
    default: 
      break;
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
  let selection = d3.select(e.target);
  let className = selection.attr("class").split(" ")[0]

  switch(className) {
    case "node":
      x = selection.attr("cx");
      y = selection.attr("cy");
      addLabel("node", x - 10, y - 10);
      break;
    case "link":
      x1 = selection.attr("x1");
      x2 = selection.attr("x2");
      y1 = selection.attr("y1");
      y2 = selection.attr("y2");
      mx = (parseInt(x1) + parseInt(x2)) / 2;
      my = (parseInt(y1) + parseInt(y2)) / 2;
      addLabel("edge", mx, my);
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
  let node = { type: "node", id: getID(), content: false };
  n = nodes.push(node);

  return node;
}

function addLink(sourceId, destId) {
  let link = { type: "link", id: getID(), sourceId: sourceId, destId: destId };
  l = links.push(link);

  console.log("add link", links);
  return link;
}

function deleteEntity(entities, id) {
  let index = entities.findIndex((n) => n.id === id);
  if (index > -1) {
    entities.splice(index, 1);
  }
}

function drawNode(node, cx, cy, radius) {
  let x = parseInt(cx)
  let y = parseInt(cy)

  d3.select(canvas)
    .append("g")
    .attr("class", "node_group")
    .append("circle")
    .attr("class", "node")
    .attr("r", radius)
    .attr("cx", x)
    .attr("cy", y)
    .attr("id", node.id)
    .attr("xmlns", "http://www.w3.org/2000/svg");
}

function drawLink(link) {
  let linkSrcNode = document.getElementById(link.sourceId);
  let linkDestNode = document.getElementById(link.destId);

  let x1 = linkSrcNode.getAttribute("cx");
  let y1 = linkSrcNode.getAttribute("cy");
  let x2 = linkDestNode.getAttribute("cx");
  let y2 = linkDestNode.getAttribute("cy");

  d3.select(canvas)
    .insert("g", ":first-child")
    .attr("class", "link_group")
    .append("line")
    .attr("class", "link")
    .attr("x1", x1)
    .attr("y1", y1)
    .attr("x2", x2)
    .attr("y2", y2)
    .attr("source_id", link.sourceId)
    .attr("target_id", link.destId)
    .attr("xmlns", "http://www.w3.org/2000/svg");
}

function removeNode(node) {
  let node_d3 = d3.select(node);
  let node_id = node_d3.attr("id");

  d3.selectAll(`[source_id=${node_id}]`)
    .remove();

  d3.selectAll(`[target_id=${node_id}]`)
    .remove();

  node_d3.remove();
}

function removeLink(link) {
  d3.select(link).remove();
}

/* TODO: initialize the canvas */
/* init.js */
webstrate.on("loaded", (webstrateId, clientId, user) => onLoaded(webstrateId, clientId, user));

function onLoaded(webstrateId, clientId, user) {
  this.clientId = clientId;

  initDragLine();
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

function addLabel(text, cx, cy) {
  var container = document.getElementById("d3_container")
  var label = document.createElement("div");
  label.appendChild(document.createTextNode(text));
  label.setAttribute("contenteditable", "true");
  label.style.position = "absolute";
  label.setAttribute("z-index", "1");
  label.style.left = cx + "px";
  label.style.top = cy + "px";
  container.appendChild(label);
}

function resetState() {
  mouseDown = 0;
  mouseUp = 0;
  mouseMoved = false;
  source_node = null;
  dragged_object = null;
  drag_offset = [0,0];
}

function selectDraggedObject(e) {
  var selection = d3.select(e.target)
  if (selection.classed("node-rep")) {
    dragged_object = e.target;
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
  var selection = d3.select(e.target)
  let sourceNode = d3.select(source_node);
  if (sourceNode && selection.classed("node-rep")) {
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
  if (dragged_object != null) {
    let selected_id = d3.select(dragged_object).attr("id");

    translateNode(dragged_object, e.pageX, e.pageY);
  }
}

function drawSelectionArea(e){
    //console.log("Drawing Selection Area");
    if (!selection_area){
        selection_area = d3.select(canvas).insert("rect", ":first-child")
            .classed("selection_area", true)
            .attr("x", e.pageX)
            .attr("y", e.pageY)
            .attr("width", 0)
            .attr("height", 0)
        //console.log("selection is created");
    }
    selection_area
        .attr("width", e.pageX - selection_area.attr("x"))
        .attr("height", e.pageY - selection_area.attr("y"));
    //console.log("selection area drawn");
}
    
function createGroup(){
  console.log("creating group");
  var left = selection_area.attr("x");
  var right = left + selection_area.attr("width");
  var top = selection_area.attr("y");
  var bottom = top + selection_area.attr("height");

  var grouped_nodes = d3.selectAll(".node")
  var children_ids = [];
  console.log(grouped_nodes)
  grouped_nodes.filter( function() {
      var position = getNodePosition(this);
      var x = position[0];
      var y = position[1];
      return x >= left
          && x <= right
          && y >= top 
          && y <= bottom;
      });
  console.log(grouped_nodes)
  grouped_nodes.each(function(){children_ids.push(d3.select(this).attr("id"))});
  selection_area.attr("children_ids", children_ids.join(" "));
  
  selection_area = null;
  dragged_object = null;
}

function moveGroup(group, x, y){
  var group = d3.select(group);
  var nodeIds = group.attr("children_ids").split(" ");

  var xMove = x - group.attr("x") + drag_offset[0];
  var yMove = y - group.attr("y") + drag_offset[1];

  for(i = 0; i < nodeIds.length; i++){
    let nodeId = nodeIds[i];
    var node = d3.select('#'+ nodeId);
    translateNode(node.node(), xMove, yMove, true);
  }

  group.attr("x", x + drag_offset[0]);
  group.attr("y", y + drag_offset[1]);
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

  var g = d3.select(node.parentNode);
  g.attr("transform", "translate(" + x + "," + y + ")");

  let selected_id = d3.select(node).attr("id");

  d3.selectAll(`[source_id=${selected_id}] > [class="link-rep"]`)
    .attr("x1", x)
    .attr("y1", y);

  d3.selectAll(`[target_id=${selected_id}] > [class="link-rep"]`)
    .attr("x2", x)
    .attr("y2", y);

}

function getNodePosition(node){
  return d3.transform(d3.select(node).attr("transform")).translate;
}

function addNodeContent(e) {
    var nodeId = hoveredNode;
    
    var newNodeAddress = "http://webstrates.ucsd.edu/" + hoveredNode;
    
    var appendElement = '<div class="note" contenteditable="true" style="position: absolute;left: 8px;top: 8px;width: 200px;min-height: 200px;padding: 16px;box-shadow: 5px 5px 10px gray;background-color: rgb(255, 255, 150);font-size: 24pt;word-wrap: break-word;"></div>'
    
    // Don't know why the elements does not append. TODO
    var openWindow = window.open(newNodeAddress).document.body.innerHTML += appendElement;
    
    nodes.find(x => x.id === hoveredNode).content = true;
    
}

function addEdgeContent(e) {
    console.log("addEdgeContent Triggered!");
}