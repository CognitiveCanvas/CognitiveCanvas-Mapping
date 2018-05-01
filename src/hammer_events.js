function toggleNonDrawingHammers( enable ){
	document.querySelectorAll("#canvas,.node,.link,.group").forEach((element)=>{
		element.hammer.set({'enable': enable})
	});
}

function hammerizeCanvas(){
	Transformer.hammerize(canvas, {pan: false, callback: isContainingParent}).then(function(transformer){
		var hammer = canvas.hammer;
		hammer.add( new Hammer.Tap({event: 'doubletap', taps: 2}) );
		hammer.add( new Hammer.Tap({ event: 'singletap' }) );
		hammer.add( new Hammer.Pan({ event: 'pan'}) )

		hammer.get('doubletap').recognizeWith('singletap');
		hammer.get('singletap').requireFailure('doubletap');

		hammer.on('singletap', canvasSingleTapListener);
		hammer.on('doubletap', canvasDoubleTapListener);
		hammer.on("pan panend", canvasPanListener);
	})
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
	
		var doubleTap = new Hammer.Tap({event: 'doubletap', taps: 2});
		var singleTap = new Hammer.Tap({ event: 'singletap' })

		var prePanTap = new Hammer.Tap({event: 'prepantap'})
		var doubleTapPan = new Hammer.Pan({event: 'doubletappan'});

		hammer.add([doubleTap, singleTap, prePanTap, pan, doubleTapPan]);

		doubleTap.recognizeWith([singleTap, pan]);

		doubleTapPan.requireFailure([doubleTap, pan]);

		singleTap.requireFailure([doubleTap]);
		prePanTap.recognizeWith([singleTap]);

		//Disables moving the node after the first tap so a link can be made
		hammer.on('prepantap', (event) => {
			console.log("PREPANTAP");
			pan.set({enable : false});
		});
		hammer.on('doubletappanend', (event) =>{
			pan.set({enable : true});
		});

		hammer.on('pan panstart panend', nodePanListener);
		hammer.on('singletap', nodeSingleTapListener);
		hammer.on('doubletap', nodeDoubleTapListener)
		hammer.on('doubletappan doubletappanstart doubletappanend', nodeDoubleTapPanListener)
	});
}

function nodePanListener(event){
	var node = getParentMapElement(event.target);

	if(event.type === 'panstart'){
		selectNode(node);
		node.links = findConnectedLinks(node);
		node.prevPoint = new Point(0, 0);
	}

	var deltaPoint = node.transformer.fromGlobalToLocalDelta(new Point(event.deltaX, event.deltaY));
	var deltaDeltaPoint = new Point(deltaPoint.x - node.prevPoint.x, deltaPoint.y - node.prevPoint.y)

	translateNode(node, deltaDeltaPoint, true, node.links);

	node.prevPoint.x = deltaPoint.x;
	node.prevPoint.y = deltaPoint.y;

	if(event.type === 'panend'){
		node.links = null;
		node.prevPoint = null;
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
	}
}

function nodeDoubleTapListener(event){
	console.log("Double Tap on node");
	var node = getParentMapElement(event.target);
	selectNode( node );
	addLabel(null, node);
}

/**
*	Create a link starting from the target node
**/
function nodeDoubleTapPanListener(event){
	var node = getParentMapElement(event.target);
	var canvasPoint = eventToCanvasPoint(event);

	if( event.type === 'doubletappanstart' ) {
		selectNode(node);
		selectSrcNode(node)
	};
	
	drawDragLine(canvasPoint);

	if( event.type === 'doubletappanend' ){ 
		var linkDest = document.elementFromPoint(event.center.x, event.center.y);
		linkDest = getParentMapElement(linkDest);
		if( $(linkDest).hasClass("node") && $(node).attr('id') != $(linkDest).attr('id') ){
			var link = selectLineDest(linkDest);
			addLabel("Link Name", link);
			selectNode(link);
			hammerizeLink(link);
		} else{
			hideDragLine();
			resetState();
		}
	}
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