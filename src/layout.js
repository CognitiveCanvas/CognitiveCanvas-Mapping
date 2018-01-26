/*
 * This function is used to get current spatial layout
 * of node from exsiting canvas. (Including nodes not
 * in current view)
 *
 * @return {JSON}: - stringfy json of layout data
 */
function getNodeSpatialLayout() {
  let nodeSpatialLayout = [];
  let nodeElements = document.getElementsByClassName("node");

  for (var i = 0; i < nodeElements.length; i++) {
    let curNode = nodeElements[i];
    nodeSpatialLayout.push(JSON.stringify({
      "x": getNodePosition(curNode)[0],
      "y": getNodePosition(curNode)[1],
      "id": curNode.getAttribute("id")
    }));
  }

  return nodeSpatialLayout;
}

/**
 * Save the node layout on current canvas
 */
function saveNodeSpatialLayout() {
  //Check if data node spatial layout block exists
  initHTMLElement(DATA_COLLECTION, SPATIAL_LAYOUT, true);

  let layoutData = initHTMLElement(SPATIAL_LAYOUT, SPATIAL_LAYOUT_DP, false);
  setElementAttribute(layoutData, "timestamp", Date.now());
  setElementAttribute(layoutData, "layout", getNodeSpatialLayout());
}