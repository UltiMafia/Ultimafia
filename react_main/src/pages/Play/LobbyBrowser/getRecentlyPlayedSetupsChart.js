import * as d3 from "d3";

export const getRecentlyPlayedSetupsChart = ({ svgRef, setupsInfo, theme }) => {
  // Specify the chart’s dimensions, based on a bar’s height.
  const barHeight = 35;
  const marginTop = 30;
  const marginRight = 10;
  const marginBottom = 0;
  const marginLeft = 10;
  const width = d3.select(svgRef.current.parentNode).node().clientWidth;
  const height =
    Math.ceil((setupsInfo.length + 0.1) * barHeight) + marginTop + marginBottom;

  // Create the scales.
  const x = d3
    .scaleLinear()
    .domain([0, d3.max(setupsInfo, (d) => d.value)])
    .range([marginLeft, width - marginRight]);

  const y = d3
    .scaleBand()
    .domain(d3.sort(setupsInfo, (d) => -d.value).map((d) => d.name))
    .rangeRound([marginTop, height - marginBottom])
    .padding(0.1);

  // Create a value format.
  const format = x.tickFormat(20, "%");

  // Create the SVG container.
  const svg = d3
    .select(svgRef.current)
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; font: 14px RobotoSlab;")
    .style("cursor", "default")
    .style("user-select", "none");

  // Append a rect for each name.
  svg
    .append("g")
    .attr("fill", theme.palette.primary.main)
    .selectAll()
    .data(setupsInfo)
    .join("rect")
    .attr("x", x(0))
    .attr("y", (d) => y(d.name))
    .attr("width", (d) => x(d.value) - x(0))
    .attr("height", y.bandwidth())
    .style("cursor", "default")
    .style("user-select", "none");

  // Append a label for each name.
  svg
    .append("g")
    .attr("fill", "white")
    .attr("text-anchor", "end")
    .selectAll()
    .data(setupsInfo)
    .join("text")
    .attr("x", (d) => x(d.value))
    .attr("y", (d) => y(d.name) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("dx", -4)
    .text((d) => format(d.value))
    .call((text) =>
      text
        .filter((d) => x(d.value) - x(0) < 20) // short bars
        .attr("dx", +4)
        .attr("fill", "black")
        .attr("text-anchor", "start")
    );

  // Create the axes.
  svg
    .append("g")
    .attr("transform", `translate(0,${marginTop})`)
    .attr("color", theme.palette.secondary.main)
    .attr("stroke", theme.palette.secondary.main)
    .attr("style", "max-width: 100%; height: auto; font: 14px RobotoSlab;")
    .attr("color", theme.palette.secondary.main)
    // .call(d3.axisTop(x).tickFormat(d3.format("")))
    .call(d3.axisTop(x).ticks(width / 80, "%"))
    .call((g) => g.select(".domain").remove())
    .selectAll(".tick line")
    .attr("stroke", theme.palette.secondary.main);

  const yAxis = svg
    .append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y).tickSizeOuter(0))
    .call((g) => g.selectAll(".tick text").remove())
    .call((g) => g.selectAll(".domain").remove())
    .call((g) => g.selectAll(".tick line").remove());

  yAxis.select(".domain"); // Selects the Y-axis line
  // .attr("stroke", theme.palette.secondary.main);

  yAxis.selectAll(".tick line"); // Selects the tick lines
  // .attr("stroke", theme.palette.secondary.main);
};
