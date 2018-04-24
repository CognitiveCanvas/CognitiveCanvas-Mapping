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
			undoDragNode();
			break;
		case "addEdge":
			undoAddEdge();
			break;
		case "removeEdge":
			undoRemoveEdge();
			break;
		case "changeLabel":
			undoChangeLabel();
			break;
		default:
			console.log("undefined action type encountered");
	}
}



function undoStyle(data){
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
			data.elements.style("fill", ""+data.old_color)
	}
}

function undoInsertNode(data){
	let node = data.node;
	
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

  	closePreviewIframe("node");
  	deleteEntity(nodes, node_id); 

  	node_d3.classed("deleted", true);
}

