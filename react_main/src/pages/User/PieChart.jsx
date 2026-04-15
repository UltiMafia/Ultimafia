import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export const PieChart = ({ wins, losses, abandons, showTotal }) => {
  const svgRef = useRef();
  const totalGames = wins + losses + abandons;

  const displayPieChart = totalGames >= 1;
  const noPieChartMsg = !displayPieChart && (
    <div style={{ marginBottom: "5px" }}>No pie chart.</div>
  );

  useEffect(() => {
    if (totalGames <= 0) {
      return;
    }

    const width = 200;
    const height = width;
    const margin = 10;
    const radius = Math.min(width, height) / 2 - margin;

    // clear any previous render
    d3.select(svgRef.current).selectAll("*").remove();

    const svgRoot = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`);

    // unique id so multiple charts on a page don't collide
    const uid = Math.random().toString(36).slice(2, 9);

    const defs = svgRoot.append("defs");

    const sliceColors = {
      W: "#5AB220",
      L: "#FF3C38",
      A: "#BFBFBF",
    };

    // glow filter for hover
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

    const data = {};
    if (wins) data.W = wins;
    if (losses) data.L = losses;
    if (abandons) data.A = abandons;

    const pie = d3
      .pie()
      .value((d) => d[1])
      .sort(null);
    const data_ready = pie(Object.entries(data));

    const arcGenerator = d3.arc().innerRadius(0).outerRadius(radius);
    const arcHover = d3
      .arc()
      .innerRadius(0)
      .outerRadius(radius + 6);

    const slices = svg
      .selectAll("path.slice")
      .data(data_ready)
      .join("path")
      .attr("class", "slice")
      .attr("fill", (d) => sliceColors[d.data[0]])
      .attr("stroke", "rgba(0, 0, 0, 0.35)")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .style("transition", "filter 200ms ease")
      .each(function (d) {
        this._current = { startAngle: d.startAngle, endAngle: d.startAngle };
      });

    // animate slices drawing in
    slices
      .transition()
      .duration(300)
      .ease(d3.easeCubicOut)
      .attrTween("d", function (d) {
        const interp = d3.interpolate(this._current, d);
        this._current = interp(1);
        return (t) => arcGenerator(interp(t));
      });

    // percentage labels (hidden until hover)
    const labels = svg
      .selectAll("text.pie-label")
      .data(data_ready)
      .enter()
      .append("text")
      .attr("class", "pie-label")
      .text((d) => {
        const value = d.data[1];
        if (!value) return "";
        return `${((value / totalGames) * 100).toFixed(1)}%`;
      })
      .attr("transform", (d) => `translate(${arcGenerator.centroid(d)})`)
      .style("text-anchor", "middle")
      .style("dominant-baseline", "middle")
      .style("font-size", "13px")
      .style("font-weight", "600")
      .style("fill", "#ffffff")
      .style("paint-order", "stroke")
      .style("stroke", "rgba(0, 0, 0, 0.6)")
      .style("stroke-width", "3px")
      .style("stroke-linejoin", "round")
      .style("pointer-events", "none")
      .style("opacity", 0);

    // fade in labels after slice animation
    labels.transition().delay(300).duration(150).style("opacity", 1);

    // hover: expand + glow
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
  }, [wins, losses, abandons, totalGames]);

  return (
    <div className="pie-chart">
      <div style={{ display: displayPieChart ? "block" : "none" }}>
        <svg ref={svgRef} />
        {showTotal && (
          <div style={{ textAlign: "right", fontSize: "12px", opacity: 0.5 }}>
            {totalGames} games
          </div>
        )}
      </div>
      {noPieChartMsg}
    </div>
  );
};
