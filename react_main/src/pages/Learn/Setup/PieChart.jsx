import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export const PieChart = ({
  data,
  colors,
  displayPieChart,
  suffixFn = (value) => "",
  tooltipFn,
  showLabels = true,
  labelThreshold = 0.3,
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

    const svgRoot = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Unique id per render so multiple charts on the same page don't collide
    // on the glow filter definition.
    const uid = Math.random().toString(36).slice(2, 9);

    const defs = svgRoot.append("defs");
    const filter = defs
      .append("filter")
      .attr("id", `pie-glow-${uid}`)
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    filter
      .append("feGaussianBlur")
      .attr("in", "SourceAlpha")
      .attr("stdDeviation", 4)
      .attr("result", "blur");
    filter
      .append("feFlood")
      .attr("flood-color", "#ffffff")
      .attr("flood-opacity", 0.55)
      .attr("result", "color");
    filter
      .append("feComposite")
      .attr("in", "color")
      .attr("in2", "blur")
      .attr("operator", "in")
      .attr("result", "glow");
    const merge = filter.append("feMerge");
    merge.append("feMergeNode").attr("in", "glow");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    const svg = svgRoot
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie().value((d) => d[1]);
    const data_ready = pie(Object.entries(data));
    const total = data_ready.reduce((acc, d) => acc + d.data[1], 0);

    const arcGenerator = d3.arc().innerRadius(0).outerRadius(radius);
    const arcHover = d3
      .arc()
      .innerRadius(0)
      .outerRadius(radius + 6);

    // Start off with a basic pie chart with slices
    const slices = svg
      .selectAll("path.slice")
      .data(data_ready)
      .join("path")
      .attr("class", "slice")
      .attr("d", arcGenerator)
      .attr("fill", (d) => {
        let type = d.data[0];
        return colors[type];
      })
      .attr("stroke", "#000")
      .style("stroke-width", "2px")
      .style("stroke-opacity", "1")
      .style("cursor", "pointer")
      .style("transition", "filter 200ms ease");

    // Native browser tooltip per slice. Callers that want a different
    // format from the on-chart label can pass a tooltipFn; otherwise we
    // fall back to suffixFn so the tooltip reads at least as well as
    // the chart label.
    slices
      .append("title")
      .text((d) =>
        tooltipFn
          ? tooltipFn(d.data[0], d.data[1])
          : `${d.data[0]}: ${d.data[1]}${suffixFn(d.data[1])}`
      );

    // Hover: slice expands slightly and picks up a white glow.
    slices
      .on("mouseenter", function () {
        d3.select(this)
          .style("filter", `url(#pie-glow-${uid})`)
          .transition()
          .duration(180)
          .ease(d3.easeCubicOut)
          .attrTween("d", function (d) {
            return () => arcHover(d);
          });
      })
      .on("mouseleave", function () {
        d3.select(this)
          .style("filter", null)
          .transition()
          .duration(180)
          .ease(d3.easeCubicOut)
          .attrTween("d", function (d) {
            return () => arcGenerator(d);
          });
      });

    if (!showLabels) return;

    // Only label slices that are a meaningful share of the pie — small
    // slices overlap each other and clip the chart edge. Hover still
    // surfaces the label via the slice's <title> tooltip.
    const labeledData = data_ready.filter(
      (d) => total > 0 && d.data[1] / total >= labelThreshold
    );

    // Draw the actual labels. Include intermediate variables for later use
    svg
      .selectAll("text")
      .data(labeledData)
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
      // Labels sit ON TOP of the pie. Without this, hovering the label eats
      // the mouse event and the slice's <title> tooltip never fires.
      .style("pointer-events", "none")
      .each(function (d) {
        d.bbox = this.getBBox();
        d.sx = d.x - d.bbox.width / 2 - 2;
        d.ox = d.x + d.bbox.width / 2 + 2;
        d.sy = d.oy = d.y + 5;

        // Compensate for text being outside of the drawing
        if (d.sx < lb) {
          d.dx = lb - d.sx;
        } else if (d.ox > rb) {
          d.dx = rb - d.ox;
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
      .data(labeledData)
      .join("rect")
      .attr("x", (d) => d.x - d.bbox.width / 2)
      .attr("y", (d) => d.y)
      .style("fill", "black")
      .style("opacity", "0.5")
      .style("pointer-events", "none")
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
      .data(labeledData)
      .enter()
      .append("path")
      .attr("class", "pointer")
      .style("fill", "none")
      .style("stroke", "black")
      .style("pointer-events", "none")
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
    svg.selectAll("text").data(labeledData).raise();
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
