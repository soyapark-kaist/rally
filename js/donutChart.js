function drawChart(inSelector, inData) {
    $("#application svg").remove();
    var width = 360,
        height = 250,
        radius = Math.min(width, height) / 2;

    var color = d3.scale.ordinal()
        .range(["#0EFF62", "#0CE897", "#0E93FF", "#0CBFE8", "#1AFFEC", "#98abc5", "#8a89a6"]);

    var arc = d3.svg.arc()
        .outerRadius(radius - 10)
        .innerRadius(radius - 70);

    var pie = d3.layout.pie()
        .sort(null)
        .value(function(d) { return d.population; });

    var svg = d3.select(inSelector).append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");


    addData(inData);

    function addData(data) {

        var g = svg.selectAll(".arc")
            .data(pie(data))
            .enter().append("g")
            .attr("class", "arc");

        g.append("path")
            .attr("d", arc)
            .style("fill", function(d) { return color(d.data.label); });

        g.append("text")
            .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
            .attr("dy", ".35em")
            .text(function(d) { return d.data.label; });
    }

    // d3.csv("data.csv", type, );

    function type(d) {
        d.population = +d.population;
        return d;
    }
}