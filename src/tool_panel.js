/**
 * @file tool_panel.js defines the behavior of the in-map tool panel.
 *
 * The tool panel will be created in a transient tag when the page is loaded.
 * It will be draggable accross the screen, and have tabs for "map", "draw",
 * and "settings".  Each of these tabs will update dynamically based on what is
 * selected on map.  On the node tab will be a "preview" of what a node should
 * look like based on the selected styling options.
 */

/**
 * An object containing all the colors and color groups from the theme.  It
 * also has a getter that will return an array of hex color codes for a color
 * group.
 * @getter {[String]} colorGroup - Takes in a {String} groupname and returns
 *         						   an array of color hex strings from that
 *         						   group
 */
const THEME_COLORS = {
	colors: { 
		red: "#E68570", purple: "#CC6686", blue: "#5884B3", green: "#9DBE59",
		yellow: "#E5CF6C", black: "#000000", geisel: "#747678", 
		darkGrey: "#ACADAE", june: "#D3D4D4", lightGrey: "#EDEEEE", 
		white: "#FFFFFF", sea: "#006A96", sun: "#FFCD00", grass: "#6E963B", 
		night: "#182B49"
	},
	colorGroups: {
		surfaces: ["geisel", "darkGrey", "june", "lightGrey", "white"],
		brand: ["sea"],
		accents: ["sun", "grass", "night", "black"],
		mapElements : ["red", "purple", "blue", "green", "yellow", "darkGrey"],
		text: ["black", "darkGrey", "white"]
	}
};

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

function getColorGroup(groupName){
	let colorsInGroup = [];
	THEME_COLORS.colorGroups[groupName].forEach( (colorName)=>{
		colorsInGroup.push(THEME_COLORS.colors[colorName]);
	});
	return colorsInGroup;
}

var toolPanelTabs = {
	nodeTPTab: {text: "Node", icon: "code-branch", fields: {
		elementStyle:{subFields:{element: {inputType: "selector", function: setTPSelection,	options: ["node", "link"] },
								 style:   {inputType: "selector", function: setStyleSelection,options: ["default"]}
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
					 							   fontStyle:{ inputType: "checkBox", functions: [toggleLabelFontBold, toggleLabelFontItalics], options: ["bold", "italic"], icons: FONT_ICONS }, 
					 							  }, visibleFor: ["node", "link"] },
		labelColor: {name: "Color", 	inputType: "radio", 	function: setLabelColor,	optionType: "color", options: getColorGroup("text"), visibleFor: ["node", "link"]},
	}}, 
	drawTPTab: {text: "Draw", icon: "pencil-alt", fields: {
		drawLine: 	{name: "Line", 	inputType: "radioLong", function: null,	optionType: "line", options: ["solid", "dashed"]},		
		drawColor:  {name: "Color", inputType: "radio", function: null, optionType: "color", options: getColorGroup("mapElements")},
		drawWeight: {name: "Weight",inputType: "selector",	function: null,	optionType: "lineWeight", options: [1,2,3,4,5]},
		eraser: 	{name: null, 	inputType: "toggleButton", function:null, label: "ERASE", icon: {name: "eraser", style: "fas"}}

	}},
	pinningTPTab: {icon: "map-marker-alt", fields: {
		uploadImage: {name: null, inputType: "button", function: null, label: "UPLOAD IMAGE", icon: {name: "image", style: "fas"}},
		pinImage: {name: null, inputType: "button", function: null, label: "PIN LABEL", icon: {name: "map-marker-alt", style: "fas"}},
	}},
	settingsTPTab: {text: null, icon: "cog", fields: {

	}}
};

/**
 * Creates the Tool Panel on page load
 */
function initToolPanel(){
	var transientWrapper = document.createElement("transient");
	transientWrapper.id = "toolPanelWrapper";

	var toolPanel = document.createElement("div");
	toolPanel.id = "toolPanel";
	transientWrapper.appendChild(toolPanel);

	var TPHeader = document.createElement("div");
	TPHeader.id = "toolPanelHeader";
	toolPanel.appendChild(TPHeader);

	Object.keys(toolPanelTabs).forEach( (tabId)=>{
		let tabInfo = toolPanelTabs[tabId];
		let tab = createTPTab(tabId, tabInfo);
		TPHeader.appendChild(tab);

		let tabFields = document.createElement("div");
		tabFields.classList.add("tabFieldContainer");
		tabFields.id = tabId + "Fields";
		toolPanel.appendChild( tabFields );

		Object.keys(tabInfo.fields).forEach( (fieldId)=>{
			let fieldInfo = tabInfo.fields[fieldId];
			let field = createTPField(fieldId, fieldInfo);
			tabFields.appendChild(field);
		});
	});
	document.body.appendChild(transientWrapper);
	setTPSelection("node");
}

/**
 * Creates a tab on the tool panel
 * @param  {String} tabId   The Tab's Id
 * @param  {Object} tabInfo JSON containing info about the tab and its contents
 *                          See top of file for structure
 * @return {HTMLELEMENT}	The tab to append to the tool panel header         
 */
function createTPTab(tabId, tabInfo){
	tab = document.createElement("div");
	tab.id = tabId;
	tab.classList.add("toolPanelTab");
	tab.setAttribute("tabName", tabInfo.tabName);

	if (tabInfo.icon) tab.appendChild( faIcon(tabInfo.icon) );
	if (tabInfo.text) tab.appendChild(document.createTextNode(tabInfo.text));

	tab.addEventListener("click", (e)=>{
		if (!e.target.hasAttribute("active")){
			setActiveTPTab( e.target.id.replace("TPTab", "") );
		}
	});
	return tab;
}

/**
 * Switches tabs on the tool panel
 * @param {String} tabName ["node" or "draw"]
 */
function setActiveTPTab(tabName){
	let newActiveTab = document.getElementById(tabName + "TPTab");

	//Deactivate a previously selected tab
	let activeTab = document.querySelector(".toolPanelTab[active]");
	if (activeTab){ 
		activeTab.removeAttribute("active");
		document.getElementById(activeTab.id + "Fields").removeAttribute("active");
	};
	newActiveTab.setAttribute("active", "");
	document.getElementById(newActiveTab.id + "Fields").setAttribute("active", "");
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
		selector.addEventListener("change", (event)=>{
			lineExample.style.borderWidth = event.target.value + "px";
		});
	}
	return container;
}


function setTPSelection(elementType){
	if( !document.getElementById("nodeTPTab").hasAttribute("active") ) setActiveTPTab("node");
	document.querySelectorAll("#nodeTPTabFields .toolPanelField").forEach( (field)=>{
		if(field.getAttribute("visibleFor").includes(elementType)){
			field.removeAttribute("hidden");
		} else{
			field.setAttribute("hidden", "");
		}
	});
}

function setStyleSelection(elementType){

}

function createRadioOptions(fieldName, fieldInfo){
	let options = createElement("span", "fieldOptions");

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
	let field = createElement("span", "fieldOptions");

	let slider = createElement("input", "sliderField", {id: fieldId, type: "range",
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
	let button = createElement("label", [fieldInfo.inputType], {for: fieldId}, span);
	let icon = faIcon(fieldInfo.icon.name, fieldInfo.icon.style);
	button.appendChild(icon);

	button.appendChild(document.createTextNode(fieldInfo.label));

	return span;
}

/**
 * Helper function to create a DOM element with optional Id and Classes
 * @param  {String} tagName The name of the DOM tag to be created
 * @param  {String} classes Classes of the element.  Can be a string or array
 * @param  {Object} attributes An object of key-value pairs corresponding to
 *                             attribute names and values
 * @param {HTMLELEMENT} parentElement the element to append the created element to
 * @return {HTMLELEMENT}    The created element if no parentElement was passed
 */
function createElement(tagName, classes=null, attributes=null, parentElement=null){
	let element = document.createElement(tagName);
	if (classes){
		classes = typeof classes === "string" ? [classes] : classes;
		element.classList.add(...classes);
	}
	if (attributes){
		Object.keys(attributes).forEach( (attr)=>{
			if (attributes.hasOwnProperty(attr)){
				element.setAttribute(attr, attributes[attr]);
			}
		})
	}
	if (parentElement) parentElement.appendChild(element)
	return element;
}

/**
 * Creates a FontAwesome icon element from an icon name
 * @param {String} iconName The name of the icon without any prefixes ("Cog")
 * @param {String} faStyle	The fontAwesome style prefix to use ("fas" | "far")
 * @param {Boolean} returnClassesOnly If true, returns the classlist
 * @return {HTMLELEMENT}     A span element containing the icon
 */
function faIcon(iconName, faStyle = "fas", returnClassesOnly=false){
	var icon = document.createElement("span");
	icon.classList.add("icon", faStyle, ("fa-" + iconName) );
	if (returnClassesOnly) return icon.classList;
	else return icon;
}