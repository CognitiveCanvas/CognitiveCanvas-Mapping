/**
 *@file
 *Defines the behavior of "nodes" on the concept map, along with how they are created, deleted, and acted upon
 *
 * Node data Structure:
{
  'id': String,
  'label': String,
  'note': String - the id of the sticky note,
  'position': Point - contains x,y coordinates of node,
  'scale': [x,y] the amount of transformation on the object,
  'size': [x,y] the calculated size of the node,
  'groupId': String - the Id of the group this node belongs to,
  'reps':{
    'mapping':{
      'type': String - "node" | "link" | "pin" | "goup" | "image,
      'shape': String - "rectangle | circle | triangle,
      'style': {
        'node-rep':{
          'fill': nodeRep.style.fill || "default",
          'stroke': nodeRep.style.stroke || "default"
        },
        'label':{
          'font-size': label.style.fontSize || "default",
          'font-color': label.style.stroke || "default",
          'font-family': label.style.fontFamily || "default",
          'italic': label.style.fontStyle === "italic",
          'bold' : label.style.fontWeight === String(FONT_BOLD)
        }
      }
    }
  }
}
 * }
 */
var snap;
var SHAPE_FUNCTIONS;

var NODE_DEFAULTS = {
  'label': "Node Name",
  'note': null,
  'position': {x: 50, y: 50},
  'scale': {x:1, y: 1},
  'groupId': null,
  'reps': {
    'mapping':{
      'type': "node",
      'shape': "rectangle",
      'style': {
        'node-rep':{
          'fill': 'rgba(46, 127, 195, 0.1)',
          'stroke': "blue"
        },
        'label': {

        }

      }
    }
  }
}

//All nodes have a base size of 100x100, and are scaled with the Transform property instead of svg attributes
var DEFAULT_NODE_SIZE = [100, 100]

/**
 * Initializes data structures needed to create nodes
 */
function initSnap(){
  snap = Snap(canvas)

  SHAPE_FUNCTIONS = {
    'rectangle': { 'function': snap.rect, 'args': [-50,-25,100,50] },
    'circle': { 'function': snap.circle, 'args': [0,0,50]},
    'triangle': { 'function': snap.polygon, 'args': [0,-60, 50,40, -50,40]},
  }
  NODE_DEFAULTS.position = new Point(50, 50);
  NODE_DEFAULTS.scale = new Point(1, 1);
}

/**
 * Creates a node from a JSON object, logs it, and adds a label
 * @param  {object} nodeInfo - describes the node to be created, all properties have defaults
 * {
 *   'id': {string} the node's ID
 *   'type': {string} node/pin/link/image/etc,
 *   'label': {string} label,
 *   'note': {string} ID of any notes attached to this node,
 *   'shape': {string} rectangle/circle,
 *   'position': [{float}, {float}] [centrx,centery],
 *   'scale': [{float}, {float}] [x,y],
 *   'groupId': {string} the id of the group this node belongs to,
 *   'style':
 *   {
 *     'fill': {string} css color,
 *     'stroke': {string} css color
 *   }
 * }
 *                           
 * @return {Promise} Returns a promise that will resolve to the created node once it has been 
 * rendered, inserted to the DOM, and has the apporpriate listeners attached.
 */
function createNode(nodeInfo={}){
  //Merge the input node info with defaults, and gives it a unique ID
  return new Promise((resolve, reject)=>{
    nodeInfo = Object.assign( {},
      NODE_DEFAULTS, 
      nodeInfo,
      {
        id: generateNewNodeID(),
      }
    );

    var node = drawNode(nodeInfo)

    hammerizeNode(node).then(
      function(success){

        selectNode(node);
        addLabel(nodeInfo.label, node);

        let data = { 
            "node"  : node,
            "groups": getNodeGroups(node)
          };
        action_done("insertNode", data);
        resolve(node);

      }, function(failure){
        console.log(failure);
        reject(null);
      });
  });
}

/**
 * Creates the svg elements to represent a node
 * @param  {object} nodeInfo - JSON representing the node, see createNode
 * @return {SVGELEMENT} the created node
 */
function drawNode(nodeInfo){

  var node = snap.g().attr(
    {
      id: nodeInfo.id,
      class: "node" + (nodeInfo.reps.mapping.type !== "node" ? " " + nodeInfo.type : ""),
      shape: nodeInfo.shape,
    }).transform(Snap.matrix(1,0,0,1, nodeInfo.position.x, nodeInfo.position.y).toTransformString());
  
  if (nodeInfo.groupId) node.attr({'groupId': nodeInfo.groupId});

  var nodeRep = drawNodeRep(node, nodeInfo);

  return node.node
}

/**
 * Creates the SVG Shape nested inside the <g> tag that represents the node
 * @param  {SVGELEMENT || Snap.Paper} The <g> tag to add the node representation to.  
 * Can be a reference to an SVG <g> tag, or one selected by Snap()
 * @param  {String} shape ["rect" | "circle" | "triangle"] the shape of the node 
 * @return none
 */
function drawNodeRep(node, nodeInfo=NODE_DEFAULTS){
  node = node instanceof SVGElement ? Snap(node): node;
  var shape = nodeInfo.reps.mapping.shape;
  var shapeInfo = SHAPE_FUNCTIONS[shape];

  var nodeRep = shapeInfo.function.call(node, ...shapeInfo.args).attr({
    class: "node-rep",
    "z-index": 1,
    "xmlns": "http://www.w3.org/2000/svg"
  });
  node.attr({'shape': shape})

  Object.keys(nodeInfo.reps.mapping.style['node-rep']).forEach( (attr)=>{
    nodeRep.node.style[attr] = nodeInfo.reps.mapping.style['node-rep'][attr]
  })

  node.prepend(nodeRep)
  return nodeRep;
}

/**
 * Changes the shape of a node that already has a node-rep
 * @param {string} shape ["rect" | "circle" | "triangle"] the new shape of the node
 * @param {nodeList} nodes the nodes to change the shape of.  Default - change the shape of
 * selected nodes
 */
function setNodeShape(shape, nodes=null){
  if (!nodes) nodes = document.querySelectorAll(".node.selected");
  nodes.forEach( (node)=>{
    var nodeInfo = nodeToObject(node);
    nodeInfo.reps.mapping.shape = shape;
    node.querySelector(".node-rep").remove();
    drawNodeRep(node, nodeInfo);
  });
}

 /**
  * Creates a unique ID for a top-level DOM element such as a Node, Link, Image, or Path
  *
  * @return {string} ID
  *   a unique ID made from the current client ID and the timestamp
  */
function generateNewNodeID() {
  return clientId + "_" + Date.now();
}

/**
 * Creates a JSON description of a node
 * @param  {SVGELEMENT} node the node to create JSON from
 * @return {Object} a standard object representation of the information contained in a node.  See createNode() for structure
 * @todo Add note
 */
function nodeToObject(node){
  let nodeRep = node.getElementsByClassName("node-rep")[0]
  let label = node.getElementsByClassName("label")[0];
  return {
    'id': node.id,
    'label': getNodeLabel(node),
    'note': null,
    'position': getNodePosition(node),
    'scale': node.transformer.localScale,
    'size': [node.transformer.localScale.x * DEFAULT_NODE_SIZE[0], node.transformer.localScale.y * DEFAULT_NODE_SIZE[1] ],
    'groupId': node.getAttribute("groupId") || null,
    'reps':{
      'mapping':{
        'type': "node" + (node.classList.contains("pin") ? " pin": ""),
        'shape': node.getAttribute("shape"),
        'style': {
          'node-rep':{
            'fill': nodeRep.style.fill || null,
            'stroke': nodeRep.style.stroke || null
          },
          'label':{
            'font-size': label.style.fontSize || "default",
            'font-color': label.style.stroke || "default",
            'font-family': label.style.fontFamily || "default",
            'italic': label.style.fontStyle === "italic",
            'bold' : label.style.fontWeight === String(FONT_BOLD)
          }
        }
      }
    }
  }
}



/**
 * [getAllNodeObjects description]
 * @return {[type]} [description]
 */
function getAllNodeObjects(){
  var allNodes = []
  document.querySelectorAll(".node").forEach( (node)=>{
    allNodes.push(nodeToObject(node));
  })
  return allNodes;
}

/**
 * @todo Remove
 * @deprecated
 */
function addNode() {
  let node = { type: "node", id: generateNewNodeID(), content: "false" };
  n = nodes.push(node);

  return node;
}

/**
 * @todo remove
 * @deprecated
 * @param {float} x position to add node at
 * @param {flot} y position to add node at
 */
function addNode(x, y) {
  let node = { type: "node", 
               id: generateNewNodeID(), 
               x: x,
               y: y,
               shape: defaultShape,
               color:defaultColor,
               radius: radius,
               content: false };
  n = nodes.push(node);
  return node;
}

/**
 * @deprecated
 * @todo  remove
 * @param {[type]} sourceId [description]
 * @param {[type]} destId   [description]
 */
function addLink(sourceId, destId) {
  let link = { type: "link", id: generateNewNodeID(), sourceId: sourceId, destId: destId, content: "false" };
  l = links.push(link);

  //console.log("add link", links);
  return link;
}

/**
 * @deprecated Remove
 * [deleteEntity description]
 * @param  {[type]} entities [description]
 * @param  {[type]} id       [description]
 * @return {[type]}          [description]
 */
function deleteEntity(entities, id) {
  let index = entities.findIndex((n) => n.id === id);
  if (index > -1) {
    entities.splice(index, 1);
  }
}

function drawLink(link) {
  let linkSrcNode = document.getElementById(link.sourceId);
  let linkDestNode = document.getElementById(link.destId);
  //console.log("source node: " + linkSrcNode + ", dest node: " + linkDestNode);
  let srcPos = getNodePosition(linkSrcNode);
  let destPos = getNodePosition(linkDestNode);

  //Inserts the link before all the nodes in the canvas
  var linkG = d3.select(canvas)
    .insert("g", ".node")
    .attr("class", "link")
    .attr("id", link.id)
    .attr("source_id", link.sourceId)
    .attr("target_id", link.destId)
    .attr("content", "false");
  linkG
    .append("line")
    .attr("class", "link-rep")
    .attr("id", link.id)
    .attr("x1", srcPos.x)
    .attr("y1", srcPos.y)
    .attr("x2", destPos.x)
    .attr("y2", destPos.y)
    .attr("xmlns", "http://www.w3.org/2000/svg");

    return linkG.node();
}

function removeNode(node) {
  //console.log(node);
  let node_d3 = node instanceof d3.selection ?  node : d3.select(node);
  let node_id = node_d3.attr("id");

  d3.selectAll(`[source_id=${node_id}]`)
    .classed("deleted", true);

  d3.selectAll(`[target_id=${node_id}]`)
    .classed("deleted", true);

  d3.selectAll(".selection_area[children_ids~=" + node_id + "]")
    .each(function(){
      let group = d3.select(this);
      group.attr("children_ids", group.attr("children_ids").split(' ').filter(id => id !== node_id).join(' ') );
    });

  node_d3.classed("deleted", true);
  let temp_transient = document.createElement("transient");
  temp_transient.appendChild(node_d3.node());
  document.getElementById("canvas").appendChild(temp_transient);
}

function removeLink(link) {
  link = link instanceof d3.selection ? link : d3.select(link);
  let link_id = link.attr("id");
  link.classed("deleted", true);
  let temp_transient = document.createElement("transient");
  temp_transient.appendChild(link.node());
  document.getElementById("canvas").appendChild(temp_transient);
}

function selectLineDest(node) {
  hideDragLine();
  if (dragged_object) {
    dragged_object = null
  }
  var selection = $(node);
  let sourceNode = $(source_node);
  if (sourceNode && 
      $(selection).hasClass("node") && 
      selection.attr("id") != sourceNode.attr("id")) 
  {
    let addedLink = addLink(sourceNode.attr("id"), selection.attr("id"));

    let data = { 
        "edge"  : addedLink
      };
    //console.log("adding edge data edge", data.edge)
    action_done("addEdge", data);
    var link = drawLink(addedLink);
    source_node = null;
    resetState()
    return link;
  } else{
    resetState();
    return null;
  }
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

function selectSrcNode(node) {
  source_node = node;
  revealDragLine();
}

/** Draws a temporary link between a source node and a point on the canvas
  * @param canvasPoint: a local point {x,y} in the canvas space, usually the mouse, move the end of the link to
**/
function drawDragLine(endPoint) {
  let sourceNode = source_node;
  let dragLine = d3.select(drag_line);
  let srcPos = getNodePosition(sourceNode);

  dragLine.attr("x1", srcPos.x)
          .attr("y1", srcPos.y)
          .attr("x2", endPoint.x)
          .attr("y2", endPoint.y)
}

//Helper Function to move a node group
/**
* node: the node to move along with its links
* IMPORTANT: Takes coordinates in local (canvas)
* x: the x coordinate to move the node to.  If relative is true, this will be an x offest instead
* y: the y coordinate to move the node to.  If relative is true, this will be a y offest instead
**/
function translateNode(node, vector, relative=false, links=null){
  //console.log("Node: ", node, ", X: ", x, ", Y: ", y);
  if (!links) {
    links = findConnectedLinks(node);
  }

  var nodePosition = getNodePosition(node);

  var x = vector.x
  var y = vector.y;

  if(!relative){
     x -= nodePosition.x;
     y -= nodePosition.y;
  }

  x += node.translateTransform.x;
  y += node.translateTransform.y;

  node.translateTransform.set(x, y)
  node.transformer.reapplyTransforms().then((promise)=>{
    //update links to connect to this node
    updateLinkPositions( links, nodePosition);
  });
  return new Promise((success, failure) => {success()});
}

/** Finds all the links connected to a ndoe
*   @param node: the node to find the links of
*   @returns {sourceLinks, destLinks} nodeLists containing links for each
**/
function findConnectedLinks(node){
  var id = node.getAttribute('id');
  var sourceLinks = document.querySelectorAll(`[source_id=${id}]`)
  var targetLinks = document.querySelectorAll(`[target_id=${id}]`);
  return {'sourceLinks': sourceLinks, 'targetLinks': targetLinks};
}

/**
*  Loops through the passed in list of links and updates their positions to match the passed node position
*  @param links: {sourceLinks, destLinks} a list of the links to update
*  @param nodePoint: the position of the node to connect the links to
**/
function updateLinkPositions( links, nodePoint ){
  var x = nodePoint.x;
  var y = nodePoint.y;
  links.sourceLinks.forEach( function(link){
    link = $(link).children('.link-rep');
    link
      .attr("x1", x)
      .attr("y1", y)
      .siblings('.label')
      .attr("x",  (parseFloat(link.attr("x1")) + parseFloat(link.attr("x2"))) / 2.0  + "px")
      .attr("y",  (parseFloat(link.attr("y1")) + parseFloat(link.attr("y2"))) / 2.0  + "px");
  });

  links.targetLinks.forEach( function(link){
    link = $(link).children('.link-rep');
    link
      .attr("x2", x)
      .attr("y2", y)
      .siblings('.label')
      .attr("x",  (parseFloat(link.attr("x1")) + parseFloat(link.attr("x2"))) / 2.0  + "px")
      .attr("y",  (parseFloat(link.attr("y1")) + parseFloat(link.attr("y2"))) / 2.0  + "px");
  }); 
}

function getNodePosition(node){
  var node = node instanceof d3.selection ? node.node() : node;
  var transformMatrix = node.transformer.getTransformMatrix();
  return new Point(transformMatrix.tx, transformMatrix.ty)
}

function getParentMapElement(element){
  if ($(element).is(".node,.link,.group")) return element;
  return $(element).parents(".node,.link,.group").get(0) || element;
}