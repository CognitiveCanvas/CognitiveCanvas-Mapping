/**
*	Enables/disables all touch interactions from a hammerized element
*	@param enable boolean: true for enabling interactions, false for disabling
*	@param element: the element to toggle; if null, acts on all hammerizable elements
*/
function toggleNonDrawingHammers( enable, elements=null ){
	elements = elements || document.querySelectorAll("#canvas,.node,.link,.group");
	elements = (elements instanceof Element) ? [elements] : elements; 
	elements.forEach((element)=>{
		if(element.hammer) element.hammer.set({'enable': enable});
	});
}

function canHammerize( element ){
	return $(element).is('.canvas,.node,.link,.group');
}

function autoHammerize( element ){
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
	Transformer.hammerize(canvas, {pan: false, callback: canvasTransformerCallback}).then(function(transformer){
		var hammer = canvas.hammer;
		hammer.add( new Hammer.Tap({event: 'doubletap', taps: 2}) );
		hammer.add( new Hammer.Tap({ event: 'singletap' }) );
		hammer.add( new Hammer.Pan({ event: 'pan'}) )

		hammer.get('doubletap').recognizeWith('singletap');
		hammer.get('singletap').requireFailure('doubletap');

		hammer.on('singletap', canvasSingleTapListener);
		hammer.on('doubletap', canvasDoubleTapListener);
		hammer.on("pan panend", canvasPanListener);

		hammer.on("pinch rotate", updateMinimapPosition);

		hammer.on("hammer.input", (event)=>{
			if(temp_label_div) handleClickDuringLabelInput();
		})
	})
}

//Checks to see if the canvas is larger than the viewport.  If not, returns false and stops the transformation
function canvasTransformerCallback( elementMatrix ){
	var transformer = this;
	var element = transformer.element;
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
  //console.log("CANVAS DOUBLE TAP");
  var canvasPoint = eventToCanvasPoint(event);

  var addedNode = addNode();
  var node = drawNode(addedNode, canvasPoint.x, canvasPoint.y, defaultShape, radius, defaultColor);
  hammerizeNode(node).then(
    function(success){
      selectNode(node);
      addLabel("Node Name", node);
      logCreation("double tap", node);
	  let data = { 
        "node"  : node,
        "groups": getNodeGroups(node)
      };
      action_done("insertNode", data);
    }, function(failure){
      console.log(failure);
    });
}

/**
*	Draws a selection area as the user drags accross the canvas
**/
function canvasPanListener(event){
	var canvasMousePoint = eventToCanvasPoint(event);
	drawSelectionArea(canvasMousePoint);
	if( event.type === 'panend'){
		createGroup();
	}
}

function hammerizeNode(node){
	return Transformer.hammerize(node, {pan: false}).then( function(transformer){
		var hammer = node.hammer;
		
		hammer.remove('pan');
		var pan = new Hammer.Pan({event: 'pan'});
		var singleTap = new Hammer.Tap({ event: 'singletap' });
		var prePanTap = new Hammer.Tap({ event: 'prepantap'});
		var tapPan = new Hammer.Pan({event: 'tappan', enable: false });
		var doubleTap = new Hammer.Tap({event: 'doubletap', taps: 2});

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

	translateNode(node, deltaDeltaPoint, true, node.links);

	node.prevPoint.x = deltaPoint.x;
	node.prevPoint.y = deltaPoint.y;

	if(event.type === 'panend'){
		node.links = null;
		node.prevPoint = null;
		logTranslate("pan", node);
	}
}

/**
*	Select the tapped node.  If it was already selected, edit the label
**/
function nodeSingleTapListener(event){
	var node = getParentMapElement(event.target);

	if( $(node).hasClass("selected") ){
		addLabel(null, node);
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
			var link = selectLineDest(linkDest);
			addLabel("Link Name", link);
			selectNode(link);
			hammerizeLink(link);
			let data = { 
        		"edge"  : link
      		};
    		action_done("addEdge", data);
		} else{
			hideDragLine();
			resetState();
		}
	}
}


function nodeDoubleTapListener(event){
	console.log("Double Tap on node");
	var node = getParentMapElement(event.target);
	selectNode( node );
	addLabel(null, node);
}

function hammerizeLink(link){
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
	console.log("LINK SINGLE TAP");
	var link = getParentMapElement(event.target);

	if( $(link).hasClass("selected") ){
		addLabel(null, link);
	}else{
		selectNode( link );
		sendSearchMsgToContainer();
	}
}

//Edits the link's label
function linkDoubleTapListener(event){
	console.log("LINK DOUBLE TAP");
	var link = getParentMapElement(event.target);
	selectNode(link);
	addLabel(null, link);
}

function hammerizeGroup(group){
	return Transformer.hammerize(group, {pan:false}).then((transformer)=>{
		var hammer = group.hammer;

		hammer.remove(hammer.get('pan'));

		var pan = new Hammer.Pan({event: 'pan'});
		var doubleTap = new Hammer.Tap( {event: 'doubletap', taps : 2});
		hammer.add([doubleTap, pan]);

		hammer.on('doubletap', groupDoubleTapListener);
		hammer.on('pan panstart panend', groupPanListener);
	});
}

function groupPanListener(event){
	var group = getParentMapElement(event.target);

	if(event.type === 'panstart'){
		group.nodes = getGroupedNodes(group);
		group.prevPoint = new Point(0, 0);
		translateSavePrevPosition(group);
	}

	var deltaPoint = group.transformer.fromGlobalToLocalDelta(new Point(event.deltaX, event.deltaY));
	var deltaDeltaPoint = new Point(deltaPoint.x - group.prevPoint.x, deltaPoint.y - group.prevPoint.y)

	moveGroup(group, deltaDeltaPoint);

	group.prevPoint.x = deltaPoint.x;
	group.prevPoint.y = deltaPoint.y;

	if(event.type === 'panend'){
		group.nodes = null;
		group.prevPoint = null;
	}
}

function groupDoubleTapListener(event){
  var canvasPoint = eventToCanvasPoint(event);
  var group = getParentMapElement(event.target);

  var addedNode = addNode();
  var node = drawNode(addedNode, canvasPoint.x, canvasPoint.y, defaultShape, radius, defaultColor);
  hammerizeNode(node).then(
    function(success){
      if($(group).hasClass('map-image')) $(node).addClass("pin");
      addNodeToGroup(node, group)
      selectNode(node, false);
      addLabel("Node Name", node);
    }, function(failure){
      console.log(failure);
    });	
}

function hammerizeMinimap(){
	var minimap = document.getElementById("minimap");
	var minimapPlacer = document.getElementById("minimap-placer");
	//Transformer.hammerize( minimap, {pan: false, rotate: false, pinch: false} );
	return Transformer.hammerize( minimap, { pan: false, rotate: false, pinch: false, callback: minimapTransformerCallback}).then( (Transformer) =>{
		var hammer = minimap.hammer;

		hammer.remove(hammer.get('pan'));

		var pan = new Hammer.Pan({event: 'pan', threshold: "1"});
		hammer.add([pan]);

		hammer.on("panstart panend panmove pancancel", minimapPanListener);

	});
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

	if( event.type == "panstart" || !placer.prevPoint ) placer.prevPoint = new Point(0, 0);

	var deltaPoint = minimap.transformer.fromGlobalToLocalDelta(new Point(event.deltaX, event.deltaY));

	var newPos = {
		left: (deltaPoint.x - placer.prevPoint.x + placerBBox.left - minimapBBox.left) / minimapBBox.width * 100,
	 	top:  (deltaPoint.y - placer.prevPoint.y + placerBBox.top - minimapBBox.top) / minimapBBox.height * 100 
	}

	console.log("NEWPOS:", newPos, ", PREVPOINT:", placer.prevPoint, ", DELTAPOINT:", deltaPoint, ", CENTER:", new Point(event.center.x,event.center.y), ", MINIMAP:", minimapBBox, ", PLACER:", placerBBox);

	placer.style.left = newPos.left + "%";
	placer.style.top = newPos.top + "%";

	placer.prevPoint.x = deltaPoint.x;
	placer.prevPoint.y = deltaPoint.y;

	if( event.type == "panend" || event.type == "pancancel") placer.prevPoint = null;

	updateMapPositionFromMinimap();
};