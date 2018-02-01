/* main.js */
var nodes = [];
var links = [];

var clientId, active_node, dragged_object = null;
var drag_offset = [0, 0];

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

// drag_line & source_node are stored as html element
var drag_line = null;
var source_node = null;
var selection_area = null;
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

function mouseUpListener(e) {
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
  mouseDown++;
  e.preventDefault();
  if(temp_label_div){
    console.log("a label is being edited");
    d3.select(temp_label_div).classed("shaking", false);
    setTimeout(function(){ d3.select(temp_label_div).classed("shaking", true)}, 1);
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
  else if (mouseDown === 2) {
    drawDragLine(e);
  }
}


function mouseOverListener(e) {
  let className = e.target.getAttribute("class").split("-")[0];

  switch(className) {
    case "node":
      hoveredEle = e.target.getAttribute("id");
      if (nodes.find(x => x.id === hoveredEle)){
          if (nodes.find(x => x.id === hoveredEle).content){
            showContent(hoveredEle);
        }
      }
      break;
    case "link":
      hoveredEle = e.target.getAttribute("id");
      if (links.find(x => x.id === hoveredEle)){
          if (links.find(x => x.id === hoveredEle).content){
          showContent(hoveredEle);
        }
      }
      break;
    default:
      break;
  }
}

function mouseOutListener(e) {
  let className = e.target.getAttribute("class").split("-")[0];

  switch(className) {
    case "node":
      if (nodes.find(x => x.id === hoveredEle)) {
        if (nodes.find(x => x.id === hoveredEle).content){
          var elem = document.getElementById("showing");
          if (elem) {
            elem.parentNode.removeChild(elem);
          }
        }
      }
      break;
    case "link":
      if (links.find(x => x.id === hoveredEle)) {
        if (links.find(x => x.id === hoveredEle).content){
          var elem = document.getElementById("showing");
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
  console.log("keyCode: " + key);

  switch(key) {
    case "Tab": // Tab
      if (quickAdd) {
        e.preventDefault();
        quickAddX += quickAddDist;
        let addedNode = addNode();
        drawNode(addedNode, quickAddX, quickAddY);
      }
      break;
    case "Enter": // Enter
      if (quickAdd) {
        quickAddY += quickAddDist;
        let addedNode = addNode();
        drawNode(addedNode, quickAddX, quickAddY);
      }
      break;
    case "q": // Q
      console.log("Quick add toggled");
      quickAdd = !quickAdd;
      break
    case "1": // #1
      if (hoveredEle) addEleContent(e);
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
    console.log("single click while there is a selection area");
    createGroup();
  } else if(dragged_object){
    console.log("single click while there is a dragged object");
  } else {
    let addedNode = null;
    console.log("regular single click");
    switch(entity) {
      case "canvas":
        addedNode = addNode();
        quickAddX = e.clientX;
        quickAddY = e.clientY;
        drawNode(addedNode, e.clientX, e.clientY, defaultShape, radius, defaultColor);
        break;
      case "node":
        break;
      case "link":
        break;
      case "selection_area":
        addedNode = addNode();
        drawNode(addedNode, e.clientX, e.clientY, defaultShape, radius, defaultColor);
        addNodeToGroup(addedNode, e.target);
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
  let selection = d3.select(e.target.parentNode);
  let className = selection.attr("class").split(" ")[0]
  //console.log(className);
  switch(className) {
    case "node":
      addLabel("node", selection.node() );
      break;
    case "link":
      x1 = selection.attr("x1");
      x2 = selection.attr("x2");
      y1 = selection.attr("y1");
      y2 = selection.attr("y2");
      mx = (parseInt(x1) + parseInt(x2)) / 2;
      my = (parseInt(y1) + parseInt(y2)) / 2;
      addLabel("edge", selection.node() );
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
  let link = { type: "link", id: getID(), sourceId: sourceId, destId: destId, content: false };
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
  addLabel("Node Name", nodeG.node());
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
    .attr("target_id", link.destId);
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
  let node_d3 = d3.select(node);
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
  getDefaultStyle();
  initDragLine();
  initDataElement();
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
  if (selection.classed("node-rep")) {
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
    let selected_id = d3.select(dragged_object).attr("id");

    translateNode(dragged_object, e.pageX, e.pageY);
  }
}

function drawSelectionArea(e){
    if (!selection_area){
      //console.log("Creating Selection Area");
        selection_area = d3.select(canvas).insert("rect", ":first-child")
            .classed("selection_area", true)
            .attr("x", e.pageX)
            .attr("y", e.pageY)
            .attr("width", 0)
            .attr("height", 0)
        //console.log("selection is created");
    }
    var rectX = Number(selection_area.attr("x"));
    var rectY = Number(selection_area.attr("y"));
    var width = Number(selection_area.attr("width"));
    var height = Number(selection_area.attr("height"));
    var midX = rectX + width / 2;
    var midY = rectY + height / 2;

    if( e.pageX > midX ){
      selection_area.attr("width", e.pageX - rectX);
    } else{
      selection_area.attr("width", rectX - e.pageX + width);
      selection_area.attr("x", e.pageX);
    }
    if( e.pageY > midY ){
      selection_area.attr("height", e.pageY - rectY);
    } else{
      selection_area.attr("height", rectY - e.pageY + height);
      selection_area.attr("y", e.pageY);
    }
    console.log("selection area drawn");
}

function createGroup(){
  console.log("creating group");
  var left = Number(selection_area.attr("x"));
  var right = left + Number(selection_area.attr("width"));
  var top = Number(selection_area.attr("y"));
  var bottom = top + Number(selection_area.attr("height"));

  var allNodes = d3.selectAll(".node")
  var children_ids = [];
  //console.log(grouped_nodes);
  //console.log("left: ", left, ", right: ", right, ", top: ", top, ", bottom: ", bottom);
  var grouped_nodes = allNodes.filter( function() {
    var position = getNodePosition(this);
    var x = position[0];
    var y = position[1];
    //console.log("x: ", x, ", y: ", y);
    return x >= left && x <= right && y >= top && y <= bottom;
  });
  //console.log(grouped_nodes)
  grouped_nodes.each(function(){children_ids.push(d3.select(this).attr("id"))});
  selection_area.attr("children_ids", children_ids.join(" "));

  selection_area = null;
  dragged_object = null;
  console.log('creating the group')
}

function moveGroup(group, x, y){
  var group = d3.select(group);
  var nodeIds = group.attr("children_ids").split(" ").filter(x => x);

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

function addNodeToGroup(node, group){
  let new_children_ids = String(group.getAttribute("children_ids"))
    .split(" ")
    .filter(x => x);
  new_children_ids.push(node.id);
  new_children_ids = new_children_ids.join(' ');
  group.setAttribute("children_ids", new_children_ids);
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
  return d3.transform(d3.select(node).attr("transform")).translate;
}

function addEleContent(e) {
  var newNodeAddress = "http://webstrates.ucsd.edu/" + hoveredEle;

  var appendElement = '<div class="note" contenteditable="true" style="position: absolute;left: 8px;top: 8px;width: 200px;min-height: 200px;padding: 16px;box-shadow: 5px 5px 10px gray;background-color: rgb(255, 255, 150);font-size: 24pt;word-wrap: break-word;"></div>'

  // Don't know why the elements does not append. TODO
  var openWindow = window.open(newNodeAddress).document.body.innerHTML += appendElement;

  if (nodes.find(x => x.id === hoveredEle)) {
    nodes.find(x => x.id === hoveredEle).content = true;
  }
  else if (links.find(x => x.id === hoveredEle)) {
    links.find(x => x.id === hoveredEle).content = true;
  }
  else {
      console.warn("Node/Link NOT FOUND");
  }


}

function showContent(ele) {
    var addressToFrame = "http://webstrates.ucsd.edu/" + ele;
    var wrapper = document.createElement('div');
    wrapper.setAttribute("id", "showing");
    var toFrame = '<iframe src="'+ addressToFrame + '" style="position: absolute;left: 8px;top: 8px;width: 300px;height: 300px;"><p>ERROR: Your browser does not support iframes.</p></iframe>';
    wrapper.innerHTML = toFrame;
    document.body.appendChild(wrapper);
}
