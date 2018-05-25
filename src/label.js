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
function scaleNode(label, node) {
  label = $(label);
  node = $(node);
  let nodeRep = node.find(".node-rep");

  let newLabelWidth = (label.val().length || label.attr("placeholder").length) + LABEL_INPUT_PADDING;
  label.attr("size", newLabelWidth);

  let labelBB = label[0].getBoundingClientRect(); 
  let nodeBB = node[0].getBoundingClientRect();
  nodeBB.center = { x: nodeBB.left + nodeBB.width/2,
                    y: nodeBB.top + nodeBB.height/2 };

  let labelLeft = nodeBB.center.x - labelBB.width / 2;
  let labelTop = nodeBB.center.y - labelBB.height / 2;
  label.css("left", labelLeft + "px");
  label.css("top", labelTop + "px");

  if(node.hasClass("node")){
    let newRadius = Math.min(labelBB.width/2 + 6 , MAX_RADIUS);
    console.log("New Radius: ", newRadius);
    nodeRep.attr("r", newRadius);
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
  setPrevLabel(labelText);
  // Adding an editable div outside
  let label = document.createElement("input");
  d3.select(label).classed("label-input", true);
  label.style.position = "absolute";
  label.setAttribute("id", node.getAttribute('id')+"_text");
  label.setAttribute("node-id", node.getAttribute('id'));
  label.setAttribute("size", labelText.length || 1);

  if(placeholderText){
    label.setAttribute("placeholder", text);
  } else{
    label.value = labelText;
  }
  temp_label_div = label;

  let cx = 0, cy = 0, x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  let name = d3.select(node).attr("class").split(" ")[0];

  switch(name){
    case "node":
      translation = getNodePosition(node);
      cx = translation.x
      cy = translation.y
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

  var screenPos = canvas.transformer.fromLocalToGlobal(new Transformer.Point(cx,cy));

  label.style.left = screenPos.x + "px";
  label.style.top = screenPos.y + "px";
  

  label.onkeydown = (e) => {
    //console.log(e.key)
    let labelInteraction = e.key;
    switch(e.key){
      case "Enter":
        if (e.shiftKey) {
          document.execCommand('insertHTML', false, '<br>');
          break;
        }
      case "Tab":
        e.preventDefault();
        e.stopImmediatePropagation();
        handleClickDuringLabelInput();
        //logLabel(labelInteraction, node); // Logging for the data team
        break;
      default:
    }
    label.oninput = (e) => {
      scaleNode(label, node);
    }

  }

  var transientEle = document.createElement("transient");
  transientEle.appendChild(label);
  container.appendChild(transientEle);

  toggleListenersForLabelInput(true); //Disable interactions during edit

  scaleNode(label, node, screenPos.x, screenPos.y);

  label.focus();

}

function createLabelFromInput(node, label){
  console.log("creating label from input");
  node = node instanceof d3.selection ? node : d3.select(node);
  label = label instanceof d3.selection ? label : d3.select(label);
  var txt = label.node().value;
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

  var textLines = txt.split('\n').filter((val)=>val);
  for (let t in textLines ) {
    console.log(textLines[t]);
    let tspan = textSVG
                  .append("tspan")
                  .text(textLines[t])
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
  toggleListenersForLabelInput(false);
  sendSearchMsgToContainer();
  return;
}

/* Blocks the user from interacting with other elements while a node is being edited
 *
 */
function toggleListenersForLabelInput( isInputtingLabel ){
  console.log("Toggling listeners for label input to: ", isInputtingLabel);
  toggleNonDrawingHammers( !isInputtingLabel )
  canvas.hammer.get( 'labelinputtap' ).set({ 'enable' : isInputtingLabel })
}

function handleClickDuringLabelInput(){
  console.log("Handling click during label input");
  
  if (!temp_label_div.nErrors) temp_label_div.nErrors = 0;

  var errorMessages = [
    "Enter Name",
    "Name me please",
    "I need a label",
    "Seriously, name me",
    "Listen asshole",
    "neither of us is going anywhere until I have a name",
    "Mary Boyle is very disappointed in you",
    "...",
    "I don't get paid enough for this",
    "Just press enter..."
  ];

  var label = temp_label_div;
  var inputText = label.value;
  var placeholderText = label.getAttribute("placeholder");
  var node = document.querySelector('#' + label.getAttribute("node-id"));

  if( inputText.length === 0 ){
    console.log("Label needs input");
    label.nErrors = Math.min( label.nErrors + 1, errorMessages.length - 1 );

    var errorMessage = errorMessages[label.nErrors];

    label.setAttribute("placeholder", errorMessage);
    label.setAttribute("size", errorMessage.length);

    scaleNode( label, node );

    var labelSel = $(label);

    labelSel.toggleClass("shaking", false);
    setTimeout(function(){ 
      labelSel.toggleClass("shaking", true);
      setTimeout(function(){
        labelSel.toggleClass("shaking", false);
      }, 1000);
    }, 1);

    resetState();
    label.focus();
  } else{
    createLabelFromInput(node, label);   
  }
  return;
}