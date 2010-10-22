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

function draw_text(x, y, s) {
    c.font = '12px sans-serif';
    c.textAlign = 'center';
    c.fillStyle = '#222';
    c.fillText(s, x, y);
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

function find_node(name) {
    nodesWithThisName = ns.filter(function(n) { return n.name == name; });
    if (1 < nodesWithThisName.length) {
	alert('There are multiple nodes named ' + name + '! I give up.');
    } else {
	return nodesWithThisName[0];
    }
}

function make_node(x, y, name) {
    n =  {'x': x, 'y': y, 'r': NODE_R,
	  'connections': new Array(0), 'name': name};

    // graph methods
    n.connectTo = function(n) {
	// insert n into the list of connections. keep connections
	// sorted by their x position.
	this.connections.push(n);
	this.connections.sort(function(a, b) { return a.x - b.x; });
    }
    n.children = function() {
	y = this.y; // hackish way to get n.y into following lambda's namespace
	return this.connections.filter(function(a) {
		return a.y > y;
	    });
    };
	
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
	draw_text(this.x, this.y, this.name);
    };
    n.drawDefault = function() { this.draw('#FCF0AD'); }
    n.drawActive = function() { this.draw('#669'); }
    ns.push(n);
    n.drawDefault();
    // Allowing empty name strings then setting them interactively is a hack.
    if (n.name == '') {
	n.name = prompt("This node's name:");
	n.drawDefault();
    }
}

function connectNodes(a, b) {
    draw_line(a.x, a.y, b.x, b.y);
    a.drawDefault();
    b.drawDefault();
    a.connectTo(b);
    b.connectTo(a);
}


function graffleEval(n) {
    // Special forms first.
    if (n.name == 'leaf?') {
	if (n.children().length == 1) {
	    if (n.children()[0].children().length == 0) {
		return 't';
	    } else {
		return 'f';
	    }
	} else {
	    alert('Error: atom? expected one argument, got ' +
		  n.children().length);
	    return;
	}
    }
    // Regular functions.
    children = n.children().map(graffleEval);
    if (n.name == '+') {
	return children.reduce(function(a,b) { return a + b; });
    } else if (n.name == '-') {
	return children.reduce(function(a, b) { return a - b; });
    } else if (n.name == '*') {
	return children.reduce(function(a, b) { return a * b; });
    } else if (n.name == '/') {
	return children.reduce(function(a, b) { return a / b; });
    } else if (!isNaN(parseFloat(n.name))) {
	return parseFloat(n.name);
    } else {
	alert(n.name + ' is not callable.');
    }
}

$(document).ready(function() {
  $('#main').bind('contextmenu', function(e) { return false; });

  c = $('#main').get(0).getContext('2d');

  $('#main')
      .mousedown(function(e) {
	      e.preventDefault();
	      var canvasX = e.clientX - $(this).position().left;
	      var canvasY = e.clientY - $(this).position().top;
	      if (e.which == 1) { // left click
		  ns.forEach(function(n) {
			  // if the user mousedowned on a node...
			  if (n.covers(canvasX, canvasY)) {
			      n.drawActive();
			      activeNode = n;
			  }
		      });
	      } else if (e.which == 3) { // right click
	      }
	  })
      .mouseup(function(e) {
	      e.preventDefault();
	      var canvasX = e.clientX - $(this).position().left;
	      var canvasY = e.clientY - $(this).position().top;
	      if (e.which == 1) { // left click
		  if (activeNode) {
		      ns.forEach(function(n) {
			      if (n.covers(canvasX, canvasY)) {
				  connectNodes(activeNode, n);
			      }});
		      activeNode.drawDefault();
		      activeNode = false;
		  } else {
		      if (ns.every(function(n) {
				  return !n.overlaps(canvasX, canvasY,
						     NODE_R);
			      })) {
			  make_node(canvasX, canvasY, '');
		      };
		  }
	      } else if (e.which == 3) { // right click
		  ns.forEach(function(n) {
			  if (n.covers(canvasX, canvasY)) {
			      d(1, 'Result: ' + graffleEval(n));
			  }
		      });
	      }
	  });
    });
