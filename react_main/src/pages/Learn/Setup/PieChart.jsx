import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export const PieChart = ({
  data,
  colors,
  displayPieChart,
  suffixFn = (value) => "",
}) => {
  const svgRef = useRef();

  const noPieChartMsg = !displayPieChart && (
    <div style={{ marginBottom: "5px" }}>No pie chart.</div>
  );

  useEffect(() => {
    const width = 200;
    const height = width;
    const margin = 24;
    const radius = Math.min(width, height) / 2 - margin;
    const lb = -width / 2;
    const rb = width / 2;

    const labelRadiusOffset = -50;
    const labelRadiusOffset2 = -10;

    // Clear any existing content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie().value((d) => d[1]);
    const data_ready = pie(Object.entries(data));

    // Start off with a basic pie chart with slices
    svg
      .selectAll("potato")
      .data(data_ready)
      .join("path")
      .attr("d", d3.arc().innerRadius(0).outerRadius(radius))
      .attr("fill", (d) => {
        let type = d.data[0];
        return colors[type];
      })
      .attr("stroke", "#242424")
      .style("stroke-width", "2px")
      .style("stroke-opacity", "0.2");

    // Draw the actual labels. Include intermediate variables for later use
    svg
      .selectAll("text")
      .data(data_ready)
      .enter()
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", function (d) {
        var a = d.startAngle + (d.endAngle - d.startAngle) / 2 - Math.PI / 2;
        d.cx = Math.cos(a) * (radius + labelRadiusOffset);
        return (d.x = Math.cos(a) * (radius + labelRadiusOffset2));
      })
      .attr("y", function (d) {
        var a = d.startAngle + (d.endAngle - d.startAngle) / 2 - Math.PI / 2;
        d.cy = Math.sin(a) * (radius + labelRadiusOffset);
        return (d.y = Math.sin(a) * (radius + labelRadiusOffset2));
      })
      .text(function (d) {
        return d.data[0] + suffixFn(d.data[1]);
      })
      .style("font", "14px sans-serif")
      .style("fill", "#FFFFFF")
      .each(function (d) {
        d.bbox = this.getBBox();
        d.sx = d.x - d.bbox.width / 2 - 2;
        d.ox = d.x + d.bbox.width / 2 + 2;
        d.sy = d.oy = d.y + 5;

        // Compensate for text being outside of the drawing
        if (d.sx < lb) {
          d.dx = lb - d.sx;
        } else if (d.ox > rb) {
          d.dx = rb - d.sx;
        } else {
          d.dx = 0;
        }
      })
      .attr("dx", (d) => d.dx);

    // Make text easier to read by giving it a background
    const xRectPadding = 1;
    const yRectPadding = 2;
    svg
      .selectAll("rect")
      .data(data_ready)
      .join("rect")
      .attr("x", (d) => d.x - d.bbox.width / 2)
      .attr("y", (d) => d.y)
      .style("fill", "black")
      .style("opacity", "0.5")
      .attr("width", (d) => d.bbox.width + 2 * xRectPadding)
      .attr("height", (d) => d.bbox.height + 2 * yRectPadding)
      .attr("transform", function (d) {
        return `translate(${
          -1 * xRectPadding + d.dx
        }, -${d.bbox.height * 0.8 + yRectPadding})`;
      });

    // Draw a dot at the end of the path
    svg
      .append("defs")
      .append("marker")
      .attr("id", "circ")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("refX", 3)
      .attr("refY", 3)
      .append("circle")
      .attr("cx", 3)
      .attr("cy", 3)
      .attr("r", 3);

    // Draw the line from the label to its slice
    svg
      .selectAll("potato.pointer")
      .data(data_ready)
      .enter()
      .append("path")
      .attr("class", "pointer")
      .style("fill", "none")
      .style("stroke", "black")
      .attr("marker-end", "url(#circ)")
      .attr("d", function (d) {
        if (d.cx > d.ox) {
          return (
            "M" +
            d.sx +
            "," +
            d.sy +
            "L" +
            d.ox +
            "," +
            d.oy +
            " " +
            d.cx +
            "," +
            d.cy
          );
        } else {
          return (
            "M" +
            d.ox +
            "," +
            d.oy +
            "L" +
            d.sx +
            "," +
            d.sy +
            " " +
            d.cx +
            "," +
            d.cy
          );
        }
      });

    // Bring the text to the foreground as a final step
    svg.selectAll("text").data(data_ready).raise();
  }, [data, colors]);

  return (
    <div className="pie-chart">
      <div style={{ display: displayPieChart ? "block" : "none" }}>
        <svg ref={svgRef} />
      </div>
      {noPieChartMsg}
    </div>
  );
};
