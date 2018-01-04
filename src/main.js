/* main.js */
var nodes = [];
var links = [];

var clientId, active_node, dragged_node = null;

var canvas = document.getElementById("canvas");
var radius = 20;

/* layout.js */
var force = d3.layout.force().nodes(nodes).links(links);
var link = d3.select(canvas).selectAll(".link");
var node = d3.select(canvas).selectAll(".node");

/* interact.js */
var mouseUp, mouseDown = 0;
var delay = 300;
var mouseMoved = false;
var singleClickTimer, duobleClickDragTimer = null;
var drag_line = null;
var source_node = null;
var zoom = null;

/*
function mouseUpListener(e) {
  mouseUp++;

}
*/

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
      addNode(e.clientX, e.clientY, radius);
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
 * 
 */
function doubleClickEvent(e) {
  let entity = e.target.getAttribute("class").split(" ")[0];

  switch(entity) {
  }

  if (className == "node") {
      x = selection.attr("cx")
      y = selection.attr("cy")
      addLabel("node", x - 10, y - 10)
    }
    else if (className == "link") {
      x1 = selection.attr("x1")
      x2 = selection.attr("x2")
      y1 = selection.attr("y1")
      y2 = selection.attr("y2")
      mx = (parseInt(x1) + parseInt(x2)) / 2
      my = (parseInt(y1) + parseInt(y2)) / 2
      addLabel("edge", mx, my)
    }
    resetState()
}

/* TODO: initialize the canvas */
/* init.js */


  var node_drag = d3.behavior.drag()
      .on("dragstart", dragStart)
      .on("drag", dragMove)
      .on("dragend", dragEnd);

  //TODO:Clear the count if it is not possible
  //TODO:Add timer to clear things out
  //TODO:Refactor all the mouse event to d3.svg.mouse

  canvas.addEventListener("mousedown", (e) => {
    mouseDown++
    if(mouseDown === 2 && mouseUp === 1
  )
  {
    clearTimeout(singleClickTimer)
    doubleClickDragTimer = setTimeout(() => {
    revealHiddenLine(e)
  },
    delay
  )
  }

  selectLineSource(e)
  })

  canvas.addEventListener("mouseup", (e) => {
    mouseUp++
    //single click event
    if(mouseUp === 1 && mouseDown === 1
  )
  {
    singleClickTimer = setTimeout(() => {
      console.log("single click")
      singleClickEvent(e)
      resetState()
    }, delay
  )
  }
  //double click event
  else
  if (mouseUp === 2 && mouseDown === 2 && !mouseMoved) {
    clearTimeout(doubleClickDragTimer)
    selection = d3.select(e.target)
    className = selection.attr("class").split(" ")[0]
    if (className == "node") {
      x = selection.attr("cx")
      y = selection.attr("cy")
      addLabel("node", x - 10, y - 10)
    }
    else if (className == "link") {
      x1 = selection.attr("x1")
      x2 = selection.attr("x2")
      y1 = selection.attr("y1")
      y2 = selection.attr("y2")
      mx = (parseInt(x1) + parseInt(x2)) / 2
      my = (parseInt(y1) + parseInt(y2)) / 2
      addLabel("edge", mx, my)
    }
    resetState()
  }

  else if (mouseUp === 2 && mouseDown === 2 && mouseMoved) {
    selectLineDest(e)
    resetState()
  }

  if (mouseDown === 1 && mouseDown === 1 && mouseMoved) {
    resetState()
  }
  })

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
    var selection = d3.select(e.target)
    if(selection.classed("node") || selection.classed("link")
  )
  {
    selection.remove();
  }
  resetState()
  })

  function revealHiddenLine(e) {
    var selection = d3.select(e.target)

    if (selection.attr("class").split(" ")[0] === "node") {
      drag_line.attr("class", "drag_line")
      source_node = selection;
    }
  }

  function selectLineSource(e) {
    var selection = d3.select(e.target)
    if (selection.classed("node")) {
      dragged_node = selection
    }
  }

  function selectLineDest(e) {
    drag_line.classed("drag_line_hidden", true)
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", 0)
    if (dragged_node) {
      dragged_node = null
    }
    var selection = d3.select(e.target)
    if (source_node && selection.classed("node")) {
      force.stop();
      source_node_force = nodes.filter((n) => n.id == source_node.attr("id"))[0]
      target_force = nodes.filter((n) => n.id == selection.attr("id"))[0]
      links.push({source: source_node_force, target: target_force});
      redraw();
      source_node = null;
    }
  }

  function drawDragLine(e) {
    drag_line
        .attr("x1", source_node.attr("cx"))
        .attr("y1", source_node.attr("cy"))
        .attr("x2", e.pageX)
        .attr("y2", e.pageY)
  }

  function drawDragNode(e) {
    /*
    dragged_node
        .attr("cx", e.pageX)
        .attr("cy", e.pageY);
        */
  }


  function addNode(cx, cy, r) {
    force.stop();
    var id = clientId + "_" + Date.now();
    cx = parseInt(cx)
    cy = parseInt(cy)
    var node = {x: cx, y: cy, id: id};
    n = nodes.push(node);
    console.log(nodes)
    redraw()
  }

  function dragStart(d, i) {
    force.stop();
  }

  function dragMove(d, i) {
    console.log("eventDx", d3.event.dx);
    d.px += d3.event.dx;
    d.py += d3.event.dy;
    d.x += d3.event.dx;
    d.y += d3.event.dy;
    tick();
  }

  function dragEnd(d, i) {
    d.fixed = true;
    tick();
    force.resume();
  }

  function tick() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    //node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  };

  function redraw() {

    //redraw links first
    link = link.data(links);

    console.log(links)

    link.enter().insert("line", ":first-child")
        .attr("class", "link")
        .attr("x1", (d) => {return d.source.x; })
        .attr("y1", (d) => {return d.source.y; })
        .attr("x2", (d) => {return d.target.x; })
        .attr("y2", (d) => {return d.target.y; })
        .attr("source_id", (d) => {return d.source.id})
        .attr("target_id", (d) => {return d.target.id})
        .attr("xmlns", "http://www.w3.org/2000/svg");

    link.exit().remove();

    console.log(node)
    // redraw node
    node = node.data(nodes);

    node.enter().append("circle")
        .attr("class", "node")
        .attr("r", 30)
        .attr("cx", (d) => {return d.x;})
        .attr("cy", (d) => {return d.y;})
        .attr("id", (d) => {return d.id})
        .attr("xmlns", "http://www.w3.org/2000/svg");

    node.exit().remove();
    force.resume();
  }

  function onLoaded(webstrateId, clientId, user) {
    // TODO: Each client should have its own drag_line
    // and only visible to itself

    drag_line = d3.select(canvas).append("line")
        .attr("class", "drag_line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", 0);

    this.clientId = clientId;

    //TODO: this is a total hack, need a more elegant way
    node[0].forEach((d) => {
      let cx = parseInt(d.cx.baseVal.value);
    let cy = parseInt(d.cy.baseVal.value);
         nodes.push({x: x, sy: cy, id: d.id});
    console.log(nodes)
    });

    node.call(node_drag);

    force.on("tick", tick);

    force.start();
  }

  webstrate.on("loaded", (webstrateId, clientId, user) => onLoaded(webstrateId, clientId, user));