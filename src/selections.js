var drag_offset = [0, 0];
var selection_area = null;

var GROUP_TEMPLATE = {
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

function groupToObject(group){
  return {
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
function selectNode(nodes, deselectCurrentSelection=true){
  //console.log("Nodes being selected: ", nodes);

  nodes = nodes instanceof d3.selection ? nodes : d3.select(nodes);
  
  if( deselectCurrentSelection ){
    deselectAllObjects();
  }

  if (nodes.classed("node")) {
    var nodeTransform = getNodePosition(nodes);
    quickAddX = nodeTransform.x;
    quickAddY = nodeTransform.y;
  }

  nodes.classed("selected", true);
  nodes.node().focus();
  
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

function deselectAllObjects(){
  //console.log("deselecting all objects");
  var allNodes = d3.selectAll(".selected");
  allNodes.classed("selected", false);
  if(!selection_area){
    d3.select(".selection_area").remove();
  }
}

function drawSelectionArea(canvasPoint){
    var canvasPoint;
    //console.log("canvasPoint", canvasPoint);
    if (!selection_area){
      ////console.log("Creating Selection Area");
      d3.select(".selection_area").remove();
      selection_area = d3.select(canvas).insert("rect", ":first-child")
        .classed("selection_area", true)
        .classed("group", true)
        .attr("x", canvasPoint.x)
        .attr("y", canvasPoint.y)
        .attr("width", 0)
        .attr("height", 0)
      ////console.log("selection is created");
    }
    var rectX = Number(selection_area.attr("x"));
    var rectY = Number(selection_area.attr("y"));
    var width = Number(selection_area.attr("width"));
    var height = Number(selection_area.attr("height"));
    var midX = rectX + width / 2;
    var midY = rectY + height / 2;

    if( canvasPoint.x > midX ){
      selection_area.attr("width", canvasPoint.x - rectX);
    } else{
      selection_area.attr("width", rectX - canvasPoint.x + width);
      selection_area.attr("x", canvasPoint.x);
    }
    if( canvasPoint.y > midY ){
      selection_area.attr("height", canvasPoint.y - rectY);
    } else{
      selection_area.attr("height", rectY - canvasPoint.y + height);
      selection_area.attr("y", canvasPoint.y);
    }
    ////console.log("selection area drawn");
}

function createGroup(){
  ////console.log("creating group");

  var group = selection_area.node();
  //console.log("GROUP: ", group);

  deselectAllObjects();

  var left = Number(selection_area.attr("x"));
  var right = left + Number(selection_area.attr("width"));
  var top = Number(selection_area.attr("y"));
  var bottom = top + Number(selection_area.attr("height"));

  var allNodes = d3.selectAll(".node")
  var children_ids = [];
  ////console.log(grouped_nodes);
  ////console.log("left: ", left, ", right: ", right, ", top: ", top, ", bottom: ", bottom);
  var grouped_nodes = allNodes.filter( function() {
    var position = getNodePosition(this);
    var x = position.x;
    var y = position.y;
    ////console.log("x: ", x, ", y: ", y);
    return x >= left && x <= right && y >= top && y <= bottom;
  });
  ////console.log(grouped_nodes)
  grouped_nodes.each(function(){children_ids.push(d3.select(this).attr("id"))});
  if(grouped_nodes.size() > 0){
    selectNode(grouped_nodes);
  }
  selection_area.attr("children_ids", children_ids.join(" "));

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
   for(var i=0; i < nodeIds.length; i++){111
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