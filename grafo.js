data_path = "Datos/specific_new/333.json"
function runCode() {
    d3.json(data_path)
        .then((data) => {
            // data.comments = comments_processed(data.comments);
            createGrafo(data);
        })
        .catch((error) => console.log(error));
}

runCode();

// -------------------------------- Limpiar Datos ----------------------

function data_processed(d) {
    let data = {
        title: d.title,
        creator: d.agency,
        subhead: d.subhead,
        date: d.date,
        time: d.time,
        body: d.text,
        url: d.url,
        comments: d.comments,
        level: -1,
        likes: 20
    }
    return data
}

function create_tree_comments(comments) {
    new_comments = [];
    for (comment of comments) {
        if (comment.level == 0) {
            new_comments.push(comment_processed(comment));
        } else {
            for (father of new_comments) {
                if (father.id == comment.parentId) {
                    father.comments.push(comment_processed(comment));
                    break;
                }
            }
        }
    }
    return new_comments
}

function comment_processed(c) {
    let comment = {
        id: c.id,
        creator: c.creator,
        level: c.level,
        likes: c.likes,
        dislikes: c.dislikes,
        time: c.time,
        text: c.text,
        comments: []
    }
    return comment
}

function max_level(comments) {
    max = 0;
    for (comment of comments) {
        if (max < comment.level) {
            max = comment.level;
        }
    }
    return max
}


// -------------------------------- Crear Grafo ------------------------
// Parametros
const HEIGTH = 40;
const WIDTH = 400;

function createGrafo(data) {

    // Constantes
    const tree_depth = max_level(data.comments);
    const tree_height = data.comments.length;

    const margin = { top: 20, right: 150, bottom: 30, left: 90 };
    const width = WIDTH * Math.sqrt(tree_depth + 1) - margin.left - margin.right;
    const height = (100 + HEIGTH * tree_height) - margin.top - margin.bottom;

    // Modificar Datos
    data = data_processed(data);
    const COLOR = d3.scaleOrdinal(d3[`schemeTableau10`])
        .domain([...Array(tree_depth).keys()]);

    data.comments = create_tree_comments(data.comments);

    // Crear Grafo
    let nodes = d3.hierarchy(data, d => d.comments);

    const treemap = d3.tree().size([height, width]);
    nodes = treemap(nodes);
    const svg = d3.select("#vis-1")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    let linkGen = d3.linkHorizontal()
        .source(d => [d.y, d.x])
        .target(d => [d.parent.y, d.parent.x]);;


    const link = g.selectAll(".link")
        .data(nodes.descendants().slice(1))
        .enter().append("path")
        .attr("class", "link")
        .style("stroke", d => COLOR(d.data.level))
        .attr("d", linkGen);

    const node = g.selectAll(".node")
        .data(nodes.descendants())
        .enter().append("g")
        .attr("class", d => "node" + (d.comments ? " node--internal" : " node--leaf"))
        .attr("transform", d => `translate(${d.y}, ${d.x})`);

    radius = d3.scaleSqrt()
        .domain([0, 10])
        .range([5, 20])

    node.append("circle")
        .attr("r", d => radius(d.data.likes))
        .style("stroke", d => d.data.likes)
        .style("fill", d => COLOR(d.data.level));

    node.append("text")
        .attr("dy", ".35em")
        .attr("x", d => radius(d.data.likes) + 5)
        .attr("y", d => 20)
        .style("text-anchor", d => d.comments ? "end" : "start")
        .text(d => d.data.creator);


    // Filtro Fechas
    function filtrar_fecha(timeMin, timeMax, time) {
        // console.log("MIN", timeMin);
        // console.log("MAX", timeMax);
        // console.log("time", time);
        // console.log()
        if (time < timeMin) { return 0.4 }
        if (time > timeMax) { return 0.1 }
        return 1;
    }

    d3.select("#selectButton").on("click", function (d) {
        let timeMin = document.getElementById('date_min').value;
        let timeInterval = document.getElementById('date_interval').value;

        timeMin = Date.parse(timeMin);
        timeInterval = timeInterval * 60 * 1000;
        timeMax = timeMin + timeInterval;
        console.log(timeMin);

        node.selectAll("circle")
        .attr("opacity", d => filtrar_fecha(timeMin, timeMax, d.data.time))

        link.attr("opacity", d => {
            return filtrar_fecha(timeMin, timeMax, d.data.time)
        })
    })

    // Tooltip
    var Tooltip = d3.select("#vis-1")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")

    node.selectAll("circle")
        .on("mouseleave", function(event, d){
            Tooltip.style("opacity", 0)
            // d3.pointer(event)
            // .style("stroke", "black")
            console.log("sali")
    })
    .on("mouseover", function(event, d){
        Tooltip.style("opacity", 1)
        // d3.pointer(event)
        // .style("stroke", "black")
    })
    .on("mousemove", function(event, d){
        Tooltip
        .html(
        "Autor: " + d.data.creator + "<br>" +
        "Comentario: " + d.data.text + "<br>" +
        "Subido el: " + Date(d.data.time) + "<br>" +
        "Cantidad de Likes: " + d.data.likes + "<br>" +
        "Cantidad de Dislikes: " + d.data.dislikes + "<br>"
        )
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY + -10) + "px")
    })
}
