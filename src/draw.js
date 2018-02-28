webstrate.on("loaded", function() {;
  (function() {

    let svg;
    let penColor = "black";
    let penThickness = 3;

    /**
     * Calculates the mid-point between the two points A and B and then returns
     * the mid-point.
     * 
     * @param {any} pointA The point A.
     * @param {any} pointB The point B.
     * @returns The mid-point between point A and point B.
     */
    const midPointBetween = (pointA, pointB) => {
      return {
        x: (pointA.x + pointB.x) / 2,
        y: (pointA.y + pointB.y) / 2
      };
    }

    /**
     * Generates a path with regard to thickness of each point in path. This
     * implementation was done by @clemens.
     * 
     * @param {any} points Path points with x- and y-position and a thickness per
     * point.
     * @returns The path as string.
     */
    const generatePath = (points) => {

      const newPoints = [];
      newPoints.push(points[0]);

      for (let j = 1; j < points.length - 1; j++) {
        let p1 = points[j - 1];
        let p = points[j];
        let p2 = points[j + 1];
        let c = {
          x: p2.x - p1.x,
          y: p2.y - p1.y
        };
        let n = {
          x: -c.y,
          y: c.x
        };
        let len = Math.sqrt(n.x * n.x + n.y * n.y);
        if (len === 0) continue;
        let u = {
          x: n.x / len,
          y: n.y / len
        };

        newPoints.push({
          x: p.x + u.x * p.thickness,
          y: p.y + u.y * p.thickness
        });
      }
      newPoints.push(points[points.length - 1]);

      for (let j = points.length - 2; j > 0; j--) {
        let p1 = points[j + 1];
        let p = points[j];
        let p2 = points[j - 1];
        let c = {
          x: p2.x - p1.x,
          y: p2.y - p1.y
        };
        let n = {
          x: -c.y,
          y: c.x
        };
        let len = Math.sqrt(n.x * n.x + n.y * n.y);
        if (len == 0) continue;
        let u = {
          x: n.x / len,
          y: n.y / len
        };

        newPoints.push({
          x: p.x + u.x * p.thickness,
          y: p.y + u.y * p.thickness
        });
      }
      let p1 = newPoints[0];
      let p2 = newPoints[1];
      let pathString = "M" + p1.x + " " + p1.y;
      for (let j = 1; j < newPoints.length; j++) {
        let midPoint = midPointBetween(p1, p2);
        if (isNaN(p1.x) || isNaN(p1.y) || isNaN(midPoint.x) || isNaN(midPoint.y)) {
          console.log("NaN");
        }
        pathString = pathString += " Q " + p1.x + " " + p1.y + " " + midPoint.x + " " + midPoint.y;
        p1 = newPoints[j];
        p2 = newPoints[j + 1];
      }

      return pathString;
    }


    const onPenDown = (pen, points, path) => {
      const { x, y, thickness } = pen;

      const point = { x, y, thickness };
      points.push(point);

      path.setAttribute("d", generatePath(points));
      path.setAttribute("fill", pen.color);

      svg.appendChild(path);
    }

    const onPenMove = (pen, points, path) => {
      const { x, y, thickness } = pen;

      const point = { x, y, thickness };
      points.push(point);

      path.setAttribute("d", generatePath(points));
    }

    const createToolPalette = () => {

      const toolPalette = document.querySelector('#tool-palette');

      const drawingTools = document.createElement("div");
      drawingTools.setAttribute("class", "drawing-instrument-tools");

      const clearCanvas = document.createElement("div");
      clearCanvas.setAttribute("class", "instrument-tool clear-drawing-canvas");
      clearCanvas.addEventListener("touchstart", event => {
        Array.from(document.querySelectorAll("path")).forEach(svg => {
          svg.remove();
        });
      });
      clearCanvas.addEventListener("click", event => {
        Array.from(document.querySelectorAll("path")).forEach(svg => {
          svg.remove();
        });
      });
      drawingTools.appendChild(clearCanvas);
      
      const eraser = document.createElement("div");
      eraser.setAttribute("class", "instrument-tool erase-drawing-canvas");
      eraser.addEventListener("click", event => {
        eraser_enabled = !eraser_enabled;
        console.log("eraser_enabled = " + eraser_enabled);
        if (eraser_enabled) eraser.style.background="black";
        else eraser.style.background = "darkgrey";
      });
      drawingTools.appendChild(eraser);

      const thicknesses = [ 3, 6, 9, 12 ];
      
      const thicknessesElement = document.createElement("div");
      thicknessesElement.setAttribute("class", "thicknesses");
      drawingTools.appendChild(thicknessesElement);
      
      let activeThickness;
      thicknesses.forEach((thickness, index) => {
        const thicknessElement = document.createElement("li");
        thicknessElement.setAttribute("class", "instrument-tool thickness");
        thicknessElement.style.background = "darkgrey";
        thicknessElement.style.fontSize = thickness/2*0.25 + "em";
        thicknessesElement.appendChild(thicknessElement);

        thicknessElement.addEventListener("touchstart", event => {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();

          if (activeThickness) {
            activeThickness.removeAttribute("active");
          }
          
          eraser_enabled = false;
          eraser.style.background = "darkgrey";

          thicknessElement.setAttribute("active", "true");
          activeThickness = thicknessElement;

          penThickness = thickness;
        }, true);
        
        thicknessElement.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();

          if (activeThickness) {
            activeThickness.removeAttribute("active");
          }
          
          eraser_enabled = false;
          eraser.style.background = "darkgrey";

          thicknessElement.setAttribute("active", "true");
          activeThickness = thicknessElement;

          penThickness = thickness;
        }, true);

        if (index === 0) {
          penThickness = thickness;
          thicknessElement.setAttribute("active", "true");
          activeThickness = thicknessElement;
        }
      });
      
      const colors = [
        "black",
        "grey",
        "darkred",
        "green",
        "blue",
        "orange",
        "yellow"
      ];

      const colorsElement = document.createElement("div");
      colorsElement.setAttribute("class", "colors");
      drawingTools.appendChild(colorsElement);

      let activeColor;
      colors.forEach((color, index) => {
        const colorElement = document.createElement("li");
        colorElement.setAttribute("class", "instrument-tool color");
        colorElement.style.background = color;
        colorsElement.appendChild(colorElement);

        colorElement.addEventListener("touchstart", event => {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();

          if (activeColor) {
            activeColor.removeAttribute("active");
          }

          colorElement.setAttribute("active", "true");
          activeColor = colorElement;

          penColor = color;
        }, true);
        
        colorElement.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();

          if (activeColor) {
            activeColor.removeAttribute("active");
          }
          
          eraser_enabled = false;
          eraser.style.background = "darkgrey";

          colorElement.setAttribute("active", "true");
          activeColor = colorElement;

          penColor = color;
        }, true);

        if (index === 0) {
          penColor = color;
          colorElement.setAttribute("active", "true");
          activeColor = colorElement;
        }
      });

      let isVisible = true;
      drawingTools.show = () => {
        drawingTools.style.opacity = 1.0;
        drawingTools.style.pointerEvents = "all";
        isVisible = true;
      };

      drawingTools.hide = () => {
        drawingTools.style.pointerEvents = "none";
        drawingTools.style.opacity = 0.0;
        isVisible = false;
      };

      drawingTools.isVisible = () => {
        return isVisible;
      }

      toolPalette.appendChild(drawingTools);

      return drawingTools;
    }
    const toolPalette = createToolPalette();


    const getMousePenPoint = (event) => {
      let transformable = event.target.closest('.transformable') || event.target.closest('.transformable-local');

      // This is a hack and workaround because the outermost canvas uses the body as hammer target and therefore, we try
      // to find the actual drawable.
      if (!transformable) {
        transformable = event.target.querySelector('.transformable-local');
      }

      if (transformable) {
        let penPoint = new Transformer.Point(event.clientX, event.clientY);
        return transformable.transformer.fromGlobalToLocal(penPoint);
      }
      return {
        x: event.clientX,
        y: event.clientY
      };
    }

    const getTouchPenPoint = (event, touch) => {
      let transformable = event.target.closest('.transformable') || event.target.closest('.transformable-local');

      // This is a hack and workaround because the outermost canvas uses the body as hammer target and therefore, we try
      // to find the actual drawable.
      if (!transformable) {
        transformable = event.target.querySelector('.transformable-local');
      }

      if (transformable) {
        let penPoint = new Transformer.Point(touch.clientX, touch.clientY);
        return transformable.transformer.fromGlobalToLocal(penPoint);
      }
      return {
        x: touch.clientX,
        y: touch.clientY
      };
    }

    const getPenThickness = (event, force) => {
      let transformable = event.target.closest('.transformable') || event.target.closest('.transformable-local');

      // This is a hack and workaround because the outermost canvas uses the body as hammer target and therefore, we try
      // to find the actual drawable.
      if (!transformable) {
        transformable = event.target.querySelector('.transformable-local');
      }

      if (transformable) {
        const globalScale = transformable.transformer.globalScale;
        return (globalScale.x) * force * 3;
      }

      return force * 3;
    }

    const ns = "http://www.w3.org/2000/svg";
    let path = null;
    let points = [];
    let timeout;

    canvas.addEventListener("mousedown", event => {
      if (!drawing_enabled) return;
      mouseDown++;
      
      if (!eraser_enabled) {
        console.log("Eraser Mode Off");
        
        if (event.target.closest('.instrument-tool')) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (timeout) {
          clearTimeout(timeout);
        }
        window.isManipulationEnabled = false;

        let drawable = event.target.closest('.drawable');
        if (!drawable) {
          drawable = event.target.querySelector('.drawable');
        }
        svg = drawable.querySelector(':scope>svg');

        if (!svg) {
          svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
          svg.setAttribute("xlink", "http://www.w3.org/1999/xlink");
          svg.setAttribute("xmlns:xlink", "");
          svg.setAttribute("class", "drawing-canvas")

          drawable.insertBefore(svg, drawable.firstElementChild);
        }

        path = document.createElementNS(ns, "path");
        points.length = 0;

        const pen = getMousePenPoint(event);
        pen.thickness = penThickness ? penThickness : 3;
        pen.color = penColor ? penColor : "black";

        onPenDown(pen, points, path);
      }
      
      else {
        console.log("Eraser Mode On");
        
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        if (!hoveredEle) return;
        hoveredEle.parentNode.removeChild(hoveredEle);
        original_color = null;
        hoveredEle = null;
      }
    }, true);

    canvas.addEventListener("mousemove", event => {
      if (!drawing_enabled) return;
      if (mouseDown === 0) return;
      
      if (!eraser_enabled) {
        if (mouseUp >= 1 && mouseDown >= 1) {
          resetState();
          return;
        }

        if (path === null) return;

        if (event.target.closest('.instrument-tool')) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const pen = getMousePenPoint(event);
        pen.thickness = penThickness ? penThickness : 3;
        pen.color = penColor ? penColor : "black";

        onPenMove(pen, points, path);
      }
      
      else {
        console.log("Eraser Mode On");
        
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        if (!hoveredEle) return;
        hoveredEle.parentNode.removeChild(hoveredEle);
        original_color = null;
        hoveredEle = null;
      }
      
    }, true);

    canvas.addEventListener("mouseup", event => {
      if (!drawing_enabled) return;
      if (eraser_enabled) {
        resetState();
        return;
      }
      mouseUp++;

      timeout = setTimeout(() => {
        window.isManipulationEnabled = true;
      }, 250);
    }, true);
    
    canvas.addEventListener("mouseover", event => {
      if (!drawing_enabled || !eraser_enabled) return;
      if (event.target.tagName != "path") return;
      hoveredEle = event.target;
      original_color = hoveredEle.getAttribute("fill");
      hoveredEle.setAttribute("fill", "red");
    }, true);
    
    canvas.addEventListener("mouseout", event => {
      if (!drawing_enabled || !eraser_enabled) return;
      if (!hoveredEle) return;
      hoveredEle.setAttribute("fill", original_color);
      original_color = null;
      hoveredEle = null;
    }, true);
    


    /*
     * Touch events for touch surface.
     * Event: touchstart
     */
    window.addEventListener("touchstart", event => {
      if (!drawing_enabled) return;   // Not in Drawing Mode
      
      if (!eraser_enabled) {          // In Drawing Mode, Not in Eraser Mode
        if (event.touches.length !== 1) return;
        let touch = event.touches[0];
        if (touch.force === 0) return;
        if (event.target.closest('.instrument-tool')) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (timeout) {
          clearTimeout(timeout);
        }
        window.isManipulationEnabled = false;

        let drawable = event.target.closest('.drawable');
        if (!drawable) {
          drawable = event.target.querySelector('.drawable');
        }
        svg = drawable.querySelector(':scope>svg');

        if (!svg) {
          svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
          svg.setAttribute("xlink", "http://www.w3.org/1999/xlink");
          svg.setAttribute("xmlns:xlink", "");
          svg.setAttribute("class", "drawing-canvas")

          drawable.insertBefore(svg, drawable.firstElementChild);
        }

        path = document.createElementNS(ns, "path");
        points.length = 0;

        const pen = getTouchPenPoint(event, touch);
        pen.thickness = getPenThickness(event, touch.force);
        pen.color = penColor ? penColor : "black";

        onPenDown(pen, points, path);
      }
      
      else {                          // In Eraser Mode
        console.log("eraser mode open");
        
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        if (event.target.tagName == "path") {
          let toRemove = event.target;
          toRemove.parentNode.removeChild(toRemove);
        }
        
      }
      
      
    }, true);

    /*
     * Touch events for touch surface.
     * Event: touchmove
     */
    window.addEventListener("touchmove", event => {
      if (!drawing_enabled) return;
      if (!eraser_enabled) {
        if (event.touches.length !== 1) return;
        let touch = event.touches[0];
        if (touch.force === 0) return;

        if (event.target.closest('.instrument-tool')) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const pen = getTouchPenPoint(event, touch);
        pen.thickness = getPenThickness(event, touch.force);
        pen.color = penColor ? penColor : "black";

        onPenMove(pen, points, path);
      }
      
      else {
        console.log("eraser mode open");
        
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        if (event.target.tagName == "path") {
          let toRemove = event.target;
          toRemove.parentNode.removeChild(toRemove);
        }
      }
    }, true);

    /*
     * Touch events for touch surface.
     * Event: touchmove
     * We will need this code later to avoid unintended manipulation of
     * the pad. It works together with the manipulation instrument.
     */
    window.addEventListener("touchend", event => {
      if (!drawing_enabled) return;
      if (eraser_enabled) return;
      timeout = setTimeout(() => {
        window.isManipulationEnabled = true;
      }, 250);
    }, true);


  })();
});
