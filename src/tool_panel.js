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

function getColorGroup(groupName){
	let colorsInGroup = [];
	THEME_COLORS.colorGroups[groupName].forEach( (colorName)=>{
		colorsInGroup.push(THEME_COLORS.colors[colorName]);
	});
	return colorsInGroup;
}

var toolPanelTabs = {
	nodeTPTab: {text: "Node", icon: "pencil-alt", fields: {
		elementType:{name: null, 		inputType: "selector", 	function: null,				options: ["node", "link", "group"]},
		nodeShape: 	{name: "Shape", 	inputType: "radio", 	function: setNodeShape,		optionType: "shapes", options: NODE_SHAPES, icons: NODE_SHAPE_ICONS, elements:["node"] },
		nodeFill: 	{name: "Fill",		inputType: "radio",		function: setNodeColor,		optionType: "colors", options: getColorGroup("mapElements"), elements: ["node"]},
		opacity: 	{name: "Opacity", 	inputType: "slider",	function: null,				range: {min: 0, max: 100, unit: "%"}, elements: ["node"] },
		borderType: {name: "Border", 	inputType: "radio", 	function: null,				optionType: "borders", options: ["solid", "none"], elements: ["node", "link"] },
		borderColor:{name: "Color", 	inputType: "radio", 	function: setBorderColor, 	optionType: "colors", options: getColorGroup("mapElements"), elements: ["node", "link"] },
		label: 		{name: "Label", 	inputType: "font", 		function: null,				elements: ["node", "link"] },
		labelColor: {name: "Color", 	inputType: "radio", 	function: setLabelColor,	optionType: "colors", options: getColorGroup("text"), elements: ["node", "link"]}
	}}, 
	drawTPTab: {text: "Draw", icon: "project-diagram", fields: {
		lineColor:  {name: "Color", inputType: "radio", optionType: "colors", options: getColorGroup("mapElements")},
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
	if (!tabName.contains){}
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
	let fieldDiv = document.createElement("div");
	fieldDiv.classList.add("toolPanelField");
	fieldDiv.id = fieldId + "Field";

	let fieldName = document.createElement("div");
	fieldName.classList.add("fieldName");
	fieldName.appendChild(document.createTextNode(fieldValues.name));
	fieldDiv.appendChild(fieldName);

	let fieldOptions;
	switch(fieldValues.inputType){
		case "radio":
			fieldOptions = createRadioOptions(fieldId, fieldValues);
			break;
		default:
			fieldOptions = document.createElement("span");
			break;
	}
	fieldDiv.appendChild(fieldOptions);

	return fieldDiv;
}

function createRadioOptions(fieldName, fieldInfo){
	let options = createElement("span", null, "fieldOptions");

	let optionValues = fieldInfo.options;
	optionValues.forEach( (optionValue)=>{
		let option = createElement("span", null, "fieldOption");
		options.appendChild(option);

		let radio = createElement("input", null, "radioOption");
		radio.setAttribute("type", "radio");
		radio.setAttribute("name", fieldName);
		radio.setAttribute("value", optionValue);
		option.appendChild(radio);

		let selectedBorder = createElement("div", null, "selectedBorder");
		option.appendChild(selectedBorder);

		switch (fieldInfo.optionType){
			case "colors":
				radio.addEventListener("change", (e)=>{ fieldInfo.function(e.target.value) })
				radio.classList.add("colorOption");
				radio.style.backgroundColor = optionValue;
				break;
			case "shapes":
				radio.addEventListener("change", (e)=>{ fieldInfo.function(e.target.value)});
				radio.classList.add("shapeOption");
				//Add the fontAwesome icon styles to the radio buttons
				let optionIcon = fieldInfo.icons[optionValue];
				radio.classList.add( ...faIcon( optionIcon.icon, optionIcon.style, true ));
				break;
			case "borders":
				radio.classList.add("borderOption");
				let id = optionValue + "BorderOption"
				radio.id = id;
				let label = createElement("label", null, "borderOptionLabel");
				label.setAttribute("for", id);
				label.appendChild(document.createTextNode(optionValue));				
				option.appendChild(label);
				break;
			default:
				break;
		}
	});
	return options;
}

/**
 * Helper function to create a DOM element with optional Id and Classes
 * @param  {String} tagName The name of the DOM tag to be created
 * @param  {String} id      The ID of the Element
 * @param  {String} classes Classes of the element.  Can be a string or array
 *                          of strings
 * @return {HTMLELEMENT}    The created element
 */
function createElement(tagName, id, classes){
	let element = document.createElement(tagName);
	if(id) element.setAttribute("id", id);
	if (classes){
		classes = typeof classes === "string" ? [classes] : classes;
		element.classList.add(...classes);
	}
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