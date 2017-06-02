$(document).ready(function() {
    var margin = {
            top: 30,
            right: 10,
            bottom: 50,
            left: 60
        },
        chart = d3LineWithLegend()
        // .xAxis.label('Time (ms)')
        .width(width(margin))
        .height(height(margin))
        .yAxis.label('Voltage (v)');


    var svg = d3.select('#report-chart svg')
        .datum(generateData())

    svg.transition().duration(500)
        .attr('width', width(margin))
        .attr('height', height(margin))
        .call(chart);

    // svg.append("text")
    //     .attr("text-anchor", "middle") // this makes it easy to centre the text as the transform is applied to the anchor
    //     .attr("transform", "translate(" + (width(margin) / 2) + "," + (height(margin) - (20 / 3)) + ")") // centre below axis
    //     .text("Date");


    chart.dispatch.on('showTooltip', function(e) {
        var offset = $('#report-chart').offset(), // { left: 0, top: 0 }
            left = e.pos[0] + offset.left,
            top = e.pos[1] + offset.top,
            formatter = d3.format(".04f");

        var content = '<h3>' + e.series.label + '</h3>' +
            '<p>' +
            '<span class="value">' + e.point[2] + '</span>' +
            '</p>';

        nvtooltip.show([left, top], content);
    });

    chart.dispatch.on('hideTooltip', function(e) {
        nvtooltip.cleanup();
    });




    $(window).resize(function() {
        var margin = chart.margin();

        chart
            .width(width(margin))
            .height(height(margin));

        d3.select('#report-chart svg')
            .attr('width', width(margin))
            .attr('height', height(margin))
            .call(chart);

    });




    function width(margin) {
        var w = $("#report-chart").width() - 20;

        return ((w - margin.left - margin.right - 20) < 0) ? margin.left + margin.right + 2 : w;
    }

    function height(margin) {
        var h = 400 - 20;

        return (h - margin.top - margin.bottom - 20 < 0) ?
            margin.top + margin.bottom + 2 : h;
    }


    //data
    function generateData() {
        var sin = [
                [0, 2],
                [1, 40],
                [2, 10],
                [3, 18],
                [4, 12],
                [5, 2],
                [6, 27],
                [7, 7],
                [8, 10],
                [9, 18],
                [10, 15],
                [11, 7],
                [12, 16],
                [13, 22],
                [14, 6],
                [15, 2],
                [16, 2],
                [17, 1],
                [18, 6],
                [19, 4],
                [20, 3],
                [21, 8],
                [22, 7],
                [23, 8],
                [24, 5],
                [25, 2],
                [26, 9],
                [27, 5],
                [28, 1],
                [29, 0],
                [30, 3],
                [31, 0],
                [32, 0],
                [33, 5],
                [34, 0],
                [35, 6],
                [36, 16],
                [37, 2],
                [38, 1],
                [39, 0],
                [40, 1],
                [41, 1],
                [42, 1],
                [43, 2],
                [44, 1],
                [45, 1],
                [46, 0],
                [47, 0],
                [48, 6],
                [49, 3],
                [50, 4],
                [51, 1],
                [52, 0],
                [53, 4],
                [54, 1],
                [55, 11]
            ],
            sin2 = [],
            cos = [];

        for (var i = 0; i < 56; i++) {
            sin[i].push(sin[i][1] + "개");
        }

        for (var i = 25; i < 55; i++) {
            cos.push([i, 0]);
        }

        sin2.push([0, 0, "아, 쫌 릴리즈"]);
        sin2.push([1, 0, "총학생회 홍보"]);
        sin2.push([8, 0, "대학원학생회 홍보"]);
        sin2.push([13, 0, "중간고사"]);
        sin2.push([14, 0, "첫 민원 정보통신팀에 발송"]);
        sin2.push([25, 0, "카대전 새버전 릴리즈"]);
        sin2.push([35, 0, "대통령 선거"]);
        sin2.push([39, 0, "랜섬웨어 사태 발발"]);
        sin2.push([46, 0, "아,쫌 점검"]);
        sin2.push([50, 0, "축제"]);
        sin2.push([55, 0, "세종관 차단기 고장"]);

        return [{
                data: sin,
                label: "아,쫌 제보"
            }, {
                data: sin2,
                label: "학내외 사건"
            },
            // {
            //   data: cos,
            //   label: "카대전 인터넷 관련 게시글"
            // },
        ];
    }

});
