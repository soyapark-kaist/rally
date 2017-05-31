function drawBarChart() {
    var data = {
        labels: [
            "9시",
            "10시",
            "11시",
            "12시",
            "13시",
            "14시",
            "15시",
            "16시",
            "17시",
            "18시",
            "19시",
            "20시",
            "21시",
            "22시",
            "23시",
            "0시",
            "1시",
            "2시",
            "3시",
            "4시",
            "5시",
            "6시",

        ],
        series: [{
            label: '제보 갯수',
            values: [10, 14, 21, 12, 15, 25, 12, 14, 11, 9, 10, 5, 13, 10, 25, 20, 10, 13, 5, 3, 0, 2]
        }, ]
    };

    var chartWidth = 150,
        barHeight = 15,
        groupHeight = barHeight * data.series.length,
        gapBetweenGroups = 2,
        spaceForLabels = 0,
        spaceForLegend = 150;

    // Zip the series data together (first values, second values, etc.)
    var zippedData = [];
    for (var i = 0; i < data.labels.length; i++) {
        for (var j = 0; j < data.series.length; j++) {
            zippedData.push(data.series[j].values[i]);
        }
    }

    // Color scale
    var color = d3.scale.category20();
    var chartHeight = barHeight * zippedData.length + gapBetweenGroups * data.labels.length;

    var x = d3.scale.linear()
        .domain([0, d3.max(zippedData)])
        .range([0, chartWidth]);

    var y = d3.scale.linear()
        .range([chartHeight + gapBetweenGroups, 0]);

    var yAxis = d3.svg.axis()
        .scale(y)
        .tickFormat('')
        .tickSize(0)
        .orient("left");


    // Specify the chart area and dimensions
    var chart = d3.select("#timeStat")
        .attr("width", spaceForLabels + chartWidth + spaceForLegend)
        .attr("height", chartHeight);

    chart.append("text")
        .attr("text-anchor", "middle") // this makes it easy to centre the text as the transform is applied to the anchor
        .attr("transform", "translate(" + (chartWidth) + "," + (chartHeight - (20 / 3)) + ")") // centre below axis
        .text("시간별 인터넷 불편 제보 갯수");

    // Create bars
    var bar = chart.selectAll("g")
        .data(zippedData)
        .enter().append("g")
        .attr("transform", function(d, i) {
            return "translate(" + spaceForLabels + "," + (i * barHeight + gapBetweenGroups * (0.5 + Math.floor(i / data.series.length))) + ")";
        });

    // Create rectangles of the correct width
    bar.append("rect")
        .attr("fill", "#ff7f0e")
        .attr("class", "bar")
        .attr("width", x)
        .attr("height", barHeight - 1);

    // Add text label in bar
    bar.append("text")
        .attr("x", function(d) { return x(d) - 3; })
        .attr("y", barHeight / 2)
        .attr("fill", "white")
        .attr("dy", ".35em")
        .text(function(d) { return d; });

    // Add text label next to bar
    bar.append("text")
        .attr("x", function(d) { return x(d) + 30; })
        .attr("y", barHeight / 2)
        .attr("fill", "black")
        .attr("style", "visibility:hidden;")
        .attr("dy", ".35em")
        .attr("class", function(d, i) { return "tooltip" + i; })
        .text(function(d, i) { return data["labels"][i]; });

    // Draw labels
    bar.append("text")
        .attr("class", "label")
        .attr("x", function(d) { return -10; })
        .attr("y", groupHeight / 2)
        .attr("dy", ".35em")
        .text(function(d, i) {
            if (i % data.series.length === 0)
                return data.labels[Math.floor(i / data.series.length)];
            else
                return ""
        });

    chart.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + spaceForLabels + ", " + -gapBetweenGroups / 2 + ")")
        .call(yAxis);

    // Draw legend
    var legendRectSize = 18,
        legendSpacing = 4;

    var legend = chart.selectAll('.legend')
        .data(data.series)
        .enter()
        .append('g')
        .attr('transform', function(d, i) {
            var height = legendRectSize + legendSpacing;
            var offset = -gapBetweenGroups / 2;
            var horz = spaceForLabels + chartWidth + 40 - legendRectSize;
            var vert = i * height - offset;
            return 'translate(' + horz + ',' + vert + ')';
        });

    legend.append('rect')
        .attr('width', legendRectSize)
        .attr('height', legendRectSize)
        .style('fill', "#ff7f0e")
        .style('stroke', function(d, i) { return color(i); });

    legend.append('text')
        .attr('class', 'legend')
        .attr('x', legendRectSize + legendSpacing)
        .attr('y', legendRectSize - legendSpacing)
        .text(function(d) { return d.label; });

    d3.selectAll("#timeStat rect")
        .on("mouseover", function(d, i) { $("#timeStat .tooltip" + i).css("visibility", "visible"); })
        .on("mouseout", function(d, i) { $("#timeStat .tooltip" + i).css("visibility", "hidden"); });

}