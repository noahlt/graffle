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

function square(x) {
    return Math.pow(x, 2);
}

function strcoords(x, y) {
    return '(' + x + ', ' + y + ')';
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

// Print debugging information.
function d(n, s) {
    // Make sure the list is big enough.
    while ($('#debuglist').children().length < n) {
	$('#debuglist').children().last().after('<li>.</li>');
    }
    $('#debuglist').children().last().text(s);
}

var NODE_R = 25;

function make_node(x, y) {
    i = ns.length;
    ns[i] = {'x': x, 'y': y, 'r': NODE_R};
    ns[i].overlaps = function(x, y, r) {
	return square(this.x - x) + square(this.y - y) < square(this.r + r);
    };
    ns[i].strcoords = function() { // for debugging
	return strcoords(this.x, this.y);
    };
    ns[i].draw = function() {
	draw_circle(this.x, this.y, this.r, '#222', '#FCF0AD');
    };
    ns[i].draw();
}


$(document).ready(function() {
	c = $('#main').get(0).getContext('2d');
	$('#main').click(function(e) {
		var canvasX = e.clientX - $(this).position().left;
		var canvasY = e.clientY - $(this).position().top;
		if (none(map(ns, function(n) {
				return n.overlaps(canvasX, canvasY, NODE_R);
			    }))) {
		    make_node(canvasX, canvasY);
		}
	    });
    });
