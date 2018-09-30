import {getNodeLabel, addLabel} from './label.js';
import {getNodePosition} from './nodes.js';
import {selectNode} from './selections.js';
import {roundToPlace} from './main.js';
import {generateObjectId, styleFromInfo} from './data_interpreter.js';
import {hammerizeLink} from './hammer_events.js';

export var LINK_TEMPLATE = {
  'label': "Link Name",
  'note': false,
  'reps': {
    'mapping':{
      'elements': {
        'link': {
          'source_id': null,
          'target_id': null,
          'style':{
            'link-rep':{
              'stroke': THEME_COLORS.colors.darkGrey
            },
            'label':{
            }
          }
        }
      }
    }
  }
}

const ARROW_LENGTH = 15;
const ARROW_DEG = 50;
const ARROW_ANGLE = ARROW_DEG / 180 * Math.PI;

/**
 * creates a link element from a JSON object
 * @param  {Object} eleInfo - an unstructured object with attribute names and 
 * values to overwrite the template with.  See LINK_TEMPLATE for attribute names
 * @return {DOMELEMENT} link - the G element representing the link
 */
export function createLink(linkObj){
  return new Promise( (resolve, reject) =>{
  	let linkInfo = linkObj.reps.mapping.elements.link;
  	let srcNode = document.getElementById(linkInfo.source_id);
  	let targetNode = document.getElementById(linkInfo.target_id);

    let endPoints = findLinkEndPoints(srcNode, targetNode);


  	let link = Snap(0,0).g().attr({
  		'id': generateObjectId(),
  		'class':'link',
  		source_id : srcNode.id,
  		target_id : targetNode.id,
      note_edited: false
  	});
    //Insert the link after any groups or images
    var groups = canvas.getElementsByClassName("group");
    if( groups.length > 0 ) {
      link.insertAfter(groups[groups.length-1])
    }
    else{
      link.insertAfter(document.getElementById("canvas-bg"));
    }

  	link.line(endPoints[0].x, endPoints[0].y, endPoints[1].x, endPoints[1].y).attr({
  		'class': 'link-rep',
  		"xmlns": "http://www.w3.org/2000/svg",
  	});
    link = link.node;
  	
    hammerizeLink(link).then(()=>{
      addLabel("Link Name", link);
      selectNode(link)
      styleFromInfo(link, linkObj, "mapping", "link");

      resolve(link);
    });
  })
}

/**
 * Creates an object from a link that is translatable back into a link
 * @param  {DOMELEMENT} link - A reference to the link <g class="link"> to make into na object
 * @return {object} A JSON object representing the link
 */
export function linkToObject(link){
  var linkRep = link.getElementsByClassName("link-rep")[0];
  return {
    'id': link.id,
    'label': getNodeLabel(link),
    'deleted': link.classList.contains("deleted"),
    'note': link.getAttribute("note_edited"),
    'reps': {
      'mapping':{
        'elements': {
          'link': {
            'source_id': link.getAttribute("source_id"),
            'target_id': link.getAttribute("target_id"),
            'style':{
              'link-rep':{
                'stroke': linkRep.style.stroke
              },
              'label':{
              }
            }
          }
        }
      }
    }
  }
}

/**
 * @deprecated
 * @param  {	} link [description]
 * @return {[type]}      [description]
 */
function drawLink(link) {
  let linkSrcNode = document.getElementById(link.source_id);
  let linkDestNode = document.getElementById(link.target_id);
  //console.log("source node: " + linkSrcNode + ", dest node: " + linkDestNode);
  let srcPos = getNodePosition(linkSrcNode);
  let destPos = getNodePosition(linkDestNode);

  //Inserts the link before all the nodes in the canvas
  var linkG = d3.select(canvas)
    .insert("g", ".node")
    .attr("class", "link")
    .attr("id", link.id)
    .attr("source_id", link.source_id)
    .attr("target_id", link.target_id)
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

function removeLink(link) {
  link = link instanceof d3.selection ? link : d3.select(link);
  let link_id = link.attr("id");
  link.classed("deleted", true);
  let temp_transient = document.createElement("transient");
  temp_transient.appendChild(link.node());
  document.getElementById("canvas").appendChild(temp_transient);
}

/**
 * @deprecated
 * @param  {[type]} node [description]
 * @return {[type]}      [description]
 */
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
  d3.select("#drag_line")
    .classed({"drag_line": true, "drag_line_hidden": false});
}

export function hideDragLine() {
  let dragLine = d3.select("#drag_line")
  dragLine.classed({"drag_line_hidden": true, "drag_line": false})
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", 0)
          .attr("y2", 0)
}

export function selectSrcNode(node) {
  source_node = node;
  revealDragLine();
}

/** Draws a temporary link between a source node and a point on the canvas
  * @param canvasPoint: a local point {x,y} in the canvas space, usually the mouse, move the end of the link to
**/
export function drawDragLine(endPoint) {
  let sourceNode = source_node;
  let dragLine = document.getElementById("drag_line");
  let endPoints = findLinkEndPoints(sourceNode, endPoint);
  let sourcePoint = endPoints[0];
  let targetPoint = endPoints[1];

  if (dragLine.getAttribute("x1") != sourcePoint.x) dragLine.setAttribute("x1", sourcePoint.x);
  if (dragLine.getAttribute("y1") != sourcePoint.y) dragLine.setAttribute("y1", sourcePoint.y);

  dragLine.setAttribute("x2", endPoint.x);
  dragLine.setAttribute("y2", endPoint.y);
}

export function findConnectedLinks(node){
  var id = node.getAttribute('id');
  var links = document.querySelectorAll(`[source_id=${id}],[target_id=${id}]`)
  return links;
}

function drawLinkEnds(links=null, source=null, target=null){
  if (!links) links = document.querySelectorAll(".link.selected");
  links.forEach( (link)=>{
    let ends = [];
    let linkColor = link.getElementsByClassName("link-rep")[0].style.stroke;
    console.log(linkColor);
    if (source !== null) ends.push({name: "source", isArrow: source});
    if (target !== null) ends.push({name: "target", isArrow: target});
    let arrow;
    ends.forEach( end=>{
      if (end.isArrow){
        arrow = Snap(0,0).polygon([0, 0])
          .addClass("link-end " + end.name);
        if(linkColor) arrow.node.style.fill = linkColor;
        arrow.prependTo(link);
      } else{
        arrow = link.getElementsByClassName(end.name)[0];
        if (arrow) arrow.remove();
      }
    });
    updateLinkPositions(link);
  });
}

export function setRightLinkEnd(type="arrow"){
  let isArrow = type === "arrow";
  drawLinkEnds(null, null, isArrow);
}

export function setLeftLinkEnd(type="arrow"){
  let isArrow = type === "arrow";
  drawLinkEnds(null, isArrow, null);
}

function updateLinkEnd(linkEnd, endPoint){
  let theta = endPoint.angle;
  let sideLength = ARROW_LENGTH / Math.sqrt(3) * 2;
  let angles = [theta + Math.PI - ARROW_ANGLE / 2 ];
  angles.push(angles[0] + ARROW_ANGLE);
  arrowPoints = [
    endPoint.x,
    endPoint.y,
    roundToPlace(endPoint.x - sideLength * Math.cos(angles[0]), 2),
    roundToPlace(endPoint.y - sideLength * Math.sin(angles[0]), 2),
    roundToPlace(endPoint.x - sideLength * Math.cos(angles[1]), 2),
    roundToPlace(endPoint.y - sideLength * Math.sin(angles[1]), 2)
  ];
  linkEnd.setAttribute("points", arrowPoints);
}

/**
*  Loops through the passed in list of links and updates their positions to 
*  match their source and target nodes
*  @param links: [HTMLELEMENTS] an array of links to update
**/
export function updateLinkPositions(links){
  if ( links instanceof Node) links = [links];
  links.forEach(link=>{
    let linkRep = link.getElementsByClassName("link-rep")[0];
    let sourceNode = document.getElementById(link.getAttribute("source_id"));
    let targetNode = document.getElementById(link.getAttribute("target_id"));

    let endPoints = findLinkEndPoints(sourceNode, targetNode);
    let ends = ["source", "target"];
    ends.forEach( (end, i)=>{
      let endPoint = endPoints[i];
      let arrow = link.getElementsByClassName(end)[0];
      if (arrow){
        updateLinkEnd(arrow, endPoint);
        endPoint = {
          x: endPoint.x + Math.cos(endPoint.angle) * ARROW_LENGTH,
          y: endPoint.y + Math.sin(endPoint.angle) * ARROW_LENGTH
        }
      }
      linkRep.setAttribute("x" + String(i+1), endPoint.x);
      linkRep.setAttribute("y" + String(i+1), endPoint.y);
    });
    updateLinkLabelPosition(link);
  })
}

function updateLinkLabelPosition(link){
  let linkRep = link.getElementsByClassName("link-rep")[0];
  let label = link.getElementsByClassName("label")[0];
  label.setAttribute("x", (parseFloat(linkRep.getAttribute("x1")) + parseFloat(linkRep.getAttribute("x2"))) / 2.0 + "px");
  label.setAttribute("y", (parseFloat(linkRep.getAttribute("y1")) + parseFloat(linkRep.getAttribute("y2"))) / 2.0 + "px");
}

/**
 * Takes in two nodes and returns the two endPoints {x, y, angle} for a link 
 * that could be drawn between them.  This link follows the angle of a line
 * drawn between the centers of each node, but the endpoints of the line are
 * calculated to intersect with the edges of the node representations
 * @param  {SVGElement | Point} node1 The sourceNode for the theoretical link.
 *                                    Can also be passed as a Point(x, y). 
 * @param  {SVGElement | Point} node2 The targetNode for the theoretical link. 
 * @return {[{x, y, angle}]} An array with two endpoints [source, target],
 *                           each with the attributes x, y, and angle.
 */
function findLinkEndPoints(node1, node2){
  let endPoints = [];
  let nodes = [node1, node2];
  let midPoints = [];
  nodes.forEach( node=>{
    if (node instanceof Node) midPoints.push(getNodePosition(node));
    else if (node instanceof Point) midPoints.push(node);
  })

  let dx = midPoints[1].x - midPoints[0].x;
  let dy = midPoints[1].y - midPoints[0].y;
  let thetas = [Math.atan2(dy, dx)]; //The angle between the midpoints
  thetas.push(thetas[0] + Math.PI);

  nodes.forEach( (node, index)=>{
    let x, y, width, height;
    let theta = thetas[index];
    if(node instanceof Node){
      let nodeRep = node.getElementsByClassName("node-rep")[0];
      let scale = node.transformer.localScale;
      switch(node.getAttribute("shape")){  //Detect edges based on the shape type
        case "circle":
          let r = nodeRep.getAttribute("r");
          x = Math.cos(theta) * r * scale.x;
          y = Math.sin(theta) * r * scale.y;
          break;
        case "rectangle":
          width = nodeRep.getAttribute("width") * scale.x;
          height = nodeRep.getAttribute("height") * scale.y;
          let heightOverWidth = height / width;
          if(Math.abs(Math.tan(theta)) < heightOverWidth){
            x = width/2.0 * Math.sign(Math.cos(theta));
            y = Math.tan(theta) * x;
          }else{
            y = height/2.0 * Math.sign(Math.sin(theta));
            x = (1.0/Math.tan(theta)) * y;
          }
          break;
        case "diamond":
          let points = nodeRep.getAttribute("points").split(",");
          let rect = {
            width: points[4] - points[0],
            height: points[7] - points[3]
          }
          width = rect.width * scale.x / 2.0 * Math.sign(Math.cos(theta));
          height = rect.height * scale.y / 2.0 * Math.sign(Math.sin(theta));
          x = height / (Math.tan(theta) + height/width);
          y = Math.tan(theta) * x; 
        default:
          break;
      }
    } else{  //If this node was passed in as a Point {x, y}
      x = node.x;
      y = node.y;
    }
    x = roundToPlace(x + midPoints[index].x, 2);
    y = roundToPlace(y + midPoints[index].y, 2);
    endPoints.push({'x': x, 'y': y, 'angle': theta});
  });
  return endPoints;
}