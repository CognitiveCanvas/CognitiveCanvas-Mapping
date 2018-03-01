/* TODO: initialize the canvas */
/* init.js */
webstrate.on("loaded", (webstrateId, clientId, user) => onLoaded(webstrateId, clientId, user));

function onLoaded(webstrateId, clientId, user) {
  getDefaultStyle();
  initIDs(webstrateId, clientId);
  initDragLine();
  initDataElement();
  reloadElement();
  initToolPalette();
  initDrawing();
}

function initIDs(webstrateId, clientId) {
  this.webstrateId = webstrateId;
  this.clientId = clientId;
  this.editId = "edit_" + clientId;
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

/**
 * Initialize data element which holds all data
 */
function initDataElement() {
  initHTMLElement("body", DATA_COLLECTION, true)
}

function initToolPalette() {
    let toolPalette = document.createElement("transient");
    toolPalette.setAttribute("id", "tool-palette");
    document.getElementById("content_container").appendChild(toolPalette);
    document.getElementById("tool-palette").style.visibility = "hidden";
}