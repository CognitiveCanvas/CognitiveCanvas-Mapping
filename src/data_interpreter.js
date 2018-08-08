REP_TEMPLATES = {
	'mapping': {
		'node': NODE_TEMPLATE,
		'link': LINK_TEMPLATE
	}
};

MASTER_TEMPLATE = {

};

//TODO
function generateAttributeMap(){
	Object.keys(REP_TEMPLATES).forEach((repType)=>{
		Object.keys(repType).forEach((eleType)=>{

		})
	})
}

/**
 * Creates a new data object representing an element based on a template of a 
 * certain type of element within a certain type of representation (e.g. a 
 * node within the 'mapping' representation)
 * 
 * @param  {String} repType - "mapping"|"outline"|"notecards"|etc - the
 * representation type from which the template is created 
 * @param  {String} eleType - "node"|"link"|"image" - the top-level element 
 * type within the representation that is being created
 * @param  {Object} eleInfo - Unstructured, flat JSON containing all the 
 * attributes to be merged into the new data object, overwriting the template.
 * See templates for attribute names
 * 
 * @return {object} The data object representing an element created from the
 * template representation type and element type, merged with optional
 * attributes
 */
function objFromTemplate(repType, eleType, eleInfo={}){
	let template = REP_TEMPLATES[repType][eleType];
	let object = {}

	let iterate = function(currObj, currTemp){
		Object.keys(currTemp).forEach((currProp)=>{
			if (currTemp[currProp] && typeof currTemp[currProp] === "object"){
				currObj[currProp] = {};
				iterate(currObj[currProp], currTemp[currProp]);
			}
			else if (eleInfo.hasOwnProperty(currProp)) {
				currObj[currProp]=eleInfo[currProp];
			}
			else{
				currObj[currProp]= currTemp[currProp];
			} 
		});
	}
	iterate(object, template);
	return object;
}

 /**
  * Creates a unique ID for a top-level DOM element such as a Node, Link, Image, or Path
  *
  * @return {string} ID
  *   a unique ID made from the current client ID and the timestamp
  */
function generateObjectId() {
  return clientId + "_" + Date.now();
}

function addRepType(eleObject, repType, eleType, eleInfo={}){
	let newRepInfo = objFromTemplate(repType, eleType, eleInfo);
	deepMerge(eleObject, newRepInfo, overwrite=false)
}

function deepMerge(targetObject, sourceObject, overwrite=true){
	let iterate = function(target, source){
		Object.keys(source).forEach( (attr)=>{
			if(source[attr] && typeof source[attr] ==="object"){
				if(!target.hasOwnProperty(attr)) target[attr] = {};
				iterate(target[attr], source[attr])
			} else if(!target.hasOwnProperty(attr) || overwrite){
				target[attr] = source[attr]
			}
		});
	}
	iterate(targetObject, sourceObject);	
}

function styleFromInfo(element, eleInfo, repType, eleType, childElementClass=null){
	let classNames;
	let style = eleInfo.reps[repType].elements[eleType].style;
	
	if( !childElementClass ) classNames = Object.keys(style); //find and style all elements
	else classNames = [childElementClass]; //only style the element specified
	
	classNames.forEach( (className)=>{ 
		let domEle = element.getElementsByClassName(className)[0];
		Object.keys(style[className]).forEach((attr)=>{
			domEle.style[attr] = style[className][attr];
		});
	});
}

//UNIMPLEMENTED DATA LAYER FUNCTIONS