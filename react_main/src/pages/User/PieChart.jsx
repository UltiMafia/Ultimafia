import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export const PieChart = ({ wins, losses, abandons }) => {
  const svgRef = useRef();
  const totalGames = wins + losses + abandons;

  const noPieChartMsg = totalGames <= 0 && (
    <div style={{ marginBottom: "5px" }}>No pie chart yet!</div>
  );

  useEffect(() => {
    if (totalGames <= 0) {
      return;
    }

    const width = 200;
    const height = width;
    const margin = 5;
    const radius = Math.min(width, height) / 2 - margin;

    const svg = d3
      .select(svgRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const data = {};
    // const color = d3.scaleOrdinal().range(["#39FF6A", "#FF2929", "#BFBFBF"]);
    const colors = [];
    if (wins) {
      data.W = wins;
      colors.push("#FF3C38");
    }
    if (losses) {
      data.L = losses;
      colors.push("#5AB220");
    }
    if (abandons) {
      data.A = abandons;
      colors.push("#BFBFBF");
    }

    const pie = d3.pie().value((d) => d[1]);
    const data_ready = pie(Object.entries(data));

    svg
      .selectAll("potato")
      .data(data_ready)
      .join("path")
      .attr("d", d3.arc().innerRadius(0).outerRadius(radius))
      .attr("fill", (d) => colors[d.index])
      .attr("stroke", "gray")
      .style("stroke-width", "1px")
      .style("stroke-opacity", "0.2");
    // .style("opacity", 0.7);

    // annotations
    var arcGenerator = d3.arc().innerRadius(0).outerRadius(radius);
    svg
      .selectAll("potato")
      .data(data_ready)
      .enter()
      .append("text")
      .text((d) => {
        const value = d.data[1];
        if (!value) {
          return "";
        }

        const percentageStr = `${((value / totalGames) * 100).toFixed(1)}%`;
        return percentageStr;
      })
      .attr("transform", (d) => `translate(${arcGenerator.centroid(d)})`)
      .style("text-anchor", "middle")
      .style("font-size", 12);
  }, [wins, losses, abandons]);

  return (
    <>
      <div ref={svgRef} />
      {noPieChartMsg}
    </>
  );
};
