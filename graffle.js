var c; // canvas
var ns = new Array(0);

// Utilities /////////////////////////////////////////////////////////////////

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

function draw_line(x1, y1, x2, y2) {
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.closePath();
    c.strokeStyle = '#222';
    c.stroke();
}

// Print debugging information.
function d(n, s) {
    // Make sure the list is big enough.
    while ($('#debuglist').children().length < n) {
	$('#debuglist').children().last().after('<li>.</li>');
    }
    $('#debuglist').children().last().text(s);
}

// The App ////////////////////////////////////////////////////////////////////

var NODE_R = 25;

var activeNode= false; // points to the node which a user has clicked.

function make_node(x, y) {
    n =  {'x': x, 'y': y, 'r': NODE_R, 'connections': new Array(0)};
    // graph methods
    n.connectTo = function(n) {
	this.connections.push(n);
    }
    n.children = function(n) { } // START HERE
	
    // geometry methods
    n.overlaps = function(x, y, r) {
	return square(this.x - x) + square(this.y - y) < square(this.r + r);
    };
    n.covers = function(x, y) {
	return square(this.x - x) + square(this.y - y) < square(this.r);
    };
    n.strcoords = function() { // for debugging
	return strcoords(this.x, this.y);
    };
    // drawing methods
    n.draw = function(bgcolor) {
	draw_circle(this.x, this.y, this.r, '#222', bgcolor);
    };
    n.drawDefault = function() { this.draw('#FCF0AD'); }
    n.drawActive = function() { this.draw('#669'); }
    ns.push(n);
    n.drawDefault();
}

function connectNodes(a, b) {
    // we should actually change some attribute
    // of the nodes instead of just drawing.
    draw_line(a.x, a.y, b.x, b.y);
    a.drawDefault();
    b.drawDefault();
    a.connectTo(b);
    b.connectTo(a);
}


$(document).ready(function() {
	c = $('#main').get(0).getContext('2d');

	$('#main').mousedown(function(e) {
		e.preventDefault();
		var canvasX = e.clientX - $(this).position().left;
		var canvasY = e.clientY - $(this).position().top;
		ns.forEach(function(n) {
			// if the user mousedowned on a node...
			if (n.covers(canvasX, canvasY)) {
			    n.drawActive();
			    activeNode = n;
			}});
	    });

	$('#main').mouseup(function(e) {
		e.preventDefault();
		var canvasX = e.clientX - $(this).position().left;
		var canvasY = e.clientY - $(this).position().top;
		if (activeNode) {
		    ns.forEach(function(n) {
			    if (n.covers(canvasX, canvasY)) {
				connectNodes(activeNode, n);
			    }});
		    activeNode.drawDefault();
		    activeNode = false;
		} else if (ns.every(function(n) {
				return !n.overlaps(canvasX, canvasY, NODE_R);
			    })) {
		    make_node(canvasX, canvasY);
		}
	    });
    });
