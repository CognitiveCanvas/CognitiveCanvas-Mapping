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
  let nodeRep = node.children[0];

  let labelSize = label.getBoundingClientRect(); 
  let nodeBB = node.getBoundingClientRect();
  nodeBB.center = { x: nodeBB.left + nodeBB.width/2,
                    y: nodeBB.top + nodeBB.height/2 };

  let labelLeft = nodeBB.center.x - labelSize.width / 2;
  let labelTop = nodeBB.center.y - labelSize.height / 2;
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
  setPrevLabel(labelText);
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
        createLabelFromInput(node, label);
        logLabel(labelInteraction, node); // Logging for the data team
        break;
      default:
        setTimeout(function(){
          scaleNode(label, node)
        },1);
        break;
    }
  }

  var transientEle = document.createElement("transient");
  transientEle.appendChild(label);
  container.appendChild(transientEle);

  toggleListenersForLabelInput(true); //Disable interactions during edit

  scaleNode(label, node, screenPos.x, screenPos.y);

  if(placeholderText){
    selectText(label);
    label.focus();
  } else{
    var cursorPosition = label.appendChild(document.createTextNode(" "));  
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

  var label = d3.select(temp_label_div);
  var inputText = label.text();
  var placeholderText = label.attr("placeholder-text");
  var node = d3.select('#' + label.attr("node-id"));

  if(inputText === placeholderText || inputText.length === 0 || inputText === errorMessages[temp_label_div.nErrors] ){
    temp_label_div.nErrors = Math.min( temp_label_div.nErrors + 1, errorMessages.length - 1 );

    label.text( errorMessages[ Math.min( temp_label_div.nErrors, errorMessages.length - 1  )] );
    scaleNode( label.node(), node.node() );
    selectText( label.node() );
    label.node().focus();

    console.log("Label needs input");
    var nodeRep = node.select(".node-rep");
    label.classed("shaking", false);
    nodeRep.classed("shaking", false);
    setTimeout(function(){ 
      label.classed("shaking", true);
      nodeRep.classed("shaking", true);
    }, 1);

    resetState();
  } else{
    var nodeId = label.attr("node-id");
    createLabelFromInput(node, label);
    logLabel("Single Tap", node[0][0]); // Logging for the data team     
  }
  return;
}

function selectText (elem) {
  var range, selection;
  // A jQuery selector should pass through too
  elem = (elem.jquery && elem.length) ? elem[0] : elem;
  if ( !elem ) {
    return;
  } else if ( elem.nodeName.match(/^(INPUT|TEXTAREA)$/i) ) {
    elem.focus();
    elem.select();
  } else if ( typeof document.body.createTextRange === "function" ) {
    // IE or Opera <10.5
    range = document.body.createTextRange();
    range.moveToElementText(elem);
    range.select();
  } else if ( typeof window.getSelection === "function" ) {
    selection = window.getSelection();
    if ( typeof selection.setBaseAndExtent === "function" ) {
      // Safari
      selection.setBaseAndExtent(elem, 0, elem, 1);
    } else if ( typeof selection.addRange === "function"
      && typeof selection.removeAllRanges === "function"
      && typeof document.createRange === "function" ) {
      // Mozilla or Opera 10.5+
      range = document.createRange();
      range.selectNodeContents(elem);
      selection.removeAllRanges();
      selection.addRange(range);  
    }
  }
}