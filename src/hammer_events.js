import {roundToPlace, resetState} from './main.js';
import {updateMinimapPosition, updateMapPositionFromMinimap} from './minimap.js';
import {isContainingParent, eventToCanvasPoint} from './transformer_extensions.js';
import {createNode, getParentMapElement, getNodePosition, translateNode} from './nodes.js';
import {findConnectedLinks, updateLinkPositions, selectSrcNode, drawDragLine, hideDragLine, createLink} from './links.js';
import {handleClickDuringLabelInput, getNodeLabel} from './label.js';
import {deselectAllObjects, selectNode} from './selections.js';
import {objFromTemplate} from './data_interpreter.js';
import {sendSearchMsgToContainer} from './request_handler.js';
import {logCreation, logTranslate, translateSavePrevPosition} from './logger.js';
import {action_done} from './undo.js';

export function initTransformer() {
  return new Promise( (resolve, reject)=>{
    window.Matrix = Transformer.Matrix; //Give Global access to Matrix
    window.Point = Transformer.Point;

    canvas.addEventListener("wheel", updateMinimapPosition, {capture: true, passive: false}) //So it fires before Hammerize's mouse scroll event stops propagation

    hammerizeCanvas().then( ()=>{

      let promises = [];

      document.querySelectorAll(".link,.node,.group").forEach( (element) => {
        promises.push( new Promise( resolveIter => {
          let prom;
          if( element.classList.contains("node")) prom = hammerizeNode(element);
          else if ( element.classList.contains("link")) prom = hammerizeLink(element);
          else if ( element.classList.contains("group")) prom = hammerizeGroup(element);
          prom.then( ()=> resolveIter() );
        }));
      });

      Promise.all(promises).then( ()=> resolve());
    });
  });
}

/**
*	Enables/disables all touch interactions from a hammerized element
*	@param enable boolean: true for enabling interactions, false for disabling
*	@param element: the element to toggle; if null, acts on all hammerizable elements
*/
export function toggleNonDrawingHammers( enable, elements=null ){
	//console.log("Toggling all non-drawing hammers to: ", enable, " for ", elements);
	elements = elements || document.querySelectorAll("#canvas,.node,.link,.group");
	elements = (elements instanceof Element) ? [elements] : elements; 
	elements.forEach((element)=>{
		if(element.hammer){ 
			element.hammer.recognizers.forEach( (recognizer) =>{
				if( recognizer.options.event === 'tappan' ){
					recognizer.set({ 'enable' : false });
				} else{
					recognizer.set({'enable': enable});
				}
			});
		}
	});
}

export function canHammerize( element ){
	return $(element).is('.canvas,.node,.link,.group');
}

export function autoHammerize( element ){
	var ele = $(element);

	if( ele.hasClass("canvas") ) hammerizeCanvas();
	else if( ele.hasClass("node") ) hammerizeNode(element);
	else if( ele.hasClass("link") ) hammerizeLink(element);
	else if( ele.hasClass("group") ) hammerizeGroup(element);
	else{
		console.log("Could not autoHammerize ", element);
	}
}

function hammerizeCanvas(){
	return Transformer.hammerize(canvas, {pan: true, rotate: false, callback: canvasTransformerCallback}).then(function(transformer){
		var hammer = canvas.hammer;
		hammer.add( new Hammer.Tap({event: 'doubletap', taps: 2, posThreshold: 30, threshold: 5, interval: 300}) );
		hammer.add( new Hammer.Tap({ event: 'singletap' }) );
		hammer.add( new Hammer.Pan({ event: 'singlefingerpan', pointers: 1}) )

		//Fires when the user taps on the canvas while inputing a label
		hammer.add( new Hammer.Tap({ event: 'labelinputtap', enable: false }) );
		
		hammer.get('pan').set({pointers: 2}); //Sets normal canvas pan to need two fingers on touch devices

		hammer.get('doubletap').recognizeWith('singletap');

		hammer.on('singletap', canvasSingleTapListener);
		hammer.on('doubletap', canvasDoubleTapListener);
		hammer.on("singlefingerpan singlefingerpanend", canvasPanListener);

		hammer.on("pinch rotate", updateMinimapPosition);

		hammer.on("labelinputtap", handleClickDuringLabelInput);
	})
}

//Checks to see if the canvas is larger than the viewport.  If not, returns false and stops the transformation
function canvasTransformerCallback( elementMatrix ){
	var transformer = this;
	var element = transformer.element;

	if (element.hammer){
		if( element.hammer.get( 'labelinputtap' ).options.enable ) return false;
	}

	return isContainingParent( element, elementMatrix, true);
}

/**
*	 Deselects all objects
**/
function canvasSingleTapListener(event){
	//console.log("CANVAS SINGLE TAP");
	deselectAllObjects();
}

/**
*	Adds a node at the clicked location, selects it, and makes the user enter a label for it
**/
function canvasDoubleTapListener(event){
  var canvasPoint = eventToCanvasPoint(event);
  let node = createNode( objFromTemplate("mapping", "node", {position: canvasPoint}) ).then( (node)=>{
  	logCreation("double tap", node);
  })
}

/**
*	Draws a selection area as the user drags accross the canvas
**/
function canvasPanListener(event){
	var canvasMousePoint = eventToCanvasPoint(event);
	drawSelectionArea(canvasMousePoint);
	if( event.type === 'singlefingerpanend'){
		createGroup();
	}
}

export function hammerizeNode(node){
	return Transformer.hammerize(node, {pan: false, callback: nodeTransformerCallback}).then( function(transformer){
		var hammer = node.hammer;
		
		hammer.remove('pan');
		var pan = new Hammer.Pan({event: 'pan'});
		var singleTap = new Hammer.Tap({ event: 'singletap' });
		var prePanTap = new Hammer.Tap({ event: 'prepantap'});
		var tapPan = new Hammer.Pan({event: 'tappan', enable: false });
		var doubleTap = new Hammer.Tap({event: 'doubletap', taps: 2,});

		hammer.add([doubleTap, tapPan, singleTap, prePanTap, pan]);

		doubleTap.recognizeWith([tapPan, singleTap, pan]);

		tapPan.requireFailure([doubleTap]);
		tapPan.recognizeWith([singleTap, pan]);

		singleTap.requireFailure([doubleTap, tapPan]);
		singleTap.recognizeWith([pan]);

		prePanTap.recognizeWith([singleTap]);

		pan.requireFailure([singleTap, tapPan, doubleTap]);

		hammer.on('pan panstart panend', nodePanListener);
		hammer.on('singletap', nodeSingleTapListener);
		hammer.on('tappan tappanstart tappanend', nodeTapPanListener);
		hammer.on('doubletap', nodeDoubleTapListener);

		//Disables moving the node after the first tap so a link can be made
		hammer.on('prepantap', (event) => {
			tapPan.set({enable : true});
		});
		hammer.on('singletap doubletap tappanend', (event) =>{
			if( event.isFinal ){
				tapPan.set({enable : false});
			}
		})
	});
}

/**
 * When a node is transformed, checks if the scale has changed.  if so, update
 * the link endpoints to match the border of the transformed node.
 * @param  {Matrix} newMatrix Transformer passes the matrix that will be
 *                            the new transformation on the element.
 * @return {Boolean}          Returns true to confirm transformation
 */
function nodeTransformerCallback(newMatrix){
	let transformer = this;
	let oldMatrix = transformer.getTransformMatrix();
	if(newMatrix.scaleX !== oldMatrix.scaleX || 
	   newMatrix.scaleY !== oldMatrix.scaleY){
	   	let node = transformer.element;
	   	let links = findConnectedLinks(node);
		updateLinkPositions(links);
	}
	return true;
}

function nodePanListener(event){
	var node = getParentMapElement(event.target);

	if(event.type === 'panstart'){
		selectNode(node);
		node.links = findConnectedLinks(node);
		node.prevPoint = new Point(0, 0);
		translateSavePrevPosition(node);
	}

	var deltaPoint = node.transformer.fromGlobalToLocalDelta(new Point(event.deltaX, event.deltaY));
	var deltaDeltaPoint = new Point(deltaPoint.x - node.prevPoint.x, deltaPoint.y - node.prevPoint.y)

	//Make sure a node isn't being moved outside its group
	if(node.hasAttribute("groupId")){
		let groupBB = document.getElementById( node.getAttribute("groupId") ).getBoundingClientRect();
		let nodeBB = node.getBoundingClientRect();
		let newBB = {};
		newBB.left = nodeBB.left + deltaDeltaPoint.x;
		newBB.right = nodeBB.right + deltaDeltaPoint.x;
		newBB.top = nodeBB.top + deltaDeltaPoint.y;
		newBB.bottom = nodeBB.bottom + deltaDeltaPoint.y;

		if (newBB.left < groupBB.left || newBB.right > groupBB.right){
			deltaDeltaPoint.x = 0;
		}
		if (newBB.top < groupBB.top || newBB.bottom > groupBB.bottom){
			deltaDeltaPoint.y = 0;
		}
	}

	translateNode(node, deltaDeltaPoint, true, node.links);

	node.prevPoint.x = deltaPoint.x;
	node.prevPoint.y = deltaPoint.y;

	if(event.type === 'panend'){
		node.links = null;
		node.prevPoint = null;
    
    action_done("dragNode", {id: node.getAttribute("id"),     
                             old_position: prev_position[node.getAttribute("id")],
                             new_position: getNodePosition(node)});
		logTranslate("pan", node);

	}
}

/**
*	Select the tapped node.  If it was already selected, edit the label
**/
function nodeSingleTapListener(event){
	var node = getParentMapElement(event.target);

	if(event.srcEvent.shiftKey){
		toggleSelection(node);
	} else if( node.classList.contains("selected") ){
		let labelText = getNodeLabel(node); 
		if( labelText ){ //Open a label edit div, insert the current name, and select it
			addLabel(labelText, node, true, true, true);
		} else{
			addLabel("Node Name", node);
		}
	}else{
		selectNode( node );
    	sendSearchMsgToContainer();
	}
}

/**
*	Create a link starting from the target node
**/
function nodeTapPanListener(event){
	var node = getParentMapElement(event.target);
	var canvasPoint = eventToCanvasPoint(event);

	if( event.type === 'tappanstart' ) {
		selectNode(node);
		selectSrcNode(node)
	};
	
	drawDragLine(canvasPoint);

	if( event.type === 'tappanend' ){ 
		var linkDest = document.elementFromPoint(event.center.x, event.center.y);
		linkDest = getParentMapElement(linkDest);
		if( $(linkDest).hasClass("node") && $(node).attr('id') != $(linkDest).attr('id') ){
			
			var linkObj = objFromTemplate("mapping", "link", {"source_id": source_node.id, "target_id": linkDest.id})
			createLink(linkObj).then( (link)=>{
				action_done("addEdge", {"edge":link});
				hideDragLine();
				resetState();
			});

			/**
			var link = selectLineDest(linkDest);
			addLabel("Link Name", link);
			selectNode(link);
			hammerizeLink(link);
			let data = { 
        		"edge"  : link
      		};
    		action_done("addEdge", data);
    		resetState();
    		**/
		} else{
			hideDragLine();
			resetState();
		}
	}
}


function nodeDoubleTapListener(event){
	//console.log("Double Tap on node");
	var node = getParentMapElement(event.target);
	selectNode( node );
	addLabel(getNodeLabel(node), node, true, true, true);
}

export function hammerizeLink(link){
	return Transformer.hammerize(link, {pan: false, pinch: false, rotate: false}).then(function (transformer){
		
		var hammer = link.hammer;

		var singleTap = new Hammer.Tap( {event: 'singletap'} );
		var doubleTap = new Hammer.Tap( {event: 'doubletap', taps: 2} );
		
		hammer.add([doubleTap, singleTap]);

		doubleTap.recognizeWith(singleTap);
		singleTap.requireFailure(doubleTap);
		
		hammer.on('singletap', linkSingleTapListener);
		hammer.on('doubletap', linkDoubleTapListener);
	});
}

//Selects the link or edits its label if already selected
function linkSingleTapListener(event){
	//console.log("LINK SINGLE TAP");
	var link = getParentMapElement(event.target);

	if( $(link).hasClass("selected") ){
		addLabel(null, link, true, true, true);
	}else{
		selectNode( link );
		sendSearchMsgToContainer();
	}
}

//Edits the link's label
function linkDoubleTapListener(event){
	//console.log("LINK DOUBLE TAP");
	var link = getParentMapElement(event.target);
	selectNode(link);
	addLabel(null, link);
}

function hammerizeGroup(group){
	return Transformer.hammerize(group, {pan:false}).then((transformer)=>{
		var hammer = group.hammer;

		hammer.remove(hammer.get('pan'));

		var pan = new Hammer.Pan({event: 'pan'});
		var singleTap = new Hammer.Tap( {event: 'singletap', taps: 1});
		var doubleTap = new Hammer.Tap( {event: 'doubletap', taps : 2});

		doubleTap.recognizeWith(singleTap);

		hammer.add([doubleTap, singleTap, pan]);

		hammer.on('doubletap', groupDoubleTapListener);
		hammer.on('singletap', groupSingleTapListener);
		hammer.on('pan panstart panend', groupPanListener);
	});
}

/**
 * Handles the pan hammer event for groups.
 * @param  {event} event a hammer PAN type event triggered by a group element
 */
function groupPanListener(event){
	var group = getParentMapElement(event.target);

	if(event.type === 'panstart'){
		group.nodes = getGroupedNodes(group);
		group.prevDeltaPoint = new Point(0, 0);
		translateSavePrevPosition(group);
	}

	var deltaPoint = new Point(event.deltaX, event.deltaY);
	var deltaDeltaPoint = new Point(deltaPoint.x - group.prevDeltaPoint.x, deltaPoint.y - group.prevDeltaPoint.y)

	//IMPORTANT NOTE: this handler sends a vector in global space to moveGroup so it can translate it
	//into local coordinates for the group and any nodes it contains
	moveGroup(group, deltaDeltaPoint);

	group.prevDeltaPoint.x = deltaPoint.x;
	group.prevDeltaPoint.y = deltaPoint.y;

	if(event.type === 'panend'){
		group.nodes = null;
		group.prevPoint = null;
	}
}

function groupSingleTapListener(event){
	if(isPinning){
		groupDoubleTapListener(event);
	}
}

function groupDoubleTapListener(event){
  var canvasPoint = eventToCanvasPoint(event);
  var group = getParentMapElement(event.target);
  var nodeInfo = {
  	'position': canvasPoint, 
  	'groupId': group.id, 
  	'type': group.classList.contains('map-image') ? "pin" : "node"
  };
  let node = createNode(nodeInfo).then( (node)=>{
  	addNodeToGroup(node, group)
  });

  return node;
}

export function hammerizeMinimap(){
	var minimap = document.getElementById("minimap");
	var minimapPlacer = document.getElementById("minimap-placer");
	//Transformer.hammerize( minimap, {pan: false, rotate: false, pinch: false} );
	let hammer = new Hammer.Manager(minimap, {recognizers: [ [Hammer.Pan, {threshold: 1}] ]})
	minimap.hammer = hammer;

	hammer.on("panstart panend pan", minimapPanListener);

}

//Checks that the minimap place indicator is within the minimap.  If not, it cancels the transform
function minimapTransformerCallback( elementMatrix ){
	var transformer = this;
	var element = transformer.element;
	return isContainingParent( element, elementMatrix, false);
}

function minimapPanListener( event ){

	//console.log("CHANGEDPOINTERS", event.changedPointers);

	var minimap = document.getElementById("minimap")
	var minimapBBox = minimap.getBoundingClientRect();
	var placer = document.getElementById("minimap-placer");
	var placerBBox = placer.getBoundingClientRect();

	if( event.type == "panstart" || !placer.startPoint ) placer.startPoint = new Point(placerBBox.left, placerBBox.top);

	//var deltaPoint = minimap.transformer.fromGlobalToLocalDelta(new Point(event.deltaX, event.deltaY));

	var newPos = {
		left: (event.deltaX + placer.startPoint.x - minimapBBox.left) / minimapBBox.width * 100,
	 	top:  (event.deltaY + placer.startPoint.y - minimapBBox.top) / minimapBBox.height * 100 
	}

	//console.log("NEWPOS:", newPos, "startPoint:", placer.startPoint, ", deltaX:", event.deltaX, ", deltaY:", event.deltaY);

	placer.style.left = roundToPlace(newPos.left, 2) + "%";
	placer.style.top = roundToPlace(newPos.top, 2) + "%";

	updateMapPositionFromMinimap();

	if( event.type == "panend") placer.startPoint = null;
};