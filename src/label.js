var temp_label_div = null;

/*
text: The text to place in the input field when it is opened.  If null, will be the current label of the node
node: The node to add or change the label of
placeholderText: if true, will select all text in the input field to be replaced by user's input.  If false, will put cursor at the end of text
*/
function addLabel(text, node, placeholderText=true){
  node = node instanceof d3.selection ? node.node() : node;
  console.log("adding labels");
  var num_labels = d3.select(node).selectAll(".label").size();
  // If a label already exists
  if (num_labels > 0){
    // Update the text 
    if( !text ){
      text = d3.select(node).select(".label").text();
    }
    // Delete the inside node
    d3.select(node).select(".label").remove();
  }

  // Adding an editable div outside
  var container = document.getElementById("d3_container");
  var label = document.createElement("div");
  d3.select(label).classed("label-input", true);
  var textNode = label.appendChild(document.createElement("input"));
  textNode.value = text;
  if(placeholderText){
    label.setAttribute("placeholder-text", text);
  }
  label.setAttribute("node-id", node.getAttribute("id"));
  temp_label_div = label;

  var cx = 0;
  var cy = 0;
  var x1 = 0;
  var x2 = 0;
  var y1 = 0;
  var y2 = 0;
  var name = d3.select(node).attr("class").split(" ")[0];

  switch(name){
    case "node":
      translation = getNodePosition(node);
      cx = translation[0];
      cy = translation[1];
      break;

    case "link":
      let line = d3.select(node).select(".link-rep");
      x1 = line.attr("x1");
      x2 = line.attr("x2");
      y1 = line.attr("y1");
      y2 = line.attr("y2");
      cx = parseFloat(parseFloat(parseFloat(x1) + parseFloat(x2)) / 2.0);
      cy = parseFloat(parseFloat(parseFloat(y1) + parseFloat(y2)) / 2.0);
      break;

    default:
      break;
  }
  label.style.left = cx + "px";
  label.style.top = cy + "px";
  
  label.onkeypress = (e) => {
    //console.log(e.key)
    e.stopImmediatePropagation();
    switch(e.key){
      case "Enter":
      case "Tab":
        createLabelFromInput(node, label);
        break;
      default:
    }
  }

  container.appendChild(label);
  textNode.focus();
  if(placeholderText){
    textNode.select();
  }
}

function createLabelFromInput(node, label){
  console.log("creating label from input");
  node = node instanceof d3.selection ? node : d3.select(node);
  label = label instanceof d3.selection ? label : d3.select(label);
  var txt = label.select("input").node().value;
  cx = 0;
  cy = 0;
  switch(node.attr("class").split(" ")[0]){
    case "node":
      break; 
    case "link":
      let line = node.select(".link-rep");
      x1 = line.attr("x1");
      x2 = line.attr("x2");
      y1 = line.attr("y1");
      y2 = line.attr("y2");
      cx = (parseFloat(x1) + parseFloat(x2)) / 2.0 ;
      cy = (parseFloat(y1) + parseFloat(y2)) / 2.0 ;
      break;
    default:
      break;
  }
  // Add the text inside svg with the new text
  node.append("text")
    .attr("x", cx+"px")
    .attr("y", cy+"px")
    .text(txt)
    .classed("label", true)
    .attr("id", node.attr("id")+"_text");
  // Remove the outside editable div
  label.remove();
  temp_label_div = null;
  return;
}

function handleClickDuringLabelInput(){
  console.log("Handling click during label input");
  var inputText = d3.select(temp_label_div).select("input").node().value;
  var placeholderText = d3.select(temp_label_div).attr("placeholder-text");
  if(inputText === placeholderText){
    console.log("Label needs input");
    d3.select(temp_label_div).classed("shaking", false);
    setTimeout(function(){ d3.select(temp_label_div).classed("shaking", true)}, 1);
    resetState();
  } else{
    var nodeId = temp_label_div.getAttribute("node-id");
    var node = d3.select("#" + nodeId).node();
    createLabelFromInput(node, temp_label_div);
  }
  return;
}