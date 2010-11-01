// Utilities /////////////////////////////////////////////////////////////////

function square(x) {
    return Math.pow(x, 2);
}

function strcoords(x, y) {
    return '(' + x + ', ' + y + ')';
}

function drawRect(context, x1, y1, x2, y2, fillstyle) {
    context.fillStyle = fillstyle;
    context.fillRect(x1, y1, x2, y2);
}

function drawCircle(context, x, y, r, borderstyle, fillstyle) {
    context.beginPath();
    // syntax reminder: x, y, r, start_angle, end_angle, anticlockwise
    context.arc(x, y, r, 0, Math.PI*2, false);
    context.closePath();
    context.fillStyle = fillstyle;
    context.strokeStyle = borderstyle;
    context.lineWidth = 2;
    context.stroke();
    context.fill();
}

function drawText(context, x, y, s) {
    context.font = '12px sans-serif';
    context.textAlign = 'center';
    context.fillStyle = '#222';
    context.fillText(s, x, y);
}

function drawLine(c, x1, y1, x2, y2) {
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
    while ($('#debuglist').children.length < n) {
	$('#debuglist').children.last().after('<li>.</li>');
    }
    $('#debuglist').children.last().text(s);
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

function makeSpace(name, canvasElement) {
    var space = {'name': name,
		 'context': canvasElement.getContext('2d'),
		 'nodes': new Array(0)};
    space.clear = function() {
	this.nodes = new Array(0);
	drawRect(this.context, 0, 0, canvasElement.width, canvasElement.height,
		 '#fff');
    };

    $(canvasElement)
      .mousedown(function(e) {
	      e.preventDefault();
	      var canvasX = e.clientX - $(this).position().left;
	      var canvasY = e.clientY - $(this).position().top;
	      if (e.which == 1) { // left click
		  space.nodes.forEach(function(n) {
			  // if the user mousedowned on a node...
			  if (n.covers(canvasX, canvasY)) {
			      n.drawActive();
			      activeNode = n;
			  }
		      });
	      } else if (e.which == 3) { // right click
		  space.nodes.forEach(function(n) {
			  if (n.covers(canvasX, canvasY)) {
			      n.drawActive();
			      n.toChildren(function(child) {
				      child.drawActive();
				  });
			  }
		      });
	      }
	  })
      .mouseup(function(e) {
	      e.preventDefault();
	      var canvasX = e.clientX - $(this).position().left;
	      var canvasY = e.clientY - $(this).position().top;
	      if (e.which == 1) { // left click
		  if (activeNode) {
		      space.nodes.forEach(function(n) {
			      if (n.covers(canvasX, canvasY)) {
				  connectNodes(activeNode, n);
			      }
			  });
		      activeNode.drawDefault();
		      activeNode = false;
		  } else {
		      if (space.nodes.every(function(n) {
				  return !n.overlaps(canvasX, canvasY,
						     NODE_R);
			      })) {
			  n = makeNode('');
			  placeNode(canvasX, canvasY, n, space);
		      };
		  }
	      } else if (e.which == 3) { // right click
		  space.nodes.forEach(function(n) {
			  n.drawDefault();
			  if (n.covers(canvasX, canvasY)) {
			      var r = graffleEval(n);
			      console.log('graffleEval returned:');
			      console.log(r);
			      resultspace.clear();
			      placeNode(50, 50, r, resultspace);
			  }
		      });
	      }
	  });

    return space;
}

function makeNode(name) {
    n = { 'name': name, 'parent': null, 'children': new Array(0) };

    // graph methods
    n.addChild = function(child) {
	this.children.push(child);
	child.parent = this;
    }
    n.toChildren = function(f) {
	this.children.forEach(function(child) {
		f(child);
		child.toChildren(f);
	    });
    }

    // Allowing empty name strings then setting them interactively is a hack.
    if (n.name == '') {
	n.name = prompt("This node's name:");
    }
    return n;
}

function placeNode(x, y, node, space) {
    space.nodes.push(node);
    node.space = space;
    node.x = x;
    node.y = y;
    node.r = NODE_R;
    for (var i = 0; i < node.children.length; i++) {
	placeNode(x + 75*i, y+75, node.children[i], space);
    }
    // geometry methods
    node.overlaps = function(x, y, r) {
	return square(this.x - x) + square(this.y - y) < square(this.r + r);
    };
    node.covers = function(x, y) {
	return square(this.x - x) + square(this.y - y) < square(this.r);
    };
    node.strcoords = function() { // for debugging
	return strcoords(this.x, this.y);
    };

    // drawing methods
    node.draw = function(bgcolor) {
	drawCircle(this.space.context, this.x, this.y, this.r, '#222', bgcolor);
	drawText(this.space.context, this.x, this.y, this.name);
    };
    node.drawTree = function(bgcolor) {
	var node = this; // is this even necessary?
	this.children.forEach(function(child) {
		drawLine(node.space.context, node.x, node.y, child.x, child.y);
		node.toChildren(function(child) { child.drawTree(bgcolor); });
	    });
	this.draw(bgcolor);
    }
    node.drawDefault = function() { this.drawTree('#FCF0AD'); };
    node.drawActive = function() { this.drawTree('#669'); };

    // sync graphical tree with abstract tree
    node.syncChildOrder = function() {
	// this assumes that all children have been placed, as well.
	this.children.sort(function(a, b) { return a.x - b.x; });
    }
    
    node.drawDefault();
}

function connectNodes(a, b) {
    if (a.space == b.space) {
	var parent;
	var child;
	if (a.y > b.y) {
	    parent = b;
	    child = a;
	} else if (b.y > a.y) {
	    parent = a;
	    child = b;
	} else {
	    alert("you're trying to connect two equal nodes, so I don't know who's the parent.");
	}
	drawLine(a.space.context, a.x, a.y, b.x, b.y);
	a.drawDefault();
	b.drawDefault();
	parent.addChild(child);
    } else {
	alert("Did you just try to connect two nodes in different spaces?  It won't work, you know.");
    }
}

function deepCopyNode(orig) {
    var copy = makeNode(orig.name);
    copy.children = orig.children.map(deepCopyNode);
    return copy;
}

function graffleEval(n) {
    // Special forms first.
    if (n.name == 'leaf?') {
	if (n.children.length == 1) {
	    if (n.children[0].children.length == 0) {
		return makeNode('true');
	    } else {
		return makeNode('false');
	    }
	} else {
	    alert('Error: leaf? expected one argument, got ' + n.children.length);
	    return;
	}
    } else if (n.name == 'quote') {
	if (n.children.length == 1) {
	    return deepCopyNode(n.children[0]);
	} else {
	    alert('Error: quote expected one argument, got ' + n.children.length);
	    return;
	}
    }
    // Regular functions: first eval all children:
    children = n.children.map(graffleEval);
    if (n.name == 'eq') {
	for (var i = 1; i < children.length; i++) {
	    if (children[i-1].name != children[i].name) {
		return makeNode('false');
	    }
	}
	return makeNode('true');
    } else if (n.name == '+') {
	return children.reduce(function(a, b) { return makeNode(a.name + b.name); });
    } else if (n.name == '-') {
	return children.reduce(function(a, b) { return makeNode(a.name - b.name); });
    } else if (n.name == '*') {
	return children.reduce(function(a, b) { return makeNode(a.name * b.name); });
    } else if (n.name == '/') {
	return children.reduce(function(a, b) { return makeNode(a.name / b.name); });
    } else if (!isNaN(parseFloat(n.name))) {
	return makeNode(parseFloat(n.name));
    } else {
	alert(n.name + ' is not callable.');
    }
}

var mainspace;
var resultspace;
$(document).ready(function() {
	$('#main').bind('contextmenu', function(e) { return false; });
	mainspace = makeSpace('main', $('#main').get(0));
	resultspace = makeSpace('result', $('#result').get(0));
    });
