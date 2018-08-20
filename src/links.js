var LINK_TEMPLATE = {
  'label': "Link Name",
  'note': false,
  'reps': {
    'mapping':{
      'elements': {
        'link': {
          'sourceId': null,
          'targetId': null,
          'style':{
            'link-rep':{
              'stroke': "gray"
            },
            'label':{
            }
          }
        }
      }
    }
  }
}

/**
 * creates a link element from a JSON object
 * @param  {Object} eleInfo - an unstructured object with attribute names and 
 * values to overwrite the template with.  See LINK_TEMPLATE for attribute names
 * @return {DOMELEMENT} link - the G element representing the link
 */
function createLink(linkObj){
  return new Promise( (resolve, reject) =>{
  	let linkInfo = linkObj.reps.mapping.elements.link;
  	let srcNode = document.getElementById(linkInfo.sourceId);
  	let srcPos = getNodePosition(srcNode);
  	let targetNode = document.getElementById(linkInfo.targetId);
  	let destPos = getNodePosition(targetNode);

  	let link = Snap(0,0).g().attr({
  		'id': generateObjectId(),
  		'class':'link',
  		sourceId : srcNode.id,
  		targetId : targetNode.id,
      note_edited: false
  	}).prependTo(snap);
  	link.line(srcPos.x, srcPos.y, destPos.x, destPos.y).attr({
  		'class': 'link-rep',
  		"xmlns": "http://www.w3.org/2000/svg"
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
function linkToObject(link){
  var linkRep = link.getElementsByClassName("link-rep")[0];
  return {
    'id': link.id,
    'label': getNodeLabel(link),
    'deleted': link.classList[link.classList.length-1] == "deleted",
    'note': link.getAttribute("note_edited"),
    'reps': {
      'mapping':{
        'elements': {
          'link': {
            'sourceId': link.getAttribute("sourceId"),
            'targetId': link.getAttribute("targetId"),
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
    .attr("sourceId", link.sourceId)
    .attr("targetId", link.destId)
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

function findConnectedLinks(node){
  var id = node.getAttribute('id');
  var sourceLinks = document.querySelectorAll(`[sourceId=${id}]`)
  var targetLinks = document.querySelectorAll(`[targetId=${id}]`);
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