var temp_label_div = null;

const LABEL_LINE_SPACING = 20;
const MIN_INPUT_COLS = 5;

/**
 * gets the label (including multiline labels) of a node
 * @param  {SVGELEMENT} node the node to get the label of
 * @return {String}     The label as a string.  Multiline labels are combined
 */
function getNodeLabel(node){
  var label = node.getElementsByClassName("label")[0];
  return label ? label.textContent : null;
}

/**
 * Adds a label to a node either by user input (if placeholderText=true) or by
 * the text parameter
 * 
 * @param {String | Array} text - If placeholderText is true, this is the 
 * placeholder that appears in the background of the input div
 * @param {DOMELEMENT}  node - The Node to add the label to
 * @param {Boolean} placeholderText - If true, user inputs label, if false,
 * a label is created from the text parameter
 */
function addLabel(text, node, placeholderText=true){
  
  let labelText = getNodeLabel(node);
  setPrevLabel(labelText); //For Logging

  text = text ? text : labelText;

  if( !node.querySelector("text") ) drawLabel(node, "");

  if(placeholderText){
    // Adding an editable div outside
    addLabelInputDiv(node, text);
  }
}

function addLabelInputDiv(node, placeholderText){
  let label = document.getElementsByClassName("label")[0];

  let labelInput = document.createElement("textarea");
  labelInput.classList.add("label-input")
  labelInput.setAttribute("id", node.getAttribute('id')+"_text");
  labelInput.setAttribute("node-id", node.getAttribute('id'));
  labelInput.setAttribute("size", placeholderText.length || 1);
  labelInput.setAttribute("placeholder", placeholderText);
  labelInput.style.fontSize = window.getComputedStyle(label).getPropertyValue("font-size");
  labelInput.style.transform = "scale("+ (1/node.transformer.globalScale.x) +","+(1/node.transformer.globalScale.y)+")";
  
  temp_label_div = labelInput;

  label.textContent = "";
  let screenPos = label.getBoundingClientRect()

  labelInput.style.left = screenPos.x + screenPos.width/2 + "px";
  labelInput.style.top = screenPos.y + screenPos.height/2 + "px";
  
  labelInput.onkeydown = (e) => {
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

function drawLabel(node, labelText){
  let cx, cy

  if (node.classList.contains("node")){
    center = new Point(0, 0)
  }
  else if (node.classList.contains("link")){
    let line = node.getElementsByClassName(".link-rep")[0],
      x1 = line.getAttribute("x1"),
      x2 = line.getAttribute("x2"),
      y1 = line.getAttribute("y1"),
      y2 = line.getAttribute("y2");
    cx = (parseFloat(x1) + parseFloat(x2)) / 2.0;
    cy = (parseFloat(y1) + parseFloat(y2)) / 2.0;
  }

  // Add the text inside svg with the new text
  var textSVG = Snap(node).text(cx, cy, "")
    .addClass("label")
    .attr({"id" : node.id+"_text"});

  if (labelText){
    changeLabelText(node, labelText);
  }
}

function changeLabelText(node, labelLines){
  let label = node.querySelector(".label");
  label.innerHTML = " ";

  if (typeof labelLines === "string") labelLines = [labelLines]; //else it is an array
  let totalHeight = (labelLines.length - 1) * LABEL_LINE_SPACING;

  labelLines.forEach( (text, index)=>{
    let lineEle = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
    lineEle.classList.add("label-line");
    lineEle.appendChild( document.createTextNode(text) );

    let lineY = labelLines.length > 1 ? totalHeight * index / (labelLines.length-1) - (totalHeight/2) : 0;
    lineEle.setAttribute("y", lineY);
    lineEle.setAttribute("x", 0)
    label.appendChild(lineEle);
  })
}

function createLabelFromInput(node, labelInput){
  let labelLines = labelInput.value.split('\n').filter((val)=>val);
  changeLabelText(node, labelLines);

  // Remove the outside editable div
  labelInput.remove();
  temp_label_div = null;
  toggleListenersForLabelInput(false);
  sendSearchMsgToContainer();
  return;
}

/* Blocks the user from interacting with other elements while a node is being edited
 *
 */
function toggleListenersForLabelInput( isInputtingLabel ){
  //console.log("Toggling listeners for label input to: ", isInputtingLabel);
  toggleNonDrawingHammers( !isInputtingLabel )
  canvas.hammer.get( 'labelinputtap' ).set({ 'enable' : isInputtingLabel })
}

function handleClickDuringLabelInput(){
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
    "Just press enter..."
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
 * Scale n
 * @param  {[type]} label [description]
 * @param  {[type]} node  [description]
 * @param  {[type]} cx    [description]
 * @param  {[type]} cy    [description]
 * @return {[type]}       [description]
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
    var unscaledSize = [labelBB.width*node.transformer.globalScale.x, 
                        labelBB.height*node.transformer.globalScale.y];
    console.log(unscaledSize + ", default: " + defaultSize);
    if( unscaledSize[0] > defaultSize[0] || unscaledSize[1] > defaultSize[1]){
      changeShapeSize(node, Math.max(unscaledSize[0], defaultSize[0]), 
                            Math.max(unscaledSize[1], defaultSize[1]) );
    }
  }
}