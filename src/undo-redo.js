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
			undoInsertNode();
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
