function drawChart(inSelector, inData) {
    $(inSelector).text("");
    // $(inSelector).css("display", "block");

    var width = 160,
        height = 200,
        radius = Math.min(width, height) / 2;

    var color = d3.scale.ordinal()
        .range(["#D787FF", "#E87BBA", "#FFA394", "#E8AC7D", "#FFDB87", "#98abc5", "#8a89a6"]);

    var arc = d3.svg.arc()
        .outerRadius(radius - 10)
        .innerRadius(radius - 50);

    var pie = d3.layout.pie()
        .sort(null)
        .value(function(d) { return d.population; });

    var svg = d3.select(inSelector).append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");


    // for Legend
    $(inSelector).append("<div class='donutchart-legend'></div>");

    var legend = [];
    addData(inData);

    function addData(data) {
        var g = svg.selectAll(".arc")
            .data(pie(data))
            .enter().append("g")
            .attr("class", "arc");

        g.append("path")
            .attr("d", arc)
            .style("fill", function(d) { legend.push({ name: d.data.label, color: color(d.data.label) }); return color(d.data.label); });

        g.append("text")
            .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
            .attr("dy", ".35em")
            .text(function(d) { if (d.data.population == 0) return; return d.data.population + "개"; });
    }
    // console.log(legend);
    displayLegend(inSelector + " .donutchart-legend", legend);

    function type(d) {
        d.population = +d.population;
        return d;
    }
}