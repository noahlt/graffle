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
			      var r = graffleEval(n, global_env);
			      console.log('graffleEval returned:');
			      console.log(r);
			      resultspace.clear();
			      // FIXME: this is a hacky way to determine
			      // whether r is a tree.
			      if ('children' in r) {
				  placeNode(50, 50, r, resultspace);
			      }
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

function copyNode(orig) {
    return makeNode(orig.name);
}

special_forms = {
    'leaf?': function(exp, env) {
	if (exp.children.length == 1) {
	    if (exp.children[0].children.length == 0) {
		return makeNode('true');
	    } else {
		return makeNode('false');
	    }
	} else {
	    alert('Error: leaf? expected one argument, got ' + exp.children.length);
	    return;
	}
    },

    'quote': function(exp, env) {
	if (exp.children.length == 1) {
	    return deepCopyNode(exp.children[0]);
	} else {
	    alert('Error: quote expected one argument, got ' + exp.children.length);
	    return;
	}
    },

    'if': function(exp, env) {
	if (exp.children.length != 3) {
	    alert('Error: if expected 3 arguments, got ' + exp.children.length);
	    return;
	} else {
	    if (graffleEval(exp.children[0]).name == 'true') {
		return graffleEval(exp.children[1]);
	    } else {
		return graffleEval(exp.children[2]);
	    }
	}
    },

    'define': function(exp, env) {
	console.log(exp.children[0]);
	console.log(exp.children[0].length);
	if (exp.children.length != 2) {
	    alert('Error: define expected 2 arguments, got ' + exp.children.length);
	}
        global_env[exp.children[0].name] = graffleEval(exp.children[1], env);
	return global_env[exp.children[0].name];
    },

    'lambda': function(exp, env) {
	if (exp.children.length != 2) {
	    alert('Error: lambda expected 2 arguments, got ' + exp.children.length);
	    return;
	}
	if (exp.children[0].name != 'args') {
	    alert('Error: The first argument to lambda should be args.');
	    return;
	}

	argnames = exp.children[0].children.map(function(node) {
		return node.name;
	    });
	console.log(argnames);

	return function(args, calling_env) {
	    if (args.length != argnames.length) {
		alert('Error: lambda function expected ' +
		      argnames.length + 'arguments, got ' + args.length);
		return;
	    }
	    function_namespace = {};
	    for (var i=0; i < args.length; i++) {
		function_namespace[argnames[i]] = args[i];
	    }
	    // This version allows global variables:
	    //return graffleEval(exp, composeNamespaces(env, function_namespace));
	    // For now, we'll only have function-scoped variables:
	    return graffleEval(exp.children[1], function_namespace);
	}
    }
};

function composeNamespaces() {
    // Called like this: composeNamespaces(global_env, local_env)
    // returns a namespace with both global_env and local_env
    // combined, with local_env (ie, the rightmost argument) taking
    // precedence in the case of collisions.

    // iterate over namespaces
    for (var i = 0; i < arguments.length; i++) {
}
}
	

builtin_functions = {
    'eq': function(args, env) {
	for (var i = 1; i < args.length; i++) {
	    if (args[i-1].name != args[i].name) {
		return makeNode('false');
	    }
	}
	return makeNode('true');
    },

    'maketree': function(args, env) {
	var r = deepCopyNode(args[0]);
	for (var i = 1; i < args.length; i++) {
	    r.addChild(deepCopyNode(args[i]));
	}
	return r;
    },
	
    'root': function(args, env) {
	if (nargs != 1) {
	    alert('Error: root expected 1 argument, got ' + nargs);
	} else {
	    return copyNode(args[0]);
	}
    },

    '+': function(args, env) {
	return args.reduce(function(a, b) {return makeNode(a.name + b.name); });
    },

    '-': function(args, env) {
	return args.reduce(function(a, b) {return makeNode(a.name - b.name); });
    },

    '*': function(args, env) {
	return args.reduce(function(a, b) {return makeNode(a.name * b.name); });
    },

    '/': function(args, env) {
	return args.reduce(function(a, b) {return makeNode(a.name / b.name); });
    },
};


global_env = {};


function graffleEval(exp, env) {
    console.log('Expression: ' + exp.name); console.log(exp);
    console.log('Environment: ' + exp.name); console.log(env);
    var nargs = exp.children.length;
    // Make sure Graffle's internal order of this node's children is
    // the same as the on-screen order of the node's childen;
    // otherwise non-commutative functions will break.
    exp.syncChildOrder();
    var successful_call = false;

    if (exp.children.length == 0) {
	// self-evaluating things. (right now: only numbers, true, false)
	if (!isNaN(parseFloat(exp.name))) {
	    return makeNode(parseFloat(exp.name));
	} else if (exp.name == 'true') {
	    return makeNode('true');
	} else if (exp.name == 'false') {
	    return makeNode('false');
	}
	// Variable substitution.
	if (exp.name in env) {
	    return env[exp.name];
	}
    }

    // Special forms
    for (var form_name in special_forms) {
	if (exp.name == form_name) {
	    return special_forms[form_name](exp, env);
	}
    }

    // Built-in functions after eval'ing all children:
    args = exp.children.map(function(inner_expression) {
	    return graffleEval(inner_expression, env);
	});
    console.log('Args before evalling ' + exp.name + ' :');
    console.log(args);
    for (var builtin_name in builtin_functions) {
	if (exp.name == builtin_name) {
	    return builtin_functions[exp.name](args, env);
	}
    }

    // User-defined functions
    if (exp.name in env) {
	console.log('Calling a user-defined function!');
	return env[exp.name](args, env);
    }
    
    alert(exp.name + ' is undefined.');
}

var mainspace;
var resultspace;
$(document).ready(function() {
	$('#main').bind('contextmenu', function(e) { return false; });
	mainspace = makeSpace('main', $('#main').get(0));
	resultspace = makeSpace('result', $('#result').get(0));
    });
