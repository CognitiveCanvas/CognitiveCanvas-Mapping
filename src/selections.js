import {TP_ELEMENT_TYPES, setTPSelection, updateNodeTPOptions} from './tool_panel.js';

var selection_area = null;

export var GROUP_TEMPLATE = {
  'label': null,
  'position': {x: 50, y: 50},
  'scale': {x:1, y: 1},
  'childrenIds': null,
  'reps': {
    'mapping':{
      'elements': {
        'group' : {
          'size': [500, 500],
          'imageURL': null,
          'style': {
            'group':{
            },
            'map-image': {
            }
          }
        }
      }
    }
  }
}

export function groupToObject(group){
  return {
    'id': group.id,
    'label': null,
    'position': getNodePosition(group),
    'scale': group.transformer.localScale,
    'childrenIds': group.getAttribute("children_ids").split(" ").filter( x=>x ),
    'reps': {
      'mapping':{
        'elements': {
          'group' : {
            'size': [group.getAttribute("width"), group.getAttribute("height")],
            'imageURL': group.getAttribute("href"),
            'style': {
              'group':{
              },
              'map-image': {
              }
            }
          }
        }
      }
    }
  }
}

/**
nodes: The node or selection of multiple nodes to be give the selected class
deselectCurrentSelection: if true, will remove the selected class from all currently sected nodes before selecting the new one
**/
export function selectNode(nodes, deselectCurrentSelection=true){
  //console.log("Nodes being selected: ", nodes);

  nodes = nodes instanceof Node ? [nodes] : nodes;
  
  if( deselectCurrentSelection ){
    deselectAllObjects();
  }

  let eleClass = nodes[0].classList.item(0);
  if ( TP_ELEMENT_TYPES.includes(eleClass) ){ 
    setTPSelection(eleClass);
    updateNodeTPOptions(nodes[0]);
  }

  nodes.forEach( (node)=>{
    node.classList.add("selected");
    Snap(node).attr({ filter: selectedFilter});
  });

  nodes[0].focus();  
}

function deselectNode(nodes){
  nodes = nodes instanceof Node ? [nodes] : nodes;
  nodes.forEach((node)=>{
    node.classList.remove("selected");
    node.removeAttribute("filter");
  });
}

function toggleSelection(nodes){
  nodes = nodes instanceof Node ? [nodes] : nodes;
  nodes.forEach((node)=>{
    if( node.classList.contains("selected")){
      deselectNode(node);
    } else{
      selectNode(node, false);
    }
  });
}

export function deselectAllObjects(removeSelectionArea=true){
  deselectNode(document.querySelectorAll(".selected"));

  if(removeSelectionArea){
    let selectionArea = document.querySelector(".selection_area");
    if(selectionArea){
      selectionArea.remove();
    }
  }
}

function selectNodeByDirection(direction){
  var node = d3.select(".node.selected");
  var nodePos = getNodePosition(node);
  var minAngle, maxAngle;

  switch(direction){
    case "right":
    case "ArrowRight":
      minAngle = RIGHT_MIN_ANGLE;
      maxAngle = RIGHT_MAX_ANGLE;
      break;
    case "up":
    case "ArrowUp":
      minAngle = UP_MIN_ANGLE;
      maxAngle = UP_MAX_ANGLE;
      break;
    case "left":
    case "ArrowLeft":
      minAngle = LEFT_MIN_ANGLE;
      maxAngle = LEFT_MAX_ANGLE;
      break;
    case "down":
    case "ArrowDown":
      minAngle = DOWN_MIN_ANGLE;
      maxAngle = DOWN_MAX_ANGLE;
      break;
    default:
      break;
  }

  var newSelection = d3.selectAll(".node:not(.selected)")
  newSelection = newSelection.filter(function(){
      let pos = getNodePosition(this);
      let angle = Math.atan2( -1*(pos.y-nodePos.y), pos.x-nodePos.x ) / Math.PI * 180;
      return (angle >= minAngle && angle <= maxAngle)
        || (minAngle > maxAngle && (angle >= minAngle || angle <= maxAngle)) 
      })
  newSelection = newSelection[0].sort(function(a,b){
      let aPos = getNodePosition(d3.select(a));
      let bPos = getNodePosition(d3.select(b));
      let aDist = Math.sqrt(Math.pow( nodePos.x-aPos.x , 2) + Math.pow( nodePos.y - aPos.y, 2));
      let bDist = Math.sqrt(Math.pow( nodePos.x-bPos.x , 2) + Math.pow( nodePos.y - bPos.y, 2));
      return aDist - bDist;
    })[0];
  if(newSelection){
    selectNode(newSelection);
  }
}

function drawSelectionArea(canvasPoint){
    var canvasPoint;

    if (!selection_area){
      //If this is the first event, create the selection area
      selection_area = document.querySelector(".selection_area");
      if (selection_area) selection_area.remove();

      selection_area = Snap(0,0).rect(canvasPoint.x, canvasPoint.y, 0, 0)
        .addClass("selection_area group");
      Snap(document.getElementById("canvas-bg")).after(selection_area);
      selection_area = selection_area.node;
    }

    //Update its position
    var rectX = Number(selection_area.getAttribute("x"));
    var rectY = Number(selection_area.getAttribute("y"));
    var width = Number(selection_area.getAttribute("width"));
    var height = Number(selection_area.getAttribute("height"));
    var midX = rectX + width / 2;
    var midY = rectY + height / 2;

    if( canvasPoint.x > midX ){
      selection_area.setAttribute("width", canvasPoint.x - rectX);
    } else{
      selection_area.setAttribute("width", rectX - canvasPoint.x + width);
      selection_area.setAttribute("x", canvasPoint.x);
    }
    if( canvasPoint.y > midY ){
      selection_area.setAttribute("height", canvasPoint.y - rectY);
    } else{
      selection_area.setAttribute("height", rectY - canvasPoint.y + height);
      selection_area.setAttribute("y", canvasPoint.y);
    }
}

function createGroup(){

  var group = selection_area;

  deselectAllObjects(false);

  var left = Number(group.getAttribute("x"));
  var right = left + Number(group.getAttribute("width"));
  var top = Number(group.getAttribute("y"));
  var bottom = top + Number(group.getAttribute("height"));

  var allNodes = document.querySelectorAll(".node");
  var children_ids = [];

  var grouped_nodes = [];
  allNodes.forEach( function(node) {
    var position = getNodePosition(node);
    var x = position.x;
    var y = position.y;
    if( x >= left && x <= right && y >= top && y <= bottom ){
      grouped_nodes.push(node);
    }
  });
  
  grouped_nodes.forEach(function(node){children_ids.push(node.getAttribute("id") ) } );

  if(grouped_nodes.length > 0){
    selectNode(grouped_nodes, false);
  }
  selection_area.setAttribute("children_ids", children_ids.join(" "));

  console.log(group);
  hammerizeGroup(group);

  selection_area = null;
  dragged_object = null;
  //console.log('creating the group')
}

/**
 * Moves a group and all nodes it contains.  
 * IMPORTANT: this function takes a vector in global (screen) coordinates so it can
 * translate it to the local space of each node in the group
 * @param  {SVGELEMENT} group  The element representing the group
 * @param  {Point} vector - a vector in global space representing the movement to be done
 */
function moveGroup(group, vector){

  var nodes = group.nodes;

  if( !nodes ){
    group.nodes = getGroupedNodes(group);
    nodes = group.nodes;
  }

  localVector = group.transformer.fromGlobalToLocalDelta(vector);

  var oldGroupTranslate = new Point( group.translateTransform.x, group.translateTransform.y);
  var xMove = oldGroupTranslate.x + localVector.x;
  var yMove = oldGroupTranslate.y + localVector.y;

  group.translateTransform.set(xMove, yMove);
  group.transformer.reapplyTransforms()

  nodes.forEach( (node)=>{ 
    translateNode(node, node.transformer.fromGlobalToLocalDelta(vector), true) 
  });
}

function addNodeToGroup(node, group){
  let new_children_ids = String(group.getAttribute("children_ids"))
    .split(" ")
    .filter(x => x);
  new_children_ids.push(node.id);
  new_children_ids = new_children_ids.join(' ');
  group.setAttribute("children_ids", new_children_ids);
}

/*
 *@param group - the group or image whose children wil be selected
 */
function getGroupedNodes(group){
   var nodes = [];
   var nodeIds = group.getAttribute("children_ids").split(" ").filter(x => x);
   for(var i=0; i < nodeIds.length; i++){
      nodes.push(document.getElementById(nodeIds[i]));
   }
   //console.log("Grouped Nodes: " + nodes );
   return nodes;
}

function BBIsInGroup(nodeBB, group){
  var left = parseInt(group.getAttribute("x"));
  var top = parseInt(group.getAttribute("y"));
  var right = left + parseInt(group.getAttribute("width"));
  var bottom = top + parseInt(group.getAttribute("height"));
  return nodeBB.left >= left &&
    nodeBB.right <= right &&
    nodeBB.top >= top &&
    nodeBB.bottom <= bottom
}