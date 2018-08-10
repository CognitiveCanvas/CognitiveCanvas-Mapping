var undo_redo_buffer = [];
const queue_length = 30;



function action_done (type, data){
	if (undo_redo_buffer.length < queue_length){
		undo_redo_buffer.push({ "type": type, "data":data } );	
	}
	else{
		// Removes the front of the buffer queue
		undo_redo_buffer.shift();
		// Appends to the end of the quque
		undo_redo_buffer.push({type : data});
	}
}

function undo(){
	// Do nothing if the stack is empty
	if (undo_redo_buffer.length == 0)
		return;

	let last_action = undo_redo_buffer.pop();
	undo_action(last_action.type, last_action.data);
	switch (last_action.type){
		case "style": 
			undoStyle(last_action.data);
			break;
		case "deleteNode":
			undoDeleteNode(last_action.data);
			break;
		case "insertNode":
			undoInsertNode(last_action.data);
			break;
		case "dragNode":
		    // TODO: not yet implemented
			undoDragNode();
			break;
		case "addEdge":
			undoAddEdge(last_action.data);
			break;
		case "removeEdge":
			undoRemoveEdge(last_action.data);
			break;
		case "changeLabel":
			undoChangeLabel();
			break;
		default:
			console.log("undefined action type encountered ", last_action.type);
	}
}



function undoStyle(data){
	console.log("undo-ing style");
	switch (data.style_type){
		case "change_color":
			data.nodes.style("fill", ""+data.old_color);
			data.edges.style("stroke", ""+data.old_color);
			break;
		case "change_border_color":
			data.elements.style("stroke", ""+data.old_color);
			break;
		case "label_font_size":
			data.elements.style("font-size", ""+data.old_size);
			break;
		case "label_font_italics":
			data.elements.style("font-style", ""+data.old_style);
			break;
		case "label_font_bold":
			data.elements.style("font-weight", ""+data.old_style);
			break;
		case "label_font_color":
			data.elements.style("fill", ""+data.old_color);
			break;
		case "change_edge_thickness":
			data.elements.style("stroke-width", ""+data.old_size);
	}
}

function removeNodeFromGroup(node){
  	let node_d3 = node instanceof d3.selection ?  node : d3.select(node);
  	let node_id = node_d3.attr("id");
    let groups = getNodeGroups(node);
    for (let i = 0; i<groups.length; i++){
    	let g = groups[i];
    	g.attr("children_ids", g.attr("children_ids").split(' ').filter(id => id !== node_id).join(' ') );
    }
}

function getNodeGroups(node){
	let node_d3 = node instanceof d3.selection ?  node : d3.select(node);
  	let node_id = node_d3.attr("id");
  	groups = [];
  	d3.selectAll(".selection_area[children_ids~=" + node_id + "]")
  		.each(()=>{groups.push(d3.select(this));});
  	return groups;
}

function insertNodeToGroup(node, groups){
	let node_d3 = node instanceof d3.selection ?  node : d3.select(node);
  	let node_id = node_d3.attr("id");
  	for (let i = 0; i<groups.length; i++){
  		let group = groups[i];
  		let curr = group.attr("children_ids") + " " + node_id;
  		group.attr("children_ids", curr);
  	}
}

function undoInsertNode(data){
	console.log("undo-ing node insertion")
	let node = data.node;
  	let node_d3 = node instanceof d3.selection ?  node : d3.select(node);
  	let node_id = node_d3.attr("id");

  	d3.selectAll(`[sourceId=${node_id}]`)
    	.classed("deleted", true);

  	d3.selectAll(`[targetId=${node_id}]`)
    	.classed("deleted", true);

  	removeNodeFromGroup(node);
  	node_d3.classed("deleted", true);
  	wrapInTransient(node_d3.node());
}

function undoDeleteNode(data){
	console.log("undo-ing node deletion")
	let node = data.node;
	let groups = data.groups;
	let node_d3 = node instanceof d3.selection ?  node : d3.select(node);
  	let node_id = node_d3.attr("id");

  	d3.selectAll(`[sourceId=${node_id}]`)
    	.classed("deleted", false);

  	d3.selectAll(`[targetId=${node_id}]`)
    	.classed("deleted", false);

    insertNodeToGroup(node, groups);
  	node_d3.classed("deleted", false);
  	removeFromTransient(node_d3);
}

function undoAddEdge(data){
	console.log("undo-ing edge insertion");
	let id = data.edge.id;
	link = d3.select("#"+id);
  	link.classed("deleted", true);
  	wrapInTransient(link.node());
}

function undoRemoveEdge(data){
	console.log("undo-ing edge removal");
	let id = data.edge.id;
	link = d3.select("#"+id);
  	link.classed("deleted", false);
  	removeFromTransient(link);
}