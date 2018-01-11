/* main.js */
var nodes = [];
var links = [];

var clientId, active_node, dragged_node = null;

var canvas = document.getElementById("canvas");
var radius = 20;

/* interact.js */
var mouseUp, mouseDown = 0;
var delay = 300;
var mouseMoved = false;
var singleClickTimer, duobleClickDragTimer = null;

// drag_line & source_node are stored as html element
var drag_line = null;
var source_node = null;
var zoom = null;

  canvas.addEventListener("mousemove", (e) => {
  if (mouseDown > 0) {
    mouseMoved = true
  }

  if (mouseDown === 1) {
    drawDragNode(e)
  }
  else if (mouseDown === 2) {
    drawDragLine(e)
  }
  })

  canvas.addEventListener("contextmenu", (e) => {
  let className = e.target.getAttribute("class").split(" ")[0];

  if (className != "canvas") {
    e.preventDefault();
  }
  
  switch(className) {
    case "node":
      deleteEntity(nodes, e.target.getAttribute("id"));
      removeNode(e.target);
      break;
    case "link":
      deleteEntity(links, e.target.getAttribute("id"));
      removeLink(e.target);
      break;
    default:
      break;
  }
  resetState();
})

  canvas.addEventListener("mousedown", (e) => {
    mouseDown++

    if(mouseDown === 2 && mouseUp === 1
  )
  {
    clearTimeout(singleClickTimer)
    doubleClickDragTimer = setTimeout(() => {
    revealDragLine(e);
  },
    delay
  )
  }

  selectLineSource(e)
  })

canvas.addEventListener("mouseup", (e) => mouseUpListener(e));

function mouseUpListener(e) {
  mouseUp++;

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

/*
 * Single click interaction
 * - canvas: add a new node
 * - existing node:
 * - existing link: 
 */
function singleClickEvent(e) {
  console.log("single click target", e.target)
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
  let node = { type: "node", id: getID() };
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

  //TODO:Clear the count if it is not possible
  //TODO:Add timer to clear things out
  //TODO:Refactor all the mouse event to d3.svg.mouse

  

  function addLabel(text, cx, cy) {
    var container = document.getElementById("d3_container")
    var label = document.createElement("div")
    label.appendChild(document.createTextNode(text))
    label.setAttribute("contenteditable", "true")
    label.style.position = "absolute"
    label.setAttribute("z-index", "1")
    label.style.left = cx + "px"
    label.style.top = cy + "px"
    container.appendChild(label)
  }

  function resetState() {
    mouseDown = 0
    mouseUp = 0
    mouseMoved = false
  }

function selectLineSource(e) {
  var selection = d3.select(e.target)
  if (selection.classed("node")) {
    dragged_node = selection
  }
}

function selectLineDest(e) {
  hideDragLine();
  if (dragged_node) {
    dragged_node = null
  }
  var selection = d3.select(e.target)
  let sourceNode = d3.select(source_node);
  if (sourceNode && selection.classed("node")) {
    let addedLink = addLink(sourceNode.attr("id"), selection.attr("id"));
    drawLink(addedLink);
    source_node = null;
  }
  resetState();
}

function revealDragLine(e) {
  let className = e.target.getAttribute("class").split(" ")[0];
    
  if (className === "node") {
    d3.select(drag_line)
      .classed({"drag_line": true, "drag_line_hidden": false});
    source_node = e.target;
  }
}

function hideDragLine() {
  let dragLine = d3.select(drag_line)
  dragLine.classed({"drag_line_hidden": true, "drag_line": false})
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", 0)
          .attr("y2", 0)
}

function drawDragLine(e) {
  let sourceNode = d3.select(source_node);
  let dragLine = d3.select(drag_line);

  dragLine.attr("x1", sourceNode.attr("cx"))
          .attr("y1", sourceNode.attr("cy"))
          .attr("x2", e.pageX)
          .attr("y2", e.pageY)
}

function drawDragNode(e) {
  let selected_id = dragged_node.attr("id");

  d3.selectAll(`[source_id=${selected_id}]`)
    .attr("x1", e.pageX)
    .attr("y1", e.pageY);

  d3.selectAll(`[target_id=${selected_id}]`)
    .attr("x2", e.pageX)
    .attr("y2", e.pageY);

  dragged_node
      .attr("cx", e.pageX)
      .attr("cy", e.pageY);
}
