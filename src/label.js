import {setPrevLabel} from './logger.js';
import {toggleNonDrawingHammers} from './hammer_events.js';
import {keyPressListener, keyDownListener} from './main.js';
import {sendSearchMsgToContainer} from './request_handler.js';
import {changeShapeSize} from './nodes.js';

var temp_label_div = null;

const LABEL_LINE_SPACING = 20;
const MIN_INPUT_COLS = 5;

/**
 * Adds a label to a node either by user input (if placeholderText=true) or by
 * the text parameter
 * 
 * @param {String | Array} text  If placeholderText is true, this is the 
 *                               placeholder that appears in the background of 
 *                               the input div.  Otherwise, it is the label
 * @param {DOMELEMENT}     node  The Node to add the label to
 * @param {Boolean} requireInput If true, user inputs label, if false,
 *                               inserts the text as a fully created label
 * @param {Boolean}  insertText  If true and placeholderText is true, inserts 
 *                               text into a newly created input div and places
 *                               the cursor at the end.
 * @param {Boolean} selectText   If true along with requireInput and insertText,
 *                               selects the inserted text so it will be replaced
 */
export function addLabel(text, node, requireInput=true, insertText=false, selectText=false){
  
  let labelText = getNodeLabel(node);
  setPrevLabel(labelText); //For Logging

  text = text ? text : labelText;

  if( !node.querySelector("text") ) drawLabel(node, "");

  if(requireInput){
    // Adding an editable div outside
    addLabelInputDiv(node, text, insertText, selectText);
  } else{
    changeLabelText(node, text);
  }
}

/**
 * gets the label (including multiline labels) of a node
 * @param  {SVGELEMENT} node the node to get the label of
 * @return {String}     The label as a string.  Multiline labels are combined
 */
export function getNodeLabel(node){
  var label = node.getElementsByClassName("label")[0];
  if (!label) return null;

  let labelText = "";
  label.querySelectorAll(".label-line").forEach( (labelLine, index)=>{
    labelText += (index > 0 ? "\n" : "") + labelLine.textContent;
  });

  return labelText;
}

/**
 * Creates a temporary input element for the user to enter the label of a node.
 * This is a transient element that only the current user can interact with.
 * The label can be finalized by pressing Tab, Enter, or clicking outside the
 * label.  Map-related event listeners are disabled during this time.
 * 
 * @param {SVGELEMENT}  node        The node to create a label for.
 * @param {String}  placeholderText Text that will be preinserted.
 * @param {Boolean} insertText      If false (default), laceholderText will be
 *                                  inserted as transparent background text
 *                                  that dissapears when the user types.  If
 *                                  true, it is instead inserted as user input
 * @param {Boolean} selectText      If this and insertText are true, the text
 *                                  is selected so that the user can either
 *                                  use the text as a label or replace it.
 */
function addLabelInputDiv(node, placeholderText, insertText=false, selectText=false){
  let label = node.getElementsByClassName("label")[0];

  let labelInput = document.createElement("textarea");
  labelInput.classList.add("label-input")
  labelInput.setAttribute("id", node.getAttribute('id')+"_text");
  labelInput.setAttribute("node-id", node.getAttribute('id'));
  labelInput.setAttribute("size", placeholderText.length || 1);
  labelInput.style.fontSize = window.getComputedStyle(label).getPropertyValue("font-size");
  labelInput.style.transform = "scale("+ (1/node.transformer.globalScale.x) +","+(1/node.transformer.globalScale.y)+")";

  if(!insertText){
    labelInput.setAttribute("placeholder", placeholderText);
  } else{ //If the user presses a key while a node is selected
    labelInput.value = placeholderText;
    if(selectText){
      labelInput.focus();
      labelInput.select();
    }
  }
 
  temp_label_div = labelInput;

  label.textContent = "";
  let screenPos = label.getBoundingClientRect()

  labelInput.style.left = screenPos.x + screenPos.width/2 + "px";
  labelInput.style.top = screenPos.y + screenPos.height/2 + "px";
  
  labelInput.onkeydown = (e) => {
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
    labelInput.oninput = (e) => {
      scaleNodeToLabelInput(labelInput, node);
    }
  }

  var transientEle = document.createElement("transient");
  transientEle.appendChild(labelInput);
  document.getElementById("d3_container").appendChild(transientEle);

  toggleListenersForLabelInput(true); //Disable interactions during edit

  scaleNodeToLabelInput(labelInput, node);

  labelInput.focus();
}

/**
 * Creates the label element on a node element
 * @param  {SVGELEMENT}         node  The node to add the label to
 * @param  {String | [String]}  labelText  The text to optionally put in the label
 */
function drawLabel(node, labelText=null){
  let cx, cy, textSVG;

  if (node.classList.contains("node")){
    cx = 0;
    cy = 0;
    textSVG = Snap(node).text(cx, cy, "").node;
  }
  else if (node.classList.contains("link")){
    let line = node.getElementsByClassName("link-rep")[0],
      x1 = line.getAttribute("x1"),
      x2 = line.getAttribute("x2"),
      y1 = line.getAttribute("y1"),
      y2 = line.getAttribute("y2");
    cx = (parseFloat(x1) + parseFloat(x2)) / 2.0;
    cy = (parseFloat(y1) + parseFloat(y2)) / 2.0;

    textSVG = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textSVG.setAttribute("x", cx);
    textSVG.setAttribute("y", cy);
    node.appendChild(textSVG);
  }
  // Add the text inside svg with the new text
    
  textSVG.classList.add("label");
  textSVG.setAttribute("id", node.id+"_text");

  if (labelText){
    changeLabelText(node, labelText);
  }
}

/**
 * Changes the label text of a node
 * @param  {SVGELEMENT} node   The node classed element to change the text of
 * @param  {String | [String]} - The text to insert to the label.  If an array
 *                               of strings, each will have its own line
 */
function changeLabelText(node, labelLines){
  let label = node.querySelector(".label");
  label.innerHTML = " ";

  if (typeof labelLines === "string") labelLines = [labelLines]; //else it is an array
  let totalHeight = (labelLines.length - 1) * LABEL_LINE_SPACING;

  labelLines.forEach( (text, index)=>{
    let lineEle = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
    lineEle.classList.add("label-line");
    lineEle.appendChild( document.createTextNode(text) );
    label.appendChild(lineEle);

    if(node.classList.contains("node")){
      var lineY = labelLines.length > 1 ? totalHeight * index / (labelLines.length-1) - (totalHeight/2) : 0;
      lineEle.setAttribute("y", lineY);
      lineEle.setAttribute("x", 0)
    } else{ //Links
      let previousLine = index > 0 ? label.getElementsByClassName("label-line")[index - 1] : null;
      var lineX = previousLine ? previousLine.getComputedTextLength() * -0.5 - lineEle.getComputedTextLength() * 0.5 : 0;
      let lineY = previousLine ? LABEL_LINE_SPACING : totalHeight / -2;
      lineEle.setAttribute("dy", lineY);
      lineEle.setAttribute("dx", lineX)
    }
  })
}

/**
 * Deletes a temporary label-input element and inserts it's value into the appropriate node's label
 * @param  {SVGELEMENT} node - The node to change the label of
 * @param  {HTMLELEMENT} labelInput The label-input element to extract text from and delete
 */
function createLabelFromInput(node, labelInput){
  let labelLines = labelInput.value.split('\n');
  changeLabelText(node, labelLines);

  // Remove the outside editable div
  labelInput.remove();
  temp_label_div = null;
  toggleListenersForLabelInput(false);
  sendSearchMsgToContainer();
}

/* Blocks the user from interacting with other elements while a node is being edited
 *
 */
function toggleListenersForLabelInput( isInputtingLabel ){
  //console.log("Toggling listeners for label input to: ", isInputtingLabel);
  toggleNonDrawingHammers( !isInputtingLabel )
  canvas.hammer.get( 'labelinputtap' ).set({ 'enable' : isInputtingLabel })

  if( isInputtingLabel){ //Don't allow the user to navigate to other nodes with arrows
    window.removeEventListener("keypress", keyPressListener);
    window.removeEventListener("keydown", keyDownListener);
  } else{
    window.addEventListener("keypress", keyPressListener);
    window.addEventListener("keydown", keyDownListener);
  }
}

export function handleClickDuringLabelInput(){
  //console.log("Handling click during label input");
  
  if (!temp_label_div.nErrors) temp_label_div.nErrors = 0;

  var errorMessages = [
    "Enter Name",
    "Name me please",
    "I need a label",
    "Seriously, name me",
    "Listen Pal,",
    "Neither of us is going anywhere until I have a name",
    "Mary Boyle is very disappointed in you",
    "...",
    "I don't get paid enough for this",
    "Just type something..."
  ];

  var label = temp_label_div;
  var inputText = label.value;
  var placeholderText = label.getAttribute("placeholder");
  var node = document.querySelector('#' + label.getAttribute("node-id"));

  if( inputText.length === 0 ){
    //console.log("Label needs input");
    label.nErrors = Math.min( label.nErrors + 1, errorMessages.length - 1 );

    var errorMessage = errorMessages[label.nErrors];

    label.setAttribute("placeholder", errorMessage);
    label.setAttribute("size", errorMessage.length);

    scaleNodeToLabelInput( label, node );

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

/**
 * Changes the size of a node's representation to fit a label as it is being input by the user
 * @label  {HTMLEMENT} label the label-input classed input element
 * @param  {SVGELEMENT} node  the node-classed element whose representation will be scalled
 */
function scaleNodeToLabelInput(label, node) {
  let nodeRep = node.getElementsByClassName(".node-rep")[0];

  let labelLines = label.value.split("\n");
  let labelRows = labelLines.length;
  let labelCols = Math.max.apply(null, labelLines.map( l=>l.length ));

  label.setAttribute("rows", labelRows);
  label.setAttribute("cols", labelCols || label.getAttribute("placeholder").length );

  let labelBB = label.getBoundingClientRect(); 
  let nodeBB = node.getBoundingClientRect();
  nodeBB.center = { x: nodeBB.left + nodeBB.width/2,
                    y: nodeBB.top + nodeBB.height/2 };

  let labelLeft = nodeBB.center.x - labelBB.width / 2;
  let labelTop = nodeBB.center.y - labelBB.height / 2;
  label.style.left = labelLeft + "px";
  label.style.top = labelTop + "px";

  if(node.classList.contains("node") ){
    var shapeType = node.getAttribute("shape"); 
    var defaultSize = DEFAULT_SHAPE_SIZES[shapeType]

    //The size of the label without transformations
    var unscaledSize = [labelBB.width*node.transformer.globalScale.x, 
                        labelBB.height*node.transformer.globalScale.y];
    var unscaledNodeSize = [nodeBB.width*node.transformer.globalScale.x,
                            nodeBB.height*node.transformer.globalScale.y];

    if( unscaledSize[0] > defaultSize[0] || unscaledSize[1] > defaultSize[1] ||
        (unscaledNodeSize[0] > defaultSize[0]  && unscaledSize[0] < defaultSize[0] ) ){
      changeShapeSize(node, Math.max(unscaledSize[0], defaultSize[0]), 
                            Math.max(unscaledSize[1], defaultSize[1]) );
    }
  }
}