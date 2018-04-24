$(document).ready(function() {
    $("#green_node").click(()=>setColor("green"));
    $("#red_node").click(()=>setColor("red"));
    $("#blue_node").click(()=>setColor("blue"));
    $("#black_node").click(()=>setColor("black"));

    $("#green_border").click(()=>setBorderColor("green"));
    $("#red_border").click(()=>setBorderColor("red"));
    $("#blue_border").click(()=>setBorderColor("blue"));
    $("#black_border").click(()=>setBorderColor("black"));

    $("#label_text_increase").click(()=>increaseLabelFontSize());
    $("#label_text_decrease").click(()=>decreaseLabelFontSize());
    $("#label_text_italics").click(()=>toggleLabelFontItalics());
    $("#label_text_bold").click(()=>toggleLabelFontBold());
    $("#green_text").click(()=>setLabelColor("green"));
    $("#red_text").click(()=>setLabelColor("red"));
    $("#blue_text").click(()=>setLabelColor("blue"));
    $("#black_text").click(()=>setLabelColor("black"));


    $("#increase_size").click(()=>increaseLabelFontSize());
    $("#decrease_size").click(()=>decreaseLabelFontSize());
    $("#bold").click(()=>toggleLabelFontBold());
    $("#italics").click(()=>toggleLabelFontItalics());
    $(".blueFill").click(()=>setColor("blue"));
    $(".redFill").click(()=>setColor("red"));
    $(".grayFill").click(()=>setColor("gray"));
    $(".yellowFill").click(()=>setColor("yellow"));
    $(".blueBorder").click(()=>setBorderColor("blue"));
    $(".redBorder").click(()=>setBorderColor("red"));
    $(".grayBorder").click(()=>setBorderColor("gray"));
    $(".yellowBorder").click(()=>setBorderColor("yellow"));
});

$(document).bind("contextmenu", function (event) {
    var $contextMenu = $("#contextMenu");
    // Avoid the real one
    event.preventDefault();
    $contextMenu.css({
        display: "block",
        left: event.pageX,
        top: event.pageY
    });
});


