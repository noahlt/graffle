var c; // canvas
var ns = new Array(0);

// Utilities /////////////////////////////////////////////////////////////////

function map(a, f) {
    r = new Array(a.length);
    for (var i = 0; i < a.length; i++)
	r[i] = f(a[i]);
    return r;
}

function all(a) {
    for (var i=0; i < a.length; i++) {
	if (a[i] == false) {
	    return false;
	}
    }
    return true;
}

function none(a) {
    for (var i = 0; i < a.length; i++) {
	if (a[i] == true) {
	    return false;
	}
    }
    return true;
}

function draw_circle(x, y, r, borderstyle, fillstyle) {
    c.beginPath();
    // syntax reminder: x, y, r, start_angle, end_angle, anticlockwise
    c.arc(x, y, r, 0, Math.PI*2, false);
    c.closePath();
    c.fillStyle = fillstyle;
    c.strokeStyle = borderstyle;
    c.lineWidth = 2;
    c.stroke();
    c.fill();
}

function d1(s) {
    $('#d1').text(s);
}

function d2(s) {
    $('#d2').text(s);
}

// Print debugging information.
function d(n, s) {
    // Make sure the list is big enough.
    while ($('#debuglist').children().length < n) {
	$('#debuglist').children().last().after('<li>.</li>');
    }
    $('#debuglist').children().last().text(s);
}



function draw_node(x, y) {
    var r = 25;
    draw_circle(x, y, r, '#222', '#FCF0AD');

    ns[ns.length] = {'x': x, 'y': y};
    ns[ns.length-1].covers = function(x, y) {
	return (this.x - x)^2 + (this.y - y)^2 < r^2;
	};
}


$(document).ready(function() {
	c = $('#main').get(0).getContext('2d');
	$('#main').click(function(e) {
		var canvasX = e.clientX - $(this).position().left;
		var canvasY = e.clientY - $(this).position().top;
		if (none(map(ns, function(n) {
				return n.covers(canvasX, canvasY);
			    }))) {
		    draw_node(canvasX, canvasY);
		    console.log('-');
		    console.log(ns);
		}
	    });
    });
