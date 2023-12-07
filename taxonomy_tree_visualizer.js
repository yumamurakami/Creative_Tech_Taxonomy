// app that creates a collapsible tree visualization using D3

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import JSONEditor from "https://cdn.jsdelivr.net/npm/jsoneditor@9.10.4/+esm";
import {downloadJSON, toggleFold} from "./handle_interactions_panel.js";


fetch('./Creative_Tech_Taxonomy_data.json')
.then(response => {
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
})
.then(data => {
  // set_tabs();
  // console.log(data);
  create_editor(data);
  create_visualization(data);
})
.catch(error => console.log(error));


const BG_COLOR = "aliceblue";

function color(d) {


  //color all the nodes
  function checkAncestors(node, name) {
    if (!node) {
      return false;
    }
    if (node.data.name === name) {
      return true;
    }
    return checkAncestors(node.parent, name);
  }

  if (checkAncestors(d, "Creative Code Frameworks")) {
    return "pink";
  } else if (checkAncestors(d, "Real-time 3D/Game Engines")) {
    return "deepskyblue";
  } else if (checkAncestors(d, "AI/Machine Learning")) {
    return "red";
  }  else if (checkAncestors(d, "Uncategorized Utilities/DevOps")) {
    return "firebrick";
  } else if (checkAncestors(d, "Pro AV Hardware and Related Software")) {
    return "darksalmon";
  } else if (checkAncestors(d, "Optical Tracking")) {
    return "darkmagenta";
  } else if (checkAncestors(d, "Sensors/Interaction Methods")) {
    return "darkviolet";
  } else if (checkAncestors(d, "Physical Computing")) {
    return "lightblue";
  } else if (checkAncestors(d, "Web/Networking Frameworks")) {
      return "limegreen";
  } else if (checkAncestors(d, "Mobile Technology")) {
    return "gold";
  } else if (checkAncestors(d, "Asset Creation")) {
    return "deeppink";
  }else {
    return d._children ? "#555" : "#999"; // Default color
  }
}

// Function to show the modal
function showModal(nodeData) {
  const modal = document.getElementById("myModal");
  const modalContent = document.getElementById("modalContent");

  // Generate content based on the clicked node data
  const content = `
    <h2>${nodeData.data.name}</h2>
    <p>${nodeData.data.description || 'No Description available.'}</p>
    <p>Tags: ${nodeData.data.tags ? nodeData.data.tags.join(', ') : 'No Tags available.'}</p>
    <div class="links-container">
      <p>Links:</p>
      <ul>
        ${nodeData.data.links
          ? Object.entries(nodeData.data.links).map(([type, url]) => `<li>${type}: <a href="${url}" target="_blank">${url}</a></li>`).join('')
          : 'No links available.'
        }
      </ul>
    </div>
  `;
  modalContent.innerHTML = content;
  modal.style.display = "block";

  // Attach the click event listener for the close button dynamically
  const closeButton = modal.querySelector(".close");
  closeButton.addEventListener("click", closeModal);
}

// Function to close the modal
function closeModal() {
  const modal = document.getElementById("myModal");
  modal.style.display = "none";
}

document.body.style.backgroundColor = BG_COLOR;

function create_visualization(data){    // Specify the charts’ dimensions. The height is variable, depending on the layout.
    const width = 3000;
    
    const marginTop = 100;
    const marginRight = 10;
    const marginBottom = 10;
    const marginLeft = 220;  
    const fontSize = 18; // Adjust the font size as needed
    const circleRadius = 3; // Adjust the circle radius as needed
    const strokeWidth = 3; // Adjust the stroke width as needed

    // Rows are separated by dx pixels, columns by dy pixels. These names can be counter-intuitive
    // (dx is a height, and dy a width). This because the tree must be viewed with the root at the
    // “bottom”, in the data domain. The width of a column is based on the tree’s height.
    const root = d3.hierarchy(data);
    const dx = fontSize *2 ;
    const dy = 225; // Set dy to the screen width minus the left and right margins

    // Define the tree layout and the shape for links.
    const tree = d3.tree().nodeSize([dx, dy]);
    const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);



    // Create the SVG container, a layer for the links and a layer for the nodes.
    const svg = d3.create("svg")
      .attr("width", "100%") // Set the width to 100% of the container
      .attr("height", dx)
      .attr("viewBox", [-marginLeft, -marginTop, window.innerWidth, dx]) // Set the viewBox width to the screen width
      // .attr("style", "max-width: 100%; height: auto; font: 30px Source Sans Pro; user-select: none;");        // .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif; user-select: none;");
      .attr("style", `width: auto; height: auto; font: ${fontSize}px 'Avenir', 'Roboto', Helvetica, Arial, sans-serif; overflow-x: scroll;`);
    const gLink = svg.append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", strokeWidth);

    const gNode = svg.append("g")
      .attr("cursor", "pointer")
      .attr("pointer-events", "all");

  
    function update(event, source) {
      const duration = event?.altKey ? 2500 : 250; // hold the alt key to slow down the transition
      const nodes = root.descendants().reverse();
      const links = root.links();
  
      // Compute the new tree layout.
      tree(root);
  
      let left = root;
      let right = root;
      root.eachBefore(node => {
        if (node.x < left.x) left = node;
        if (node.x > right.x) right = node;
      });
  
      const height = right.x - left.x + marginTop + marginBottom + 100;
  
      const transition = svg.transition()
          .duration(duration)
          .attr("height", height)
          .attr("viewBox", [-marginLeft, left.x - marginTop, width, height])
          .tween("resize", window.ResizeObserver ? null : () => () => svg.dispatch("toggle"));
  
      // Update the nodes…
      const node = gNode.selectAll("g")
        .data(nodes, d => d.id);
  
      // Enter any new nodes at the parent's previous position.
      
      const nodeEnter = node.enter().append("g")
      .attr("transform", d => `translate(${source.y0},${source.x0})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0);
  
      // add warping box around text node
      nodeEnter.append("rect")
      .attr("rx", 5) // Adjust the x-radius for rounded corners
      .attr("ry", 5) // Adjust the y-radius for rounded corners
      .attr("height", fontSize + 5) // Adjust the height as needed (font size + padding)
      .attr("width", d => {
        if(!d._children) {
        //this is a kludged way of fixing the fact that getComputedTextLength() doesnt seem to be working but long text entries get a little screwed up
          const textLength = d.data.name.length;
          const multiplier = Math.max(0.8, 1 - (textLength - 8) * 0.05); // Adjust the parameters as needed
          return textLength * (fontSize - 5) * multiplier + 25;
      }else{
        return 0;
      }}) // Adjust the width as needed
      .attr("fill", "lightgray") // Adjust the background color
      // .attr("x", d => d._children ? -d.data.name.length * (fontSize - 5) * Math.max(0.8, 1 - (d.data.name.length - 8) * 0.05) - 20: 0) // Center the rect around the text
      .attr("x", d => d._children ? 0: 0) // Center the rect around the text
      .attr("y", -(fontSize + 5) / 2) // Center the rect vertically around the text
      .attr('fill', color)
      .attr('stroke', "lightgray")
      .attr('stroke-width', 1)
      .attr("opacity", d => d._children ? 0 : 0.5)
      .on("mouseover", function () {
          d3.select(this).attr("transform", "scale(1.1)").transition().ease(d3.easeElastic); // Scale up by 10%
      })
      .on("mouseout", function () {
          d3.select(this).attr("transform", "scale(1)").transition().ease(d3.easeElastic); // Reset the scale
      });
      /*
      //ugh this annoyingly doesnt work because of render timing issues
      .each(function (d) {
        const rect = d3.select(this);
        const tempText = rect.append("text")
            .attr("class", "temp-text")
            .text(d.data.name);
    
        // Use requestAnimationFrame to wait for the next animation frame
        window.requestAnimationFrame(() => {
            // Use getBBox() to get the bounding box of the text
            const textWidth = tempText.node().getComputedTextLength();
           
        console.log (tempText.node())
            console.log("Text Width:", textWidth); // Log the text width
    
            // Set the width of the rectangle
            rect.attr("width", textWidth + 20); // Adjust for padding
    
            // Remove the temporary text element
            //tempText.remove();
        });
    });*/
      
      // add circleRadius depending on children or not
      // if children, add circleRadius + 3 and if opened make it hollow 
      nodeEnter.append("circle")
          .attr("r", d => d._children ? circleRadius + 2 : 0)
          .attr("fill", d => d._children ? BG_COLOR : color)
          // .attr("fill", color)
          // .attr("stroke", d => d._children ? color : null)
          .attr("stroke", color)
          .attr("stroke-width", strokeWidth-1)
          .on("mouseover", function () {
            d3.select(this).attr("transform", "scale(1.5)").transition().ease(d3.easeElastic); // Scale up by 10%
          })
          .on("mouseout", function () {
              d3.select(this).attr("transform", "scale(1)").transition().ease(d3.easeElastic); // Reset the scale
          })
          .on("click", (event, d) => {
            // // Toggle the children and toggle filled/hollow on click
            d.children = d.children ? null : d._children;
            // const isFilled = d3.select(event.currentTarget).attr("fill") !== BG_COLOR;
            // d3.select(event.currentTarget)
            //     .attr("fill", isFilled ? BG_COLOR : color)
            //     .attr("r", isFilled ? circleRadius + 2 : circleRadius + 5);
            update(event, d);
          });
      
      const linebreakThreshold = 24;
      const linebreakFontRelation = 0.9;
      nodeEnter.append('text')
          .attr("dy", d=> d.data.name.length > linebreakThreshold && d._children ?  "-0.2em": "0.31em")
          .style("font-size", d=> d.data.name.length > linebreakThreshold && d._children ?  fontSize*linebreakFontRelation: fontSize)
          .attr("x", d => d._children ? -fontSize +5 : fontSize +5)
          .attr("text-anchor", d => d._children ? "end" : "start")
          .each(function(d) {
            const text = d.data.name;
            if (text.length > linebreakThreshold && d._children) {
              const lines = splitText(text, linebreakThreshold);
              lines.forEach((line, index) => {
                d3.select(this).append("tspan")
                  .attr("dy", index > 0 ? "0.9em" : 0)
                  .attr("x", d._children ? -fontSize + 5 : fontSize + 5)
                  .style("font-size", fontSize*linebreakFontRelation)
                  .text(line);
              });
            } else {
              d3.select(this).text(text);
            }
          })
          .on("click", (event, d) => {
              // Show modal with additional information about the clicked node
              showModal(d);
              // Prevent the click event from propagating to the parent (circle) element
              d3.event.stopPropagation();
          })
          .on("mouseover", function (event, d) {
            // Scale up the corresponding rectangle on mouseover
            d3.select(this.parentNode).select("rect").attr("transform", "scale(1.2)").transition().ease(d3.easeElastic);
           })
          .on("mouseout", function (event, d) {
            // Reset the scale of the corresponding rectangle on mouseout
            d3.select(this.parentNode).select("rect").attr("transform", "scale(1)").transition().ease(d3.easeElastic);
          });
          
          // helper function to split text
          function splitText(text, maxLength) {
            const words = text.split(/\s+/); // Split by spaces
            let lines = [];
            let currentLine = words[0];
            for (let i = 1; i < words.length; i++) {
              const word = words[i];
              if (currentLine.length + word.length <= maxLength) {
                currentLine += ' ' + word;
              } else {
                lines.push(currentLine);
                currentLine = word;
              }
            }
            lines.push(currentLine);
            return lines;
          }
      
      nodeEnter.select("text")
          .clone(true).lower()
          .attr("stroke-linejoin", "round")
          .attr("stroke-width", strokeWidth)
          .attr("stroke", "white");


        
/*
          nodeEnter.select("circle")
          .on("click", (event, d) => {
            const newNodeName = prompt("Enter the name for the new node:");
            if (newNodeName) {
              // Create a new node
              const newNode = { name: newNodeName, children: [] };
        
              // Add the new node as a child of the clicked node
              if (!d.children) d.children = [];
              d.children.push(newNode);
        
              // Update the hierarchy and visualization
              const newRoot = d3.hierarchy(data);
              tree(newRoot);
              update(event, newRoot);
            }
          });
*/

      // Transition nodes to their new position.
      const nodeUpdate = node.merge(nodeEnter).transition(transition)
          .attr("transform", d => `translate(${d.y},${d.x})`)
          .attr("fill-opacity", 1)
          .attr("stroke-opacity", 1);
  
      // Transition exiting nodes to the parent's new position.
      const nodeExit = node.exit().transition(transition).remove()
          .attr("transform", d => `translate(${source.y},${source.x})`)
          .attr("fill-opacity", 0)
          .attr("stroke-opacity", 0);
  
      // Update the links…
      const link = gLink.selectAll("path")
        .data(links, d => d.target.id);
  
      // Enter any new links at the parent's previous position.
      const linkEnter = link.enter().append("path")
          .attr("d", d => {
            const o = {x: source.x0, y: source.y0};
            return diagonal({source: o, target: o});
          })
          .attr("stroke-width", strokeWidth)
          .attr("stroke", d => color(d.source)); // Set link color to the same color as nodes

  
      // Transition links to their new position.
      link.merge(linkEnter).transition(transition)
          .attr("d", diagonal)
          .attr("stroke", d => color(d.source)); // Set link color to the same color as nodes
  
      // Transition exiting nodes to the parent's new position.
      link.exit().transition(transition).remove()
          .attr("d", d => {
            const o = {x: source.x, y: source.y};
            return diagonal({source: o, target: o});
          });
  
      // Stash the old positions for transition.
      root.eachBefore(d => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }
  
    // Do the first update to the initial configuration of the tree — where a number of nodes
    // are open (arbitrarily selected as the root, plus nodes with 7 letters).
    root.x0 = dy / 2;
    root.y0 = 0;
    root.descendants().forEach((d, i) => {
      d.id = i;
      d._children = d.children;
     // if (d.depth && d.data.name.length !== 12) d.children = null;
    });


  // Collapse after the second level
  root.children.forEach(handle_collapse);
  update(null, root);

  visualizer.append(svg.node());

  document.getElementById("toggleFold").addEventListener("change",function() {
    let targetFold = toggleFold();
    console.log(targetFold);
    if(targetFold){
      // Do the first update to the initial configuration of the tree — where a number of nodes
      // are open (arbitrarily selected as the root, plus nodes with 7 letters).
      root.x0 = dy / 2;
      root.y0 = 0;
      root.descendants().forEach((d, i) => {
        d.id = i;
        d._children = d.children;
      // if (d.depth && d.data.name.length !== 12) d.children = null;
      });
      root.children.forEach(handle_collapse)
    } else{ handle_expand(root);}
    update(null, root);

  });
  
}

// DONE: make fold don't fold first layer
function handle_collapse(d){
    if(d.children) {
      d._children = d.children
      d._children.forEach(handle_collapse)
      d.children = null
  }
}

// DONE: fix expand node look
function handle_expand(d){   
  if (d._children) {        
      d.children = d._children;
      // d._children = null;       
  }
  var children = (d.children)?d.children:d._children;
  if(children)
    children.forEach(handle_expand);
}




// create json editor
function create_editor(data){
  let changedBounceTimer = null
  const refreshVisualize = () => {
    visualizer.innerHTML = "";
    create_visualization(jsonEdit.get());
  }

  // editor options
  const options = {
    onChange : () => {
      // debounce the refresh
      if(changedBounceTimer) clearTimeout(changedBounceTimer)

      console.log("json changed and set refresh timer")
      changedBounceTimer = setTimeout(refreshVisualize, 1000)
    }
  }

  // add the editor to the page
  const jsonEdit = new JSONEditor(editor, options)
  jsonEdit.set(data)
  document.getElementById("download-json").addEventListener("click",function() {
    downloadJSON(jsonEdit)});

}



