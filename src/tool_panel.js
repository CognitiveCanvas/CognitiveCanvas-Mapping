import {createElement, deleteSelectedElement, faIcon, makeUIDraggable} from './main.js';
import {setNodeShape} from './nodes.js';
import {setLeftLinkEnd, setRightLinkEnd} from './links.js';
import {drawing_enabled, drawingToolFunctions, toggleDrawing} from './draw.js';
import {togglePinning, uploadImage} from './pinning.js';
import {deselectAllObjects} from './selections.js';
import {setNodeColor, setNodeOpacity, setBorderType, setLinkColor, setLinkThickness, setBorderColor, toggleLabelFontItalics, toggleLabelFontBold, setLabelColor, setLabelSize, setLabelFont} from './style.js';

/**
 * @file tool_panel.js defines the behavior of the in-map tool panel.
 *
 * The tool panel will be created in a transient tag when the page is loaded.
 * It will be draggable accross the screen, and have tabs for "map", "draw",
 * and "settings".  Each of these tabs will update dynamically based on what is
 * selected on map.  On the node tab will be a "preview" of what a node should
 * look like based on the selected styling options.
 */

export var TP_ELEMENT_TYPES = ["node", "link"];

const NODE_SHAPE_ICONS = {
	rectangle: {icon: "square", style: "far"},
	circle:    {icon: "circle", style: "far"},
	diamond:   {icon: "square", style: "far"}
};

const LINE_END_ICONS = {
	arrow: {icon: "caret-left", style: "fas"},
	none:  {icon: "minus", style: "fas"}
}

const FONT_ICONS = {
	bold: 	{icon: "bold", style: "fas"},
	italic: {icon: "italic", style: "fas"}
}

const LABEL_FONTS = ["Roboto Condensed", "Raleway", "Lato", "Slabo 13px"];

const LABEL_FONT_SIZES = [12, 14, 16, 18, 20];

var toolPanelTabs;
function initToolPanelInfo(){
	toolPanelTabs = {
		node: {icon: "code-branch", fields: {
			elementStyle:{subFields:{element: {inputType: "selector", function: setTPSelection,	options: ["node", "link"] },
									 style:   {inputType: "selector", function: setStyleSelection,options: ["default"]},
									 deleteElement: {name: null, inputType: "button", size:"small", function: deleteSelectedElement, label: "Delete" }
										   }, visibleFor: ["node", "link"] },
			nodeShape: 	{name: "Shape", 	inputType: "radio", 	function: setNodeShape,		optionType: "shape", options: NODE_SHAPES, icons: NODE_SHAPE_ICONS, visibleFor:["node"] },
			lineType: 	{name: "Line", 		inputType: "radioLong", function: setBorderType,	optionType: "line", options: ["solid", "dashed"], visibleFor: ["link"]},		
			nodeFill: 	{name: "Fill",		inputType: "radio",		function: setNodeColor,		optionType: "color", options: getColorGroup("mapElements"), visibleFor: ["node"]},
			linkColor: 	{name: "Fill",		inputType: "radio",		function: setLinkColor,		optionType: "color", options: getColorGroup("mapElements"), visibleFor: ["link"]},
			opacity: 	{name: "Opacity", 	inputType: "slider",	function: setNodeOpacity,	range: {min: 0, max: 100, unit: "%"}, visibleFor: ["node"] },
			borderType: {name: "Border", 	inputType: "radioLong", function: setBorderType,	optionType: "border", options: ["solid", "dashed", "none"], visibleFor: ["node"] },
			lineWeight: {name: "Weight", 	inputType: "selector",	function: setLinkThickness,	optionType: "lineWeight", options: [1,2,3,4,5], visibleFor: ["link"]},
			lineEnds: 	{name: "Ends",		subFields:{ leftEnd: { inputType: "radio", function: setLeftLinkEnd, options: ["arrow", "none"], icons: LINE_END_ICONS},
														rightEnd:{ inputType: "radio", function: setRightLinkEnd, options: ["none", "arrow"], icons: LINE_END_ICONS},
													  }, visibleFor: ["link"]},
			label: 		{name: "Label", 	subFields:{fontFace: { inputType: "selector", optionType:"font", function: setLabelFont, options: LABEL_FONTS },
													   fontSize: { inputType: "selector", optionType:"fontSize", function: setLabelSize, options: LABEL_FONT_SIZES },
						 							   fontStyle:{ inputType: "checkBox", functions: [toggleLabelFontBold, toggleLabelFontItalics], options: ["bold", "italic"], icons: FONT_ICONS }, 
						 							  }, visibleFor: ["node", "link"] },
			labelColor: {name: "Color", 	inputType: "radio", 	function: setLabelColor,	optionType: "color", options: getColorGroup("text"), visibleFor: ["node", "link"]},
		}}, 
		draw: {icon: "pencil-alt", fields: {
			//drawLine: 	{name: "Line", 	inputType: "radioLong", function: drawingToolFunctions.setLineType, optionType: "line", options: ["solid", "dashed"]},		
			drawColor:  {name: "Color", inputType: "radio", 		function: drawingToolFunctions.setPenColor, 	optionType: "color", options: getColorGroup("mapElements")},
			drawWeight: {name: "Weight",inputType: "selector",		function: drawingToolFunctions.setPenThickness,	optionType: "lineWeight", options: [1,2,3,4,5]},
			eraser: 	{name: null, 	inputType: "toggleButton", 	function: drawingToolFunctions.toggleEraser, 	label: "ERASE", icon: {name: "eraser", style: "fas"}}

		}},
		pinning: {icon: "map-marker-alt", fields: {
			uploadImage: {name: null, inputType: "button", function: uploadImage, label: "UPLOAD IMAGE", icon: {name: "image", style: "fas"}},
			pinImage: {name: null, inputType: "button", function: togglePinning, label: "PIN LABEL", icon: {name: "map-marker-alt", style: "fas"}},
		}},
		anchor: {type: "anchor", icon: "cog", fields: null}
	};
}

/**
 * Creates the Tool Panel on page load
 */
export function initToolPanel(){
	initToolPanelInfo();

	var transientWrapper = createElement("transient", null, {id: "toolPanelWrapper"});
	var toolPanel = createElement("div", null, {id: "toolPanel"}, transientWrapper);
	var TPHeader = createElement("div", null, {id: "toolPanelHeader"}, toolPanel);

	Object.keys(toolPanelTabs).forEach( (tabName)=>{
		let tabInfo = toolPanelTabs[tabName];

		let tab = createTPTab(tabName, tabInfo);
		TPHeader.appendChild(tab);

		if(tabInfo.fields){
			let tabFields = createElement("div", "tabFieldContainer", {id: tabName + "Fields"}, toolPanel);

			Object.keys(tabInfo.fields).forEach( (fieldId)=>{
				let fieldInfo = tabInfo.fields[fieldId];
				let field = createTPField(fieldId, fieldInfo);
				tabFields.appendChild(field);
			});
		} else if (tabInfo.type === "anchor"){
		}
	});
	makeUIDraggable(toolPanel);

	document.body.appendChild(transientWrapper);
	toolPanel.style.left = document.documentElement.clientWidth - toolPanel.clientWidth - INITIAL_UI_PADDING + "px";
	toolPanel.style.top = INITIAL_UI_PADDING + "px";
	setTPSelection("node");
}

/**
 * Creates a tab on the tool panel
 * @param  {String} tabId   The Tab's Id
 * @param  {Object} tabInfo JSON containing info about the tab and its contents
 *                          See top of file for structure
 * @return {HTMLELEMENT}	The tab to append to the tool panel header         
 */
function createTPTab(tabName, tabInfo){
	let tab = createElement("div", ["toolPanelTab"], {id: tabName + "TPTab", name: tabName}, null);

	if(tabInfo.type === "anchor") tab.classList.add("anchor");

	if (tabInfo.icon) tab.appendChild( faIcon(tabInfo.icon) );
	if (tabInfo.text) tab.appendChild(document.createTextNode(tabInfo.text));

	let hammer = new Hammer.Manager(tab, { recognizers: [ [Hammer.Tap] ] });
	tab.hammer = hammer;
	hammer.on("tap", (event)=>{
		if (!tab.hasAttribute("active")){
			setActiveTPTab( tabName );
		}
	});
	return tab;
}

/**
 * Switches tabs on the tool panel
 * @param {String} tabName ["node" | "draw" | "pinning"]
 */
function setActiveTPTab(tabName){
	let newActiveTab = document.getElementById(tabName + "TPTab");

	//Deactivate a previously selected tab
	let activeTab = document.querySelector(".toolPanelTab[active]");
	if (activeTab){ 
		activeTab.removeAttribute("active");
		let activeTabFields = document.getElementById(activeTab.getAttribute("name") + "Fields");
		if(activeTabFields) activeTabFields.removeAttribute("active");
	};
	newActiveTab.setAttribute("active", "");
	let newActiveTabFields = document.getElementById(newActiveTab.getAttribute("name") + "Fields");
	if(newActiveTabFields) newActiveTabFields.setAttribute("active", "");

	toggleDrawing(tabName === "draw");

	switch(tabName){
		case "node":
			break;
		case "draw":
			deselectAllObjects();
			break;
		case "pinning":
			break;
		default:
			break;
	}
}

/**
 * Sets the selection for the tool panel, changing tab and style selection as needed
 * @param {String} elementType - "node" | "link"
 */
export function setTPSelection(elementType){
	if (!TP_ELEMENT_TYPES.includes(elementType)) return;
	document.getElementById("elementSelector").value = elementType;
	if( !document.getElementById("nodeTPTab").hasAttribute("active") ) setActiveTPTab("node");
	document.querySelectorAll("#nodeFields .toolPanelField").forEach( (field)=>{
		if(field.getAttribute("visibleFor").includes(elementType)){
			field.removeAttribute("hidden");
		} else{
			field.setAttribute("hidden", "");
		}
	});
}

function setStyleSelection(elementType){

}

function createTPField(fieldId, fieldValues){
	let fieldDiv = createElement("div", "toolPanelField", {id: fieldId + "Field"});

	if(fieldValues.hasOwnProperty("visibleFor")){
		fieldDiv.setAttribute("visibleFor", fieldValues.visibleFor.join(" "));
	}

	if(fieldValues.name){
		let fieldName = createElement("div", "fieldName", {}, fieldDiv);
		fieldName.appendChild(document.createTextNode(fieldValues.name));
	}

	let subFields;
	if (fieldValues.subFields) subFields = fieldValues.subFields;
	else {
		subFields = {}
		subFields[fieldId] = fieldValues;
	} 
	Object.keys(subFields).forEach( (subFieldId)=>{
		let fieldInfo = subFields[subFieldId];
		let fieldOptions;
		switch(fieldInfo.inputType){
			case "selector":
				fieldOptions = createSelector(subFieldId, fieldInfo);
				break;
			case "radio":
			case "radioLong":
				fieldOptions = createRadioOptions(subFieldId, fieldInfo);
				break;
			case "slider":
				fieldOptions = createSliderOption(subFieldId, fieldInfo);
				break;
			case "checkBox":
				fieldOptions = createCheckBoxOptions(subFieldId, fieldInfo);
				break;
			case "button":
			case "toggleButton":
				fieldOptions = createButton(subFieldId, fieldInfo);
				break;
			default:
				fieldOptions = document.createElement("span");
				break;
		}
		fieldDiv.appendChild(fieldOptions);
	});

	return fieldDiv;
}

function createSelector(fieldId, fieldValues){
	let container = createElement("span");
	let selector = createElement("select", "selectField", {id: fieldId + "Selector"}, container)
	fieldValues.options.forEach( (optionName)=>{
		let option = createElement("option", null, {value: optionName}, selector);
		let optionText = optionName;
		if (fieldValues.optionType === "font") optionText = optionName.split(" ")[0];
		option.innerText = optionText;
	});
	selector.addEventListener("change", (e)=>{fieldValues.function(e.target.value)});

	if(fieldValues.optionType === "lineWeight"){
		let lineExample = createElement("span", "lineOptionLabel", {}, container);
		selector.addEventListener("input", (event)=>{
			lineExample.style.borderWidth = event.target.value + "px";
		});
	}
	return container;
}

function createRadioOptions(fieldName, fieldInfo){
	let options = createElement("span", ["fieldOptions", fieldInfo.optionType, fieldInfo.inputType]);

	let optionValues = fieldInfo.options;
	optionValues.forEach( (optionValue)=>{
		let id = fieldName + optionValue + "Option"; 
		let classes = ["radioOption", fieldName, optionValue];
		if(fieldInfo.optionType) classes.push(fieldInfo.optionType);
		let attributes = {id: id, type: "radio", name: fieldName, value: optionValue}

		let option = createElement("span", "fieldOption", null, options);
		let radio = createElement("input", classes, attributes, option);
		
		if (fieldInfo.inputType === "radioLong") radio.classList.add("long");

		let selectedBorder = createElement("div", "selectedBorder", null, option);

		if(fieldInfo.function){
			radio.addEventListener("change", (e)=>{ fieldInfo.function(e.target.value) })
		}
		//Add the fontAwesome icon styles to the radio buttons
		if (fieldInfo.icons){
			let optionIcon = fieldInfo.icons[optionValue];
			radio.classList.add( ...faIcon( optionIcon.icon, optionIcon.style, true ));
		}

		switch (fieldInfo.optionType){
			case "color":
				radio.style.backgroundColor = optionValue;
				break;
			case "shape":
				break;
			case "border":
			case "line":
				let label = createElement("label", fieldInfo.optionType + "OptionLabel", {for: id}, option);
				if (fieldInfo.optionType === "border"){
					label.appendChild(document.createTextNode(optionValue));
				}
				break;
			default:
				break;
		}
	});
	return options;
}

function createCheckBoxOptions(fieldId, fieldInfo){
	let field = createElement("span", "fieldOptions", {id: fieldId});
	fieldInfo.options.forEach( (optionName, index)=>{
		let option = createElement("span", "fieldOption", {}, field);

		let checkBox = createElement("input", "checkBoxOption", {id: optionName  + "Option", type: "checkbox", name: fieldId, value: optionName});
		checkBox.addEventListener("change", ()=>{fieldInfo.functions[index](checkBox.checked)});

		let icon = fieldInfo.icons[optionName];
		checkBox.classList.add(...faIcon(icon.icon, icon.style, true));
		option.appendChild(checkBox);

		let selectedBorder = createElement("div", "selectedBorder", {}, option);
	});
	return field;
}

function createSliderOption(fieldId, fieldInfo){
	let field = createElement("span", ["fieldOption", fieldId]);

	let slider = createElement("input", ["sliderField", fieldId], {id: fieldId, type: "range",
		min: fieldInfo.range.min, max: fieldInfo.range.max}, field);

	let readOut = createElement("label", "sliderReadOut", null, field);
	readOut.innerText = slider.value + fieldInfo.range.unit;

	slider.addEventListener("input", (e)=>{
		readOut.innerText = e.target.value + fieldInfo.range.unit;
		fieldInfo.function(e.target.value);
	})

	return field;
}

function createButton(fieldId, fieldInfo){
	let span = createElement("span");

	if(fieldInfo.inputType === "toggleButton"){
		let checkBox = createElement("input", [fieldInfo.inputType + "Field"], {id: fieldId, type: "checkbox", name: fieldId, value: fieldId}, span );
	}
	let button = createElement("label", [fieldInfo.inputType, fieldId], {for: fieldId}, span);
	if(fieldInfo.size === "small")button.classList.add("small");

	if(fieldInfo.icon){
		let icon = faIcon(fieldInfo.icon.name, fieldInfo.icon.style);
		button.appendChild(icon);
	}
	button.appendChild(document.createTextNode(fieldInfo.label));

	button.addEventListener("click", ()=>{fieldInfo.function()});

	return span;
}

function createDrawingPalette(){
	let palette = createElement("div", null, {id: "drawing-palette"});
	return palette;
}

export function updateNodeTPOptions(element){
	let label = element.getElementsByClassName("label")[0];

	if (label && element.classList.contains("node") || element.classList.contains("link")){
		//LABEL FONT OPTIONS
		let fontFace = label.style.fontFamily.split(",")[0];
		if(fontFace) document.getElementById("fontFaceSelector").value = fontFace;

		let fontSize = label.style.fontSize.replace("px", "");
		if(fontSize) document.getElementById("fontSizeSelector").value = fontSize;

		let isBold = label.style.fontWeight === FONT_BOLD;
		document.getElementById("boldOption").checked = isBold;

		let isItalic = label.style.fontStyle === "italic";
		document.getElementById("italicOption").checked = isItalic;

		let labelColor = label.style.fill;
		if (labelColor){ 
			let labelColorOption = document.querySelector('.fieldOption .labelColor[value="'+labelColor+'"]')
			if (labelColorOption) labelColorOption.checked = true;
		}

	}
	if(element.classList.contains("node")){
		let nodeRep = element.getElementsByClassName("node-rep")[0];

		let shape = element.getAttribute("shape");
		let shapeOption = document.querySelector('.fieldOption .nodeShape[value="'+shape+'"]');
		if( shapeOption ) shapeOption.checked = true;

		let fill = nodeRep.style.fill;
		let fillOption = document.querySelector('.fieldOption .nodeFill[value="'+fill+'"]');
		if( fillOption) fillOption.checked = true;

		let opacity = nodeRep.style.opacity;
		if (opacity) document.querySelector(".fieldOption .opacity").value = opacity;

		let borderType = nodeRep.style.strokeDasharray;
		if(borderType) borderType = Object.keys(DASH_ARRAY_VALUES).find( name=>DASH_ARRAY_VALUES[name]===borderType);
		if(borderType){ 
			let borderOption = document.querySelector('.fieldOption .borderType[value="'+borderType+'"]');
			if (borderOption) borderOption.checked = true;
		}

	} else if(element.classList.contains("link")){
		let linkRep = element.getElementsByClassName("link-rep")[0];

		let lineType = linkRep.style.strokeDasharray;
		if (lineType) lineType = Object.keys(DASH_ARRAY_VALUES).find( ( name=>DASH_ARRAY_VALUES[name]===lineType));
		if (lineType){
			let lineOption = document.querySelector('.fieldOption .lineType[value="'+lineType+'"]');
			if (lineOption) lineOption.checked = true;
		}

		let color = linkRep.style.stroke;
		let colorOption = document.querySelector('.fieldOption .linkColor[value="'+color+'"]');
		if( colorOption) colorOption.checked = true;

		let lineWeight = linkRep.style.strokeWidth;
		if (lineWeight) document.getElementById("lineWeightSelector").value = lineWeight;

		let sourceEnd = element.getElementsByClassName("link-end source")[0];
		if (sourceEnd) document.querySelector(".fieldOption .leftEnd.arrow").checked = true;
		else document.querySelector(".fieldOption .leftEnd.none").checked = true;

		let targetEnd = element.getElementsByClassName("link-end target")[0];
		if (targetEnd) document.querySelector(".fieldOption .rightEnd.arrow").checked = true;
		else document.querySelector(".fieldOption .rightEnd.none").checked = true;
	}
}