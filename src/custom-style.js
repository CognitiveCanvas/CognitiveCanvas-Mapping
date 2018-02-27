$(document).ready(function() {
    $(".node_color_button").click(function(){
        console.log(this.id);
        switch(this.id){
        	case "green_node":
        		setColor("green");
        		break;
        	case "red_node":
        		setColor("red");
        		break;
        	case "blue_node":
        		setColor("blue");
        		break;
        	case "black_node":
        		setColor("black");
        		break;
        	case "green_border":
        		setBorderColor("green");
        		break;
        	case "red_border":
        		setBorderColor("red");
        		break;
        	case "blue_border":
        		setBorderColor("blue");
        		break;
        	case "black_border":
        		setBorderColor("black");
        		break;
        	default: 
        		console.log("default switch case reached")
        }
    }); 

});