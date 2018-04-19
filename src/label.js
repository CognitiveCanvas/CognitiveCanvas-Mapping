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
  console.log("Scaling Node");
  let nodeRep = node.children[0];

  let labelSize = label.getBoundingClientRect(); 
  console.log(labelSize);
  let labelLeft = cx - labelSize.width / 2;
  let labelTop = cy - labelSize.height / 2;
  label.style.left = labelLeft + "px";
  label.style.top = labelTop + "px";

  if($(node).hasClass("node")){
    if (d3.select(nodeRep).attr("r") <= MAX_RADIUS) {
        d3.select(nodeRep)
          .attr("r", labelSize.width / 2 + 6);
    } 
    else {
      d3.select(label)
        .attr("max", d3.select(nodeRep).attr("r") * 2 - 12);
    }
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
  
  // If a label already exists
  let labelText = checkLabelExisted(node);
  labelText = text ? text : labelText;

  // Adding an editable div outside
  let label = document.createElement("div");
  d3.select(label).classed("label-input", true);
  label.style.position = "absolute";
  label.setAttribute("contenteditable", "true");
  label.setAttribute("id", node.getAttribute('id')+"_text");
  label.setAttribute("node-id", node.getAttribute('id'));
  label.setAttribute("size", labelText.length || 1);
  var textNode = label.appendChild(document.createTextNode(labelText));

  if(placeholderText){
    label.setAttribute("placeholder-text", text);
  }
  temp_label_div = label;

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
        setTimeout(function(){
          scaleNode(label, node, cx, cy)
        },1);
        break;
    }
  }

  container.appendChild(label);

  scaleNode(label, node, cx, cy);

  if(placeholderText){
    selectText(textNode);
    label.focus();
  } else{
    var cursorPosition = label.appendChild(document.createTextNode(""));  
    selectText(cursorPosition);
  }
}

function createLabelFromInput(node, label){
  console.log("creating label from input");
  node = node instanceof d3.selection ? node : d3.select(node);
  label = label instanceof d3.selection ? label : d3.select(label);
  var txt = label.text().split("\n");
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
  var textSVG = node.append("text")
    .attr("text-anchor", "middle")
    .attr("x", cx+"px")
    .attr("y", cy+"px")
    .attr("font-family", "Helvetica")
    .classed("label", true)
    .attr("id", node.attr("id")+"_text")

  for (let t in txt) {
    console.log(t);
    let tspan = textSVG
                  .append("tspan")
                  .text(txt[t])
                  .classed("label-line", true);

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
  var label = d3.select(temp_label_div);
  var inputText = label.text();
  var placeholderText = label.attr("placeholder-text");
  var node = d3.select('#' + label.attr("node-id"));

  if(inputText === placeholderText || inputText.length === 0){
    console.log("Label needs input");
    var nodeRep = node.select(".node-rep");
    label.classed("shaking", false);
    nodeRep.classed("shaking", false);
    setTimeout(function(){ 
      label.classed("shaking", true);
      nodeRep.classed("shaking", true)
    }, 1);
    resetState();
  } else{
    var nodeId = label.attr("node-id");
    createLabelFromInput(node, label);
  }
  return;
}

function selectText(element) {
    var doc = document
        , text = element
        , range, selection
    ;    
    if (doc.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(text);
        range.select();
    } else if (window.getSelection) {
        selection = window.getSelection();        
        range = document.createRange();
        range.selectNodeContents(text);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}