## /* -*- javascript -*-

<%inherit file="base.mako"/>

<%block name="title">Parametric Form</%block>

## */

new Demo({
    viewRange: [[-10, 10], [-10, 10], [-3, 3]],
    caption: katex.renderToString("\\color{red}{2x + \\phantom{2}y + 12z = 1}")
        + "<br>" + katex.renderToString(
            "\\color{green}{\\phantom{2}x + 2y + \\phantom{1}9z = -1}")
        + "<br>" + katex.renderToString(
            "\\color{yellow}{(x,y,z) = (1-5z,\\,{-1}-2z,z)}"),
}, function() {
    // gui
    var Params = function() {
        this.z = 0.0;
    };
    var params = new Params();
    var gui = new dat.GUI();
    gui.add(params, 'z', -9/5, 11/5).step(0.1);

    // Plane 1
    this.view
        .matrix({
            channels: 3,
            live:     false,
            width:    21,
            height:   21,
            expr: function (emit, i, j) {
                i -= 10;  j -= 10;
                emit(i, j, (1-2*i-j)/12);
            }
        })
        .surface({
            color:   "rgb(128,0,0)",
            opacity: 0.75,
            stroke:  "solid",
            lineX:   true,
            lineY:   true,
            width:   3,
            fill:    false,
        })
        .surface({
            color:   "rgb(128,0,0)",
            opacity: 0.5,
            stroke:  "solid",
        })
    // Plane 2
        .matrix({
            channels: 3,
            live:     false,
            width:    21,
            height:   21,
            expr: function (emit, i, j) {
                i -= 10;  j -= 10;
                emit(i, j, (-1-i-2*j)/9);
            }
        })
        .surface({
            color:   "rgb(0,128,0)",
            opacity: 0.75,
            stroke:  "solid",
            lineX:   true,
            lineY:   true,
            width:   3,
            fill:    false,
        })
        .surface({
            color:   "rgb(0,128,0)",
            opacity: 0.5,
            stroke:  "solid",
        })

    // Intersection
        .array({
            channels: 3,
            live:     false,
            width:    2,
            data:     [[10, 13/5, -9/5], [-10, -27/5, 11/5]],
        })
        .line({
            color:   "rgb(200,200,0)",
            opacity: 1.0,
            stroke:  "solid",
            width:   4,
            zIndex:  2
        })

    // Parameterized point
        .array({
            channels: 3,
            width:    1,
            expr:     function(emit) {
                emit(1-5*params.z, -1-2*params.z, params.z)
            }
        })
        .point({
            color:  "rgb(200,200,200)",
            size:   15,
            zIndex: 2,
        })
        .format({
            expr: function(x, y, z) {
                return "(" + x.toPrecision(2) + ", "
                    + y.toPrecision(2) + ", "
                    + z.toPrecision(2) + ")";
            }
        })
        .label({
            outline: 0,
            color:   "white",
            offset:  [0,20],
            size:    20,
            zIndex:  2
        })
    ;
});

