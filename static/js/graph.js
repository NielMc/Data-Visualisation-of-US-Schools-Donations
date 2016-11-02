queue()
    .defer(d3.json, "/donorsUS/projects")
    .defer(d3.json, "/static/us-states.json")
    .await(makeGraphs);

function makeGraphs(error, projectsJson, statesJson) {

    //Clean projectsJson data
    var donorsUSProjects = projectsJson;
    var dateFormat = d3.time.format("%Y-%m-%d %H:%M:%S");
    var numberFormat = d3.format('.2f');
    donorsUSProjects.forEach(function (d) {
        d["date_posted"] = dateFormat.parse(d["date_posted"]);
        d["date_posted"].setDate(1);
        d["total_donations"] = +d["total_donations"];

    });


    //Create a Crossfilter instance
    var ndx = crossfilter(donorsUSProjects);

    //Define Dimensions
    var dateDim = ndx.dimension(function (d) {
        return d["date_posted"];
    });
    var resourceTypeDim = ndx.dimension(function (d) {
        return d["resource_type"];
    });
    var povertyLevelDim = ndx.dimension(function (d) {
        return d["poverty_level"];
    });
    var stateDim = ndx.dimension(function (d) {
        return d["school_state"];
    });
    var totalDonationsDim = ndx.dimension(function (d) {
        return d["total_donations"];
    });

    var fundingStatus = ndx.dimension(function (d) {
        return d["funding_status"];
    });
    var metroDim = ndx.dimension(function (d) {
        return d["school_metro"];
    });


    //Calculate metrics
    var numProjectsByDate = dateDim.group();
    var numProjectsByResourceType = resourceTypeDim.group();
    var numProjectsByPovertyLevel = povertyLevelDim.group();
    var numProjectsByFundingStatus = fundingStatus.group();
    var totalDonationsByState = stateDim.group().reduceSum(function (d) {
        return d["total_donations"];

    });
    var totalDonationsByMetro = metroDim.group().reduceSum(function (d) {
        return d["metro_donations"];});
    var stateGroup = stateDim.group();
    var numMetro = metroDim.group();


    var all = ndx.groupAll();
    var totalDonations = ndx.groupAll().reduceSum(function (d) {
        return d["total_donations"];
    });

    var max_state = totalDonationsByState.top(1)[0].value;

    //Define values (to be used in charts)
    var minDate = dateDim.bottom(1)[0]["date_posted"];
    var maxDate = dateDim.top(1)[0]["date_posted"];

    //Charts
    var timeChart = dc.barChart("#time-chart");
    var resourceTypeChart = dc.rowChart("#resource-type-row-chart");
    var povertyLevelChart = dc.rowChart("#poverty-level-row-chart");
    var numberProjectsND = dc.numberDisplay("#number-projects-nd");
    var totalDonationsND = dc.numberDisplay("#total-donations-nd");
    var fundingStatusChart = dc.pieChart("#funding-chart");
    var fundingStatusmap = dc.geoChoroplethChart("#funding-map");
    var fundingMetroChart = dc.pieChart("#metro-chart");
    // var yearlyBubbleChart = dc.bubbleChart('#yearly-bubble-chart');


    selectField = dc.selectMenu('#menu-select')
        .dimension(stateDim)
        .group(stateGroup);


    numberProjectsND
        .formatNumber(d3.format("d"))
        .valueAccessor(function (d) {
            return d;
        })
        .group(all);

    totalDonationsND
        .formatNumber(d3.format("d"))
        .valueAccessor(function (d) {
            return d;
        })
        .group(totalDonations)
        .formatNumber(d3.format(".3s"));

    timeChart
        .width(800)
        .height(200)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(dateDim)
        .group(numProjectsByDate)
        .transitionDuration(500)
        .x(d3.time.scale().domain([minDate, maxDate]))
        .elasticY(true)
        .xAxisLabel("Year")
        .yAxis().ticks(4);

    resourceTypeChart
        .width(300)
        .height(250)
        .dimension(resourceTypeDim)
        .group(numProjectsByResourceType)
        .xAxis().ticks(4);

    povertyLevelChart
        .width(300)
        .height(250)
        .dimension(povertyLevelDim)
        .group(numProjectsByPovertyLevel)
        .xAxis().ticks(4);

    fundingStatusChart
        .height(220)
        .radius(90)
        .innerRadius(40)
        .transitionDuration(1500)
        .dimension(fundingStatus)
        .group(numProjectsByFundingStatus);

    fundingMetroChart
        .height(220)
        .radius(90)
        .innerRadius(40)
        .transitionDuration(1500)
        .dimension(metroDim)
        .group(numMetro);

 //  var yearlyPerformanceGroup = dateDim.group().reduce(
 //    function () {
 //            return {
 //                count: 0,
 //                absGain: 10,
 //                fluctuation: 0,
 //                fluctuationPercentage: 50,
 //                sumIndex: 0,
 //                avgIndex: 0,
 //                percentageGain: 70
 //            };
 // }
 //    );
 //
 //    yearlyBubbleChart
 //        .width(990)
 //        .height(250)
 //        .transitionDuration(1500)
 //        .margins({top: 10, right: 50, bottom: 30, left: 40})
 //        .dimension(dateDim)
 //        .group(numProjectsByDate)
 //        .colors(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#7C151D"])
 //        .colorDomain([-500, 500])
 //        .colorAccessor(function (d) {
 //            return d.value.absGain;
 //        })
 //        .keyAccessor(function (p) {
 //            return p.value.absGain;
 //        })
 //        .valueAccessor(function (p) {
 //            return p.value.percentageGain;
 //        })
 //        .radiusValueAccessor(function (p) {
 //            return p.value.fluctuationPercentage;
 //        })
 //        .maxBubbleRelativeSize(0.3)
 //        .x(d3.scale.linear().domain([-2500, 2500]))
 //        .y(d3.scale.linear().domain([-100, 100]))
 //        .r(d3.scale.linear().domain([0, 4000]))
 //        .elasticY(true)
 //        .elasticX(true)
 //        .yAxisPadding(100)
 //        .xAxisPadding(500)
 //        .renderHorizontalGridLines(true)
 //        .renderVerticalGridLines(true)
 //        .xAxisLabel('Index Gain')
 //        .yAxisLabel('Index Gain %')
 //        .renderLabel(true)
 //        .label(function (p) {
 //            return p.key;
 //        })
 //        .renderTitle(true)
 //        .title(function (p) {
 //            return [
 //                p.key,
 //                'Index Gain: ' + numberFormat(p.value.absGain),
 //                'Index Gain in Percentage: ' + numberFormat(p.value.percentageGain) + '%',
 //                'Fluctuation / Index Ratio: ' + numberFormat(p.value.fluctuationPercentage) + '%'
 //            ].join('\n');
 //        })
 //        .yAxis().tickFormat(function (v) {
 //            return v + '%';
 //        });

    fundingStatusmap.width(1000)
        .height(330)
        .dimension(stateDim)
        .group(totalDonationsByState)
        .colors(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#7C151D"])
        .colorDomain([0, max_state])
        .overlayGeoJson(statesJson["features"], "state", function (d) {
            return d.properties.name;
        })
        .projection(d3.geo.albersUsa()
            .scale(600)
            .translate([340, 150]))
        .title(function (p) {
            return "State: " + p["key"]
                + "\n"
                + "Total Donations: " + Math.round(p["value"]) + " $";
        });

    dc.renderAll();
}