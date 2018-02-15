var temp_label_div = null;

/**
 * Check whether label existed for the selected entity
 * Return its text if existed and remove current SVG text
 *
 * @arguments: node, entity to check
 * @return {String} [Text in existed label]
 */
function checkLabelExisted(node) {
  let text = null;
  let num_labels = d3.select(node)
                     .selectAll(".label")
                     .size();
  console.log("num_labels", num_labels);
  if (num_labels > 0){
    text = d3.select(node)
             .select(".label")
             .text();
    
    d3.select(node)
      .select(".label")
      .remove();
  }

  return text;
}

/**
 * Scale n
 * @param  {[type]} label [description]
 * @param  {[type]} node  [description]
 * @param  {[type]} cx    [description]
 * @param  {[type]} cy    [description]
 * @return {[type]}       [description]
 */
function scaleNode(label, node, cx, cy) {
  let labelSize = document.getElementById(editId).getBoundingClientRect(); 
  let labelLeft = cx - labelSize.width / 2;
  let labelTop = cy - labelSize.height / 2;
  label.style.left = labelLeft + "px";
  label.style.top = labelTop + "px";

  let nodeRep = node.children[0];

  if (d3.select(nodeRep).attr("r") <= MAX_RADIUS) {
    if (labelSize.width > d3.select(nodeRep).attr("r") * 2 - 12) {
      d3.select(nodeRep)
        .attr("r", labelSize.width / 2 + 6);
    }
  } 
  else {
    d3.select(label)
      .attr("max", d3.select(nodeRep).attr("r") * 2 - 12);
  }
}

/*
text: The text to place in the input field when it is opened.  If null, will be the current label of the node
node: The node to add or change the label of
placeholderText: if true, will select all text in the input field to be replaced by user's input.  If false, will put cursor at the end of text
*/
function addLabel(text, node, placeholderText=true){
  console.log("adding labels");

  node = node instanceof d3.selection ? node.node() : node;
  let container = document.getElementById("d3_container");
  let label = document.createElement("div");
  var num_labels = d3.select(node).selectAll(".label").size();
  
  // If a label already exists
  let labelText = checkLabelExisted(node);
  labelText = labelText ? labelText : text;

  // Adding an editable div outside
  d3.select(label).classed("label-input", true);
  label.appendChild(document.createTextNode(labelText));
  label.style.position = "absolute";
  label.setAttribute("z-index", "1");
  label.setAttribute("contenteditable", "true");
  label.setAttribute("id", editId);

  if(placeholderText){
    label.setAttribute("placeholder-text", text);
  }
  label.setAttribute("node-id", node.getAttribute("id"));

  temp_label_div  label;

  let cx = 0, cy = 0, x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  let name = d3.select(node).attr("class").split(" ")[0];

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
  
  label.onkeydown = (e) => {
    //console.log(e.key)
    switch(e.key){
      case "Enter":
        if (e.shiftKey) {
          document.execCommand('insertHTML', false, '<br>');
          break;
        }
      case "Tab":
        e.preventDefault();
        e.stopImmediatePropagation();
        createLabelFromInput(node, label);
        break;
      default:
        if (name === "node") {
          scaleNode(label, node, cx, cy)
        }
      break;
    }
  }

  container.appendChild(label);

  let labelSize = document.getElementById(editId).getBoundingClientRect(); 
  console.log(labelSize);
  let labelLeft = cx - labelSize.width / 2;
  let labelTop = cy - labelSize.height / 2;
  label.style.left = labelLeft + "px";
  label.style.top = labelTop + "px";

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
  var textSVG = d3.select(node).append("text")
    .attr("text-anchor", "middle")
    .attr("x", cx+"px")
    .attr("y", cy+"px")
    .attr("font-family", "Helvetica")
    .classed("label", true)
    .attr("id", d3.select(node).attr("id")+"_text")

  for (let t in txt) {
    console.log(t);
    let tspan = textSVG
                  .append("tspan")
                  .text(txt[t]);

    if (name === "node") {
      tspan.attr("x", 0);
    }
    
    if (t > 0) {
      tspan.attr("dy", 15);
    }
  }

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