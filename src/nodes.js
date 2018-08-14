/**
 *@file
 *Defines the behavior of "nodes" on the concept map, along with how they are created, deleted, and acted upon
 *
 * Node data Structure:
{
  'id': String,
  'label': String,
  'note': Boolean - whether the sticky note is edited,
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

var NODE_TEMPLATE = {
  'label': "Node Name",
  'note': false,
  'position': {x: 50, y: 50},
  'scale': {x:1, y: 1},
  'groupId': null,
  'reps': {
    'mapping':{
      'elements': {
        'node' : {
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
  }
}

//All nodes have a base size of 100x100, and are scaled with the Transform property instead of svg attributes
var DEFAULT_NODE_SIZE = [100, 100]

/**
 * Initializes data structures needed to create nodes
 */
function initSnap(){
  snap = Snap(canvas);

  SHAPE_FUNCTIONS = {
    'rectangle': { 'function': snap.rect, 'args': [-50,-25,100,50] },
    'circle': { 'function': snap.circle, 'args': [0,0,50]},
    'triangle': { 'function': snap.polygon, 'args': [0,-60, 50,40, -50,40]},
  }
}

/**
 * Creates a node from a JSON object, logs it, and adds a label
 * @param  {object} nodeInfo - describes the node to be created, all properties have defaults
 * {
 *   'id': {string} the node's ID
 *   'type': {string} node/pin/link/image/etc,
 *   'label': {string} label,
 *   'note': {boolean} whether the note attaching to this node is edited,
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
  console.log(nodeInfo)
  return new Promise((resolve, reject)=>{
    nodeInfo = Object.assign( {},
      NODE_TEMPLATE, 
      nodeInfo,
      {
        id: generateObjectId(),
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
      note_edited: false,
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
function drawNodeRep(node, nodeInfo=NODE_TEMPLATE){
  node = node instanceof SVGElement ? Snap(node): node;
  var shape = nodeInfo.reps.mapping.elements.node.shape;
  var shapeInfo = SHAPE_FUNCTIONS[shape];

  var nodeRep = shapeInfo.function.call(node, ...shapeInfo.args).attr({
    class: "node-rep",
    "z-index": 1,
    "xmlns": "http://www.w3.org/2000/svg"
  });
  node.attr({'shape': shape})

  node.prepend(nodeRep)

  styleFromInfo(node.node, nodeInfo, "mapping", "node", "node-rep");

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
    'note': node.getAttribute("note_edited"),
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
 * @param [String] - an array of strings containing the map elements to collect
 *                   Example: ["node", "link", "group"]
 * @return [Object] Objects representing all the selected map elements
 */
function getAllObjects(types=["node", "link", "group"]){
  var allNodes = []
  document.querySelectorAll("."+types.join(",.") ).forEach( (node)=>{
    if (node.classList.contains("node")){
      allNodes.push(nodeToObject(node));
    }
    else if (node.classList.contains("link")){
      allNodes.push(linkToObject(node));
    }
    else if (node.classList.contains("group")){
      allNodes.push(groupToObject(node));
    }
  });
  return allNodes;
}

/**
 * @todo Remove
 * @deprecated
 */
function addNode() {
  let node = { type: "node", id: generateObjectId(), content: "false" };
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
               id: generateObjectId(), 
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
  let link = { type: "link", id: generateObjectId(), sourceId: sourceId, destId: destId, content: "false" };
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

function removeNode(node) {
  //console.log(node);
  let node_d3 = node instanceof d3.selection ?  node : d3.select(node);
  let node_id = node_d3.attr("id");

  d3.selectAll(`[sourceId=${node_id}]`)
    .classed("deleted", true);

  d3.selectAll(`[targetId=${node_id}]`)
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

function getNodePosition(node){
  var node = node instanceof d3.selection ? node.node() : node;
  var transformMatrix = node.transformer.getTransformMatrix();
  return new Point(transformMatrix.tx, transformMatrix.ty)
}

function getParentMapElement(element){
  if ($(element).is(".node,.link,.group")) return element;
  return $(element).parents(".node,.link,.group").get(0) || element;
}